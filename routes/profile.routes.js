// routes/profile.routes.js
import express from "express";
import {
	getProfileController,
	updateProfileController,
} from "../controllers/profile.controller.js";
import { requireAuth } from "../middleware/posts.middleware.js";

export const profileRoute = express.Router();

// Protected routes
profileRoute.get("/", requireAuth, getProfileController);
profileRoute.put("/", requireAuth, updateProfileController);
profileRoute.patch("/", requireAuth, updateProfileController);
