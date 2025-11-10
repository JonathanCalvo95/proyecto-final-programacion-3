import { Schema, model } from "mongoose";

const schema = new Schema(
  {
    level: { type: String, default: "error" },
    message: String,
    meta: Schema.Types.Mixed,
  },
  { timestamps: true, versionKey: false }
);

export const AuditLogModel = model("AuditLog", schema);
