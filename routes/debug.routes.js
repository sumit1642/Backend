// routes/debug.routes.js (Add this file for debugging)
import express from "express";
import { debugAuthStatus, debugActiveSessions, debugCleanupTokens } from "../controllers/debug.controller.js";

export const debugRoutes = express.Router();

// Only available in development
if (process.env.NODE_ENV !== "production") {
	debugRoutes.get("/auth", debugAuthStatus);
	debugRoutes.get("/sessions", debugActiveSessions);
	debugRoutes.post("/cleanup", debugCleanupTokens);
}
