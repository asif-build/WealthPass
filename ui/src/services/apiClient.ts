/**
 * WealthPass Secure API Client
 * Manages CSRF token retrieval, cross-site request security,
 * error normalization, and credential management.
 */

export function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(?:^|;\\s*)" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[1]) : null;
}

let cachedCsrfToken: string | null = null;

export async function fetchCsrfToken(): Promise<string | null> {
  // 1. Try reading directly from cookie
  const cookieToken = getCookie("csrftoken");
  if (cookieToken) {
    cachedCsrfToken = cookieToken;
    return cookieToken;
  }

  // 2. Fallback to API endpoint to seed CSRF cookie
  try {
    const res = await fetch("/api/auth/csrf/", {
      method: "GET",
      headers: { Accept: "application/json" },
      credentials: "same-origin",
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.csrfToken) {
        cachedCsrfToken = data.csrfToken;
        return data.csrfToken;
      }
    }
  } catch {
    // Network or server issue
  }

  return cachedCsrfToken;
}

export interface ApiFetchOptions extends Omit<RequestInit, "body"> {
  body?: any;
  timeoutMs?: number;
}

export interface ApiResponse<T = any> {
  ok: boolean;
  status: number;
  data: T;
  error?: string;
}

export async function apiFetch<T = any>(
  endpoint: string,
  options: ApiFetchOptions = {}
): Promise<ApiResponse<T>> {
  const { body, headers = {}, timeoutMs = 15000, ...rest } = options;

  const method = (rest.method || "GET").toUpperCase();
  const requestHeaders: Record<string, string> = {
    Accept: "application/json",
    ...(headers as Record<string, string>),
  };

  // Mutating requests require CSRF token in Django
  if (["POST", "PUT", "DELETE", "PATCH"].includes(method)) {
    let token = getCookie("csrftoken") || cachedCsrfToken;
    if (!token) {
      token = await fetchCsrfToken();
    }
    if (token) {
      requestHeaders["X-CSRFToken"] = token;
    }
  }

  let requestBody: any = undefined;
  if (body !== undefined) {
    if (body instanceof FormData) {
      requestBody = body;
    } else {
      requestHeaders["Content-Type"] = "application/json";
      requestBody = JSON.stringify(body);
    }
  }

  // Controller for request timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(endpoint, {
      ...rest,
      method,
      headers: requestHeaders,
      body: requestBody,
      credentials: "same-origin",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Parse response
    const contentType = response.headers.get("content-type") || "";
    let data: any = null;

    if (contentType.includes("application/json")) {
      try {
        data = await response.json();
      } catch {
        data = null;
      }
    } else {
      // Non-JSON response (e.g., HTML error page from CSRF failure or 500)
      const text = await response.text();
      data = { rawText: text };
    }

    if (!response.ok) {
      let errorMessage = "Request failed.";

      if (data && typeof data === "object" && data.error) {
        errorMessage = data.error;
      } else if (response.status === 403) {
        errorMessage =
          "Security validation failed (CSRF expired or invalid session). Please refresh the page.";
      } else if (response.status === 404) {
        errorMessage = "The requested server endpoint was not found.";
      } else if (response.status === 409) {
        errorMessage =
          "An account with this email or mobile number already exists. Please sign in.";
      } else if (response.status === 429) {
        errorMessage = "Too many requests. Please wait a few moments before trying again.";
      } else if (response.status >= 500) {
        errorMessage =
          "WealthPass secure servers are temporarily unavailable. Please try again shortly.";
      }

      return {
        ok: false,
        status: response.status,
        data,
        error: errorMessage,
      };
    }

    return {
      ok: true,
      status: response.status,
      data,
    };
  } catch (err: any) {
    clearTimeout(timeoutId);

    let clientError = "Unable to connect to WealthPass secure servers.";
    if (err.name === "AbortError") {
      clientError = "Request timed out. Please check your internet connection.";
    } else if (err instanceof TypeError && err.message.includes("Failed to fetch")) {
      clientError = "Network connection failed. Please ensure the server is reachable.";
    }

    return {
      ok: false,
      status: 0,
      data: null as any,
      error: clientError,
    };
  }
}
