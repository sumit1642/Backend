// controllers/auth.controller.js
import {
	registerUser,
	loginUser,
	refreshAccessToken,
	logoutUser,
} from "../services/auth.service.js";
import { getProfile } from "../services/profile.service.js";

export const register = async (req, res) => {
	try {
		const { name, email, password } = req.body;
		const result = await registerUser({ name, email, password });

		return res.status(201).json({
			status: "success",
			message: "User registered successfully",
			data: { user: result },
		});
	} catch (err) {
		console.error("Registration error:", err);

		if (err.message === "User already exists") {
			return res.status(409).json({
				status: "error",
				message: "User already exists",
			});
		}

		if (err.message.includes("Password")) {
			return res.status(400).json({
				status: "error",
				message: err.message,
			});
		}

		return res.status(500).json({
			status: "error",
			message: "Internal server error",
		});
	}
};

export const login = async (req, res) => {
	try {
		const user = req.foundUser;
		const { password } = req.body;
		const result = await loginUser(user, password);

		// Set cookies
		res.cookie("accessToken", result.accessToken, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			maxAge: 15 * 60 * 1000, // 15 minutes
		});

		res.cookie("refreshToken", result.refreshToken, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
		});

		return res.status(200).json({
			status: "success",
			message: "Logged in successfully",
			data: { user: result.user },
		});
	} catch (err) {
		console.error("Login error:", err);

		if (err.message === "Invalid credentials") {
			return res.status(401).json({
				status: "error",
				message: "Invalid email or password",
			});
		}

		return res.status(500).json({
			status: "error",
			message: "Internal server error",
		});
	}
};

export const refresh = async (req, res) => {
	try {
		const refreshToken = req.cookies.refreshToken;
		const result = await refreshAccessToken(refreshToken);

		// Set new cookies
		res.cookie("accessToken", result.accessToken, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			maxAge: 15 * 60 * 1000,
		});

		res.cookie("refreshToken", result.refreshToken, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			maxAge: 7 * 24 * 60 * 60 * 1000,
		});

		return res.status(200).json({
			status: "success",
			message: "Token refreshed successfully",
			data: { user: result.user },
		});
	} catch (err) {
		console.error("Refresh error:", err);

		// Clear cookies on error
		res.clearCookie("accessToken");
		res.clearCookie("refreshToken");

		return res.status(401).json({
			status: "error",
			message: "Token refresh failed",
		});
	}
};

export const logout = async (req, res) => {
	try {
		const refreshToken = req.cookies.refreshToken;
		await logoutUser(refreshToken);

		// Clear cookies
		res.clearCookie("accessToken");
		res.clearCookie("refreshToken");

		return res.status(200).json({
			status: "success",
			message: "Logged out successfully",
		});
	} catch (err) {
		console.error("Logout error:", err);
		return res.status(500).json({
			status: "error",
			message: "Internal server error",
		});
	}
};

export const getProfileController = async (req, res) => {
	try {
		const userId = req.user.userId;
		const profile = await getProfile(userId);

		return res.status(200).json({
			status: "success",
			message: "Profile fetched successfully",
			data: { profile },
		});
	} catch (err) {
		console.error("Get profile error:", err);

		if (err.message === "User not found") {
			return res.status(404).json({
				status: "error",
				message: "User not found",
			});
		}

		return res.status(500).json({
			status: "error",
			message: "Internal server error",
		});
	}
};
