// ============================================
// Auth Routes — Register, Login, Email Verification, Password Reset
// ============================================

import { Router, Request, Response } from "express"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import crypto from "node:crypto"
import { prisma } from "../lib/prisma.js"
import { validate } from "../middleware/validate.js"
import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../validators/auth.js"
import {
  sendEmailVerificationEmail,
  sendPasswordResetEmail,
} from "../services/resend.js"

const router = Router()

const JWT_SECRET = process.env.JWT_SECRET
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? "7d"
const BCRYPT_ROUNDS = 12

if (!JWT_SECRET) {
  console.error("FATAL: JWT_SECRET environment variable is not set.")
  process.exit(1)
}

/** Issues a signed JWT for a given user ID */
function signToken(userId: string): string {
  return jwt.sign({ sub: userId }, JWT_SECRET!, {
    expiresIn: JWT_EXPIRES_IN,
  } as jwt.SignOptions)
}

/**
 * POST /api/auth/register
 * Creates a new user account and sends an email verification link.
 */
router.post(
  "/register",
  validate(registerSchema),
  async (req: Request, res: Response): Promise<void> => {
    const { email, password, fullName } = req.body as {
      email: string
      password: string
      fullName: string
    }

    // Check if email already registered
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      res.status(409).json({
        success: false,
        error: "An account with this email already exists",
        code: "EMAIL_TAKEN",
      })
      return
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS)
    const verificationToken = crypto.randomBytes(32).toString("hex")
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h

    await prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName,
        emailVerificationToken: verificationToken,
        emailVerificationExpires: verificationExpires,
        wallet: { create: {} },
      },
    })

    // Send verification email (non-blocking — don't fail registration if email fails)
    sendEmailVerificationEmail(email, fullName, verificationToken).catch((err) =>
      console.error("[Auth] Failed to send verification email:", err)
    )

    res.status(201).json({
      success: true,
      data: { message: "Account created. Please check your email to verify your account." },
    })
  }
)

/**
 * POST /api/auth/login
 * Authenticates the user and returns a JWT access token.
 */
router.post(
  "/login",
  validate(loginSchema),
  async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body as { email: string; password: string }

    const user = await prisma.user.findUnique({ where: { email } })

    // Use consistent timing to prevent user enumeration
    const dummyHash = "$2b$12$e.67GpvEKJbqInPKP7W9eeijszkS/sq.NXdPThKmj9tB0cUITsT1C"
    const passwordMatch = user?.passwordHash
      ? await bcrypt.compare(password, user.passwordHash)
      : await bcrypt.compare(password, dummyHash).then(() => false)

    if (!user || !passwordMatch) {
      res.status(401).json({
        success: false,
        error: "Invalid email or password",
        code: "INVALID_CREDENTIALS",
      })
      return
    }

    if (!user.emailVerified) {
      res.status(403).json({
        success: false,
        error: "Please verify your email address before signing in",
        code: "EMAIL_NOT_VERIFIED",
      })
      return
    }

    if (user.isBanned) {
      res.status(403).json({
        success: false,
        error: "Your account has been suspended",
        code: "ACCOUNT_BANNED",
      })
      return
    }

    const token = signToken(user.id)

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          avatarUrl: user.avatarUrl,
          isAdmin: user.isAdmin,
          verificationStatus: user.verificationStatus,
          onboardingComplete: user.onboardingComplete,
        },
      },
    })
  }
)

/**
 * POST /api/auth/verify-email
 * Verifies a user's email address using the token sent via email.
 */
router.post(
  "/verify-email",
  validate(verifyEmailSchema),
  async (req: Request, res: Response): Promise<void> => {
    const { token } = req.body as { token: string }

    const user = await prisma.user.findUnique({
      where: { emailVerificationToken: token },
    })

    if (
      !user ||
      !user.emailVerificationExpires ||
      user.emailVerificationExpires < new Date()
    ) {
      res.status(400).json({
        success: false,
        error: "Invalid or expired verification token",
        code: "INVALID_TOKEN",
      })
      return
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
      },
    })

    const accessToken = signToken(user.id)

    res.json({
      success: true,
      data: {
        token: accessToken,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          avatarUrl: user.avatarUrl,
          isAdmin: user.isAdmin,
          verificationStatus: user.verificationStatus,
          onboardingComplete: user.onboardingComplete,
        },
      },
    })
  }
)

/**
 * POST /api/auth/resend-verification
 * Resends the email verification link.
 */
router.post(
  "/resend-verification",
  validate(resendVerificationSchema),
  async (req: Request, res: Response): Promise<void> => {
    const { email } = req.body as { email: string }

    const user = await prisma.user.findUnique({ where: { email } })

    // Always return 200 to prevent email enumeration
    if (!user || user.emailVerified) {
      res.json({
        success: true,
        data: { message: "If an unverified account exists, a new link has been sent." },
      })
      return
    }

    const verificationToken = crypto.randomBytes(32).toString("hex")
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken: verificationToken,
        emailVerificationExpires: verificationExpires,
      },
    })

    sendEmailVerificationEmail(email, user.fullName, verificationToken).catch((err) =>
      console.error("[Auth] Failed to resend verification email:", err)
    )

    res.json({
      success: true,
      data: { message: "If an unverified account exists, a new link has been sent." },
    })
  }
)

/**
 * POST /api/auth/forgot-password
 * Sends a password reset link to the user's email.
 */
router.post(
  "/forgot-password",
  validate(forgotPasswordSchema),
  async (req: Request, res: Response): Promise<void> => {
    const { email } = req.body as { email: string }

    const user = await prisma.user.findUnique({ where: { email } })

    // Always return 200 to prevent email enumeration
    if (user) {
      const resetToken = crypto.randomBytes(32).toString("hex")
      const resetExpires = new Date(Date.now() + 60 * 60 * 1000) // 1h

      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetToken: resetToken,
          passwordResetExpires: resetExpires,
        },
      })

      sendPasswordResetEmail(email, user.fullName, resetToken).catch((err) =>
        console.error("[Auth] Failed to send password reset email:", err)
      )
    }

    res.json({
      success: true,
      data: { message: "If an account with that email exists, a reset link has been sent." },
    })
  }
)

/**
 * POST /api/auth/reset-password
 * Resets the user's password using the token from the reset email.
 */
router.post(
  "/reset-password",
  validate(resetPasswordSchema),
  async (req: Request, res: Response): Promise<void> => {
    const { token, password } = req.body as { token: string; password: string }

    const user = await prisma.user.findUnique({
      where: { passwordResetToken: token },
    })

    if (
      !user ||
      !user.passwordResetExpires ||
      user.passwordResetExpires < new Date()
    ) {
      res.status(400).json({
        success: false,
        error: "Invalid or expired reset token",
        code: "INVALID_TOKEN",
      })
      return
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    })

    res.json({
      success: true,
      data: { message: "Password reset successfully. You can now sign in." },
    })
  }
)

export default router
