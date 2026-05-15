import { createBrowserClient } from '@supabase/ssr';

let client: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (typeof window === 'undefined') {
    // During SSR/build, return a placeholder that won't be used
    return createBrowserClient(
      'http://localhost:54321',
      'placeholder-key'
    );
  }

  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  client = createBrowserClient(url, key);
  return client;
}
