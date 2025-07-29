// controllers/auth.controller.js
import {
	registerUser,
	loginUser,
	refreshAccessToken,
	logoutUser,
} from "../services/auth.service.js";

const createSecureCookieOptions = (maxAge) => ({
	httpOnly: true,
	secure: process.env.NODE_ENV === "production",
	sameSite: "strict",
	path: "/",
	maxAge,
});

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
			message: "Registration failed",
		});
	}
};

export const login = async (req, res) => {
	try {
		const user = req.foundUser;
		const { password } = req.body;
		const result = await loginUser(user, password);

		// Set secure cookies
		res.cookie("accessToken", result.accessToken, createSecureCookieOptions(15 * 60 * 1000)); // 15 minutes
		res.cookie(
			"refreshToken",
			result.refreshToken,
			createSecureCookieOptions(7 * 24 * 60 * 60 * 1000),
		); // 7 days

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
			message: "Login failed",
		});
	}
};

export const refresh = async (req, res) => {
	try {
		const refreshToken = req.cookies.refreshToken;

		if (!refreshToken) {
			return res.status(401).json({
				status: "error",
				message: "Refresh token required",
			});
		}

		const result = await refreshAccessToken(refreshToken);

		// Set new secure cookies
		res.cookie("accessToken", result.accessToken, createSecureCookieOptions(15 * 60 * 1000));
		res.cookie(
			"refreshToken",
			result.refreshToken,
			createSecureCookieOptions(7 * 24 * 60 * 60 * 1000),
		);

		return res.status(200).json({
			status: "success",
			message: "Token refreshed successfully",
			data: { user: result.user },
		});
	} catch (err) {
		console.error("Refresh error:", err);

		// Clear cookies on error
		res.clearCookie("accessToken", { path: "/" });
		res.clearCookie("refreshToken", { path: "/" });

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
		res.clearCookie("accessToken", { path: "/" });
		res.clearCookie("refreshToken", { path: "/" });

		return res.status(200).json({
			status: "success",
			message: "Logged out successfully",
		});
	} catch (err) {
		console.error("Logout error:", err);

		// Still clear cookies even if there's an error
		res.clearCookie("accessToken", { path: "/" });
		res.clearCookie("refreshToken", { path: "/" });

		return res.status(200).json({
			status: "success",
			message: "Logged out successfully",
		});
	}
};
