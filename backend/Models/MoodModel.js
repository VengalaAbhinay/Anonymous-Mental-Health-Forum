import mongoose, { Schema } from "mongoose";

const moodSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "user", required: true, index: true },
  mood: {
    type: String,
    enum: ["happy", "calm", "neutral", "sad", "anxious", "angry", "stressed"],
    required: true,
  },
  intensity: { type: Number, min: 1, max: 5, default: 3 },
  note: { type: String, trim: true, maxlength: 500, default: "" },
  entryDate: { type: String, required: true, index: true }, // YYYY-MM-DD
}, { timestamps: true, versionKey: false });

moodSchema.index({ user: 1, entryDate: 1 }, { unique: true });

export const MoodModel = mongoose.models.mood || mongoose.model("mood", moodSchema);
