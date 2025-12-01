import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
      throw new Error("No stripe-signature header found");
    }

    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!webhookSecret) {
      throw new Error("STRIPE_WEBHOOK_SECRET not configured");
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil"
    });

    const body = await req.text();
    let event: Stripe.Event;

    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        webhookSecret
      );
      logStep("Webhook verified", { type: event.type });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logStep("Webhook signature verification failed", { error: errorMessage });
      return new Response(JSON.stringify({ error: "Webhook signature verification failed" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Handle different event types
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        logStep("Checkout completed", { 
          sessionId: session.id, 
          customerId: session.customer,
          metadata: session.metadata 
        });

        // Handle analysis pack purchase
        if (session.metadata?.type === "analysis_pack") {
          const userId = session.metadata.user_id;
          if (!userId) {
            logStep("No user_id in metadata, skipping pack purchase processing");
            break;
          }

          logStep("Processing analysis pack purchase", { userId });
          
          // Get analysis count from metadata (defaults to 5 for backward compatibility)
          const analysisCount = parseInt(session.metadata.analysis_count || '5', 10);
          logStep("Analysis count from metadata", { analysisCount });
          
          // Get current pack count and increment
          const { data: currentRole, error: fetchError } = await supabaseAdmin
            .from("user_roles")
            .select("pack_analyses_remaining")
            .eq("user_id", userId)
            .single();

          if (fetchError) {
            logStep("Error fetching current pack count", { error: fetchError });
            break;
          }

          const newCount = (currentRole?.pack_analyses_remaining || 0) + analysisCount;
          
          const { error: updateError } = await supabaseAdmin
            .from("user_roles")
            .update({ 
              pack_analyses_remaining: newCount
            })
            .eq("user_id", userId);

          if (updateError) {
            logStep("Error updating pack analyses", { error: updateError });
          } else {
            logStep("Successfully added 5 pack analyses", { userId, newCount });
          }
        }

        // Handle subscription checkout
        if (session.mode === "subscription" && session.subscription) {
          const subscriptionId = session.subscription as string;
          const customerId = session.customer as string;

          logStep("Processing subscription", { subscriptionId, customerId });

          // Get customer email
          const customer = await stripe.customers.retrieve(customerId);
          const email = (customer as Stripe.Customer).email;

          if (!email) {
            logStep("No email found for customer", { customerId });
            break;
          }

          // Find user by email
          const { data: profile } = await supabaseAdmin
            .from("profiles")
            .select("id")
            .eq("email", email)
            .single();

          if (!profile) {
            logStep("No profile found for email", { email });
            break;
          }

          // Update user role to premium
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const { error: roleError } = await supabaseAdmin
            .from("user_roles")
            .update({
              role: "premium",
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              subscription_status: subscription.status,
              subscription_start: new Date(subscription.current_period_start * 1000).toISOString(),
              subscription_end: new Date(subscription.current_period_end * 1000).toISOString(),
              monthly_analyses_limit: 10,
              monthly_analyses_used: 0
            })
            .eq("user_id", profile.id);

          if (roleError) {
            logStep("Error updating user role", { error: roleError });
          } else {
            logStep("User upgraded to premium", { userId: profile.id });
          }
        }
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        logStep("Subscription event", { 
          type: event.type,
          subscriptionId: subscription.id,
          status: subscription.status 
        });

        // Find user by subscription ID
        const { data: userRole } = await supabaseAdmin
          .from("user_roles")
          .select("user_id")
          .eq("stripe_subscription_id", subscription.id)
          .single();

        if (!userRole) {
          logStep("No user found for subscription", { subscriptionId: subscription.id });
          break;
        }

        // Update subscription status
        const updates: any = {
          subscription_status: subscription.status,
          subscription_end: new Date(subscription.current_period_end * 1000).toISOString()
        };

        // If subscription is cancelled or past_due, downgrade to free
        if (subscription.status === "canceled" || subscription.status === "unpaid") {
          updates.role = "free";
          updates.monthly_analyses_limit = 1;
          updates.stripe_subscription_id = null;
          logStep("Downgrading user to free", { userId: userRole.user_id, status: subscription.status });
        }

        const { error: updateError } = await supabaseAdmin
          .from("user_roles")
          .update(updates)
          .eq("user_id", userRole.user_id);

        if (updateError) {
          logStep("Error updating subscription", { error: updateError });
        } else {
          logStep("Subscription updated", { userId: userRole.user_id, updates });
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        logStep("Payment succeeded", { 
          invoiceId: invoice.id,
          subscriptionId: invoice.subscription 
        });
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        logStep("Payment failed", { 
          invoiceId: invoice.id,
          subscriptionId: invoice.subscription 
        });
        break;
      }

      default:
        logStep("Unhandled event type", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
