import { NextRequest, NextResponse } from "next/server";
import { ZodError, ZodType } from "zod";
import { connectDB } from "@/lib/server/db";
import { User, IUser, UserRole } from "@/lib/server/models/User";
import { ApiError } from "@/lib/server/errors";
import { verifyJwt } from "@/lib/server/auth/jwt";
import { parseQuery } from "@/lib/server/http";
import { checkRateLimit } from "@/lib/server/rateLimit";

export interface RouteOptions<TBody = unknown> {
  auth?: boolean;
  optionalAuth?: boolean;
  roles?: UserRole[];
  rateLimit?: "auth" | "invest";
  schema?: ZodType<TBody, any, any>;
}

export interface RouteContext<TBody = unknown> {
  req: NextRequest;
  user: IUser | null;
  params: Record<string, string>;
  query: Record<string, string>;
  body: TBody;
}

function sanitizeObject(obj: unknown): unknown {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  const cleanObj: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    // Strip keys starting with $ or containing . (NoSQL injection prevention)
    if (!key.startsWith("$") && !key.includes(".")) {
      cleanObj[key] = sanitizeObject(value);
    }
  }
  return cleanObj;
}

export function route<TBody = unknown>(
  options: RouteOptions<TBody>,
  handler: (ctx: RouteContext<TBody>) => Promise<NextResponse>
) {
  return async (req: NextRequest, { params = {} }: { params?: Record<string, string> } = {}) => {
    try {
      await connectDB();

      const ip =
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        req.headers.get("x-real-ip") ||
        "127.0.0.1";
      const pathname = req.nextUrl.pathname;

      // Rate limiting
      if (options.rateLimit === "auth") {
        checkRateLimit(`auth:${ip}`, 10, 60000);
      } else if (options.rateLimit === "invest") {
        checkRateLimit(`invest:${ip}`, 20, 60000);
      }

      // Authentication
      const authHeader = req.headers.get("authorization");
      let currentUser: IUser | null = null;

      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.substring(7);
        try {
          const payload = verifyJwt(token);
          const foundUser = await User.findById(payload.sub);
          if (foundUser) {
            if (!foundUser.isActive) {
              throw new ApiError(401, "UNAUTHENTICATED", "Account has been deactivated");
            }
            currentUser = foundUser;
          }
        } catch (err: unknown) {
          if (err instanceof ApiError) throw err;
          // If auth is required, token failure is 401
          if (options.auth !== false && !options.optionalAuth) {
            throw new ApiError(401, "UNAUTHENTICATED", "Invalid or expired token");
          }
        }
      }

      const isAuthRequired = options.auth !== false && !options.optionalAuth;
      if (isAuthRequired && !currentUser) {
        throw new ApiError(401, "UNAUTHENTICATED", "Authentication required");
      }

      // Role Check
      if (options.roles && options.roles.length > 0) {
        if (!currentUser || !options.roles.includes(currentUser.role)) {
          throw new ApiError(403, "FORBIDDEN", "You do not have permission to perform this action");
        }
      }

      // Body Parsing & Sanitization
      let body: unknown = undefined;
      const method = req.method.toUpperCase();
      if (["POST", "PUT", "PATCH"].includes(method)) {
        const contentType = req.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          try {
            const rawBody = await req.json();
            body = sanitizeObject(rawBody);
          } catch {
            throw new ApiError(400, "VALIDATION_ERROR", "Invalid JSON body");
          }
        }
      }

      // Schema Validation
      if (options.schema && body !== undefined) {
        const validation = options.schema.safeParse(body);
        if (!validation.success) {
          throw new ApiError(
            400,
            "VALIDATION_ERROR",
            "Validation failed",
            validation.error.flatten().fieldErrors
          );
        }
        body = validation.data;
      }

      const query = parseQuery(req.nextUrl);

      return await handler({
        req,
        user: currentUser,
        params,
        query,
        body: body as TBody,
      });
    } catch (error: unknown) {
      if (error instanceof ApiError) {
        const errPayload: { code: string; message: string; details?: unknown } = {
          code: error.code,
          message: error.message,
        };
        if (error.details) {
          errPayload.details = error.details;
        }
        return NextResponse.json({ success: false, error: errPayload }, { status: error.status });
      }

      if (error instanceof ZodError) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "VALIDATION_ERROR",
              message: "Validation failed",
              details: error.flatten().fieldErrors,
            },
          },
          { status: 400 }
        );
      }

      // Mongo duplicate key error (11000)
      if (typeof error === "object" && error !== null && (error as { code?: number }).code === 11000) {
        const keyPattern = (error as { keyPattern?: Record<string, unknown> }).keyPattern;
        if (keyPattern && "idempotencyKey" in keyPattern) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: "DUPLICATE_REQUEST",
                message: "A request with this idempotency key was already submitted",
              },
            },
            { status: 409 }
          );
        }
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "CONFLICT",
              message: "A resource with these unique properties already exists",
            },
          },
          { status: 409 }
        );
      }

      // Generic internal server error (never leak stack trace)
      console.error("Unhandled API error:", error);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INTERNAL_ERROR",
            message: "An unexpected error occurred. Please try again later.",
          },
        },
        { status: 500 }
      );
    }
  };
}
