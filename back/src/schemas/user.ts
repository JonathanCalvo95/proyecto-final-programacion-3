import { Schema, model, Document, Types, HydratedDocument } from "mongoose";
import bcrypt from "bcrypt";
import { USER_ROLE, USER_ROLES, UserRole } from "../enums/role";

export interface IUser extends Document {
  id: Types.ObjectId;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  bornDate?: Date;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: { type: String, required: true },
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    phone: { type: String, trim: true },
    bornDate: { type: Date },
    role: {
      type: String,
      enum: USER_ROLES,
      required: true,
      index: true,
      default: USER_ROLE.CLIENT,
    },
    isActive: { type: Boolean, default: true, index: true },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, any>) => {
        ret.id = ret._id?.toString?.() ?? ret._id;
        delete ret._id;
        delete ret.password;
        return ret;
      },
    },
  }
);

schema.pre("save", async function (next) {
  const self = this as HydratedDocument<IUser>;
  if (!self.isModified("password")) return next();
  self.password = await bcrypt.hash(self.password, 10);
  next();
});

schema.methods.comparePassword = function (plain: string) {
  return bcrypt.compare(plain, this.password);
};

export default model<IUser>("User", schema);
