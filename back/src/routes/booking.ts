import express, { Request, Response, NextFunction } from "express";
import authentication from "../middlewares/authentication";
import { SpaceModel } from "../schemas/space";
import ReservationModel from "../schemas/reservation";

const router = express.Router();

function isAdmin(req: Request) {
  return (req.user as any)?.role === "admin";
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
  ReservationModel.findById(req.params.id)
    .then((r) => {
      if (!r) return res.status(404).send("Booking not found");
      if (r.user.toString() !== userId.toString())
        return res.status(403).send("Unauthorized");
      (req as any).booking = r;
      next();
    })
    .catch(next);
}

// List all bookings (admin)
router.get("/", authentication, ensureAdmin, async (_req, res, next) => {
  try {
    const bookings = await ReservationModel.find()
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
    const bookings = await ReservationModel.find({ user: userId })
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

    const space = await SpaceModel.findById(spaceId);
    if (!space || !space.active)
      return res.status(404).send("Space not available");

    const conflict = await ReservationModel.findOne({
      space: spaceId,
      status: "active",
      $or: [{ start: { $lt: e }, end: { $gt: s } }],
    });
    if (conflict) return res.status(409).send("Time slot not available");

    const booking = await ReservationModel.create({
      user: (req.user as any)?._id,
      space: spaceId,
      start: s,
      end: e,
      status: "active",
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
      if (booking.start <= new Date())
        return res.status(400).send("Cannot cancel past or ongoing booking");
      booking.status = "cancelled";
      await booking.save();
      res.send(booking);
    } catch (err) {
      next(err);
    }
  }
);

// Reschedule booking (owner or admin)
router.patch(
  "/:id/reschedule",
  authentication,
  ensureOwnerOrAdmin,
  async (req, res, next) => {
    try {
      const { start, end } = req.body ?? {};
      if (!start || !end)
        return res.status(400).send("Missing required fields");
      const s = new Date(start);
      const e = new Date(end);
      if (s >= e || s < new Date())
        return res.status(400).send("Invalid time range");

      const booking = (req as any).booking;
      if (booking.status !== "active")
        return res.status(400).send("Only active bookings can be rescheduled");

      const conflict = await ReservationModel.findOne({
        _id: { $ne: booking._id },
        space: booking.space,
        status: "active",
        $or: [{ start: { $lt: e }, end: { $gt: s } }],
      });
      if (conflict) return res.status(409).send("Time slot not available");

      booking.start = s;
      booking.end = e;
      await booking.save();
      res.send(booking);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
