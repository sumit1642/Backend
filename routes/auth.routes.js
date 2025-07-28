// routes/auth.routes.js
import express from "express";
import { login, refresh, register, logout, getProfile } from "../controllers/auth.controller.js";
import { loginValidation, registerValidation } from "../middleware/auth.middleware.js";
import { requireAuth } from "../middleware/posts.middleware.js";

export const authRoute = express.Router();

// Public routes
authRoute.post("/register", registerValidation, register);
authRoute.post("/login", loginValidation, login);
authRoute.post("/refresh", refresh);
authRoute.post("/logout", logout);

// Protected routes
authRoute.get("/profile", requireAuth, getProfile);
