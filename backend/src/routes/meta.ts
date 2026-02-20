import { createSafeRouter } from "../lib/safe-router.js";
import { API_CATALOG } from "../lib/api-catalog.js";

const router = createSafeRouter();

router.get("/endpoints", (_req, res) => {
  res.json({ endpoints: API_CATALOG });
});

export default router;
