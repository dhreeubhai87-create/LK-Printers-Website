export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export type ApiError = Error & {
  status?: number;
  data?: unknown;
};

const buildUrl = (path: string) => `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;

const parseResponse = async (response: Response) => {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  return response.text();
};

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(buildUrl(path), options);
  const data = await parseResponse(response);

  if (!response.ok) {
    const message = typeof data === "string" ? data : data?.message || response.statusText || "Request failed";
    const error = new Error(message) as ApiError;
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data as T;
}

export const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
};