// controllers/auth.controller.js
import {
	loginUser,
	registerUser,
	refreshAccessToken,
	logoutUser,
} from "../services/auth.service.js";

export const register = async (req, res) => {
	try {
		const { name, email, password } = req.body;

		const newUser = await registerUser({
			name,
			email,
			password,
		});

		return res.status(201).json({
			status: "success",
			message: "User registered successfully",
			data: {
				user: newUser,
			},
		});
	} catch (err) {
		console.error("Registration error:", err);

		// Handle specific errors
		if (err.message === "User already exists") {
			return res.status(409).json({
				status: "error",
				message: "User already exists",
			});
		}

		if (err.message.includes("Password must be")) {
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

		const { accessToken, refreshToken, user: userData } = await loginUser(user, password);

		// Set HTTP-only cookies
		res.cookie("accessToken", accessToken, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			signed: true,
			maxAge: 15 * 60 * 1000, // 15 minutes
			sameSite: "strict",
		});

		res.cookie("refreshToken", refreshToken, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			signed: true,
			maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
			sameSite: "strict",
		});

		return res.status(200).json({
			status: "success",
			message: "Logged in successfully",
			data: {
				user: userData,
				// Don't send tokens in response body for security
			},
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
		const refreshToken = req.signedCookies.refreshToken;

		const {
			accessToken,
			refreshToken: newRefreshToken,
			user,
		} = await refreshAccessToken(refreshToken);

		// Set new cookies
		res.cookie("accessToken", accessToken, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			signed: true,
			maxAge: 15 * 60 * 1000, // 15 minutes
			sameSite: "strict",
		});

		res.cookie("refreshToken", newRefreshToken, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			signed: true,
			maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
			sameSite: "strict",
		});

		return res.status(200).json({
			status: "success",
			message: "Token refreshed successfully",
			data: { user },
		});
	} catch (err) {
		console.error("Refresh error:", err);

		// Clear cookies on error
		res.clearCookie("accessToken", {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "strict",
			signed: true,
		});

		res.clearCookie("refreshToken", {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "strict",
			signed: true,
		});

		if (err.message.includes("token")) {
			return res.status(401).json({
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

export const logout = async (req, res) => {
	try {
		const refreshToken = req.signedCookies.refreshToken;

		await logoutUser(refreshToken);

		// Clear cookies
		res.clearCookie("accessToken", {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "strict",
			signed: true,
		});

		res.clearCookie("refreshToken", {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "strict",
			signed: true,
		});

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

export const getProfile = async (req, res) => {
	try {
		// User data is available from auth middleware
		const user = req.user;

		return res.status(200).json({
			status: "success",
			data: {
				user: {
					id: user.userId,
					name: user.name,
					email: user.email,
				},
			},
		});
	} catch (err) {
		console.error("Get profile error:", err);
		return res.status(500).json({
			status: "error",
			message: "Internal server error",
		});
	}
};
