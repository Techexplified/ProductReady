/**
 * Safe API Fetch Utility
 * Prevents "SyntaxError: Unexpected token '<', '<!DOCTYPE ...' is not valid JSON" errors
 * across all client-side requests in Shopify embedded apps.
 */

export interface SafeFetchResult<T = any> {
  ok: boolean;
  status: number;
  data: T | null;
  error?: string;
  isHtmlResponse?: boolean;
}

export async function safeApiFetch<T = any>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<SafeFetchResult<T>> {
  try {
    const headers = new Headers(init?.headers || {});
    if (!headers.has("Accept")) {
      headers.set("Accept", "application/json");
    }

    const response = await fetch(input, {
      ...init,
      headers,
    });

    const contentType = response.headers.get("content-type") || "";
    const isJson = contentType.toLowerCase().includes("application/json");

    if (!isJson) {
      // Server returned an HTML error document, redirect, or plain text
      const text = await response.text();
      const isHtml = text.trim().startsWith("<") || text.includes("<!DOCTYPE");

      let userFriendlyError = "Server returned an unexpected response format.";
      if (response.status === 401) {
        userFriendlyError = "Session expired. Please refresh the Shopify store page.";
      } else if (response.status === 403) {
        userFriendlyError = "Store is currently disconnected or access is denied.";
      } else if (response.status === 404) {
        userFriendlyError = "API endpoint not found.";
      } else if (response.status >= 500) {
        userFriendlyError = "Server encountered a temporary issue. Please try again shortly.";
      }

      console.warn(
        `[safeApiFetch] Non-JSON response (${response.status}) received for ${input.toString()}:`,
        text.slice(0, 150)
      );

      return {
        ok: false,
        status: response.status,
        data: null,
        error: userFriendlyError,
        isHtmlResponse: isHtml,
      };
    }

    try {
      const data = await response.json();
      return {
        ok: response.ok,
        status: response.status,
        data,
        error: response.ok ? undefined : data?.error || data?.message || `Request failed (${response.status})`,
        isHtmlResponse: false,
      };
    } catch (parseError) {
      console.warn(`[safeApiFetch] Failed to parse JSON response from ${input.toString()}:`, parseError);
      return {
        ok: false,
        status: response.status,
        data: null,
        error: "Failed to parse JSON response from server.",
        isHtmlResponse: false,
      };
    }
  } catch (networkError: any) {
    console.error(`[safeApiFetch] Network error for ${input.toString()}:`, networkError);
    return {
      ok: false,
      status: 0,
      data: null,
      error: networkError?.message || "Network request failed. Please check your connection.",
      isHtmlResponse: false,
    };
  }
}
