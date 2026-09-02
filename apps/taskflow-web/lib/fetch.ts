import { getCurrentSession } from '@/lib/auth';

interface FetchOptions extends RequestInit {
  params?: Record<string, string>;
}

interface ApiResponse<T> {
  success: boolean;
  response: T;
  message?: string;
}

export async function fetcher<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { params, headers, ...customConfig } = options;
  const baseUrl = process.env.NEXT_PUBLIC_BACKEND_REST_URL;

  if (!baseUrl) {
    throw new Error('NEXT_PUBLIC_BACKEND_REST_URL is not defined.');
  }

  // Construct URL with query parameters
  const url = new URL(`/api/${endpoint.replace(/^\//, '')}`, baseUrl);
  if (params) {
    Object.entries(params).forEach(([key, value]) =>
      url.searchParams.append(key, value)
    );
  }

  // Attach session token if available
  const session = await getCurrentSession();
  const authHeaders: Record<string, string> = {};

  if (session?.accessToken) {
    authHeaders['Authorization'] = `Bearer ${session.accessToken}`;
  }

  const response = await fetch(url.toString(), {
    method: customConfig.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...headers,
    },
    ...customConfig,
  });

  if (!response.ok) {
    throw new Error(`REST API Error: ${response.status} ${response.statusText}`);
  }

  const data: ApiResponse<T> = await response.json();
  if (!data.success) {
    throw new Error(data.message || 'API operation failed');
  }

  return data.response;
}
