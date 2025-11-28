import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";
import { SPACE_TYPES, type SpaceType } from "../enums/space";
import { USER_ROLE, type UserRole } from "../enums/role";
import Space from "../schemas/space";
import Booking from "../schemas/booking";
import authentication from "../middlewares/authentication";
import { Types } from "mongoose";
import dayjs from "dayjs";

type AuthedRequest = Request & { user?: { _id?: string; role?: UserRole } };

function isAdmin(req: AuthedRequest) {
  return req.user?.role === USER_ROLE.ADMIN;
}
function ensureAdmin(req: AuthedRequest, res: Response, next: NextFunction) {
  if (isAdmin(req)) return next();
  return res.status(403).json({ message: "Unauthorized" });
}

const router = express.Router();

/* GET /spaces/availability */
router.get(
  "/availability",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { start, end } = req.query;

      if (typeof start !== "string" || typeof end !== "string") {
        return res.status(400).json({ message: "start y end son requeridos" });
      }

      // 1) Parsear rango EN DÍA COMPLETO
      const startDate = dayjs(start, "YYYY-MM-DD", true).startOf("day");
      const endDate = dayjs(end, "YYYY-MM-DD", true).endOf("day");

      if (
        !startDate.isValid() ||
        !endDate.isValid() ||
        endDate.isBefore(startDate)
      ) {
        return res.status(400).json({ message: "Rango de fechas inválido" });
      }

      // 2) Buscar bookings NO canceladas que se solapen con el rango
      const bookings = await Booking.find({
        isCanceled: false,
        start: { $lte: endDate.toDate() },
        end: { $gte: startDate.toDate() },
      })
        .select("space")
        .lean()
        .exec();

      const bookedSpaceIds = new Set(bookings.map((b) => String(b.space)));

      // 3) Obtener todos los espacios activos
      const spaces = await Space.find({ active: true })
        .select("_id")
        .lean()
        .exec();

      // 4) Filtrar los que NO están en bookedSpaceIds
      const available = spaces
        .map((s) => String(s._id))
        .filter((id) => !bookedSpaceIds.has(id));

      return res.json({ available });
    } catch (err) {
      next(err);
    }
  }
);

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
      const {
        name,
        type,
        capacity,
        dailyRate,
        active,
        content,
        characteristics,
        amenities,
      } = req.body ?? {};
      if (
        !name ||
        !type ||
        typeof capacity !== "number" ||
        typeof dailyRate !== "number"
      ) {
        return res.status(400).json({ message: "Faltan campos obligatorios" });
      }
      if (!SPACE_TYPES.includes(type as SpaceType)) {
        return res.status(400).json({ message: "Tipo inválido" });
      }
      const normContent = typeof content === "string" ? content.trim() : "";
      const normChars = Array.isArray(characteristics)
        ? characteristics.map((c) => String(c).trim()).filter(Boolean)
        : [];
      const normAmenities = Array.isArray(amenities)
        ? amenities.map((a) => String(a).trim()).filter(Boolean)
        : [];
      const created = await Space.create({
        name: String(name).trim(),
        type: type as SpaceType,
        capacity,
        dailyRate,
        content: normContent,
        characteristics: normChars,
        amenities: normAmenities,
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
      if (typeof body.dailyRate === "number")
        allowed.dailyRate = body.dailyRate;
      if (typeof body.active === "boolean") allowed.active = body.active;
      if (typeof body.content === "string")
        allowed.content = body.content.trim();
      if (Array.isArray(body.characteristics))
        allowed.characteristics = body.characteristics
          .map((c: unknown) => String(c).trim())
          .filter(Boolean);
      if (Array.isArray(body.amenities))
        allowed.amenities = body.amenities
          .map((a: unknown) => String(a).trim())
          .filter(Boolean);
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

// DELETE lógico /spaces/:id  (solo admin)
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
