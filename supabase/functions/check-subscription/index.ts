import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      logStep("No authorization header - returning unauthenticated response");
      return new Response(JSON.stringify({ subscribed: false, authenticated: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    logStep("Authenticating user with token");
    
    let user;
    try {
      const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
      if (userError || !userData.user?.email) {
        logStep("Authentication failed - returning unauthenticated response", { error: userError?.message });
        return new Response(JSON.stringify({ subscribed: false, authenticated: false }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
      user = userData.user;
    } catch (authError) {
      // Handle thrown exceptions from Supabase client
      const authErrorMsg = authError instanceof Error ? authError.message : String(authError);
      logStep("Authentication threw exception - returning unauthenticated response", { error: authErrorMsg });
      return new Response(JSON.stringify({ subscribed: false, authenticated: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
    
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No customer found");
      // Update user role to free
      await supabaseClient
        .from('user_roles')
        .update({ 
          role: 'free',
          stripe_customer_id: null,
          stripe_subscription_id: null,
          subscription_status: null,
          subscription_start: null,
          subscription_end: null
        })
        .eq('user_id', user.id);
      
      return new Response(JSON.stringify({ subscribed: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    // Check for PAID active subscriptions only - not trialing or incomplete
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });
    
    // Double-check the subscription has actually been paid
    let hasActiveSub = false;
    let subscriptionData = null;
    
    if (subscriptions.data.length > 0) {
      const subscription = subscriptions.data[0];
      
      // Verify this is a real paid subscription by checking:
      // 1. Status is 'active' (not 'trialing', 'incomplete', etc.)
      // 2. The subscription has at least one successful invoice payment
      const invoices = await stripe.invoices.list({
        subscription: subscription.id,
        status: 'paid',
        limit: 1,
      });
      
      const hasPaidInvoice = invoices.data.length > 0;
      
      if (hasPaidInvoice) {
        hasActiveSub = true;
        const periodStart = subscription.current_period_start;
        const periodEnd = subscription.current_period_end;
        
        logStep("Active PAID subscription found", { 
          subscriptionId: subscription.id, 
          periodStart,
          periodEnd,
          paidInvoices: invoices.data.length
        });
        
        subscriptionData = {
          id: subscription.id,
          status: subscription.status,
          start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
          end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
        };
      } else {
        logStep("Subscription found but NO paid invoice - treating as unpaid", { 
          subscriptionId: subscription.id,
          status: subscription.status
        });
      }
    } else {
      logStep("No active subscription found");
    }

    // Check for one-time analysis pack purchases
    const charges = await stripe.charges.list({
      customer: customerId,
      limit: 100,
    });
    
    let totalPackAnalyses = 0;
    for (const charge of charges.data) {
      if (charge.paid && charge.metadata?.type === "analysis_pack") {
        totalPackAnalyses += 5; // Each pack is 5 analyses
      }
    }
    
    if (totalPackAnalyses > 0) {
      logStep("Found analysis pack purchases", { totalAnalyses: totalPackAnalyses });
    }

    // Get current role to preserve admin status and existing limits
    const { data: currentRole } = await supabaseClient
      .from('user_roles')
      .select('pack_analyses_remaining, role, monthly_analyses_limit')
      .eq('user_id', user.id)
      .maybeSingle();
    
    const currentPackAnalyses = currentRole?.pack_analyses_remaining || 0;
    const isAdmin = currentRole?.role === 'admin';
    
    // Only update pack analyses if we found new purchases
    const newPackAnalyses = totalPackAnalyses > currentPackAnalyses ? totalPackAnalyses : currentPackAnalyses;

    // Preserve admin role, otherwise set based on subscription
    const newRole = isAdmin ? 'admin' : (hasActiveSub ? 'premium' : 'free');
    
    // Only give 10 monthly analyses if they have a PAID active subscription or are admin
    // Free users keep their existing limit (from signup trigger: 3 initial, then 1 after reset)
    const newMonthlyLimit = (hasActiveSub || isAdmin) ? 10 : (currentRole?.monthly_analyses_limit || 1);

    const { error: updateError } = await supabaseClient
      .from('user_roles')
      .upsert({
        user_id: user.id,
        role: newRole,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionData?.id || null,
        subscription_status: subscriptionData?.status || null,
        subscription_start: subscriptionData?.start || null,
        subscription_end: subscriptionData?.end || null,
        monthly_analyses_limit: newMonthlyLimit,
        pack_analyses_remaining: newPackAnalyses,
      }, { onConflict: 'user_id' });
    
    if (updateError) {
      logStep("ERROR updating user role", { error: updateError });
      throw updateError;
    }

    logStep("Successfully updated user role", { 
      role: newRole, 
      monthlyLimit: newMonthlyLimit,
      hasActiveSub 
    });

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      subscription_end: subscriptionData?.end || null
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
