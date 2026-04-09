import { Router } from "express";
import { requireAdmin } from "../middlewares/auth.middleware";
import {
  getAdminCars,
  createAdminCar,
  getAdminCarById,
  updateAdminCarById,
  deleteAdminCarById,
} from "../controllers/admin.controller";

const router = Router();

router.use(requireAdmin);

router.get("/cars", getAdminCars);
router.post("/cars", createAdminCar);
router.get("/cars/:id", getAdminCarById);
router.patch("/cars/:id", updateAdminCarById);
router.delete("/cars/:id", deleteAdminCarById);

export default router;
