import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { connect } from "mongoose";
import cookieParser from "cookie-parser";
import { config } from "dotenv";
import cors from "cors";
import { v4 as uuidv4 } from "uuid";
import jwt from "jsonwebtoken";

import { userApp } from "./API/UserAPI.js";
import { postApp } from "./API/PostAPI.js";
import { adminApp } from "./API/AdminAPI.js";
import { reportApp } from "./API/ReportAPI.js";
import { moodApp } from "./API/MoodAPI.js";
import { resourceApp } from "./API/ResourceAPI.js";
import { counselorApp } from "./API/CounselorAPI.js";
import { ChatRoomModel } from "./Models/ChatRoomModel.js";
import { UserModel } from "./Models/UserModel.js";

config();

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  },
});

app.set("io", io);

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.use("/user-api", userApp);
app.use("/post-api", postApp);
app.use("/admin-api", adminApp);
app.use("/report-api", reportApp);
app.use("/mood-api", moodApp);
app.use("/resource-api", resourceApp);
app.use("/counselor-api", counselorApp);

app.get("/health", (_, res) => res.json({ status: "ok" }));

function getTokenFromReq(req) {
  return req.cookies?.token;
}

async function getFreshUserFromToken(token) {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  const user = await UserModel.findById(decoded.id).select(
    "alias role isActive counselorProfile"
  );

  if (!user) throw new Error("USER_NOT_FOUND");
  if (!user.isActive) throw new Error("USER_BLOCKED");

  return user;
}

app.get("/chat-api/waiting", async (req, res) => {
  try {
    const token = getTokenFromReq(req);

    if (!token) {
      return res.status(401).json({ message: "Login required." });
    }

    const user = await getFreshUserFromToken(token);

    if (user.role !== "counselor" && user.role !== "admin") {
      return res.status(403).json({ message: "Counselors only." });
    }

    const query =
      user.role === "admin"
        ? { status: "waiting" }
        : { status: "waiting", counselor: user._id };

    const rawRooms = await ChatRoomModel.find(query)
      .sort({ createdAt: -1 })
      .select("roomId user userAlias counselor counselorAlias createdAt status")
      .populate("user", "alias")
      .lean();

    const seen = new Set();
    const rooms = [];

    for (const room of rawRooms) {
      const studentId = room.user?._id?.toString() || room.user?.toString();
      const key = `${studentId || room.roomId}:${room.counselor?.toString()}`;

      if (seen.has(key)) continue;
      seen.add(key);

      rooms.push({
        ...room,
        userAlias: getDisplayAlias(room.userAlias || room.user?.alias),
      });
    }

    res.json({ rooms });
  } catch {
    res.status(401).json({ message: "Invalid session." });
  }
});

io.use(async (socket, next) => {
  try {
    const cookieHeader = socket.handshake.headers.cookie || "";
    const tokenMatch = cookieHeader.match(/token=([^;]+)/);

    if (!tokenMatch) {
      return next(new Error("AUTH_REQUIRED"));
    }

    const user = await getFreshUserFromToken(tokenMatch[1]);

    socket.user = {
      id: user._id.toString(),
      role: user.role,
      alias: user.alias,
      counselorProfile: user.counselorProfile,
    };

    next();
  } catch {
    next(new Error("AUTH_INVALID"));
  }
});

const activeRooms = new Map();
const connectedStudents = new Map();

function getDisplayAlias(value) {
  const clean = value?.trim();
  return clean && clean !== "Anonymous" ? clean : "Anonymous student";
}

function addStudentSocket(userId, socketId) {
  if (!connectedStudents.has(userId)) connectedStudents.set(userId, new Set());
  connectedStudents.get(userId).add(socketId);
}

function removeStudentSocket(userId, socketId) {
  const sockets = connectedStudents.get(userId);
  if (!sockets) return;
  sockets.delete(socketId);
  if (sockets.size === 0) connectedStudents.delete(userId);
}

