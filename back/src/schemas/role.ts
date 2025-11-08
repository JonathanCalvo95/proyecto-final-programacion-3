import mongoose, { Schema } from "mongoose";
import { IRole } from "../types/index";

const roleSchema = new Schema<IRole>(
  {
    name: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true,
    },
    description: { type: String, trim: true },
    permissions: [{ type: String, required: true }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Role = mongoose.model<IRole>("Role", roleSchema);

export default Role;
