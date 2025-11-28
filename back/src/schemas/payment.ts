import { Schema, model, Types } from "mongoose";

export interface IPayment {
  _id?: string;
  user: Types.ObjectId;
  booking: Types.ObjectId;
  amount: number;
  last4: string;
  brand: string;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<IPayment>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    booking: { type: Schema.Types.ObjectId, ref: "Booking", required: true, unique: true },
    amount: { type: Number, required: true },
    last4: { type: String, required: true },
    brand: { type: String, required: true },
  },
  { timestamps: true, versionKey: false }
);

schema.index({ user: 1 });
schema.index({ booking: 1 });

export default model<IPayment>("Payment", schema);
