import { Router } from "express";
import { verifyToken, requireAdmin, requireUser } from "../middlewares/verifyToken.js";
import { CounselorApplicationModel } from "../Models/CounselorApplicationModel.js";
import { UserModel } from "../Models/UserModel.js";

export const counselorApp = Router();

// User applies to become a verified counselor (students only)
counselorApp.post("/apply", verifyToken, requireUser, async (req, res, next) => {
  try {
    const { fullName, specialization, experience, qualification, bio, availability } = req.body;
    if (!fullName || !specialization || !experience || !qualification || !bio) {
      return res.status(400).json({ message: "Please fill all required fields." });
    }

    const existing = await CounselorApplicationModel.findOne({ user: req.user.id, status: "pending" });
    if (existing) return res.status(409).json({ message: "Your counselor application is already pending." });

    const application = await CounselorApplicationModel.create({
      user: req.user.id,
      fullName: fullName.trim(),
      specialization: specialization.trim(),
      experience: experience.trim(),
      qualification: qualification.trim(),
      bio: bio.trim(),
      availability: availability?.trim() || "",
    });

    res.status(201).json({ message: "Application submitted for admin verification.", application });
  } catch (err) { next(err); }
});

// User checks own application status (students only)
counselorApp.get("/my-application", verifyToken, requireUser, async (req, res, next) => {
  try {
    const application = await CounselorApplicationModel.findOne({ user: req.user.id })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ application });
  } catch (err) { next(err); }
});

// Admin lists applications
counselorApp.get("/applications", verifyToken, requireAdmin, async (req, res, next) => {
  try {
    const { status = "pending" } = req.query;
    const query = status === "all" ? {} : { status };
    const applications = await CounselorApplicationModel.find(query)
      .sort({ createdAt: -1 })
      .populate("user", "email alias role")
      .lean();
    res.json({ applications });
  } catch (err) { next(err); }
});

// Admin approves/rejects counselor application
counselorApp.patch("/applications/:id", verifyToken, requireAdmin, async (req, res, next) => {
  try {
    const { status, adminNote = "" } = req.body;
    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Status must be approved or rejected." });
    }

    const application = await CounselorApplicationModel.findById(req.params.id);
    if (!application) return res.status(404).json({ message: "Application not found." });

    application.status = status;
    application.adminNote = adminNote;
    application.reviewedBy = req.user.id;
    application.reviewedAt = new Date();
    await application.save();

    if (status === "approved") {
      await UserModel.findByIdAndUpdate(application.user, {
        role: "counselor",
        counselorProfile: {
          name: application.fullName,
          specialization: application.specialization,
          bio: `${application.qualification}. ${application.experience}. ${application.bio}`,
          isAvailable: true,
          isVerified: true,
          verifiedAt: new Date(),
        },
      });
    }

    res.json({ message: `Application ${status}.`, application });
  } catch (err) { next(err); }
});
