import { NextResponse } from "next/server";

export function ok<T>(data: T, message?: string, status = 200) {
  const payload: { success: true; data: T; message?: string } = {
    success: true,
    data,
  };
  if (message) {
    payload.message = message;
  }
  return NextResponse.json(payload, { status });
}

export function parseQuery(url: string | URL): Record<string, string> {
  const parsedUrl = typeof url === "string" ? new URL(url, "http://localhost") : url;
  const result: Record<string, string> = {};
  parsedUrl.searchParams.forEach((value, key) => {
    result[key] = value;
  });
  return result;
}

export interface PaginationParams {
  page?: string | number;
  limit?: string | number;
}

export function paginate(params: PaginationParams) {
  const page = Math.max(1, parseInt(String(params.page || 1), 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(String(params.limit || 20), 10) || 20));
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

export function listResult<T>(items: T[], total: number, page: number, limit: number) {
  const totalPages = Math.ceil(total / limit) || 1;
  return {
    items,
    page,
    limit,
    total,
    totalPages,
  };
}
