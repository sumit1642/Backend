// routes/auth.routes.js
import express from "express";
import {
	loginUser,
	refreshUserToken,
	registerNewUser,
	logoutCurrentUser,
} from "../controllers/auth.controller.js";
import {
	validateLoginCredentials,
	validateRegistrationData,
	redirectIfAuthenticated,
} from "../middleware/auth.middleware.js";

export const authenticationRoutes = express.Router();

// Public authentication routes with redirect protection for logged-in users
// If user is already authenticated, they will be redirected to home page

// User registration endpoint - creates new user account
authenticationRoutes.post(
	"/register",
	redirectIfAuthenticated,
	validateRegistrationData,
	registerNewUser,
);

// User login endpoint - authenticates existing user
authenticationRoutes.post("/login", redirectIfAuthenticated, validateLoginCredentials, loginUser);

// Token refresh endpoint - generates new access token using refresh token
// Note: No redirect middleware here as authenticated users need to refresh tokens
authenticationRoutes.post("/refresh", refreshUserToken);

// User logout endpoint - clears authentication tokens
// Note: No redirect middleware here as authenticated users need to logout
authenticationRoutes.post("/logout", logoutCurrentUser);
