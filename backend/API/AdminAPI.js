import { Router } from "express";
import { UserModel } from "../Models/UserModel.js";
import { PostModel } from "../Models/PostModel.js";
import { CommentModel } from "../Models/CommentModel.js";
import { ReportModel } from "../Models/ReportModel.js";
import { MoodModel } from "../Models/MoodModel.js";
import { CounselorApplicationModel } from "../Models/CounselorApplicationModel.js";
import { verifyToken, requireAdmin } from "../middlewares/verifyToken.js";

export const adminApp = Router();

// ── Dashboard stats ──────────────────────────────────────────────────────────
adminApp.get("/stats", verifyToken, requireAdmin, async (req, res, next) => {
  try {
    const [totalUsers, totalPosts, pendingReports, crisisPosts, moodEntries, pendingCounselorApplications] = await Promise.all([
      UserModel.countDocuments({}),
      PostModel.countDocuments({ isActive: true }),
      ReportModel.countDocuments({ status: "pending" }),
      PostModel.countDocuments({ "sentiment.label": "crisis", isActive: true }),
      MoodModel.countDocuments({}),
      CounselorApplicationModel.countDocuments({ status: "pending" }),
    ]);
    res.json({ totalUsers, totalPosts, pendingReports, crisisPosts, moodEntries, pendingCounselorApplications });
  } catch (err) { next(err); }
});

// ── All users ────────────────────────────────────────────────────────────────
adminApp.get("/users", verifyToken, requireAdmin, async (req, res, next) => {
  try {
    const users = await UserModel.find({}).select("-password").lean();
    res.json({ users });
  } catch (err) { next(err); }
});

// ── Block / unblock user ─────────────────────────────────────────────────────
adminApp.patch("/users/:id/toggle", verifyToken, requireAdmin, async (req, res, next) => {
  try {
    const user = await UserModel.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found." });
    user.isActive = !user.isActive;
    await user.save();
    res.json({ message: `User ${user.isActive ? "unblocked" : "blocked"}.`, isActive: user.isActive });
  } catch (err) { next(err); }
});

// ── Promote / change role ────────────────────────────────────────────────────
adminApp.patch("/users/:id/role", verifyToken, requireAdmin, async (req, res, next) => {
  try {
    const { role, counselorProfile } = req.body;
    const update = { role };
    if (counselorProfile) update.counselorProfile = counselorProfile;
    await UserModel.findByIdAndUpdate(req.params.id, update);
    res.json({ message: "Role updated." });
  } catch (err) { next(err); }
});

// ── Reports: get by status ───────────────────────────────────────────────────
adminApp.get("/reports", verifyToken, requireAdmin, async (req, res, next) => {
  try {
    const { status = "pending" } = req.query;
    const reports = await ReportModel.find({ status })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ reports });
  } catch (err) { next(err); }
});

// ── Review a report ──────────────────────────────────────────────────────────
adminApp.patch("/reports/:id/review", verifyToken, requireAdmin, async (req, res, next) => {
  try {
    const { action, reviewNote } = req.body;
    const report = await ReportModel.findById(req.params.id);
    if (!report) return res.status(404).json({ message: "Report not found." });

    report.status = action === "dismiss" ? "dismissed" : "reviewed";
    report.reviewedBy = req.user.id;
    report.reviewNote = reviewNote || "";
    await report.save();

    if (action === "remove_content") {
      if (report.targetType === "post") {
        await PostModel.findByIdAndUpdate(report.targetId, { isActive: false });
      } else {
        await CommentModel.findByIdAndUpdate(report.targetId, { isActive: false });
      }
    }
    res.json({ message: `Report ${report.status}.` });
  } catch (err) { next(err); }
});

// ── Crisis posts ─────────────────────────────────────────────────────────────
adminApp.get("/crisis", verifyToken, requireAdmin, async (req, res, next) => {
  try {
    const posts = await PostModel.find({ "sentiment.label": "crisis", isActive: true })
      .sort({ createdAt: -1 })
      .select("-author")
      .lean();
    res.json({ posts });
  } catch (err) { next(err); }
});

// ── Delete post ──────────────────────────────────────────────────────────────
adminApp.delete("/posts/:id", verifyToken, requireAdmin, async (req, res, next) => {
  try {
    await PostModel.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: "Post removed." });
  } catch (err) { next(err); }
});

// ── Delete comment ───────────────────────────────────────────────────────────
adminApp.delete("/comments/:id", verifyToken, requireAdmin, async (req, res, next) => {
  try {
    await CommentModel.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: "Comment removed." });
  } catch (err) { next(err); }
});
