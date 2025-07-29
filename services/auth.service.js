// services/auth.service.js
import bcrypt from "bcryptjs";
import { prisma } from "../utils/prisma.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";

// Ensure JWT secret is set
const JWT_SECRET = process.env.JWT_SECRET_KEY;
if (!JWT_SECRET) {
	console.error("❌ JWT_SECRET_KEY environment variable is required");
	process.exit(1);
}

export const registerUser = async ({ name, email, password }) => {
	try {
		// Check if user already exists
		const existingUser = await prisma.user.findUnique({
			where: { email },
		});

		if (existingUser) {
			throw new Error("User already exists");
		}

		// Validate password strength
		if (password.length < 6) {
			throw new Error("Password must be at least 6 characters long");
		}

		const hashedPassword = await bcrypt.hash(password, 12);

		const newUser = await prisma.user.create({
			data: {
				name,
				email,
				password: hashedPassword,
				profile: {
					create: {
						bio: "",
					},
				},
			},
			select: {
				id: true,
				name: true,
				email: true,
			},
		});

		return newUser;
	} catch (error) {
		console.error("Register user error:", error);
		throw error;
	}
};

export const loginUser = async (user, password) => {
	try {
		const validPassword = await bcrypt.compare(password, user.password);
		if (!validPassword) {
			throw new Error("Invalid credentials");
		}

		// Clean up expired refresh tokens for this user
		await prisma.refreshToken.deleteMany({
			where: {
				userId: user.id,
				expiresAt: {
					lt: new Date(),
				},
			},
		});

		// Create JWT access token
		const accessToken = jwt.sign(
			{
				userId: user.id,
				email: user.email,
				name: user.name,
			},
			JWT_SECRET,
			{ expiresIn: "15m" },
		);

		// Create refresh token
		const refreshTokenValue = crypto.randomBytes(40).toString("hex");
		const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

		await prisma.refreshToken.create({
			data: {
				token: refreshTokenValue,
				userId: user.id,
				expiresAt,
			},
		});

		return {
			accessToken,
			refreshToken: refreshTokenValue,
			user: {
				id: user.id,
				name: user.name,
				email: user.email,
			},
		};
	} catch (error) {
		console.error("Login user error:", error);
		throw error;
	}
};

export const refreshAccessToken = async (refreshToken) => {
	try {
		if (!refreshToken) {
			throw new Error("Refresh token is required");
		}

		// Find and validate refresh token
		const tokenEntry = await prisma.refreshToken.findUnique({
			where: { token: refreshToken },
			include: { user: true },
		});

		if (!tokenEntry) {
			throw new Error("Invalid refresh token");
		}

		if (tokenEntry.expiresAt < new Date()) {
			// Clean up expired token
			await prisma.refreshToken.delete({
				where: { token: refreshToken },
			});
			throw new Error("Refresh token expired");
		}

		if (!tokenEntry.user) {
			throw new Error("User not found");
		}

		// Create new access token first
		const newAccessToken = jwt.sign(
			{
				userId: tokenEntry.user.id,
				email: tokenEntry.user.email,
				name: tokenEntry.user.name,
			},
			JWT_SECRET,
			{ expiresIn: "15m" },
		);

		// Create new refresh token
		const newRefreshToken = crypto.randomBytes(40).toString("hex");
		const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

		// Use transaction to ensure atomicity
		const result = await prisma.$transaction(async (tx) => {
			// Delete the old refresh token
			await tx.refreshToken.delete({
				where: { token: refreshToken },
			});

			// Create new refresh token
			await tx.refreshToken.create({
				data: {
					token: newRefreshToken,
					userId: tokenEntry.user.id,
					expiresAt,
				},
			});

			return {
				accessToken: newAccessToken,
				refreshToken: newRefreshToken,
				user: {
					id: tokenEntry.user.id,
					name: tokenEntry.user.name,
					email: tokenEntry.user.email,
				},
			};
		});

		return result;
	} catch (error) {
		console.error("Refresh token error:", error);
		throw error;
	}
};

export const logoutUser = async (refreshToken) => {
	try {
		if (refreshToken) {
			await prisma.refreshToken.delete({
				where: { token: refreshToken },
			});
		}
	} catch (error) {
		// Token might not exist, continue with logout
		console.log("Refresh token not found during logout:", error.message);
	}
};

export const logoutAllDevices = async (userId) => {
	try {
		await prisma.refreshToken.deleteMany({
			where: { userId },
		});
	} catch (error) {
		console.error("Logout all devices error:", error);
		throw error;
	}
};
