import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";
import { SPACE_TYPES, type SpaceType } from "../enums/space";
import { USER_ROLE, type UserRole } from "../enums/role";
import Space from "../schemas/space";
import authentication from "../middlewares/authentication";
import { Types } from "mongoose";

type AuthedRequest = Request & { user?: { _id?: string; role?: UserRole } };

function isAdmin(req: AuthedRequest) {
  return req.user?.role === USER_ROLE.ADMIN;
}
function ensureAdmin(req: AuthedRequest, res: Response, next: NextFunction) {
  if (isAdmin(req)) return next();
  return res.status(403).json({ message: "Unauthorized" });
}

const router = express.Router();

// GET /spaces
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filter: Record<string, unknown> = { active: true };

    if (typeof req.query.type === "string") {
      const t = req.query.type;
      if (!SPACE_TYPES.includes(t as SpaceType)) {
        return res.status(400).json({ message: "Filtro de tipo inválido" });
      }
      filter.type = t;
    }

    const spaces = await Space.find(filter)
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    res.json(spaces);
  } catch (err) {
    next(err);
  }
});

// GET /spaces/:id
router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const space = await Space.findById(req.params.id).lean().exec();
    if (!space)
      return res.status(404).json({ message: "Espacio no encontrado" });
    res.json(space);
  } catch (err) {
    next(err);
  }
});

// POST /spaces  (solo admin)
router.post(
  "/",
  authentication,
  ensureAdmin,
  async (req: AuthedRequest, res: Response, next: NextFunction) => {
    try {
      const { name, type, capacity, hourlyRate, active } = req.body ?? {};
      if (
        !name ||
        !type ||
        typeof capacity !== "number" ||
        typeof hourlyRate !== "number"
      ) {
        return res.status(400).json({ message: "Faltan campos obligatorios" });
      }
      if (!SPACE_TYPES.includes(type as SpaceType)) {
        return res.status(400).json({ message: "Tipo inválido" });
      }
      const created = await Space.create({
        name: String(name).trim(),
        type: type as SpaceType,
        capacity,
        hourlyRate,
        active: typeof active === "boolean" ? active : true,
        createdBy: req.user?._id ? new Types.ObjectId(req.user._id) : undefined,
      });
      res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  }
);

// PUT /spaces/:id  (solo admin)
router.put(
  "/:id",
  authentication,
  ensureAdmin,
  async (req: AuthedRequest, res: Response, next: NextFunction) => {
    try {
      const allowed: Record<string, unknown> = {};
      const body = req.body ?? {};
      if (typeof body.name === "string") allowed.name = body.name.trim();
      if (SPACE_TYPES.includes(body.type as SpaceType))
        allowed.type = body.type as SpaceType;
      if (typeof body.capacity === "number") allowed.capacity = body.capacity;
      if (typeof body.hourlyRate === "number")
        allowed.hourlyRate = body.hourlyRate;
      if (typeof body.active === "boolean") allowed.active = body.active;
      const updated = await Space.findByIdAndUpdate(req.params.id, allowed, {
        new: true,
      })
        .lean()
        .exec();
      if (!updated)
        return res.status(404).json({ message: "Espacio no encontrado" });
      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

// DELETE logico /spaces/:id  (solo admin)
router.delete(
  "/:id",
  authentication,
  ensureAdmin,
  async (req: AuthedRequest, res: Response, next: NextFunction) => {
    try {
      const space = await Space.findById(req.params.id);
      if (!space)
        return res.status(404).json({ message: "Espacio no encontrado" });

      if (!space.active) {
        return res.status(400).json({ message: "Espacio ya inactivo" });
      }

      space.active = false;
      await space.save();

      res.json({ ok: true, message: "Espacio desactivado" });
    } catch (err) {
      next(err);
    }
  }
);

export const spaceRouter = router;
