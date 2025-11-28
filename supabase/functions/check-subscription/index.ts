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
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    logStep("Authenticating user with token");
    
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
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

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });
    const hasActiveSub = subscriptions.data.length > 0;
    let subscriptionEnd = null;

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      subscriptionEnd = subscription.current_period_end * 1000;
      logStep("Active subscription found", { subscriptionId: subscription.id, endDate: subscriptionEnd });
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

    // Get current pack analyses from DB to avoid overwriting
    const { data: currentRole } = await supabaseClient
      .from('user_roles')
      .select('pack_analyses_remaining')
      .eq('user_id', user.id)
      .maybeSingle();
    
    const currentPackAnalyses = currentRole?.pack_analyses_remaining || 0;
    
    // Only update pack analyses if we found new purchases (total from Stripe > current in DB)
    const newPackAnalyses = totalPackAnalyses > currentPackAnalyses ? totalPackAnalyses : currentPackAnalyses;

    const { error: updateError } = await supabaseClient
      .from('user_roles')
      .upsert({
        user_id: user.id,
        role: hasActiveSub ? 'premium' : 'free',
        stripe_customer_id: customerId,
        stripe_subscription_id: hasActiveSub ? subscriptions.data[0].id : null,
        subscription_status: hasActiveSub ? 'active' : null,
        subscription_start: hasActiveSub ? new Date(subscriptions.data[0].current_period_start * 1000).toISOString() : null,
        subscription_end: subscriptionEnd ? new Date(subscriptionEnd).toISOString() : null,
        monthly_analyses_limit: hasActiveSub ? 10 : 0,
        pack_analyses_remaining: newPackAnalyses,
      }, { onConflict: 'user_id' });
    
    if (updateError) {
      logStep("ERROR updating user role", { error: updateError });
    }

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      subscription_end: subscriptionEnd
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
