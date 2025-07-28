// routes/post.routes.js
import express from "express";
import {
	createPostController,
	getAllPostsController,
	getPostByIdController,
	updatePostController,
	deletePostController,
} from "../controllers/post.controller.js";
import { requireAuth, optionalAuth } from "../middleware/posts.middleware.js";

export const postRoute = express.Router();

// Public routes (no auth required)
postRoute.get("/", optionalAuth, getAllPostsController);
postRoute.get("/:postId", optionalAuth, getPostByIdController);

// Protected routes (auth required)
postRoute.post("/", requireAuth, createPostController);
postRoute.put("/:postId", requireAuth, updatePostController);
postRoute.patch("/:postId", requireAuth, updatePostController);
postRoute.delete("/:postId", requireAuth, deletePostController);
