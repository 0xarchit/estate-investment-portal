import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email("Invalid email address").toLowerCase(),
  password: z.string().min(1, "Password is required"),
  role: z.enum(["INVESTOR", "BROKER", "ADMIN"]).optional(),
});

export const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters").trim(),
    email: z.string().email("Invalid email address").toLowerCase().trim(),
    phone: z
      .string()
      .regex(/^[6-9]\d{9}$/, "Phone must be a valid 10-digit mobile number")
      .trim(),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(/[^a-zA-Z0-9]/, "Password must contain at least one special character"),
    confirmPassword: z.string().optional(),
    role: z.enum(["INVESTOR", "BROKER"]),
  })
  .refine(
    (d) => d.confirmPassword === undefined || d.password === d.confirmPassword,
    {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    }
  );

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters")
      .regex(/[0-9]/, "New password must contain at least one number")
      .regex(/[^a-zA-Z0-9]/, "New password must contain at least one special character"),
    confirmNewPassword: z.string().optional(),
  })
  .refine(
    (d) => d.confirmNewPassword === undefined || d.newPassword === d.confirmNewPassword,
    {
      message: "Passwords do not match",
      path: ["confirmNewPassword"],
    }
  );

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address").toLowerCase().trim(),
});

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(/[^a-zA-Z0-9]/, "Password must contain at least one special character"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
