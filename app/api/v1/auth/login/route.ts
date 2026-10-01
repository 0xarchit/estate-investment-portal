export const dynamic = 'force-dynamic';
import bcrypt from "bcryptjs";
import { route } from "@/lib/server/handler";
import { ok } from "@/lib/server/http";
import { User } from "@/lib/server/models/User";
import { ApiError } from "@/lib/server/errors";
import { signJwt } from "@/lib/server/auth/jwt";
import { loginSchema, LoginInput } from "@/lib/validators/auth";

export const POST = route<LoginInput>(
  {
    auth: false,
    rateLimit: "auth",
    schema: loginSchema,
  },
  async ({ body }) => {
    const user = await User.findOne({ email: body.email }).select("+passwordHash");

    if (!user) {
      throw new ApiError(401, "UNAUTHENTICATED", "Invalid email or password");
    }

    if (!user.isActive) {
      throw new ApiError(401, "UNAUTHENTICATED", "Account has been deactivated");
    }

    const isMatch = await bcrypt.compare(body.password, user.passwordHash);
    if (!isMatch) {
      throw new ApiError(401, "UNAUTHENTICATED", "Invalid email or password");
    }

    const token = signJwt({
      sub: user._id.toString(),
      role: user.role,
    });

    const userObj = user.toObject();
    delete (userObj as { passwordHash?: string }).passwordHash;

    return ok({ token, user: userObj }, "Login successful");
  }
);

