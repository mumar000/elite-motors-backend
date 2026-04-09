import { Request, Response } from "express";
import mongoose from "mongoose";
import Car from "../models/Car.model";
import { carFormSchema, carPatchSchema } from "../schemas/carForm.schema";

function getCarQuery(id: string) {
  return mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { slug: id };
}

function parsePositiveInt(value: unknown, fallback: number) {
  const parsed = parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export const getAdminCars = async (req: Request, res: Response) => {
  try {
    const page = parsePositiveInt(req.query.page, 1);
    const limit = Math.min(50, parsePositiveInt(req.query.limit, 20));
    const q = ((req.query.q as string) ?? "").trim();
    const status = req.query.status as string;
    const featured = req.query.featured as string;
    const skip = (page - 1) * limit;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = {};

    if (status === "available" || status === "sold" || status === "reserved") {
      filter.status = status;
    }

    if (featured === "true") {
      filter.isFeatured = true;
    }
    if (featured === "false") {
      filter.isFeatured = false;
    }

    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { slug: { $regex: q, $options: "i" } },
      ];

      const year = Number(q);
      if (Number.isInteger(year)) {
        filter.$or.push({ "specs.year": year });
      }
    }

    const [cars, total, totalCars, availableCars, soldCars, featuredCars] = await Promise.all([
      Car.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select(
          "_id slug name status priceAUD isFeatured thumbnailUrl sortOrder specs.year createdAt updatedAt"
        )
        .lean(),
      Car.countDocuments(filter),
      Car.countDocuments(),
      Car.countDocuments({ status: "available" }),
      Car.countDocuments({ status: "sold" }),
      Car.countDocuments({ isFeatured: true }),
    ]);

    return res.json({
      data: cars,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        total: totalCars,
        available: availableCars,
        sold: soldCars,
        featured: featuredCars,
      },
    });
  } catch (error) {
    console.error("[GET /api/admin/cars]", error);
    return res.status(500).json({ error: "Failed to fetch admin cars" });
  }
};

export const createAdminCar = async (req: Request, res: Response) => {
  try {
    const parsed = carFormSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid payload", issues: parsed.error.flatten() });
    }

    const dataToCreate = { ...parsed.data };
    if (dataToCreate.specs && dataToCreate.specs.driveType === null) {
      delete dataToCreate.specs.driveType;
    }
    const created = await Car.create(dataToCreate as any);

    return res.status(201).json({
      data: {
        id: created._id.toString(),
        slug: created.slug,
      },
    });
  } catch (error) {
    console.error("[POST /api/admin/cars]", error);
    return res.status(500).json({ error: "Failed to create car" });
  }
};

export const getAdminCarById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const car = await Car.findOne(getCarQuery(id)).select("-__v").lean();
    if (!car) {
      return res.status(404).json({ error: "Car not found" });
    }

    return res.json({ data: car });
  } catch (error) {
    console.error("[GET /api/admin/cars/:id]", error);
    return res.status(500).json({ error: "Failed to fetch car" });
  }
};

export const updateAdminCarById = async (req: Request, res: Response) => {
  try {
    const parsed = carPatchSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid payload", issues: parsed.error.flatten() });
    }

    const patch = parsed.data;
    if (Object.keys(patch).length === 0) {
      return res.status(400).json({ error: "No fields provided" });
    }

    const id = req.params.id as string;

    const car = await Car.findOne(getCarQuery(id));
    if (!car) {
      return res.status(404).json({ error: "Car not found" });
    }

    if (patch.specs) {
      const updatedSpecs: any = {
        ...car.specs,
        ...patch.specs,
      };
      if (updatedSpecs.driveType === null) {
        delete updatedSpecs.driveType;
      }
      car.specs = updatedSpecs;
    }

    Object.entries(patch).forEach(([key, value]) => {
      if (key === "specs" || value === undefined) return;
      car.set(key, value);
    });

    await car.save();

    return res.json({
      data: {
        id: car._id.toString(),
        slug: car.slug,
      },
    });
  } catch (error) {
    console.error("[PATCH /api/admin/cars/:id]", error);
    return res.status(500).json({ error: "Failed to update car" });
  }
};

export const deleteAdminCarById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const deleted = await Car.findOneAndDelete(getCarQuery(id));
    if (!deleted) {
      return res.status(404).json({ error: "Car not found" });
    }

    return res.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/admin/cars/:id]", error);
    return res.status(500).json({ error: "Failed to delete car" });
  }
};
