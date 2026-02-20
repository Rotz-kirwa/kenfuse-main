import { createSafeRouter } from "../lib/safe-router.js";
import { z } from "zod";
import { prisma } from "../lib/db.js";
import { hashPassword, signToken, verifyPassword } from "../lib/auth.js";
import { requireAuth } from "../middleware/auth.js";
import { logActivity } from "../lib/activity.js";

const router = createSafeRouter();

const registerSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

router.post("/register", async (req, res, next) => {
  try {
    const body = registerSchema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email: body.email.toLowerCase() } });

    if (existing) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const user = await prisma.user.create({
      data: {
        fullName: body.fullName,
        email: body.email.toLowerCase(),
        passwordHash: await hashPassword(body.password),
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    await logActivity({
      userId: user.id,
      type: "REGISTER",
      entityType: "USER",
      entityId: user.id,
    });

    const token = signToken({ userId: user.id, email: user.email });
    return res.status(201).json({ user, token });
  } catch (error) {
    return next(error);
  }
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post("/login", async (req, res, next) => {
  try {
    const body = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: body.email.toLowerCase() } });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const validPassword = await verifyPassword(body.password, user.passwordHash);

    if (!validPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = signToken({ userId: user.id, email: user.email });

    await logActivity({
      userId: user.id,
      type: "LOGIN",
      entityType: "USER",
      entityId: user.id,
    });

    return res.json({
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.auth!.userId },
    select: { id: true, fullName: true, email: true, role: true, createdAt: true },
  });

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  return res.json({ user });
});

export default router;
