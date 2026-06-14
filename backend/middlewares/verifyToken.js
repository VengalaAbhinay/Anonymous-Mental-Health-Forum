import jwt from "jsonwebtoken";
import { UserModel } from "../Models/UserModel.js";

export const verifyToken = async (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: "Access denied. Please log in." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await UserModel.findById(decoded.id).select(
      "isActive role alias counselorProfile"
    );

    if (!user) {
      return res.status(401).json({ message: "User not found." });
    }

    if (!user.isActive) {
      return res.status(403).json({
        message: "Account suspended. Contact support.",
      });
    }

    req.user = {
      id: user._id.toString(),
      role: user.role,
      alias: user.alias,
      counselorProfile: user.counselorProfile,
    };

    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired session." });
  }
};

export const requireUser = (req, res, next) => {
  if (req.user?.role !== "user") {
    return res.status(403).json({ message: "Students only." });
  }

  next();
};

export const requireCounselor = (req, res, next) => {
  if (req.user?.role !== "counselor" && req.user?.role !== "admin") {
    return res.status(403).json({ message: "Counselors only." });
  }

  next();
};

export const requireAdmin = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Admins only." });
  }

  next();
};