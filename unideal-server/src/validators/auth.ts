import { z } from "zod"

export const registerSchema = z.object({
  email: z.string().email("Invalid email address").toLowerCase(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password is too long"),
  fullName: z.string().min(2, "Name must be at least 2 characters").max(100),
})

export const loginSchema = z.object({
  email: z.string().email("Invalid email address").toLowerCase(),
  password: z.string().min(1, "Password is required"),
})

export const verifyEmailSchema = z.object({
  token: z.string().min(1, "Verification token is required"),
})

export const resendVerificationSchema = z.object({
  email: z.string().email("Invalid email address").toLowerCase(),
})

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address").toLowerCase(),
})

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password is too long"),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>
export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
