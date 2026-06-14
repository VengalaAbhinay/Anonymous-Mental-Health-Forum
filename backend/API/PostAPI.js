import { Router } from "express";
import { PostModel } from "../Models/PostModel.js";
import { CommentModel } from "../Models/CommentModel.js";
import { UserModel } from "../Models/UserModel.js";
import { verifyToken, requireAdmin, requireUser } from "../middlewares/verifyToken.js";
import { analyzeSentimentAI, CRISIS_RESOURCES } from "../config/sentiment.js";

export const postApp = Router();

// Get all posts (feed) with pagination
postApp.get("/", async (req, res, next) => {
  try {
    const { page = 1, limit = 15, category, search } = req.query;
    const query = { isActive: true };
    if (category && category !== "all") query.category = category;
    if (search) query.$or = [
      { title: { $regex: search, $options: "i" } },
      { content: { $regex: search, $options: "i" } },
    ];

    const posts = await PostModel.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .select("-author") // never expose real author ID in list
      .lean();

    const total = await PostModel.countDocuments(query);
    res.json({ posts, total, pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
});

// Get single post with comments
postApp.get("/:id", async (req, res, next) => {
  try {
    const post = await PostModel.findOne({ _id: req.params.id, isActive: true })
      .select("-author")
      .populate({
        path: "comments",
        match: { isActive: true },
        select: "-author",
        options: { sort: { createdAt: 1 } },
      })
      .lean();
    if (!post) return res.status(404).json({ message: "Post not found." });

    const crisisResources = post.sentiment?.label === "crisis" ? CRISIS_RESOURCES : [];
    res.json({ post, crisisResources });
  } catch (err) { next(err); }
});

// Create post (students only)
postApp.post("/", verifyToken, requireUser, async (req, res, next) => {
  try {
    const { title, content, category, tags } = req.body;
    if (!title?.trim() || !content?.trim()) {
      return res.status(400).json({ message: "Title and content are required." });
    }
    const user = await UserModel.findById(req.user.id).select("alias");
    let sentiment = await analyzeSentimentAI(title + " " + content);

      if (category === "crisis-support" && sentiment.label !== "crisis") {
        sentiment = {
          label: "crisis",
          score: -3,
          flagged: true,
          category: "crisis",
          severity: "medium",
        };
      }
    const post = new PostModel({
      author: req.user.id,
      displayAlias: user?.alias || "Anonymous",
      title: title.trim(),
      content: content.trim(),
      category: category || "general",
      tags: tags || [],
      sentiment,
    });
    await post.save();

    const response = { message: "Post created.", post: { ...post.toObject(), author: undefined } };
    if (sentiment.label === "crisis") {
      response.crisisAlert = true;
      response.crisisResources = CRISIS_RESOURCES;
    }
    res.status(201).json(response);
  } catch (err) { next(err); }
});

// Upvote / remove upvote (students only)
postApp.patch("/:id/upvote", verifyToken, requireUser, async (req, res, next) => {
  try {
    const post = await PostModel.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found." });

    const idx = post.upvotes.indexOf(req.user.id);
    if (idx === -1) post.upvotes.push(req.user.id);
    else post.upvotes.splice(idx, 1);
    await post.save();
    res.json({ upvotes: post.upvotes.length, upvoted: idx === -1 });
  } catch (err) { next(err); }
});

// Add comment (students only)
postApp.post("/:id/comments", verifyToken, requireUser, async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: "Comment cannot be empty." });

    const user = await UserModel.findById(req.user.id).select("alias");
    const sentiment = await analyzeSentimentAI(text);

    const comment = new CommentModel({
      post: req.params.id,
      author: req.user.id,
      displayAlias: user?.alias || "Anonymous",
      text: text.trim(),
      sentiment,
    });
    await comment.save();
    await PostModel.findByIdAndUpdate(req.params.id, { $push: { comments: comment._id } });

    const responseComment = { ...comment.toObject(), author: undefined };
    const response = { message: "Comment added.", comment: responseComment };
    if (sentiment.label === "crisis") {
      response.crisisAlert = true;
      response.crisisResources = CRISIS_RESOURCES;
    }
    res.status(201).json(response);
  } catch (err) { next(err); }
});

// Flag post (admin)
postApp.patch("/:id/flag", verifyToken, requireAdmin, async (req, res, next) => {
  try {
    await PostModel.findByIdAndUpdate(req.params.id, {
      isFlagged: true, flagReason: req.body.reason || "Admin flagged",
    });
    res.json({ message: "Post flagged." });
  } catch (err) { next(err); }
});

// Delete post (admin)
postApp.delete("/:id", verifyToken, requireAdmin, async (req, res, next) => {
  try {
    await PostModel.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: "Post removed." });
  } catch (err) { next(err); }
});
