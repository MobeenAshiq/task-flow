import { useAuthStore } from '@/lib/auth-store';

interface FetchOptions extends RequestInit {
  params?: Record<string, string>;
}

interface ApiSuccess<T> {
  success: true;
  response: T;
}

interface ApiError {
  success: false;
  statusCode: number;
  error: {
    message: string;
    path: string;
    timestamp: string;
  };
}

export class ApiRequestError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
  }
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

  const url = new URL(`/api/${endpoint.replace(/^\//, '')}`, baseUrl);
  if (params) {
    Object.entries(params).forEach(([key, value]) =>
      url.searchParams.append(key, value)
    );
  }

  const accessToken = useAuthStore.getState().accessToken;
  const authHeaders: Record<string, string> = {};
  if (accessToken) {
    authHeaders['Authorization'] = `Bearer ${accessToken}`;
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

  let data: ApiSuccess<T> | ApiError | null = null;
  try {
    data = await response.json();
  } catch {
    // no JSON body
  }

  if (!response.ok || !data || data.success === false) {
    if (response.status === 401) {
      useAuthStore.getState().clearSession();
    }
    const message =
      data && data.success === false
        ? data.error?.message
        : `Request failed with status ${response.status}`;
    throw new ApiRequestError(message || 'Request failed', response.status);
  }

  return data.response;
}
