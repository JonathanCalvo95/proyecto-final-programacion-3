import { Schema, model, Document, Types } from "mongoose";
import { RESERVATION_STATUSES, ReservationStatus } from "../enums/reservation";

export interface IReservation extends Document {
  user: Types.ObjectId;
  space: Types.ObjectId;
  start: Date;
  end: Date;
  status: ReservationStatus;
  createdAt: Date;
  updatedAt: Date;
}

const ReservationSchema = new Schema<IReservation>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    space: {
      type: Schema.Types.ObjectId,
      ref: "Space",
      required: true,
      index: true,
    },
    start: { type: Date, required: true, index: true },
    end: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: RESERVATION_STATUSES,
      default: "active",
      index: true,
    },
  },
  { timestamps: true }
);

ReservationSchema.index({ space: 1, start: 1, end: 1 });

export default model<IReservation>("Reservation", ReservationSchema);
