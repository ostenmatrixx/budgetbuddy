import { createClient } from "npm:@supabase/supabase-js@2.106.2";

interface DeleteAccountRequest {
  emailConfirmation?: unknown;
  currentPassword?: unknown;
  captchaToken?: unknown;
}

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const allowedOrigins = new Set(
  (Deno.env.get("ALLOWED_ORIGINS") ?? "http://localhost:5173,http://127.0.0.1:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
);

function corsHeaders(origin: string): HeadersInit {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin"
  };
}

function json(origin: string, status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(origin),
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

Deno.serve(async (request) => {
  const origin = request.headers.get("Origin") ?? "";

  if (!allowedOrigins.has(origin)) {
    return new Response("Origin not allowed", {
      status: 403,
      headers: { Vary: "Origin", "Cache-Control": "no-store" }
    });
  }

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }

  if (request.method !== "POST") {
    return json(origin, 405, { error: "Method not allowed." });
  }

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return json(origin, 500, { error: "Account deletion is not configured." });
  }

  const authorization = request.headers.get("Authorization");
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];

  if (!token) {
    return json(origin, 401, { error: "Authentication required." });
  }

  let body: DeleteAccountRequest;

  try {
    body = await request.json();
  } catch {
    return json(origin, 400, { error: "A valid JSON body is required." });
  }

  if (
    typeof body.emailConfirmation !== "string" ||
    body.emailConfirmation.length > 320 ||
    typeof body.currentPassword !== "string" ||
    body.currentPassword.length < 1 ||
    body.currentPassword.length > 1024 ||
    (body.captchaToken !== undefined &&
      (typeof body.captchaToken !== "string" || body.captchaToken.length > 2048))
  ) {
    return json(origin, 400, { error: "Email confirmation and current password are required." });
  }

  const authClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  const { data: userData, error: userError } = await authClient.auth.getUser(token);
  const user = userData.user;

  if (userError || !user?.email) {
    return json(origin, 401, { error: "Your session is invalid or expired." });
  }

  // Exact matching prevents deleting a different signed-in account by mistake.
  if (body.emailConfirmation !== user.email) {
    return json(origin, 400, { error: "The confirmation email does not match your account." });
  }

  const reauthClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  const { data: reauthData, error: reauthError } = await reauthClient.auth.signInWithPassword({
    email: user.email,
    password: body.currentPassword,
    options: typeof body.captchaToken === "string" ? { captchaToken: body.captchaToken } : undefined
  });

  if (reauthError || reauthData.user?.id !== user.id) {
    return json(origin, 401, {
      error: "Password verification failed. Check your password and security challenge."
    });
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id, false);

  if (deleteError) {
    return json(origin, 500, { error: "Unable to delete the account right now." });
  }

  return json(origin, 200, { deleted: true });
});
