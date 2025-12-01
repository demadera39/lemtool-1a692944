import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Webhook received");

    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      throw new Error("No stripe-signature header");
    }

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not configured");
    if (!webhookSecret) throw new Error("STRIPE_WEBHOOK_SECRET not configured");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    
    // Get raw body for signature verification
    const body = await req.text();
    
    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
      logStep("Webhook signature verified", { type: event.type });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      logStep("Webhook signature verification failed", { error: errorMsg });
      return new Response(JSON.stringify({ error: "Webhook signature verification failed" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle the event
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      logStep("Checkout session completed", { 
        sessionId: session.id, 
        metadata: session.metadata 
      });

      // Check if this is an analysis pack purchase
      if (session.metadata?.type === "analysis_pack" && session.metadata?.user_id) {
        const userId = session.metadata.user_id;
        logStep("Analysis pack purchase detected", { userId });

        // Initialize Supabase client with service role key for admin access
        const supabaseClient = createClient(
          Deno.env.get("SUPABASE_URL") ?? "",
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
          { auth: { persistSession: false } }
        );

        // Get current user role data
        const { data: userRole, error: fetchError } = await supabaseClient
          .from("user_roles")
          .select("pack_analyses_remaining")
          .eq("user_id", userId)
          .single();

        if (fetchError) {
          logStep("Error fetching user role", { error: fetchError });
          throw fetchError;
        }

        const currentPack = userRole?.pack_analyses_remaining || 0;
        const newPack = currentPack + 5;

        logStep("Updating pack analyses", { 
          userId, 
          current: currentPack, 
          new: newPack 
        });

        // Update pack_analyses_remaining
        const { error: updateError } = await supabaseClient
          .from("user_roles")
          .update({ 
            pack_analyses_remaining: newPack,
            updated_at: new Date().toISOString()
          })
          .eq("user_id", userId);

        if (updateError) {
          logStep("Error updating user role", { error: updateError });
          throw updateError;
        }

        logStep("Successfully added 5 pack analyses", { userId, newTotal: newPack });
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
