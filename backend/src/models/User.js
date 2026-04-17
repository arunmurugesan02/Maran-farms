import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      set: (value) => (value == null || value === "" ? undefined : value)
    },
    phone: {
      type: String,
      trim: true,
      set: (value) => (value == null || value === "" ? undefined : value)
    },
    password: { type: String, minlength: 6 },
    isAdmin: { type: Boolean, default: false }
  },
  { timestamps: true }
);

// Unique only when email/phone are real strings. This avoids null-collision on OTP-only users.
userSchema.index(
  { email: 1 },
  { unique: true, partialFilterExpression: { email: { $type: "string" } } }
);
userSchema.index(
  { phone: 1 },
  { unique: true, partialFilterExpression: { phone: { $type: "string" } } }
);

userSchema.pre("save", async function preSave(next) {
  if (!this.password) return next();
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function comparePassword(password) {
  if (!this.password) return false;
  return bcrypt.compare(password, this.password);
};

export const User = mongoose.model("User", userSchema);
