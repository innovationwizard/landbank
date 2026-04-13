// ============================================================================
// Email OTP verification endpoint — used by recovery, invite, magic-link,
// and email-change flows. The Supabase email templates point here with
// ?token_hash=<hash>&type=<otp-type>&next=<post-verify-path>.
//
// We verify the token server-side so the session cookie is set on our
// domain (required for @supabase/ssr), then redirect to `next`. If the
// token is missing, invalid, or expired, we bounce to /login with a
// human-readable error query param.
// ============================================================================

import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/";

  if (!token_hash || !type) {
    return NextResponse.redirect(`${origin}/login?error=enlace_invalido`);
  }

  const supabase = createClient();
  const { error } = await supabase.auth.verifyOtp({ type, token_hash });

  if (error) {
    const msg = encodeURIComponent(error.message);
    return NextResponse.redirect(`${origin}/login?error=${msg}`);
  }

  // Only redirect to same-origin paths to prevent open-redirect abuse.
  const safeNext = next.startsWith("/") ? next : "/";
  return NextResponse.redirect(`${origin}${safeNext}`);
}
