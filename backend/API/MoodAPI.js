import { Router } from "express";
import { MoodModel } from "../Models/MoodModel.js";
import { verifyToken, requireUser } from "../middlewares/verifyToken.js";

export const moodApp = Router();

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

// Create/update today's mood entry (students only)
moodApp.post("/", verifyToken, requireUser, async (req, res, next) => {
  try {
    const { mood, intensity = 3, note = "", entryDate = todayString() } = req.body;
    if (!mood) return res.status(400).json({ message: "Mood is required." });

    const entry = await MoodModel.findOneAndUpdate(
      { user: req.user.id, entryDate },
      {
        user: req.user.id,
        mood,
        intensity: Number(intensity),
        note: note.trim(),
        entryDate,
      },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(201).json({ message: "Mood saved.", entry });
  } catch (err) { next(err); }
});

// Get mood history (students only)
moodApp.get("/", verifyToken, requireUser, async (req, res, next) => {
  try {
    const { days = 14 } = req.query;
    const since = new Date();
    since.setDate(since.getDate() - Number(days));

    const entries = await MoodModel.find({
      user: req.user.id,
      createdAt: { $gte: since },
    }).sort({ entryDate: 1 }).lean();

    const avgIntensity = entries.length
      ? Number((entries.reduce((sum, e) => sum + e.intensity, 0) / entries.length).toFixed(1))
      : 0;

    res.json({ entries, avgIntensity, total: entries.length });
  } catch (err) { next(err); }
});
