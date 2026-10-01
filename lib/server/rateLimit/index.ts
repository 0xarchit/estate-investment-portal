import { ApiError } from "@/lib/server/errors";

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

function cleanStaleRecords(now: number): void {
  if (rateLimitStore.size > 500) {
    for (const [key, record] of rateLimitStore.entries()) {
      if (now > record.resetTime) {
        rateLimitStore.delete(key);
      }
    }
  }
}

export function checkRateLimit(
  identifier: string,
  limit: number,
  windowMs = 60000
): void {
  const now = Date.now();
  cleanStaleRecords(now);

  const record = rateLimitStore.get(identifier);

  if (!record || now > record.resetTime) {
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    });
    return;
  }

  if (record.count >= limit) {
    const retryAfter = Math.ceil((record.resetTime - now) / 1000);
    throw new ApiError(
      429,
      "TOO_MANY_REQUESTS",
      `Too many requests. Please try again in ${retryAfter} seconds.`
    );
  }

  record.count += 1;
}
