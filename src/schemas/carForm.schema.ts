import { z } from "zod";

export const carStatusSchema = z.enum(["available", "sold", "reserved"]);
export const fuelTypeSchema = z.enum(["Petrol", "Hybrid", "Diesel", "Electric"]);
export const driveTypeSchema = z.enum(["RWD", "FWD", "AWD", "4WD"]);

export const carSpecsSchema = z.object({
  mileageKm: z.number().min(0),
  engineDisplacement: z.string().min(1),
  transmission: z.string().min(1),
  fuelType: fuelTypeSchema,
  year: z.number().int().min(1900).max(2100),
  color: z.string().min(1),
  driveType: driveTypeSchema.nullable().optional(),
});

export const carFormSchema = z.object({
  name: z.string().min(2),
  tagline: z.string().min(2),
  description: z.string().min(10),
  priceAUD: z.number().int().min(0).nullable(),
  status: carStatusSchema,
  specs: carSpecsSchema,
  highlights: z.array(z.string().min(1)).default([]),
  images: z.array(z.string().url()).min(1),
  tags: z.array(z.string().min(1)).default([]),
  isFeatured: z.boolean().default(false),
  dealer: z.string().min(1).default("Elite Motor Cars"),
  dealerLocation: z.string().min(1).default("Sydney, Australia"),
  licenseNumber: z.string().min(1).default("MD100405"),
  sortOrder: z.number().int().default(0),
});

export const carPatchSchema = carFormSchema
  .omit({ specs: true })
  .extend({
    specs: carSpecsSchema.partial().optional(),
  })
  .partial();

export type CarFormSchemaValues = z.infer<typeof carFormSchema>;
export type CarPatchSchemaValues = z.infer<typeof carPatchSchema>;
