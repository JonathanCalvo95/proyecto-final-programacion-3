import { Router, Request, Response, NextFunction } from "express";
import authentication from "../middlewares/authentication";
import Booking from "../schemas/booking";
import Payment from "../schemas/payment";
import { BOOKING_STATUS } from "../enums/booking";

const router = Router();

router.use(authentication);

function currentUser(req: Request) {
  return req.user as { _id?: string; role?: string } | undefined;
}

// POST /api/payments  { bookingId, cardNumber, cardHolder, expiry, cvv }
router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { bookingId, cardNumber, cardHolder, expiry, cvv } = req.body || {};
    if (!bookingId || !cardNumber || !cardHolder || !expiry || !cvv) {
      return res.status(400).send("Missing required fields");
    }

    const user = currentUser(req);
    if (!user?._id) return res.status(401).send("Unauthorized");

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).send("Booking not found");

    if (booking.user.toString() !== user._id && user.role !== "admin") {
      return res.status(403).send("Forbidden");
    }

    // No permitir pago sobre reserva cancelada
    if (booking.status === BOOKING_STATUS.CANCELED) {
      return res.status(400).send("Booking canceled");
    }

    // No permitir doble pago
    if (booking.status === BOOKING_STATUS.PAID) {
      return res.status(409).send("Booking already paid");
    }

    // No permitir pagar reservas vencidas (expired derivado por fecha)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (
      booking.status === BOOKING_STATUS.PENDING_PAYMENT &&
      booking.end <= today
    ) {
      return res.status(400).send("Booking expired");
    }

    const paymentExists = await Payment.findOne({ booking: booking._id });
    if (paymentExists) return res.status(409).send("Booking already paid");

    const digits = String(cardNumber).replace(/\D/g, "");
    if (digits.length < 13 || digits.length > 19) {
      return res.status(400).send("Invalid card number length");
    }

    const match = /^([0-1][0-9])\/(\d{2})$/.exec(String(expiry));
    if (!match) return res.status(400).send("Invalid expiry format MM/YY");
    const mm = parseInt(match[1], 10);
    const yy = parseInt(match[2], 10);
    if (mm < 1 || mm > 12) return res.status(400).send("Invalid month");
    const expDate = new Date(2000 + yy, mm - 1, 1);
    const now = new Date();
    expDate.setMonth(expDate.getMonth() + 1);
    if (expDate < now) return res.status(400).send("Card expired");

    if (!/^[0-9]{3,4}$/.test(String(cvv))) {
      return res.status(400).send("Invalid CVV");
    }

    const brand =
      digits[0] === "4"
        ? "Visa"
        : digits[0] === "5"
        ? "Mastercard"
        : digits[0] === "3"
        ? "Amex"
        : "Card";
    const last4 = digits.slice(-4);

    const payment = await Payment.create({
      user: booking.user,
      booking: booking._id,
      amount: booking.amount,
      last4,
      brand,
    });

    // Marcar la reserva como pagada usando la fecha del Payment
    booking.status = BOOKING_STATUS.PAID;
    await booking.save();

    const clean = await Payment.findById(payment._id).lean();
    res.status(201).json(clean);
  } catch (e) {
    next(e);
  }
});

// GET /api/payments/my
router.get("/my", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = currentUser(req);
    if (!user?._id) return res.status(401).send("Unauthorized");
    const list = await Payment.find({ user: user._id }).lean();
    res.json(list);
  } catch (e) {
    next(e);
  }
});

// GET /api/payments (admin) - listar todos los pagos
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = currentUser(req);
    if (!user || user.role !== "admin")
      return res.status(403).send("Forbidden");
    const list = await Payment.find()
      .populate("booking user")
      .sort({ createdAt: -1 })
      .lean();
    res.json(list);
  } catch (e) {
    next(e);
  }
});

export default router;
