// routes/auth.routes.js
import express from "express";
import { login, refresh, register, logout, getProfile } from "../controllers/auth.controller.js";
import { loginMiddlewares, registerMiddlewares } from "../middleware/auth.middleware.js";
import { isAuthenticated } from "../middleware/posts/isAuthenticated.js";

export const authRoute = express.Router();

// Public routes
authRoute.post("/register", registerMiddlewares, register);
authRoute.post("/login", loginMiddlewares, login);
authRoute.post("/refresh", refresh);
authRoute.post("/logout", logout);

// Protected routes
authRoute.get("/profile", isAuthenticated, getProfile);

// Health check route
authRoute.get("/health", (req, res) => {
	res.status(200).json({
		status: "success",
		message: "Auth service is running",
	});
});
