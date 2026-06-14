import { Router } from "express";
import { ReportModel } from "../Models/ReportModel.js";
import { PostModel } from "../Models/PostModel.js";
import { CommentModel } from "../Models/CommentModel.js";
import { verifyToken, requireAdmin, requireUser } from "../middlewares/verifyToken.js";

export const reportApp = Router();

// Submit a report (students only)
reportApp.post("/", verifyToken, requireUser, async (req, res, next) => {
  try {
    const { targetType, targetId, reason, details } = req.body;
    if (!targetType || !targetId || !reason) {
      return res.status(400).json({ message: "targetType, targetId and reason are required." });
    }

    // Grab a content snapshot for admin context
    let contentSnapshot = "";
    if (targetType === "post") {
      const post = await PostModel.findById(targetId).select("title content").lean();
      contentSnapshot = post ? `[POST] ${post.title}: ${post.content?.slice(0, 200)}` : "";
    } else if (targetType === "comment") {
      const comment = await CommentModel.findById(targetId).select("text").lean();
      contentSnapshot = comment ? `[COMMENT] ${comment.text?.slice(0, 200)}` : "";
    }

    const report = new ReportModel({
      reporter: req.user.id,
      targetType,
      targetId,
      reason,
      details: details?.trim() || "",
      contentSnapshot,
    });
    await report.save();
    res.status(201).json({ message: "Report submitted. Our team will review it." });
  } catch (err) {
    // Duplicate report
    if (err.code === 11000) return res.status(409).json({ message: "You have already reported this." });
    next(err);
  }
});

// Get all pending reports (admin)
reportApp.get("/", verifyToken, requireAdmin, async (req, res, next) => {
  try {
    const { status = "pending" } = req.query;
    const reports = await ReportModel.find({ status })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ reports });
  } catch (err) { next(err); }
});

// Get report counts by status (admin dashboard)
reportApp.get("/counts", verifyToken, requireAdmin, async (req, res, next) => {
  try {
    const [pending, reviewed, dismissed] = await Promise.all([
      ReportModel.countDocuments({ status: "pending" }),
      ReportModel.countDocuments({ status: "reviewed" }),
      ReportModel.countDocuments({ status: "dismissed" }),
    ]);
    res.json({ pending, reviewed, dismissed });
  } catch (err) { next(err); }
});

// Review a report — dismiss or take action (admin)
reportApp.patch("/:id/review", verifyToken, requireAdmin, async (req, res, next) => {
  try {
    const { action, reviewNote } = req.body;
    // action: "dismiss" | "remove_content"
    const report = await ReportModel.findById(req.params.id);
    if (!report) return res.status(404).json({ message: "Report not found." });

    report.status = action === "dismiss" ? "dismissed" : "reviewed";
    report.reviewedBy = req.user.id;
    report.reviewNote = reviewNote || "";
    await report.save();

    // If removing content, soft-delete the target
    if (action === "remove_content") {
      if (report.targetType === "post") {
        await PostModel.findByIdAndUpdate(report.targetId, { isActive: false });
      } else if (report.targetType === "comment") {
        await CommentModel.findByIdAndUpdate(report.targetId, { isActive: false });
      }
    }

    res.json({ message: `Report ${report.status}.` });
  } catch (err) { next(err); }
});
