import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./lib/env.js";
import { prisma } from "./lib/db.js";
import authRoutes from "./routes/auth.js";
import legacyPlanRoutes from "./routes/legacy-plan.js";
import fundraiserRoutes from "./routes/fundraisers.js";
import memorialRoutes from "./routes/memorials.js";
import marketplaceRoutes from "./routes/marketplace.js";
import activityRoutes from "./routes/activities.js";
import adminRoutes from "./routes/admin.js";
import metaRoutes from "./routes/meta.js";
import servicesRoutes from "./routes/services.js";
import { errorHandler } from "./middleware/error-handler.js";

const app = express();
const allowedOrigins = env.CORS_ORIGINS.split(",").map((origin) => origin.trim()).filter(Boolean);
const isDevelopment = env.NODE_ENV !== "production";

function isAllowedDevelopmentOrigin(origin: string) {
  return /^https?:\/\/(localhost|127\.0\.0\.1|\d{1,3}(\.\d{1,3}){3})(:\d+)?$/.test(origin);
}

app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      if (isDevelopment && isAllowedDevelopmentOrigin(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`Not allowed by CORS: ${origin}`));
    },
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/legacy-plan", legacyPlanRoutes);
app.use("/api/fundraisers", fundraiserRoutes);
app.use("/api/memorials", memorialRoutes);
app.use("/api/marketplace", marketplaceRoutes);
app.use("/api/activities", activityRoutes);
app.use("/api/services", servicesRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/meta", metaRoutes);

app.use(errorHandler);

const server = app.listen(env.PORT, () => {
  console.log(`API running on http://localhost:${env.PORT}`);
});

async function shutdown(signal: string) {
  console.log(`Received ${signal}. Shutting down.`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});
