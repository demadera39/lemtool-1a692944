import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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
    console.log("[ADMIN-ADD-CREDITS] Starting request");
    
    // Create service role client for all operations
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get auth header
    const authHeader = req.headers.get("Authorization");
    console.log("[ADMIN-ADD-CREDITS] Auth header present:", !!authHeader);
    
    if (!authHeader) throw new Error("No authorization header");

    // Extract token from Bearer header
    const token = authHeader.replace("Bearer ", "");
    console.log("[ADMIN-ADD-CREDITS] Token extracted, length:", token.length);

    // Verify the JWT using service role client
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    console.log("[ADMIN-ADD-CREDITS] User verification:", { 
      hasUser: !!user, 
      userId: user?.id,
      email: user?.email,
      error: userError?.message 
    });
    
    if (userError || !user) {
      console.error("[ADMIN-ADD-CREDITS] Auth failed:", userError);
      throw new Error("Unauthorized");
    }

    // Check if user is admin
    console.log("[ADMIN-ADD-CREDITS] Checking admin role for user:", user.id);
    
    const { data: adminCheck, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    console.log("[ADMIN-ADD-CREDITS] Role check result:", { 
      role: adminCheck?.role, 
      error: roleError?.message 
    });

    if (adminCheck?.role !== 'admin') {
      throw new Error("Access denied. Admin only.");
    }
    
    console.log("[ADMIN-ADD-CREDITS] Admin verified");

    // Get request body
    const { userId, amount } = await req.json();

    if (!userId || !amount || amount <= 0) {
      throw new Error("Invalid userId or amount");
    }

    // Get current credits
    const { data: currentRole, error: fetchError } = await supabaseClient
      .from('user_roles')
      .select('pack_analyses_remaining')
      .eq('user_id', userId)
      .single();

    if (fetchError) throw fetchError;

    // Add credits to user's pack_analyses_remaining
    const { error: updateError } = await supabaseClient
      .from('user_roles')
      .update({ 
        pack_analyses_remaining: (currentRole?.pack_analyses_remaining || 0) + amount
      })
      .eq('user_id', userId);

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({ success: true, message: `Added ${amount} credits` }),
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
