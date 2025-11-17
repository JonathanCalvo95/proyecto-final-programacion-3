import mongoose, { Schema, model, Document, Types } from "mongoose";

export interface IRating extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  space: Types.ObjectId;
  score: number;
  comment?: string;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<IRating>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    space: { type: Schema.Types.ObjectId, ref: "Space", required: true, index: true },
    score: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true },
  },
  { timestamps: true, versionKey: false }
);

schema.index({ user: 1, space: 1 }, { unique: true });

if (mongoose.models.Rating) mongoose.deleteModel("Rating");

export default model<IRating>("Rating", schema);
