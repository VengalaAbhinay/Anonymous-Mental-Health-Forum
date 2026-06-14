import mongoose, { Schema } from "mongoose";

const userSchema = new Schema({
  // Users register with email+password but post anonymously
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, "Password is required"],
  },
  // Display alias shown on posts (can be changed; defaults to "Anonymous")
  alias: {
    type: String,
    default: "Anonymous",
    trim: true,
    maxlength: [30, "Alias cannot exceed 30 characters"],
  },
  role: {
    type: String,
    enum: ["user", "counselor", "admin"],
    default: "user",
  },
  // Counselor-specific fields
  counselorProfile: {
    name: { type: String, default: "" },
    specialization: { type: String, default: "" },
    bio: { type: String, default: "" },
    isAvailable: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: false },
    verifiedAt: { type: Date, default: null },
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  // Crisis resources seen (for tracking purposes)
  lastSeen: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
  versionKey: false,
});

export const UserModel = mongoose.models.user || mongoose.model("user", userSchema);
