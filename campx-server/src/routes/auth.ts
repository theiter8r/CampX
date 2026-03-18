import { Router, Request, Response, NextFunction } from "express"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import crypto from "crypto"
import { prisma } from "../lib/prisma.js"
import { requireAuth } from "../middleware/auth.js"
import { sendVerificationEmail } from "../services/resend.js"
import { z } from "zod"
import { validate } from "../middleware/validate.js"

const router = Router()

const JWT_SECRET = process.env.JWT_SECRET!
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!
const SALT_ROUNDS = 12

// ── Validators ────────────────────────────────────────────────────────────────

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password is too long"),
  fullName: z.string().min(2, "Name must be at least 2 characters").max(100),
})

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
})

const resendVerificationSchema = z.object({
  email: z.string().email("Invalid email address"),
})

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
})

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
})

// ── Helpers ───────────────────────────────────────────────────────────────────

const IS_PROD = process.env.NODE_ENV === "production"

/** Shared cookie options */
const COOKIE_OPTS = {
  httpOnly: true,
  secure: IS_PROD,
  sameSite: IS_PROD ? ("none" as const) : ("lax" as const),
  path: "/",
}

/** Generates short-lived access token (15 min) */
function signAccessToken(userId: string): string {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: "15m" })
}

/** Generates long-lived refresh token (7 days) */
function signRefreshToken(userId: string): string {
  return jwt.sign({ sub: userId }, JWT_REFRESH_SECRET, { expiresIn: "7d" })
}

/** Set access + refresh tokens as httpOnly cookies on the response */
function setTokenCookies(res: Response, accessToken: string, refreshToken: string): void {
  res.cookie("access_token", accessToken, {
    ...COOKIE_OPTS,
    maxAge: 15 * 60 * 1000, // 15 minutes
  })
  res.cookie("refresh_token", refreshToken, {
    ...COOKIE_OPTS,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  })
}

/** Clear auth cookies */
function clearTokenCookies(res: Response): void {
  res.clearCookie("access_token", COOKIE_OPTS)
  res.clearCookie("refresh_token", COOKIE_OPTS)
}

// ── POST /api/auth/register ───────────────────────────────────────────────────

/**
 * Register a new user with email + password.
 * Sends a verification email via Resend.
 */
router.post(
  "/register",
  validate(registerSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password, fullName } = req.body as z.infer<typeof registerSchema>

      // Check if email already exists
      const existing = await prisma.user.findUnique({ where: { email } })
      if (existing) {
        res.status(409).json({
          success: false,
          error: "An account with this email already exists",
          code: "EMAIL_EXISTS",
        })
        return
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)

      // Generate email verification token
      const emailVerifyToken = crypto.randomBytes(32).toString("hex")

      // Create user + wallet atomically
      const user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          fullName,
          emailVerifyToken,
          emailVerified: false,
          wallet: { create: {} },
        },
        select: { id: true, email: true, fullName: true },
      })

      // Send verification email
      try {
        await sendVerificationEmail(email, fullName, emailVerifyToken)
      } catch (emailErr) {
        console.error("[Auth] Failed to send verification email:", emailErr)
      }

      console.log(`[Auth] Registered: ${email}`)

      res.status(201).json({
        success: true,
        data: {
          user: { id: user.id, email: user.email, fullName: user.fullName },
          message: "Account created. Please check your email to verify your account.",
        },
      })
    } catch (err) {
      next(err)
    }
  }
)

// ── POST /api/auth/login ──────────────────────────────────────────────────────

/**
 * Log in with email + password. Returns access + refresh tokens.
 */
router.post(
  "/login",
  validate(loginSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password } = req.body as z.infer<typeof loginSchema>

      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          fullName: true,
          passwordHash: true,
          emailVerified: true,
          isBanned: true,
          isAdmin: true,
          verificationStatus: true,
          onboardingComplete: true,
          avatarUrl: true,
        },
      })

      if (!user) {
        res.status(401).json({
          success: false,
          error: "Invalid email or password",
          code: "INVALID_CREDENTIALS",
        })
        return
      }

      const passwordValid = await bcrypt.compare(password, user.passwordHash)
      if (!passwordValid) {
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
          error: "Please verify your email before signing in",
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

      const accessToken = signAccessToken(user.id)
      const refreshToken = signRefreshToken(user.id)

      // Set httpOnly cookies
      setTokenCookies(res, accessToken, refreshToken)

      console.log(`[Auth] Login: ${email}`)

      res.json({
        success: true,
        data: {
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
    } catch (err) {
      next(err)
    }
  }
)

// ── POST /api/auth/refresh ────────────────────────────────────────────────────

/**
 * Exchange a valid refresh token for a new access token.
 */
router.post(
  "/refresh",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Read refresh token from httpOnly cookie (fallback to body for backwards compat)
      const refreshToken =
        (req.cookies?.refresh_token as string | undefined) ??
        (req.body as { refreshToken?: string })?.refreshToken

      if (!refreshToken) {
        res.status(400).json({
          success: false,
          error: "Refresh token is required",
          code: "MISSING_TOKEN",
        })
        return
      }

      let payload: jwt.JwtPayload
      try {
        payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as jwt.JwtPayload
      } catch {
        clearTokenCookies(res)
        res.status(401).json({
          success: false,
          error: "Invalid or expired refresh token",
          code: "INVALID_REFRESH_TOKEN",
        })
        return
      }

      const userId = payload.sub as string

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, isBanned: true },
      })

      if (!user || user.isBanned) {
        clearTokenCookies(res)
        res.status(401).json({
          success: false,
          error: "User not found or banned",
          code: "USER_NOT_FOUND",
        })
        return
      }

      const accessToken = signAccessToken(userId)
      const newRefreshToken = signRefreshToken(userId)

      setTokenCookies(res, accessToken, newRefreshToken)

      res.json({
        success: true,
        data: { message: "Token refreshed" },
      })
    } catch (err) {
      next(err)
    }
  }
)

