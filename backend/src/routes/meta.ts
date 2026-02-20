import { Router } from "express";
import { API_CATALOG } from "../lib/api-catalog.js";

const router = Router();

router.get("/endpoints", (_req, res) => {
  res.json({ endpoints: API_CATALOG });
});

export default router;
