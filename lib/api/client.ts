import axios from "axios";

export const api = axios.create({
  baseURL: "/api/v1",
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("fre_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== "undefined" && error.response?.status === 401) {
      if (!window.location.pathname.startsWith("/login")) {
        localStorage.removeItem("fre_token");
        window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
      }
    }
    return Promise.reject(error);
  }
);

export async function unwrap<T>(promise: Promise<any>): Promise<T> {
  try {
    const res = await promise;
    return res.data?.data !== undefined ? res.data.data : res.data;
  } catch (err: any) {
    if (err.response?.data?.error) {
      throw {
        ...err.response.data.error,
        status: err.response.status,
      };
    }
    throw {
      code: "NETWORK_ERROR",
      message: err.message || "Network request failed",
      status: err.response?.status || 500,
    };
  }
}
