import bcrypt from "bcryptjs";
import { route } from "@/lib/server/handler";
import { ok } from "@/lib/server/http";
import { User } from "@/lib/server/models/User";
import { ApiError } from "@/lib/server/errors";
import { changePasswordSchema, ChangePasswordInput } from "@/lib/validators/auth";

export const POST = route<ChangePasswordInput>(
  {
    auth: true,
    schema: changePasswordSchema,
  },
  async ({ user, body }) => {
    const userWithPw = await User.findById(user!._id).select("+passwordHash");
    if (!userWithPw) {
      throw new ApiError(404, "NOT_FOUND", "User not found");
    }

    const isMatch = await bcrypt.compare(body.currentPassword, userWithPw.passwordHash);
    if (!isMatch) {
      throw new ApiError(400, "VALIDATION_ERROR", "Current password is incorrect");
    }

    const salt = await bcrypt.genSalt(10);
    userWithPw.passwordHash = await bcrypt.hash(body.newPassword, salt);
    await userWithPw.save();

    return ok({}, "Password changed successfully");
  }
);
