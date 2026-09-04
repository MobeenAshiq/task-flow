import { useAuthStore } from '@/lib/auth-store';

interface FetchOptions extends RequestInit {
  params?: Record<string, string>;
}

interface ApiSuccess<T> {
  success: true;
  response: T;
}

interface ApiError {
  success?: false;
  statusCode?: number;
  error?: {
    message: string;
    path: string;
    timestamp: string;
  };
  // Fallback shape (Nest's default, unwrapped by our filter): { message, error, statusCode }
  message?: string | string[];
}

export class ApiRequestError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
  }
}

// Generic, human-readable fallbacks for when the backend gives us no usable
// message of its own (e.g. an unmatched route returns plain HTML, not our
// JSON error shape) — the user should never see a raw status code.
const FRIENDLY_STATUS_MESSAGES: Record<number, string> = {
  400: 'That request was not valid. Please check the form and try again.',
  401: 'Your session has expired. Please sign in again.',
  403: "You don't have permission to do that.",
  404: 'We could not find what you were looking for.',
  409: 'That could not be completed — it conflicts with existing data.',
  422: 'That request was not valid. Please check the form and try again.',
  429: "You're doing that a bit too fast — please wait a moment and try again.",
  500: 'Something went wrong on our end. Please try again shortly.',
  502: 'The server is temporarily unavailable. Please try again shortly.',
  503: 'The server is temporarily unavailable. Please try again shortly.',
  504: 'The request timed out. Please try again.',
};

// A backend message is only worth showing if it's actually human-authored copy —
// not a raw framework/route string (e.g. Express's "Cannot GET /api/...").
function isDisplayableMessage(message?: string | null): message is string {
  if (!message) return false;
  return !/^cannot (get|post|put|patch|delete)\b/i.test(message.trim());
}

function friendlyMessage(status: number, backendMessage?: string | null): string {
  if (isDisplayableMessage(backendMessage)) return backendMessage;
  return FRIENDLY_STATUS_MESSAGES[status] || 'Something went wrong. Please try again.';
}

// Reads a human-authored message out of whichever error shape the backend
// actually sent — our own { success:false, error:{ message } } wrapper, or
// Nest's default { message, error, statusCode } (a single exception filter
// gap or an unhandled path could still produce this shape).
function extractBackendMessage(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null;
  const obj = data as Record<string, unknown>;

  if (obj.success === false && obj.error && typeof obj.error === 'object') {
    const message = (obj.error as Record<string, unknown>).message;
    if (typeof message === 'string') return message;
  }

  if (typeof obj.message === 'string') return obj.message;
  if (Array.isArray(obj.message) && obj.message.every((m) => typeof m === 'string')) {
    return (obj.message as string[]).join(', ');
  }

  return null;
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

  if (!response.ok || !data || (data as ApiError).success === false) {
    if (response.status === 401) {
      useAuthStore.getState().clearSession();
    }
    throw new ApiRequestError(friendlyMessage(response.status, extractBackendMessage(data)), response.status);
  }

  return (data as ApiSuccess<T>).response;
}
