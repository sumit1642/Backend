// controllers/auth.controller.js
import { loginUser, registerUser } from "../services/auth.service.js";
import { refreshAccessToken } from "../services/auth.service.js";
import { prisma } from "../utils/prisma.js";

export const register = async (req, res) => {
	try {
		const { name, email, password } = req.body;

		const newUser = await registerUser({
			name,
			email,
			password,
		});

		return res.status(201).json({
			msg: "User registered successfully",
			data: {
				id: newUser.id,
				name: newUser.name,
				email: newUser.email,
			},
		});
	} catch (err) {
		return res.status(500).json({ msg: "Server error", error: err.message });
	}
};

export const login = async (req, res) => {
	try {
		const user = req.foundUser;
		const { password } = req.body;

		const { token, refreshToken } = await loginUser(user, password);
		if (!token) {
			return res.status(401).json({
				status: "error",
				message: "Invalid email or password",
			});
		}

		res.cookie("token", token, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			signed: true,
			maxAge: 7 * 24 * 60 * 60 * 1000,
			sameSite: "lax",
		});

		res.cookie("refreshToken", refreshToken, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			signed: true,
			maxAge: 30 * 24 * 60 * 60 * 1000,
			sameSite: "lax",
		});

		const { id, name, email } = user;
		return res.status(200).json({
			status: "success",
			message: "Logged in successfully",
			data: { user: { id, name, email } },
		});
	} catch (err) {
		return res.status(500).json({ msg: "Server error", error: err.message });
	}
};

export const refresh = async (req, res) => {
	try {
		const refreshToken = req.signedCookies.refreshToken;
		if (!refreshToken) {
			return res.status(401).json({ msg: "No refresh token provided" });
		}

		const newAccessToken = await refreshAccessToken(refreshToken);
		if (!newAccessToken) {
			return res.status(403).json({ msg: "Invalid or expired refresh token" });
		}

		res.cookie("token", newAccessToken, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			signed: true,
			maxAge: 7 * 24 * 60 * 60 * 1000,
			sameSite: "lax",
		});

		return res.status(200).json({ msg: "Token refreshed successfully" });
	} catch (err) {
		return res.status(500).json({ msg: "Server error", error: err.message });
	}
};

export const logout = async (req, res) => {
	const refreshToken = req.signedCookies.refreshToken;

	if (refreshToken) {
		await prisma.refreshToken.delete({
			where: { token: refreshToken },
		});
	}

	res.clearCookie("token", {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		signed: true,
	});

	res.clearCookie("refreshToken", {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		signed: true,
	});

	return res.status(200).json({
		status: "success",
		message: "Logged out successfully",
	});
};
