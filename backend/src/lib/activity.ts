import { Prisma } from "@prisma/client";
import { prisma } from "./db.js";

interface ActivityInput {
  userId?: string;
  type: string;
  entityType: string;
  entityId: string;
  metadata?: Prisma.InputJsonValue;
}

export async function logActivity(input: ActivityInput) {
  try {
    await prisma.activity.create({
      data: {
        userId: input.userId,
        type: input.type,
        entityType: input.entityType,
        entityId: input.entityId,
        metadata: input.metadata,
      },
    });
  } catch (error) {
    // Activity logging must not block primary API operations (login, signup, etc).
    console.error("Activity logging failed:", error);
  }
}
