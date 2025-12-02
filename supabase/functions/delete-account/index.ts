import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[DELETE-ACCOUNT] Starting request");

    // Extract user ID from the JWT token payload
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const tokenParts = token.split(".");
    if (tokenParts.length !== 3) throw new Error("Invalid token format");

    const payload = JSON.parse(atob(tokenParts[1]));
    const userId = payload.sub;

    if (!userId) throw new Error("No user ID in token");
    console.log("[DELETE-ACCOUNT] User ID from token:", userId);

    // Create service role client for admin operations
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseClient = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Delete user's projects first (cascade should handle test_sessions)
    console.log("[DELETE-ACCOUNT] Deleting user projects");
    const { error: projectsError } = await supabaseClient
      .from("projects")
      .delete()
      .eq("user_id", userId);

    if (projectsError) {
      console.error("[DELETE-ACCOUNT] Error deleting projects:", projectsError);
    }

    // Delete user role
    console.log("[DELETE-ACCOUNT] Deleting user role");
    const { error: roleError } = await supabaseClient
      .from("user_roles")
      .delete()
      .eq("user_id", userId);

    if (roleError) {
      console.error("[DELETE-ACCOUNT] Error deleting user role:", roleError);
    }

    // Delete user profile
    console.log("[DELETE-ACCOUNT] Deleting user profile");
    const { error: profileError } = await supabaseClient
      .from("profiles")
      .delete()
      .eq("id", userId);

    if (profileError) {
      console.error("[DELETE-ACCOUNT] Error deleting profile:", profileError);
    }

    // Delete the auth user
    console.log("[DELETE-ACCOUNT] Deleting auth user");
    const { error: authError } = await supabaseClient.auth.admin.deleteUser(userId);

    if (authError) {
      console.error("[DELETE-ACCOUNT] Error deleting auth user:", authError);
      throw authError;
    }

    console.log("[DELETE-ACCOUNT] Account deleted successfully");

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[DELETE-ACCOUNT] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
