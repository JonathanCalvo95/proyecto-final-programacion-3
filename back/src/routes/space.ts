import express, { Request, Response, NextFunction } from "express";
import { Schema, model, models, Document } from "mongoose";

export type SpaceType = "sala" | "escritorio";

export interface ISpace extends Document {
  name: string;
  type: SpaceType;
  capacity: number;
  hourlyRate: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SpaceSchema = new Schema<ISpace>(
  {
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["sala", "escritorio"],
      required: true,
      index: true,
    },
    capacity: { type: Number, required: true, min: 1 },
    hourlyRate: { type: Number, required: true, min: 0 },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true, versionKey: false }
);

// Búsquedas comunes más rápidas
SpaceSchema.index({ active: 1, type: 1 });

export const SpaceModel = models.Space || model<ISpace>("Space", SpaceSchema);

// Guards
function isAdmin(req: Request) {
  return (req.user as any)?.role === "admin";
}
function ensureAdmin(_req: Request, res: Response, next: NextFunction) {
  if (isAdmin(_req)) return next();
  res.status(403).send("Unauthorized");
}

// Router
const router = express.Router();

// Listar espacios (opcionalmente filtrar por activo y tipo)
router.get("/", async (req, res, next) => {
  try {
    const filter: Record<string, any> = {};
    if (typeof req.query.active === "string")
      filter.active = req.query.active === "true";
    if (typeof req.query.type === "string") filter.type = req.query.type;
    const spaces = await SpaceModel.find(filter).sort({ createdAt: -1 });
    res.send(spaces);
  } catch (err) {
    next(err);
  }
});

// Obtener por id
router.get("/:id", async (req, res, next) => {
  try {
    const space = await SpaceModel.findById(req.params.id);
    if (!space) return res.status(404).send("Space not found");
    res.send(space);
  } catch (err) {
    next(err);
  }
});

// Crear (solo admin)
router.post("/", ensureAdmin, async (req, res, next) => {
  try {
    const { name, type, capacity, hourlyRate, active } = req.body ?? {};
    if (!name || !type || !capacity || hourlyRate == null) {
      return res.status(400).send("Missing required fields");
    }
    const created = await SpaceModel.create({
      name,
      type,
      capacity,
      hourlyRate,
      active: active ?? true,
    });
    res.status(201).send(created);
  } catch (err) {
    next(err);
  }
});

// Actualizar (solo admin)
router.put("/:id", ensureAdmin, async (req, res, next) => {
  try {
    const updated = await SpaceModel.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
      }
    );
    if (!updated) return res.status(404).send("Space not found");
    res.send(updated);
  } catch (err) {
    next(err);
  }
});

// Eliminar (solo admin)
router.delete("/:id", ensureAdmin, async (req, res, next) => {
  try {
    const deleted = await SpaceModel.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).send("Space not found");
    res.send({ ok: true });
  } catch (err) {
    next(err);
  }
});

export const spaceRouter = router;
