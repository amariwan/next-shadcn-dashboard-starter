function getBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return '/api';
  }
  const host =
    process.env.NEXTAUTH_URL ||
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : `http://localhost:${process.env.PORT || 3000}`);
  return `${host}/api`;
}

export async function apiClient<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const headers = new Headers(options?.headers);
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  // When executed in Server Components, forward incoming cookies
  if (typeof window === 'undefined') {
    try {
      const { cookies } = await import('next/headers');
      const cookieStore = await cookies();
      const cookieHeader = cookieStore.toString();
      if (cookieHeader && !headers.has('cookie')) {
        headers.set('cookie', cookieHeader);
      }
    } catch {
      // Outside of request context (e.g. build phase / background worker)
    }
  }

  const res = await fetch(`${getBaseUrl()}${endpoint}`, {
    ...options,
    headers
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}
