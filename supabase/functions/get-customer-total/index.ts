import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[GET-CUSTOMER-TOTAL] Starting request");
    
    // Since verify_jwt = true in config.toml, JWT is already verified by Supabase
    // Get auth header to extract user info
    const authHeader = req.headers.get("Authorization");
    console.log("[GET-CUSTOMER-TOTAL] Auth header present:", !!authHeader);
    
    if (!authHeader) throw new Error("No authorization header");

    // Extract token from Bearer header
    const token = authHeader.replace("Bearer ", "");
    console.log("[GET-CUSTOMER-TOTAL] Token extracted, length:", token.length);

    // Create service role client for admin operations
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseClient = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get user from token using service role client
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      console.error("[GET-CUSTOMER-TOTAL] Failed to get user:", userError);
      throw new Error("Unauthorized");
    }
    
    const authenticatedUserId = user.id;
    console.log("[GET-CUSTOMER-TOTAL] User verified, userId:", authenticatedUserId);

    // Check if user is admin
    console.log("[GET-CUSTOMER-TOTAL] Checking admin role for user:", authenticatedUserId);
    
    const { data: adminCheck, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', authenticatedUserId)
      .single();

    console.log("[GET-CUSTOMER-TOTAL] Role check result:", { 
      role: adminCheck?.role, 
      error: roleError?.message 
    });

    if (adminCheck?.role !== 'admin') {
      throw new Error("Access denied. Admin only.");
    }
    
    console.log("[GET-CUSTOMER-TOTAL] Admin verified");

    const { customerId } = await req.json();

    if (!customerId) {
      throw new Error("Customer ID is required");
    }

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("Stripe key not configured");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Get all charges for this customer
    const charges = await stripe.charges.list({
      customer: customerId,
      limit: 100,
    });

    // Calculate total paid (successful charges only)
    const totalPaid = charges.data
      .filter((charge: any) => charge.status === 'succeeded')
      .reduce((sum: number, charge: any) => sum + charge.amount, 0);

    return new Response(
      JSON.stringify({ totalPaid }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
