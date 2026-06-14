import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { UserModel } from "../Models/UserModel.js";
import { verifyToken } from "../middlewares/verifyToken.js";
import { ChatRoomModel } from "../Models/ChatRoomModel.js";

export const userApp = Router();

// Register
userApp.post("/register", async (req, res, next) => {
  try {
    const { email, password, alias } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }
    const exists = await UserModel.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(409).json({ message: "Email already registered." });

    const hashed = await bcrypt.hash(password, 10);
    const user = new UserModel({
      email: email.toLowerCase(),
      password: hashed,
      alias: alias?.trim() || "Anonymous",
    });
    await user.save();
    res.status(201).json({ message: "Account created. You can now log in." });
  } catch (err) { next(err); }
});

// Login
userApp.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await UserModel.findOne({ email: email?.toLowerCase() });
    if (!user) return res.status(401).json({ message: "Invalid credentials." });
    if (!user.isActive) return res.status(403).json({ message: "Account suspended." });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: "Invalid credentials." });

    const token = jwt.sign(
      { id: user._id, role: user.role, alias: user.alias },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      message: "Login successful",
      user: {
        id: user._id,
        alias: user.alias,
        role: user.role,
        email: user.email,
        counselorProfile: user.counselorProfile,
      },
    });
  } catch (err) { next(err); }
});

// Logout
// Logout
userApp.post("/logout", verifyToken, async (req, res, next) => {
  try {
    const roomsToClose = await ChatRoomModel.find({
      user: req.user.id,
      status: { $in: ["waiting", "active"] },
    })
      .select("roomId counselor")
      .lean();

    await ChatRoomModel.updateMany(
      {
        user: req.user.id,
        status: { $in: ["waiting", "active"] },
      },
      {
        status: "closed",
        closedAt: new Date(),
      }
    );

    const io = req.app.get("io");

    if (io) {
      roomsToClose.forEach((room) => {
        const roomId = room.roomId;
        const counselorId = room.counselor?.toString();

        if (counselorId) {
          io.to(`counselor:${counselorId}`).emit("room-removed", { roomId });
        }

        io.to(roomId).emit("room-closed", {
          roomId,
          message: "Chat session ended because the student logged out.",
        });
      });
    }

    res.clearCookie("token");

    res.json({
      message: "Logged out.",
    });
  } catch (err) {
    next(err);
  }
});

// Get current user
userApp.get("/me", verifyToken, async (req, res, next) => {
  try {
    const user = await UserModel.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found." });
    res.json({ user });
  } catch (err) { next(err); }
});

// Update alias
userApp.patch("/alias", verifyToken, async (req, res, next) => {
  try {
    const { alias } = req.body;
    if (!alias?.trim()) return res.status(400).json({ message: "Alias cannot be empty." });
    await UserModel.findByIdAndUpdate(req.user.id, { alias: alias.trim() });
    res.json({ message: "Alias updated.", alias: alias.trim() });
  } catch (err) { next(err); }
});

// Get all active counselor accounts (public)
userApp.get("/counselors", async (req, res, next) => {
  try {
    const counselors = await UserModel.find({ role: "counselor", isActive: true })
      .select("alias counselorProfile createdAt")
      .sort({ "counselorProfile.isVerified": -1, "counselorProfile.isAvailable": -1, createdAt: -1 })
      .lean();

    const normalizedCounselors = counselors.map((counselor) => {
      const profile = counselor.counselorProfile || {};
      const isVerified = profile.isVerified === true;
      const isAvailable = profile.isAvailable !== false;

      return {
        ...counselor,
        counselorProfile: {
          ...profile,
          isVerified,
          isAvailable,
        },
        canChat: isVerified && isAvailable,
      };
    });

    res.json({ counselors: normalizedCounselors });
  } catch (err) { next(err); }
});
