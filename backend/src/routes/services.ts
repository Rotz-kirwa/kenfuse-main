import { createSafeRouter } from "../lib/safe-router.js";
import { listServices } from "../lib/services-catalog.js";

const router = createSafeRouter();

router.get("/", async (_req, res) => {
  const services = await listServices(false);
  return res.json({ services });
});

export default router;
