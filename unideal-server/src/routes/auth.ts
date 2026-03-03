import { Router, Request, Response } from "express"
import { Webhook } from "svix"
import { prisma } from "../lib/prisma.js"

const router = Router()

interface ClerkUserCreatedEvent {
  type: "user.created"
  data: {
    id: string
    email_addresses: { email_address: string; id: string }[]
    primary_email_address_id: string
    first_name: string | null
    last_name: string | null
    image_url: string | null
  }
}

interface ClerkUserUpdatedEvent {
  type: "user.updated"
  data: {
    id: string
    email_addresses: { email_address: string; id: string }[]
    primary_email_address_id: string
    first_name: string | null
    last_name: string | null
    image_url: string | null
  }
}

interface ClerkUserDeletedEvent {
  type: "user.deleted"
  data: {
    id: string
    deleted: boolean
  }
}

type ClerkWebhookEvent =
  | ClerkUserCreatedEvent
  | ClerkUserUpdatedEvent
  | ClerkUserDeletedEvent

/**
 * POST /api/webhooks/clerk
 * Receives Clerk webhook events and syncs user data to the database.
 * Handles: user.created, user.updated
 */
router.post(
  "/",
  async (req: Request, res: Response): Promise<void> => {
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET

    if (!webhookSecret) {
      console.error("CLERK_WEBHOOK_SECRET is not set")
      res.status(500).json({ error: "Webhook secret not configured" })
      return
    }

    // Verify Svix signature
    const svix_id = req.headers["svix-id"] as string
    const svix_timestamp = req.headers["svix-timestamp"] as string
    const svix_signature = req.headers["svix-signature"] as string

    if (!svix_id || !svix_timestamp || !svix_signature) {
      res.status(400).json({ error: "Missing Svix headers" })
      return
    }

    const wh = new Webhook(webhookSecret)
    let event: ClerkWebhookEvent

    try {
      event = wh.verify(req.body.toString(), {
        "svix-id": svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature": svix_signature,
      }) as ClerkWebhookEvent
    } catch (err) {
      console.error("Clerk webhook signature verification failed:", err)
      res.status(400).json({ error: "Invalid webhook signature" })
      return
    }

    try {
      if (event.type === "user.created") {
        const primaryEmail = event.data.email_addresses.find(
          (e) => e.id === event.data.primary_email_address_id
        )
        const email = primaryEmail?.email_address ?? ""
        const fullName =
          [event.data.first_name, event.data.last_name].filter(Boolean).join(" ") ||
          "Unideal User"

        // Create user + wallet atomically
        await prisma.user.create({
          data: {
            clerkId: event.data.id,
            email,
            fullName,
            avatarUrl: event.data.image_url ?? undefined,
            wallet: { create: {} },
          },
        })

        console.log(`[Clerk webhook] Created user: ${email}`)
      }

      if (event.type === "user.updated") {
        const primaryEmail = event.data.email_addresses.find(
          (e) => e.id === event.data.primary_email_address_id
        )
        const email = primaryEmail?.email_address ?? undefined
        const fullName =
          [event.data.first_name, event.data.last_name].filter(Boolean).join(" ") ||
          undefined

        await prisma.user.update({
          where: { clerkId: event.data.id },
          data: {
            ...(email && { email }),
            ...(fullName && { fullName }),
            ...(event.data.image_url && { avatarUrl: event.data.image_url }),
          },
        })

        console.log(`[Clerk webhook] Updated user: ${event.data.id}`)
      }

      if (event.type === "user.deleted") {
        // Use deleteMany for idempotency — silently succeeds if user was already removed
        await prisma.user.deleteMany({
          where: { clerkId: event.data.id },
        })

        console.log(`[Clerk webhook] Deleted user: ${event.data.id}`)
      }

      res.status(200).json({ received: true })
    } catch (err) {
      console.error("Clerk webhook DB error:", err)
      res.status(500).json({ error: "Internal error processing webhook" })
    }
  }
)

export default router
