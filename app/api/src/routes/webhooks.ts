import { Router } from "express";
import express from "express";
import { Webhook } from "svix";
import { User, Workflow, Counter } from "@trading-n8n/db";

const router = Router();

// Clerk webhook payload types
interface ClerkWebhookEvent {
  type: string;
  data: {
    id: string;
    email_addresses: Array<{ email_address: string; id: string }>;
    first_name: string;
    last_name: string;
  };
}

// Ensure this route gets the raw body for svix signature verification
router.post( "/clerk", express.raw({ type: "application/json" }), async (req, res) => {
    const SIGNING_SECRET = process.env.CLERK_WEBHOOK_SECRET;

    if (!SIGNING_SECRET) {
      console.error("Missing CLERK_WEBHOOK_SECRET in environment");
      return res.status(500).json({ error: "Server Configuration Error" });
    }

    // Get the headers
    const svix_id = req.headers["svix-id"] as string;
    const svix_timestamp = req.headers["svix-timestamp"] as string;
    const svix_signature = req.headers["svix-signature"] as string;

    // If there are no headers, error out
    if (!svix_id || !svix_timestamp || !svix_signature) {
      return res.status(400).json({ error: "Missing svix headers" });
    }

    // Get the raw body
    const payload = req.body.toString("utf8");

    let wh: Webhook;
    try {
      // Create a new Svix instance with your secret.
      wh = new Webhook(SIGNING_SECRET);
    } catch (err) {
      console.error("Invalid Webhook Secret format:", err);
      return res.status(500).json({ error: "Invalid Server Configuration" });
    }

    let evt: ClerkWebhookEvent;

    // Verify the payload with the headers
    try {
      evt = wh.verify(payload, {
        "svix-id": svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature": svix_signature,
      }) as ClerkWebhookEvent;
    } catch (err) {
      console.error("Error verifying webhook:", err);
      return res.status(400).json({ error: "Webhook verification failed" });
    }

    const { id } = evt.data;
    const eventType = evt.type;

    console.log(`Webhook with an ID of ${id} and type of ${eventType}`);

    if (eventType === "user.created" || eventType === "user.updated") {
      const email = evt.data.email_addresses[0]?.email_address;
      const firstName = evt.data.first_name || "";
      const lastName = evt.data.last_name || "";
      const name = `${firstName} ${lastName}`.trim() || email;

      try {
        await User.findOneAndUpdate(
          { clerk_id: id },
          { 
            clerk_id: id,
            email, 
            name 
          },
          { upsert: true, returnDocument: 'after' }
        );
        console.log(`Successfully synced user ${id} to MongoDB`);
      } catch (error) {
        console.error("Failed to sync user to MongoDB:", error);
        return res.status(500).json({ error: "Database error" });
      }
    }

    if (eventType === "user.deleted") {
      try {
        const deletedUser = await User.findOneAndDelete({ clerk_id: id });
        if (deletedUser) {
          await Workflow.deleteMany({ user_id: deletedUser._id });
          await Counter.findOneAndDelete({ _id: `workflowId-${deletedUser._id}` });
        }
        console.log(`Successfully deleted user ${id} and all associated data from MongoDB`);
      } catch (error) {
        console.error("Failed to delete user from MongoDB:", error);
        return res.status(500).json({ error: "Database error" });
      }
    }

    return res.status(200).json({ success: true });
  }
);

export default router;
