import { Request, Response, NextFunction } from "express"
import jwt from "jsonwebtoken"
import { prisma } from "../lib/prisma.js"

const JWT_SECRET = process.env.JWT_SECRET!

/**
 * Extracts the access token from httpOnly cookie or Authorization header (fallback).
 */
function extractToken(req: Request): string | null {
  // 1. Try httpOnly cookie first
  const cookieToken = req.cookies?.access_token as string | undefined
  if (cookieToken) return cookieToken

  // 2. Fallback to Bearer header (useful for Postman / external API clients)
  const authHeader = req.headers.authorization
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7)
  }

  return null
}

/**
 * Verifies JWT from httpOnly cookie or Authorization header.
 * Attaches `req.user` with DB user data including isAdmin and verificationStatus.
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const token = extractToken(req)

  if (!token) {
    res.status(401).json({
      success: false,
      error: "Unauthorized — missing token",
      code: "UNAUTHORIZED",
    })
    return
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload
    const userId = payload.sub as string

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        isAdmin: true,
        isBanned: true,
        verificationStatus: true,
        onboardingComplete: true,
      },
    })

    if (!user) {
      res.status(401).json({
        success: false,
        error: "User not found — please sign in again",
        code: "USER_NOT_FOUND",
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

    req.user = {
      id: user.id,
      email: user.email,
      isAdmin: user.isAdmin,
      verificationStatus: user.verificationStatus,
      onboardingComplete: user.onboardingComplete,
    }

    next()
  } catch {
    res.status(401).json({
      success: false,
      error: "Invalid or expired token",
      code: "INVALID_TOKEN",
    })
  }
}

/**
 * Optionally extracts user from JWT if present. Does not fail if no token.
 * Useful for public endpoints that want to personalize responses for logged-in users.
 */
export async function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const token = extractToken(req)
  if (!token) {
    next()
    return
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload
    const userId = payload.sub as string
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        isAdmin: true,
        isBanned: true,
        verificationStatus: true,
        onboardingComplete: true,
      },
    })
    if (user && !user.isBanned) {
      req.user = {
        id: user.id,
        email: user.email,
        isAdmin: user.isAdmin,
        verificationStatus: user.verificationStatus,
        onboardingComplete: user.onboardingComplete,
      }
    }
  } catch {
    // Token invalid — proceed as unauthenticated
  }
  next()
}

/**
 * Requires the authenticated user to have VERIFIED status.
 * Must be placed AFTER `requireAuth` middleware.
 */
export function requireVerified(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (req.user?.verificationStatus !== "VERIFIED") {
    res.status(403).json({
      success: false,
      error: "College verification required to perform this action",
      code: "NOT_VERIFIED",
    })
    return
  }
  next()
}
