// routes/post.routes.js
import express from "express";
import { optionalAuth, requireAuth, validatePostData } from "../middleware/posts.middleware.js";
import {
	createPostController,
	deletePostController,
	getAllPostsController,
	getMyPostsController,
	getPostByIdController,
	getUserPostsController,
	updatePostController,
} from "../controllers/post.controller.js";

export const postRoute = express.Router();

// Protected routes (require authentication)
postRoute.get("/my/posts", requireAuth, getMyPostsController);
postRoute.post("/", requireAuth, validatePostData, createPostController);
postRoute.put("/:postId", requireAuth, validatePostData, updatePostController);
postRoute.patch("/:postId", requireAuth, validatePostData, updatePostController);
postRoute.delete("/:postId", requireAuth, deletePostController);

// Public routes (optional authentication for enhanced features)
postRoute.get("/", optionalAuth, getAllPostsController);
postRoute.get("/user/:userId", optionalAuth, getUserPostsController);
postRoute.get("/:postId", optionalAuth, getPostByIdController);
