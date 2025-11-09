import { Schema, model, Document, Types } from "mongoose";
import {
  PAYMENT_STATUS,
  PAYMENT_STATUSES,
  PaymentStatus,
} from "../enums/payment";

export interface IPayment extends Document {
  booking: Types.ObjectId;
  amount: number;
  currency: string;
  status: PaymentStatus;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    booking: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      index: true,
    },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "USD" },
    status: {
      type: String,
      enum: PAYMENT_STATUSES,
      default: PAYMENT_STATUS.PENDING,
      index: true,
    },
  },
  { timestamps: true }
);

export default model<IPayment>("Payment", paymentSchema);
