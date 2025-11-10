import { Schema, model, Types } from "mongoose";
import { BOOKING_STATUSES, BookingStatus } from "../enums/booking";

export interface IBooking {
  _id?: string;
  user: Types.ObjectId;
  space: Types.ObjectId;
  start: Date;
  end: Date;
  amount: number;
  status: BookingStatus;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<IBooking>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    space: { type: Schema.Types.ObjectId, ref: "Space", required: true },
    start: { type: Date, required: true },
    end: { type: Date, required: true },
    amount: { type: Number, required: true },
    status: {
      type: String,
      enum: BOOKING_STATUSES,
      default: BOOKING_STATUSES[0],
    },
  },
  { timestamps: true, versionKey: false }
);

schema.index({ space: 1, start: 1, end: 1 });
schema.index({ user: 1, start: 1 });
schema.index({ status: 1 });

export default model<IBooking>("Booking", schema);
