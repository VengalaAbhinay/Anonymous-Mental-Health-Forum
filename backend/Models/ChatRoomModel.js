import mongoose, { Schema } from "mongoose";

const chatRoomSchema = new Schema(
  {
    roomId: {
      type: String,
      required: true,
      unique: true,
    },

    user: {
      type: Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },

    userAlias: {
      type: String,
      default: "Anonymous",
      trim: true,
    },

    counselor: {
      type: Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },

    counselorAlias: {
      type: String,
      default: "",
      trim: true,
    },

    status: {
      type: String,
      enum: ["waiting", "active", "closed"],
      default: "waiting",
    },

    closedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

chatRoomSchema.index({ counselor: 1, status: 1, createdAt: -1 });
chatRoomSchema.index({ user: 1, status: 1, createdAt: -1 });
chatRoomSchema.index(
  { user: 1, counselor: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ["waiting", "active"] } },
  }
);

export const ChatRoomModel =
  mongoose.models.chatroom || mongoose.model("chatroom", chatRoomSchema);