import express from "express";
import authentication from "../middlewares/authentication";
import Rating from "../schemas/rating";
import Space from "../schemas/space";
import Booking from "../schemas/booking";

const router = express.Router();

router.get("/summary", authentication, async (_req, res, next) => {
  try {
    const agg = await Rating.aggregate([
      {
        $group: { _id: "$space", avg: { $avg: "$score" }, count: { $sum: 1 } },
      },
    ]);
    res.json(
      agg.map((x) => ({
        spaceId: String(x._id),
        avg: Number(x.avg),
        count: Number(x.count),
      }))
    );
  } catch (e) {
    next(e);
  }
});

router.get("/", authentication, async (_req, res, next) => {
  try {
    const list = await Rating.find()
      .populate({ path: "user", select: "firstName lastName email" })
      .populate({ path: "space", select: "name" })
      .sort({ updatedAt: -1 })
      .lean()
      .exec();
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.post("/", authentication, async (req, res, next) => {
  try {
    const { spaceId, score, comment } = req.body ?? {};

    if (!spaceId || typeof score !== "number")
      return res.status(400).send("Datos inválidos");

    if (score < 1 || score > 5) return res.status(400).send("Puntaje inválido");

    const space = await Space.findById(spaceId);

    if (!space || !space.active)
      return res.status(404).send("Espacio no encontrado");

    const userId = (req.user as any)?._id;
    const hasAnyBooking = await Booking.exists({
      user: userId,
      space: spaceId,
    });

    if (!hasAnyBooking)
      return res
        .status(403)
        .send("Se requiere haber reservado dicho espacio para calificar");

    const up = await Rating.findOneAndUpdate(
      { user: userId, space: spaceId },
      {
        $set: { score, comment: comment ? String(comment).trim() : undefined },
      },
      { upsert: true, new: true }
    )
      .populate({ path: "space", select: "name" })
      .populate({ path: "user", select: "firstName lastName email" })
      .exec();

    res.status(201).json(up);
  } catch (e) {
    next(e);
  }
});

export default router;
