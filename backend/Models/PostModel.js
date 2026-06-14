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

const postSchema = new Schema({
  // Anonymous author reference (never exposed publicly)
  author: {
    type: Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  // Displayed alias at time of posting (snapshot so alias changes don't affect old posts)
  displayAlias: {
    type: String,
    default: "Anonymous",
  },
  title: {
    type: String,
    required: [true, "Title is required"],
    trim: true,
    maxlength: [120, "Title cannot exceed 120 characters"],
  },
  content: {
    type: String,
    required: [true, "Content is required"],
    maxlength: [3000, "Content cannot exceed 3000 characters"],
  },
  category: {
    type: String,
    enum: ["stress", "anxiety", "depression", "relationships", "academic", "general", "crisis-support"],
    default: "general",
  },
  tags: [{ type: String, trim: true }],

  // Sentiment analysis result (set by backend AI or keyword check)
  sentiment: {
    type: sentimentSchema,
    default: () => ({}),
  },

  upvotes: [{ type: Schema.Types.ObjectId, ref: "user" }],
  comments: [{ type: Schema.Types.ObjectId, ref: "comment" }],

  isActive: { type: Boolean, default: true },
  isFlagged: { type: Boolean, default: false },
  flagReason: { type: String, default: "" },
}, {
  timestamps: true,
  versionKey: false,
});

postSchema.index({ isActive: 1, createdAt: -1 });
postSchema.index({ "sentiment.label": 1, isActive: 1 });
postSchema.index({ isFlagged: 1, isActive: 1 });

export const PostModel = mongoose.models.post || mongoose.model("post", postSchema);
