import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";
import mongoose from "mongoose";
import { SPACE_TYPES, type SpaceType } from "../enums/space";
import { USER_ROLE, type UserRole } from "../enums/role";
import SpaceModel from "../schemas/space";

type AuthedRequest = Request & { user?: { _id?: string; role?: UserRole } };

function isAdmin(req: AuthedRequest) {
  return req.user?.role === USER_ROLE.ADMIN;
}
function ensureAdmin(req: AuthedRequest, res: Response, next: NextFunction) {
  if (isAdmin(req)) return next();
  return res.status(403).json({ message: "Unauthorized" });
}

function ensureDbReady(_req: Request, res: Response, next: NextFunction) {
  if (mongoose.connection.readyState === 1) return next();
  return res.status(503).json({ message: "Database not connected" });
}

const router = express.Router();

router.use(ensureDbReady);

// GET /spaces  (?active=true|false & ?type=sala|escritorio)
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filter: Record<string, unknown> = {};
    if (typeof req.query.active === "string") {
      filter.active = req.query.active === "true";
    }
    if (typeof req.query.type === "string") {
      const t = req.query.type;
      if (!SPACE_TYPES.includes(t as SpaceType)) {
        return res.status(400).json({ message: "Invalid type filter" });
      }
      filter.type = t;
    }
    const spaces = await SpaceModel.find(filter)
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
    const space = await SpaceModel.findById(req.params.id).lean().exec();
    if (!space) return res.status(404).json({ message: "Space not found" });
    res.json(space);
  } catch (err) {
    next(err);
  }
});

// POST /spaces  (solo admin)
router.post(
  "/",
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
        return res.status(400).json({ message: "Missing required fields" });
      }

      if (!SPACE_TYPES.includes(type as SpaceType)) {
        return res.status(400).json({ message: "Invalid type" });
      }

      const created = await SpaceModel.create({
        name: String(name).trim(),
        type: type as SpaceType,
        capacity,
        hourlyRate,
        active: typeof active === "boolean" ? active : true,
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

      const updated = await SpaceModel.findByIdAndUpdate(
        req.params.id,
        allowed,
        { new: true }
      )
        .lean()
        .exec();

      if (!updated) return res.status(404).json({ message: "Space not found" });
      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /spaces/:id  (solo admin)
router.delete(
  "/:id",
  ensureAdmin,
  async (req: AuthedRequest, res: Response, next: NextFunction) => {
    try {
      const deleted = await SpaceModel.findByIdAndDelete(req.params.id)
        .lean()
        .exec();
      if (!deleted) return res.status(404).json({ message: "Space not found" });
      res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  }
);

export const spaceRouter = router;
