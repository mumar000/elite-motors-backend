import { Request, Response } from "express";
import mongoose from "mongoose";
import Car from "../models/Car.model";

export const getCars = async (req: Request, res: Response) => {
  try {
    const status = req.query.status as string;
    const tag = req.query.tag as string;
    const q = (req.query.q as string)?.trim() ?? "";
    const minPriceParam = req.query.minPrice as string;
    const maxPriceParam = req.query.maxPrice as string;
    const fromYearParam = req.query.fromYear as string;
    const toYearParam = req.query.toYear as string;
    const page = Math.max(1, parseInt((req.query.page as string) ?? "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt((req.query.limit as string) ?? "12", 10)));
    const sort = (req.query.sort as string) ?? "sortOrder_asc";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = {};
    if (status === "available" || status === "sold" || status === "reserved") {
      filter.status = status;
    }
    if (tag) {
      filter.tags = tag;
    }
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { tagline: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
      ];
    }

    const minPrice = minPriceParam ? Number(minPriceParam) : undefined;
    const maxPrice = maxPriceParam ? Number(maxPriceParam) : undefined;
    if (Number.isFinite(minPrice) || Number.isFinite(maxPrice)) {
      filter.priceAUD = {};
      if (Number.isFinite(minPrice)) {
        filter.priceAUD.$gte = minPrice;
      }
      if (Number.isFinite(maxPrice)) {
        filter.priceAUD.$lte = maxPrice;
      }
    }

    const fromYear = fromYearParam ? Number(fromYearParam) : undefined;
    const toYear = toYearParam ? Number(toYearParam) : undefined;
    if (Number.isFinite(fromYear) || Number.isFinite(toYear)) {
      filter["specs.year"] = {};
      if (Number.isFinite(fromYear)) {
        filter["specs.year"].$gte = fromYear;
      }
      if (Number.isFinite(toYear)) {
        filter["specs.year"].$lte = toYear;
      }
    }

    const sortMap: Record<string, Record<string, 1 | -1>> = {
      sortOrder_asc:  { sortOrder: 1 },
      price_asc:      { priceAUD: 1 },
      price_desc:     { priceAUD: -1 },
      year_desc:      { "specs.year": -1 },
      year_asc:       { "specs.year": 1 },
      createdAt_desc: { createdAt: -1 },
    };
    const sortQuery = sortMap[sort] ?? { sortOrder: 1 };

    const skip = (page - 1) * limit;

    const [cars, total] = await Promise.all([
      Car.find(filter)
        .sort(sortQuery)
        .skip(skip)
        .limit(limit)
        .select("-__v")
        .lean(),
      Car.countDocuments(filter),
    ]);

    return res.json({
      data: cars,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[GET /api/cars]", error);
    return res.status(500).json({ error: "Failed to fetch cars" });
  }
};

export const getFeaturedCars = async (req: Request, res: Response) => {
  try {
    const cars = await Car.find({ isFeatured: true, status: "available" })
      .sort({ sortOrder: 1 })
      .limit(6)
      .select("-__v")
      .lean();

    return res.json({ data: cars });
  } catch (error) {
    console.error("[GET /api/cars/featured]", error);
    return res.status(500).json({ error: "Failed to fetch featured cars" });
  }
};

export const getCarById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const car = await Car.findOne(
      isObjectId ? { _id: id } : { slug: id }
    )
      .select("-__v")
      .lean();

    if (!car) {
      return res.status(404).json({ error: "Car not found" });
    }

    return res.json({ data: car });
  } catch (error) {
    console.error("[GET /api/cars/:id]", error);
    return res.status(500).json({ error: "Failed to fetch car" });
  }
};