// ── GET /api/auth/verify-email?token=... ──────────────────────────────────────

/**
 * Verify email address via the token sent during registration.
 */
router.get(
  "/verify-email",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { token } = req.query as { token?: string }

      if (!token) {
        res.status(400).json({
          success: false,
          error: "Verification token is required",
          code: "MISSING_TOKEN",
        })
        return
      }

      const user = await prisma.user.findFirst({
        where: { emailVerifyToken: token },
        select: { id: true, emailVerified: true },
      })

      if (!user) {
        res.status(400).json({
          success: false,
          error: "Invalid or expired verification token",
          code: "INVALID_TOKEN",
        })
        return
      }

      if (user.emailVerified) {
        res.json({
          success: true,
          data: { message: "Email already verified" },
        })
        return
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: true, emailVerifyToken: null },
      })

      console.log(`[Auth] Email verified for user: ${user.id}`)

      res.json({
        success: true,
        data: { message: "Email verified successfully. You can now sign in." },
      })
    } catch (err) {
      next(err)
    }
  }
)

// ── POST /api/auth/resend-verification ────────────────────────────────────────

/**
 * Resend the verification email for an unverified account.
 */
router.post(
  "/resend-verification",
  validate(resendVerificationSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email } = req.body as z.infer<typeof resendVerificationSchema>

      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, fullName: true, emailVerified: true },
      })

      if (!user) {
        res.json({
          success: true,
          data: { message: "If an account exists, a verification email has been sent." },
        })
        return
      }

      if (user.emailVerified) {
        res.json({
          success: true,
          data: { message: "Email is already verified." },
        })
        return
      }

      const emailVerifyToken = crypto.randomBytes(32).toString("hex")
      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerifyToken },
      })

      await sendVerificationEmail(email, user.fullName, emailVerifyToken)

      res.json({
        success: true,
        data: { message: "Verification email sent." },
      })
    } catch (err) {
      next(err)
    }
  }
)

// ── POST /api/auth/forgot-password ────────────────────────────────────────────

/**
 * Send a password reset email.
 */
router.post(
  "/forgot-password",
  validate(forgotPasswordSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email } = req.body as z.infer<typeof forgotPasswordSchema>

      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, fullName: true },
      })

      if (!user) {
        res.json({
          success: true,
          data: { message: "If an account exists, a reset link has been sent." },
        })
        return
      }

      const resetToken = crypto.randomBytes(32).toString("hex")
      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerifyToken: resetToken },
      })

      console.log(`[Auth] Password reset requested for ${email}`)

      res.json({
        success: true,
        data: { message: "If an account exists, a reset link has been sent." },
      })
    } catch (err) {
      next(err)
    }
  }
)

// ── POST /api/auth/reset-password ─────────────────────────────────────────────

/**
 * Reset password using token from forgot-password email.
 */
router.post(
  "/reset-password",
  validate(resetPasswordSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { token, password } = req.body as z.infer<typeof resetPasswordSchema>

      const user = await prisma.user.findFirst({
        where: { emailVerifyToken: token },
        select: { id: true },
      })

      if (!user) {
        res.status(400).json({
          success: false,
          error: "Invalid or expired reset token",
          code: "INVALID_TOKEN",
        })
        return
      }

      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)

      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash, emailVerifyToken: null },
      })

      console.log(`[Auth] Password reset for user: ${user.id}`)

      res.json({
        success: true,
        data: { message: "Password reset successfully. You can now sign in." },
      })
    } catch (err) {
      next(err)
    }
  }
)

// ── GET /api/auth/me ──────────────────────────────────────────────────────────

/**
 * Returns the current authenticated user's basic info (from JWT).
 */
router.get(
  "/me",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        select: {
          id: true,
          email: true,
          fullName: true,
          avatarUrl: true,
          phone: true,
          collegeId: true,
          college: { select: { id: true, name: true, slug: true, logoUrl: true } },
          verificationStatus: true,
          isAdmin: true,
          onboardingComplete: true,
          emailVerified: true,
          wallet: { select: { id: true, balance: true, frozenBalance: true } },
          _count: { select: { reviewsReceived: true } },
          reviewsReceived: { select: { rating: true } },
        },
      })

      if (!user) {
        res.status(401).json({
          success: false,
          error: "User not found",
          code: "USER_NOT_FOUND",
        })
        return
      }

      const reviewCount = user._count.reviewsReceived
      const avgRating =
        reviewCount > 0
          ? user.reviewsReceived.reduce((sum, r) => sum + r.rating, 0) / reviewCount
          : undefined

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            avatarUrl: user.avatarUrl,
            phone: user.phone,
            collegeId: user.collegeId,
            college: user.college,
            verificationStatus: user.verificationStatus,
            isAdmin: user.isAdmin,
            onboardingComplete: user.onboardingComplete,
            emailVerified: user.emailVerified,
            wallet: user.wallet
              ? {
                  id: user.wallet.id,
                  balance: user.wallet.balance.toString(),
                  frozenBalance: user.wallet.frozenBalance.toString(),
                }
              : undefined,
            avgRating,
            reviewCount,
          },
        },
      })
    } catch (err) {
      next(err)
    }
  }
)

// ── POST /api/auth/logout ─────────────────────────────────────────────────────

/**
 * Clears httpOnly auth cookies.
 */
router.post("/logout", (_req: Request, res: Response): void => {
  clearTokenCookies(res)
  res.json({ success: true, data: { message: "Logged out" } })
})

export default router
