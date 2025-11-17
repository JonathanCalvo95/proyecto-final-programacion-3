import mongoose, { Schema, model, Document, Types } from "mongoose";
import { SpaceType, SPACE_TYPES } from "../enums";

export interface ISpace extends Document {
  _id: Types.ObjectId;
  name: string;
  type: SpaceType;
  capacity: number;
  dailyRate: number;
  content?: string;
  characteristics?: string[];
  amenities?: string[];
  active: boolean;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<ISpace>(
  {
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: SPACE_TYPES,
      required: true,
      index: true,
    },
    capacity: { type: Number, required: true, min: 1 },
    dailyRate: { type: Number, required: true, min: 0 },
    content: { type: String, default: "" },
    characteristics: { type: [String], default: [] },
    amenities: { type: [String], default: [] },
    active: { type: Boolean, default: true, index: true },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  { timestamps: true, versionKey: false }
);

if (mongoose.models.Space) {
  mongoose.deleteModel("Space");
}

export default model<ISpace>("Space", schema);
