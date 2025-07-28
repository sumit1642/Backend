// services/auth.service.js
import bcrypt from "bcryptjs";
import { prisma } from "../utils/prisma.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";

export const registerUser = async ({ name, email, password }) => {
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

	const hashedPassword = await bcrypt.hash(password, 12); // Increased salt rounds

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
			createdAt: true,
		},
	});

	return newUser;
};

export const loginUser = async (user, password) => {
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
		process.env.JWT_SECRET_KEY || "secretkey",
		{ expiresIn: "15m" }, // Short-lived access token
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
};

export const refreshAccessToken = async (refreshToken) => {
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

	// Delete the old refresh token (token rotation)
	await prisma.refreshToken.delete({
		where: { token: refreshToken },
	});

	// Create new access token
	const newAccessToken = jwt.sign(
		{
			userId: tokenEntry.user.id,
			email: tokenEntry.user.email,
			name: tokenEntry.user.name,
		},
		process.env.JWT_SECRET_KEY || "secretkey",
		{ expiresIn: "15m" },
	);

	// Create new refresh token
	const newRefreshToken = crypto.randomBytes(40).toString("hex");
	const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

	await prisma.refreshToken.create({
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
};

export const logoutUser = async (refreshToken) => {
	if (refreshToken) {
		try {
			await prisma.refreshToken.delete({
				where: { token: refreshToken },
			});
		} catch (error) {
			// Token might not exist, continue with logout
			console.log("Refresh token not found during logout");
		}
	}
};

export const logoutAllDevices = async (userId) => {
	await prisma.refreshToken.deleteMany({
		where: { userId },
	});
};
