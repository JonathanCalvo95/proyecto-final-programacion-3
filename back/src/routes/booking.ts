import express, { Request, Response, NextFunction } from "express";
import authentication from "../middlewares/authentication";
import Booking from "../schemas/booking";
import Space from "../schemas/space";
import { USER_ROLE } from "../enums/role";
import { BOOKING_STATUS } from "../enums/booking";

const router = express.Router();

function isAdmin(req: Request) {
  return (req.user as any)?.role === USER_ROLE.ADMIN;
}
function ensureAdmin(req: Request, res: Response, next: NextFunction) {
  if (isAdmin(req)) return next();
  res.status(403).send("Unauthorized");
}
function ensureOwnerOrAdmin(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) {
  const bookingId = req.params.id;
  const userId = (req.user as any)?._id;

  Booking.findById(bookingId)
    .then((r) => {
      if (!r) return res.status(404).send("Reserva no encontrada");
      // Si no es admin, validar propiedad
      if (!isAdmin(req)) {
        if (!userId) return res.status(401).send("Unauthenticated");
        if (r.user.toString() !== userId?.toString())
          return res.status(403).send("Unauthorized");
      }
      (req as any).booking = r;
      next();
    })
    .catch(next);
}

async function loadBooking(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) {
  try {
    const b = await Booking.findById(req.params.id);
    if (!b) return res.status(404).json({ message: "Reserva no encontrada" });
    (req as any).booking = b;
    next();
  } catch (e) {
    next(e);
  }
}

// List all bookings (admin)
router.get("/", authentication, ensureAdmin, async (_req, res, next) => {
  try {
    const bookings = await Booking.find()
      .populate("space user")
      .sort({ start: -1 });
    res.send(bookings);
  } catch (err) {
    next(err);
  }
});

// List my bookings
router.get("/my", authentication, async (req, res, next) => {
  try {
    const userId = (req.user as any)?._id;
    const bookings = await Booking.find({ user: userId })
      .populate("space")
      .sort({ start: -1 });
    res.send(bookings);
  } catch (err) {
    next(err);
  }
});

// Get booking by id
router.get("/:id", authentication, ensureOwnerOrAdmin, async (req, res) => {
  res.send((req as any).booking);
});

// Create booking
router.post("/", authentication, async (req, res, next) => {
  try {
    const { spaceId, start, end } = req.body ?? {};
    if (!spaceId || !start || !end)
      return res.status(400).send("Falta campos obligatorios");
    const s = new Date(start);
    const e = new Date(end);
    if (isNaN(s.getTime()) || isNaN(e.getTime()))
      return res.status(400).send("Format de fecha inválido");
    if (s >= e)
      return res
        .status(400)
        .send("Fecha de inicio debe ser antes de fecha de fin");
    if (s < new Date())
      return res.status(400).send("Fecha de inicio debe ser futura");

    const space = await Space.findById(spaceId);
    if (!space || !space.active)
      return res.status(404).send("Espacio no encontrado");

    // Conflicto: existencia de cualquier reserva activa (no cancelada) que se superpone
    const conflict = await Booking.findOne({
      space: spaceId,
      status: { $ne: BOOKING_STATUS.CANCELED },
      start: { $lt: e },
      end: { $gt: s },
    });
    if (conflict) return res.status(409).send("Horario no disponible");

    const hours = (e.getTime() - s.getTime()) / 3600000;
    const amount = Math.round(hours * space.hourlyRate * 100) / 100;

    const booking = await Booking.create({
      user: (req.user as any)?._id,
      space: spaceId,
      start: s,
      end: e,
      amount,
      status: BOOKING_STATUS.PENDING,
    });
    res.status(201).send(booking);
  } catch (err) {
    next(err);
  }
});

// Cancel booking
router.patch(
  "/:id/cancel",
  authentication,
  ensureOwnerOrAdmin,
  async (req, res, next) => {
    try {
      const booking = (req as any).booking;
      if (booking.status === BOOKING_STATUS.CANCELED)
        return res.status(400).json({ message: "Ya cancelada" });
      if (booking.start <= new Date())
        return res.status(400).json({
          message: "No se puede cancelar una reserva pasada o en curso",
        });
      booking.status = BOOKING_STATUS.CANCELED;
      await booking.save();
      res.json(booking);
    } catch (e) {
      next(e);
    }
  }
);

// PATCH /bookings/:id/confirm (solo admin)
router.patch(
  "/:id/confirm",
  authentication,
  ensureAdmin,
  loadBooking,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const booking = (req as any).booking;
      if (booking.status === BOOKING_STATUS.CONFIRMED)
        return res.status(400).json({ message: "Ya confirmada" });
      if (booking.status === BOOKING_STATUS.CANCELED)
        return res
          .status(400)
          .json({ message: "No se puede confirmar una reserva cancelada" });
      booking.status = BOOKING_STATUS.CONFIRMED;
      await booking.save();
      res.json(booking);
    } catch (e) {
      next(e);
    }
  }
);

// Reschedule booking
router.patch(
  "/:id/reschedule",
  authentication,
  ensureOwnerOrAdmin,
  async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    try {
      const booking = (req as any).booking;
      const { start, end } = req.body ?? {};
      if (!start || !end)
        return res.status(400).send("Falta campos obligatorios");

      const s = new Date(start);
      const e = new Date(end);
      if (isNaN(s.getTime()) || isNaN(e.getTime()))
        return res.status(400).send("Formato de fecha inválido");
      if (s >= e)
        return res
          .status(400)
          .send("Fecha de inicio debe ser antes de fecha de fin");
      if (booking.start <= new Date())
        return res
          .status(400)
          .send("No se puede reprogramar una reserva pasada u en curso");

      const space = await Space.findById(booking.space);
      if (!space) return res.status(404).send("Espacio no encontrado");

      // Conflicto: otra reserva activa (no cancelada) superpuesta en el mismo espacio
      const conflict = await Booking.findOne({
        _id: { $ne: booking._id },
        space: booking.space,
        status: { $ne: BOOKING_STATUS.CANCELED },
        start: { $lt: e },
        end: { $gt: s },
      });
      if (conflict) return res.status(409).send("Horario no disponible");

      booking.start = s;
      booking.end = e;

      const hours = (e.getTime() - s.getTime()) / 3600000;
      booking.amount = Math.round(hours * (space.hourlyRate || 0) * 100) / 100;

      await booking.save();
      res.json(booking);
    } catch (e) {
      next(e);
    }
  }
);

export default router;
