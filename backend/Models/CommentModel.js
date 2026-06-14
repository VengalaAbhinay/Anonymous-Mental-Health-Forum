import mongoose, { Schema } from "mongoose";

const sentimentSchema = new Schema({
  label: {
    type: String,
    enum: ["positive", "neutral", "negative", "crisis"],
    default: "neutral",
  },
  score: { type: Number, default: 0 },
  flagged: { type: Boolean, default: false },
  category: {
    type: String,
    enum: ["general", "crisis", "self-harm", "bullying", "toxic", "distress"],
    default: "general",
  },
  severity: {
    type: String,
    enum: ["none", "low", "medium", "high", "critical"],
    default: "none",
  },
}, { _id: false });

const commentSchema = new Schema({
  post: {
    type: Schema.Types.ObjectId,
    ref: "post",
    required: true,
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  displayAlias: {
    type: String,
    default: "Anonymous",
  },
  text: {
    type: String,
    required: ["Comment text is required"],
    maxlength: [1000, "Comment cannot exceed 1000 characters"],
  },
  sentiment: {
    type: sentimentSchema,
    default: () => ({}),
  },
  upvotes: [{ type: Schema.Types.ObjectId, ref: "user" }],
  isActive: { type: Boolean, default: true },
  isFlagged: { type: Boolean, default: false },
  flagReason: { type: String, default: "" },
}, {
  timestamps: true,
  versionKey: false,
});

commentSchema.index({ post: 1, isActive: 1, createdAt: 1 });
commentSchema.index({ isFlagged: 1, isActive: 1 });
commentSchema.index({ "sentiment.label": 1, isActive: 1 });

export const CommentModel = mongoose.models.comment || mongoose.model("comment", commentSchema);
