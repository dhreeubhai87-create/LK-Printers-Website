const API_BASE_URL = "http://localhost:5000";
const buildUrl = (path) => `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
const parseResponse = async (response) => {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }
  return response.text();
};
async function apiRequest(path, options = {}) {
  const response = await fetch(buildUrl(path), options);
  const data = await parseResponse(response);
  if (!response.ok) {
    const message = typeof data === "string" ? data : data?.message || response.statusText || "Request failed";
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
}
const getApiErrorMessage = (error, fallback) => {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
};
export {
  apiRequest as a,
  getApiErrorMessage as g
};
