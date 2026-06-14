import mongoose, { Schema } from "mongoose";

const counselorApplicationSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "user", required: true, index: true },
  fullName: { type: String, required: true, trim: true, maxlength: 80 },
  specialization: { type: String, required: true, trim: true, maxlength: 120 },
  experience: { type: String, required: true, trim: true, maxlength: 120 },
  qualification: { type: String, required: true, trim: true, maxlength: 160 },
  bio: { type: String, required: true, trim: true, maxlength: 800 },
  availability: { type: String, trim: true, maxlength: 160, default: "" },
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending", index: true },
  adminNote: { type: String, trim: true, maxlength: 500, default: "" },
  reviewedBy: { type: Schema.Types.ObjectId, ref: "user", default: null },
  reviewedAt: { type: Date, default: null },
}, { timestamps: true, versionKey: false });

export const CounselorApplicationModel = mongoose.models.counselorApplication || mongoose.model("counselorApplication", counselorApplicationSchema);
