import { Router } from "express";
import { getCars, getFeaturedCars, getCarById } from "../controllers/cars.controller";

const router = Router();

router.get("/", getCars);
router.get("/featured", getFeaturedCars);
router.get("/:id", getCarById);

export default router;
