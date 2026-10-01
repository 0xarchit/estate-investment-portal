import axios, { type AxiosResponse } from "axios";
import type { ApiErrorShape } from "@/lib/types";

export const api = axios.create({ baseURL: "/api/v1", timeout: 20000 });

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("fre_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (
      typeof window !== "undefined" &&
      axios.isAxiosError(error) &&
      error.response?.status === 401
    ) {
      localStorage.removeItem("fre_token");
      if (!window.location.pathname.startsWith("/login")) {
        const next = window.location.pathname + window.location.search;
        window.location.href = `/login?next=${encodeURIComponent(next)}`;
      }
    }
    return Promise.reject(error);
  },
);

export async function unwrap<T>(promise: Promise<AxiosResponse>): Promise<T> {
  try {
    const response = await promise;
    return response.data?.data !== undefined
      ? response.data.data
      : response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const serverError = error.response?.data?.error;
      const normalized: ApiErrorShape = {
        code: serverError?.code ?? "NETWORK_ERROR",
        message:
          serverError?.message ??
          (error.code === "ECONNABORTED"
            ? "The request timed out. Please try again."
            : "Unable to connect. Please try again."),
        details: serverError?.details,
        status: error.response?.status ?? 0,
      };
      throw normalized;
    }
    throw {
      code: "NETWORK_ERROR",
      message: "Something went wrong. Please try again.",
      status: 0,
    } satisfies ApiErrorShape;
  }
}
