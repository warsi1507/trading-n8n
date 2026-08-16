import { Router, Request, Response } from "express";
import { Credential, User } from "@trading-n8n/db";
import { encrypt, decrypt } from "../utils/encryption";
import { getAuth } from "@clerk/express";

const router = Router();

// Middleware to get current user from MongoDB based on Clerk ID
const attachUser = async (req: Request, res: Response, next: any) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const user = await User.findOne({ clerk_id: clerkId });
    if (!user) {
      return res.status(404).json({ error: "User not found in database" });
    }
    (req as any).user = user;
    next();
  } catch (err) {
    console.error("Error fetching user:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

router.use(attachUser);

// GET /api/credentials - Fetch all credentials for the current user
router.get("/", async (req: Request, res: Response): Promise<any> => {
  try {
    const user = (req as any).user;
    const credentials = await Credential.find({ user_id: user._id }).sort({ created_at: -1 });

    const decryptedCredentials = credentials.map((cred) => {
      let plainTextValue = "";
      try {
        plainTextValue = decrypt(cred.encrypted_value, cred.iv, cred.auth_tag);
      } catch (decryptionError) {
        console.error(`Failed to decrypt credential ${cred._id}:`, decryptionError);
        plainTextValue = "ERROR_DECRYPTING"; // Or mask it
      }

      return {
        _id: cred._id.toString(),
        name: cred.name,
        value: plainTextValue,
        created_at: cred.created_at,
      };
    });

    return res.status(200).json(decryptedCredentials);
  } catch (error) {
    console.error("Error fetching credentials:", error);
    return res.status(500).json({ error: "Failed to fetch credentials" });
  }
});

// POST /api/credentials - Create a new credential
router.post("/", async (req: Request, res: Response): Promise<any> => {
  try {
    const user = (req as any).user;
    const { name, value } = req.body;

    if (!name || !value) {
      return res.status(400).json({ error: "Name and value are required" });
    }

    const { encrypted_value, iv, auth_tag } = encrypt(value);

    const newCredential = new Credential({
      user_id: user._id,
      name,
      encrypted_value,
      iv,
      auth_tag,
    });

    await newCredential.save();

    return res.status(201).json({
      _id: newCredential._id.toString(),
      name: newCredential.name,
      value: value, // Returning the plaintext just created so UI can append without refreshing
      created_at: newCredential.created_at,
    });
  } catch (error) {
    console.error("Error creating credential:", error);
    return res.status(500).json({ error: "Failed to create credential" });
  }
});

// DELETE /api/credentials/:id - Delete a credential
router.delete("/:id", async (req: Request, res: Response): Promise<any> => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    const credential = await Credential.findOneAndDelete({
      _id: id,
      user_id: user._id,
    });

    if (!credential) {
      return res.status(404).json({ error: "Credential not found" });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error deleting credential:", error);
    return res.status(500).json({ error: "Failed to delete credential" });
  }
});

export default router;
