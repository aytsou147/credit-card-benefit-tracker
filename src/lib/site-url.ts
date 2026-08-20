/**
 * Public origin of the app, used for every auth redirect (email links, OAuth).
 * Never derive these from `window.location.origin` alone — a preview deploy or a
 * misconfigured Supabase Site URL would otherwise send users to the wrong host.
 */
export function getSiteURL() {
  let url =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.NEXT_PUBLIC_VERCEL_URL
      ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
      : '') ||
    (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');

  if (!url.startsWith('http')) url = `https://${url}`;
  return url.replace(/\/+$/, '');
}

/**
 * Origin the user actually reached, for redirects out of a route handler.
 * `new URL(request.url).origin` is the internal origin behind Vercel's proxy.
 */
export function getRequestOrigin(headers: Headers) {
  const host = headers.get('x-forwarded-host');
  if (!host) return getSiteURL();
  return `${headers.get('x-forwarded-proto') ?? 'https'}://${host}`;
}

/** Only allow same-origin relative paths as a post-auth destination. */
export function safeNext(next: string | null) {
  return next && /^\/(?!\/)/.test(next) ? next : '/';
}
