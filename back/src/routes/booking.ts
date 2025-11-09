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
  if (isAdmin(req)) return next();
  const userId = (req.user as any)?._id;
  if (!userId) return res.status(401).send("Unauthenticated");
  Booking.findById(req.params.id)
    .then((r) => {
      if (!r) return res.status(404).send("Booking not found");
      if (r.user.toString() !== userId.toString())
        return res.status(403).send("Unauthorized");
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
    if (!b) return res.status(404).json({ message: "Booking not found" });
    (req as any).booking = b;
    next();
  } catch (e) {
    next(e);
  }
}

function ownerOrAdmin(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) {
  const booking = (req as any).booking;
  if (
    booking.user.toString() === (req.user as any)?._id?.toString() ||
    isAdmin(req)
  ) {
    return next();
  }
  return res.status(403).json({ message: "Forbidden" });
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

// Get booking by id (owner or admin)
router.get("/:id", authentication, ensureOwnerOrAdmin, async (req, res) => {
  res.send((req as any).booking);
});

// Create booking
router.post("/", authentication, async (req, res, next) => {
  try {
    const { spaceId, start, end } = req.body ?? {};
    if (!spaceId || !start || !end)
      return res.status(400).send("Missing required fields");
    const s = new Date(start);
    const e = new Date(end);
    if (isNaN(s.getTime()) || isNaN(e.getTime()))
      return res.status(400).send("Invalid date format");
    if (s >= e) return res.status(400).send("Start must be before end");
    if (s < new Date())
      return res.status(400).send("Start must be in the future");

    const space = await Space.findById(spaceId);
    if (!space || !space.active)
      return res.status(404).send("Space not available");

    const conflict = await Booking.findOne({
      space: spaceId,
      status: BOOKING_STATUS.CONFIRMED,
      $or: [{ start: { $lt: e }, end: { $gt: s } }],
    });
    if (conflict) return res.status(409).send("Time slot not available");

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

// Cancel booking (owner or admin)
router.patch(
  "/:id/cancel",
  authentication,
  ensureOwnerOrAdmin,
  async (req, res, next) => {
    try {
      const booking = (req as any).booking;
      if (booking.status === BOOKING_STATUS.CANCELED)
        return res.status(400).json({ message: "Already cancelled" });
      if (booking.start <= new Date())
        return res
          .status(400)
          .json({ message: "Cannot cancel past or ongoing booking" });
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
  loadBooking,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const booking = (req as any).booking;
      if (booking.status === BOOKING_STATUS.CONFIRMED)
        return res.status(400).json({ message: "Already confirmed" });
      if (booking.status === BOOKING_STATUS.CANCELED)
        return res
          .status(400)
          .json({ message: "Cannot confirm a cancelled booking" });
      booking.status = BOOKING_STATUS.CONFIRMED;
      await booking.save();
      res.json(booking);
    } catch (e) {
      next(e);
    }
  }
);

export default router;
