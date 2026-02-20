import { Router } from "express";
import { listServices } from "../lib/services-catalog.js";

const router = Router();

router.get("/", async (_req, res) => {
  const services = await listServices(false);
  return res.json({ services });
});

export default router;
