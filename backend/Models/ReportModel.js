import mongoose, { Schema } from "mongoose";

const reportSchema = new Schema({
  // Who reported (kept private, never exposed)
  reporter: {
    type: Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  // What was reported
  targetType: {
    type: String,
    enum: ["post", "comment"],
    required: true,
  },
  targetId: {
    type: Schema.Types.ObjectId,
    required: true,
    refPath: "targetType",
  },
  reason: {
    type: String,
    enum: ["harmful", "self-harm", "bullying", "toxic", "spam", "misinformation", "other"],
    required: true,
  },
  details: {
    type: String,
    maxlength: 300,
    default: "",
  },
  // Snapshot so admin can read even if post is deleted
  contentSnapshot: {
    type: String,
    default: "",
  },
  status: {
    type: String,
    enum: ["pending", "reviewed", "dismissed"],
    default: "pending",
  },
  reviewedBy: {
    type: Schema.Types.ObjectId,
    ref: "user",
    default: null,
  },
  reviewNote: {
    type: String,
    default: "",
  },
}, {
  timestamps: true,
  versionKey: false,
});

// Prevent duplicate reports from same user on same target
reportSchema.index({ reporter: 1, targetId: 1 }, { unique: true });

export const ReportModel = mongoose.models.report || mongoose.model("report", reportSchema);
