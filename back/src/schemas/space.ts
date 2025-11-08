import { Schema, model, Document, Types, Model, models } from "mongoose";
import { SpaceType, SPACE_TYPES } from "../enums";

export interface ISpace extends Document {
  title: string;
  description?: string;
  type: SpaceType;
  capacity: number;
  hourlyRate: number;
  amenities: string[];
  active: boolean;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SpaceSchema = new Schema<ISpace>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String },
    type: {
      type: String,
      enum: SPACE_TYPES,
      required: true,
      index: true,
    },
    capacity: { type: Number, required: true, min: 1 },
    hourlyRate: { type: Number, required: true, min: 0 },
    amenities: { type: [String], default: [] },
    active: { type: Boolean, default: true, index: true },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

export const SpaceModel: Model<ISpace> =
  (models.Space as Model<ISpace>) || model<ISpace>("Space", SpaceSchema);
