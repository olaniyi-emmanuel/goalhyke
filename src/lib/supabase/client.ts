import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export function getRedirectUrl() {
  const envUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_VERCEL_URL ??
    process.env.VERCEL_URL;

  let url = typeof window !== "undefined" ? window.location.origin : envUrl ?? "";

  // Ensure protocol prefix
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = `https://${url}`;
  }

  // Remove trailing slash if exists, to guarantee neat callback appending
  url = url.endsWith("/") ? url.slice(0, -1) : url;

  return url ? `${url}/auth/callback` : "/auth/callback";
}