io.on("connection", (socket) => {
  const { id: userId, role, alias } = socket.user;

  if (role === "counselor" || role === "admin") {
    socket.join(`counselor:${userId}`);
  }

  if (role === "user") {
    addStudentSocket(userId, socket.id);
  }

  socket.on("request-room", async ({ counselorId } = {}) => {
    if (role !== "user") {
      socket.emit("room-error", {
        message: "Only normal users can open chat sessions.",
      });
      return;
    }

    if (!counselorId) {
      socket.emit("room-error", {
        message: "Please select a counselor first.",
      });
      return;
    }

    try {
      const counselor = await UserModel.findOne({
        _id: counselorId,
        role: "counselor",
        isActive: true,
        "counselorProfile.isVerified": true,
        "counselorProfile.isAvailable": true,
      }).select("_id alias counselorProfile");

      if (!counselor) {
        socket.emit("room-error", {
          message: "Selected counselor is not available.",
        });
        return;
      }

      const assignedCounselorId = counselor._id.toString();
      const studentAlias = getDisplayAlias(alias);

      const existingRoom = await ChatRoomModel.findOne({
        user: userId,
        counselor: assignedCounselorId,
        status: { $in: ["waiting", "active"] },
      }).lean();

      if (existingRoom) {
        socket.join(existingRoom.roomId);

        if (existingRoom.userAlias !== studentAlias) {
          ChatRoomModel.updateOne(
            { roomId: existingRoom.roomId },
            { userAlias: studentAlias }
          ).catch(() => {});
        }

        let room = activeRooms.get(existingRoom.roomId);
        const hasLiveCounselor = Boolean(
          room?.activeCounselorJoined && room?.counselorSocketId
        );

        // If MongoDB says the room is active but the counselor is not actually
        // connected now, treat it as waiting again. This prevents the student
        // page from opening a blank "Session active" chat while the counselor
        // dashboard still shows no active/waiting request.
        if (existingRoom.status === "active" && !hasLiveCounselor) {
          await ChatRoomModel.updateOne(
            { roomId: existingRoom.roomId },
            { status: "waiting", closedAt: null }
          );
        }

        if (!room) {
          room = {
            userId,
            counselorId: assignedCounselorId,
            messages: [],
            activeCounselorJoined: false,
            counselorSocketId: null,
          };
          activeRooms.set(existingRoom.roomId, room);
        }

        const effectiveStatus =
          existingRoom.status === "active" && hasLiveCounselor
            ? "active"
            : "waiting";

        room.activeCounselorJoined = effectiveStatus === "active";
        if (effectiveStatus !== "active") room.counselorSocketId = null;

        socket.emit("room-created", {
          roomId: existingRoom.roomId,
          counselorId: assignedCounselorId,
          counselorName:
            counselor.counselorProfile?.name || counselor.alias || "Counselor",
          existing: true,
          status: effectiveStatus,
          messages: room.messages || [],
        });

        if (effectiveStatus === "waiting") {
          io.to(`counselor:${assignedCounselorId}`).emit("room-waiting", {
            roomId: existingRoom.roomId,
            counselorId: assignedCounselorId,
            userAlias: studentAlias,
            createdAt: existingRoom.createdAt,
          });
        }

        return;
      }

      const roomId = uuidv4();

      activeRooms.set(roomId, {
        userId,
        counselorId: assignedCounselorId,
        messages: [],
        activeCounselorJoined: false,
        counselorSocketId: null,
      });

      const counselorAlias =
        counselor.counselorProfile?.name || counselor.alias || "Counselor";

      await ChatRoomModel.create({
        roomId,
        user: userId,
        userAlias: studentAlias,
        counselor: assignedCounselorId,
        counselorAlias,
        status: "waiting",
      });

      socket.join(roomId);

      socket.emit("room-created", {
        roomId,
        counselorId: assignedCounselorId,
        counselorName: counselorAlias,
        existing: false,
        status: "waiting",
        messages: [],
      });

      io.to(`counselor:${assignedCounselorId}`).emit("room-waiting", {
        roomId,
        counselorId: assignedCounselorId,
        userAlias: studentAlias,
        createdAt: new Date().toISOString(),
      });
    } catch (err) {
      if (err?.code === 11000) {
        const existingRoom = await ChatRoomModel.findOne({
          user: userId,
          counselor: counselorId,
          status: { $in: ["waiting", "active"] },
        }).lean();

        if (existingRoom) {
          socket.join(existingRoom.roomId);

          socket.emit("room-created", {
            roomId: existingRoom.roomId,
            counselorId,
            counselorName: existingRoom.counselorAlias || "Counselor",
            existing: true,
            status: existingRoom.status === "active" ? "waiting" : "waiting",
            messages: [],
          });

          if (existingRoom.status === "waiting") {
            io.to(`counselor:${counselorId}`).emit("room-waiting", {
              roomId: existingRoom.roomId,
              counselorId,
              userAlias: getDisplayAlias(existingRoom.userAlias || alias),
              createdAt: existingRoom.createdAt,
            });
          }

          return;
        }

        socket.emit("room-error", {
          message: "You already have a chat session with this counselor.",
        });
        return;
      }

      socket.emit("room-error", {
        message: "Could not create chat session.",
      });
    }
  });

  socket.on("join-room", async ({ roomId }) => {
    if (role !== "counselor" && role !== "admin") {
      socket.emit("room-error", {
        message: "Only counselors can join sessions.",
      });
      return;
    }

    let room = activeRooms.get(roomId);

    if (!room) {
      const savedRoom = await ChatRoomModel.findOne({
        roomId,
        status: { $in: ["waiting", "active"] },
      }).lean();

      if (savedRoom) {
        room = {
          userId: savedRoom.user.toString(),
          counselorId: savedRoom.counselor?.toString() || null,
          messages: [],
          activeCounselorJoined: false,
          counselorSocketId: null,
        };

        activeRooms.set(roomId, room);
      }
    }

    if (!room) {
      socket.emit("room-error", {
        message: "Room not found or already closed.",
      });
      return;
    }

    if (role === "counselor" && room.counselorId !== userId) {
      socket.emit("room-error", {
        message: "This session is assigned to another counselor.",
      });
      return;
    }

    if (room.activeCounselorJoined && room.counselorId !== userId) {
      socket.emit("room-error", {
        message: "A counselor has already joined this room.",
      });
      return;
    }

    room.activeCounselorJoined = true;
    room.counselorSocketId = socket.id;
    socket.join(roomId);

    try {
      await ChatRoomModel.findOneAndUpdate(
        { roomId },
        { status: "active" }
      );
    } catch {}

    if (room.counselorId) {
      io.to(`counselor:${room.counselorId}`).emit("room-removed", { roomId });
    }

    socket.emit("room-joined", { roomId, messages: room.messages || [] });

    io.to(roomId).emit("counselor-joined", {
      roomId,
      message: "A counselor has joined the chat.",
    });
  });

  socket.on("send-message", ({ roomId, message }) => {
    if (!activeRooms.has(roomId)) return;
    if (!socket.rooms.has(roomId)) return;
    if (!message?.trim()) return;

    const safeAlias = getDisplayAlias(alias);

    const msg = {
      alias: role === "counselor" ? `Counselor (${safeAlias})` : safeAlias,
      text: message.trim().slice(0, 1000),
      timestamp: new Date().toISOString(),
    };

    activeRooms.get(roomId).messages.push(msg);
    io.to(roomId).emit("receive-message", msg);
  });

  socket.on("close-room", async ({ roomId }) => {
    if (!activeRooms.has(roomId)) return;

    const room = activeRooms.get(roomId);

    if (room.userId !== userId && room.counselorId !== userId && role !== "admin") {
      return;
    }

    activeRooms.delete(roomId);

    try {
      await ChatRoomModel.findOneAndUpdate(
        { roomId },
        { status: "closed", closedAt: new Date() }
      );
    } catch {}
    // Remove waiting session from counselor dashboard instantly
      if (room.counselorId) {
        io.to(`counselor:${room.counselorId}`).emit("room-removed", {
          roomId,
        });
      }

    io.to(roomId).emit("room-closed", {
      roomId,
      message: "Chat session ended. Messages have been cleared.",
    });

    io.socketsLeave(roomId);
  });

  socket.on("disconnect", () => {
    if (role === "counselor" || role === "admin") {
      for (const [roomId, room] of activeRooms.entries()) {
        if (room.counselorSocketId === socket.id) {
          room.activeCounselorJoined = false;
          room.counselorSocketId = null;
          ChatRoomModel.findOneAndUpdate(
            { roomId, status: "active" },
            { status: "waiting", closedAt: null }
          ).catch(() => {});
          io.to(`counselor:${room.counselorId}`).emit("room-waiting", {
            roomId,
            counselorId: room.counselorId,
            userAlias: "Student",
            createdAt: new Date().toISOString(),
          });
        }
      }
      return;
    }

    if (role !== "user") return;

    removeStudentSocket(userId, socket.id);

    setTimeout(async () => {
      if (connectedStudents.has(userId)) return;

      const waitingRooms = await ChatRoomModel.find({
        user: userId,
        status: "waiting",
      }).select("roomId counselor").lean();

      if (waitingRooms.length === 0) return;

      await ChatRoomModel.updateMany(
        { user: userId, status: "waiting" },
        { status: "closed", closedAt: new Date() }
      );

      for (const room of waitingRooms) {
        activeRooms.delete(room.roomId);
        const counselorId = room.counselor?.toString();

        if (counselorId) {
          io.to(`counselor:${counselorId}`).emit("room-removed", {
            roomId: room.roomId,
          });
        }
      }
    }, 5000);
  });

});

app.use((err, req, res, next) => {
  console.error(err);

  if (err.name === "ValidationError") {
    return res.status(400).json({
      message: "Validation error",
      error: err.message,
    });
  }

  res.status(500).json({
    message: "Server error",
    error: "Internal server error",
  });
});

async function connectDB() {
  try {
    await connect(process.env.DB_URL);
    console.log("✓ DB connected");

    httpServer.listen(process.env.PORT || 8000, () =>
      console.log(`✓ Server running on port ${process.env.PORT || 8000}`)
    );
  } catch (err) {
    console.error("DB connection failed:", err);
    process.exit(1);
  }
}

connectDB();