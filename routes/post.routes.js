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
postRoute.get("/", optionalAuth, getAllPostsController); // Optional auth for user-specific data
postRoute.get("/:postId", optionalAuth, getPostByIdController); // Optional auth to check if user liked

// Protected routes (auth required)
postRoute.post("/", requireAuth, createPostController);
postRoute.put("/:postId", requireAuth, updatePostController);
postRoute.patch("/:postId", requireAuth, updatePostController); // Support both PUT and PATCH
postRoute.delete("/:postId", requireAuth, deletePostController);

// Additional useful routes
postRoute.get("/user/:userId", optionalAuth, getAllPostsController); // Get posts by specific user
postRoute.get("/tag/:tagName", optionalAuth, getAllPostsController); // Get posts by tag
