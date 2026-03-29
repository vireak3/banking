import { clearStoredAuth, getStoredToken } from "@/lib/auth";
import type { ApiEnvelope } from "@/types/banking";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api";

export class ApiError extends Error {
  status: number;
  details: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

type RequestOptions = RequestInit & {
  requiresAuth?: boolean;
};

function joinUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

async function parseResponse<T>(response: Response): Promise<ApiEnvelope<T> | null> {
  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    return null;
  }

  return (await response.json()) as ApiEnvelope<T>;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}) {
  const { requiresAuth = true, headers, ...restOptions } = options;
  const token = requiresAuth ? getStoredToken() : null;
  const requestHeaders = new Headers(headers);

  if (!requestHeaders.has("Content-Type") && !(restOptions.body instanceof FormData)) {
    requestHeaders.set("Content-Type", "application/json");
  }

  if (token) {
    requestHeaders.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(joinUrl(path), {
    ...restOptions,
    headers: requestHeaders,
    cache: "no-store",
  });

  const payload = await parseResponse<T>(response);

  if (!response.ok) {
    const message = payload?.message ?? `Request failed with status ${response.status}`;

    if (response.status === 401) {
      clearStoredAuth();

      if (typeof window !== "undefined" && window.location.pathname !== "/login") {
        window.location.assign("/login");
      }
    }

    throw new ApiError(message, response.status, payload?.data);
  }

  if (!payload) {
    throw new ApiError("The API did not return JSON.", response.status);
  }

  return payload;
}

export function getErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}