import jwt from "jsonwebtoken";
import { env } from "@/lib/server/config/env";
import { UserRole } from "@/lib/server/models/User";

export interface JwtPayload {
  sub: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export function signJwt(payload: { sub: string; role: UserRole }): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
}

export function verifyJwt(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
}
