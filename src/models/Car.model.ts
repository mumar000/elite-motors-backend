import mongoose, { Schema, Document, Model } from "mongoose";

// ── Types ──────────────────────────────────────────────────────────────────

export interface ICarSpecs {
  mileageKm: number;
  engineDisplacement: string;
  transmission: string;
  fuelType: "Petrol" | "Hybrid" | "Diesel" | "Electric";
  year: number;
  color: string;
  driveType?: "RWD" | "FWD" | "AWD" | "4WD";
}

export interface ICar extends Document {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  priceAUD: number | null;
  status: "available" | "sold" | "reserved";
  specs: ICarSpecs;
  highlights: string[];
  images: string[];
  thumbnailUrl: string;
  tags: string[];
  isFeatured: boolean;
  dealer: string;
  dealerLocation: string;
  licenseNumber: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

// ── Schema ─────────────────────────────────────────────────────────────────

const CarSpecsSchema = new Schema<ICarSpecs>(
  {
    mileageKm: { type: Number, required: true },
    engineDisplacement: { type: String, required: true },
    transmission: { type: String, required: true },
    fuelType: {
      type: String,
      enum: ["Petrol", "Hybrid", "Diesel", "Electric"],
      required: true,
    },
    year: { type: Number, required: true },
    color: { type: String, required: true },
    driveType: {
      type: String,
      enum: ["RWD", "FWD", "AWD", "4WD"],
      default: null,
    },
  },
  { _id: false }
);

const CarSchema = new Schema<ICar>(
  {
    slug: { type: String, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    tagline: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    priceAUD: { type: Number, default: null }, // null = SOLD
    status: {
      type: String,
      enum: ["available", "sold", "reserved"],
      default: "available",
      index: true,
    },
    specs: { type: CarSpecsSchema, required: true },
    highlights: [{ type: String }],
    images: [{ type: String }],
    thumbnailUrl: { type: String, default: "" },
    tags: [{ type: String, index: true }],
    isFeatured: { type: Boolean, default: false, index: true },
    dealer: { type: String, default: "Elite Motor Cars" },
    dealerLocation: { type: String, default: "Sydney, Australia" },
    licenseNumber: { type: String, default: "MD100405" },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Auto-generate slug before saving
CarSchema.pre("save", async function () {
  if (this.isModified("name") || !this.slug) {
    let baseSlug = generateSlug(this.name);
    let slug = baseSlug;
    let counter = 1;
    // Ensure uniqueness
    while (await (this.constructor as Model<ICar>).findOne({ slug, _id: { $ne: this._id } })) {
      slug = `${baseSlug}-${counter++}`;
    }
    this.slug = slug;
  }
  // Keep thumbnailUrl in sync with first image
  if (this.images.length > 0) {
    this.thumbnailUrl = this.images[0];
  }
});

// ── Model ──────────────────────────────────────────────────────────────────

const Car: Model<ICar> =
  mongoose.models.Car ?? mongoose.model<ICar>("Car", CarSchema);

export default Car;
