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

// Protected routes first
postRoute.get("/my/posts", requireAuth, getMyPostsController);
postRoute.post("/", requireAuth, validatePostData, createPostController);

// Specific public routes
postRoute.get("/user/:userId", optionalAuth, getUserPostsController);

// Generic public routes
postRoute.get("/", optionalAuth, getAllPostsController);

// Parameter routes last
postRoute.get("/:postId", optionalAuth, getPostByIdController);
postRoute.put("/:postId", requireAuth, validatePostData, updatePostController);
postRoute.patch("/:postId", requireAuth, validatePostData, updatePostController);
postRoute.delete("/:postId", requireAuth, deletePostController);
