import bcrypt from "bcryptjs";
import { route } from "@/lib/server/handler";
import { ok } from "@/lib/server/http";
import { User } from "@/lib/server/models/User";
import { ApiError } from "@/lib/server/errors";
import { registerSchema, RegisterInput } from "@/lib/validators/auth";

export const POST = route<RegisterInput>(
  {
    auth: false,
    rateLimit: "auth",
    schema: registerSchema,
  },
  async ({ body }) => {
    const existing = await User.findOne({ email: body.email });
    if (existing) {
      throw new ApiError(409, "CONFLICT", "A user with this email already exists");
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(body.password, salt);

    const newUser = await User.create({
      name: body.name,
      email: body.email,
      phone: body.phone,
      passwordHash,
      role: body.role,
      isActive: true,
      brokerApproved: false,
      walletBalance: 0,
      kyc: {
        status: "NOT_SUBMITTED",
        docs: [],
      },
    });

    const userObj = newUser.toObject();
    delete (userObj as { passwordHash?: string }).passwordHash;

    return ok({ user: userObj }, "Registration successful", 201);
  }
);
