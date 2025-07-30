// services/auth.service.js
import bcrypt from "bcryptjs";
import { prisma } from "../utils/prisma.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";

// Ensure JWT secret key is properly configured
const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;
if (!JWT_SECRET_KEY) {
	console.error("❌ JWT_SECRET_KEY environment variable is required");
	process.exit(1);
}

// Create new user account service function
export const createNewUserAccount = async ({ name, email, password }) => {
	try {
		// Double-check if user already exists (redundant safety check)
		const existingUserRecord = await prisma.user.findUnique({
			where: { email },
		});

		if (existingUserRecord) {
			throw new Error("User already exists");
		}

		// Validate password strength requirements
		if (password.length < 6) {
			throw new Error("Password must be at least 6 characters long");
		}

		// Hash password with strong salt rounds for security
		const hashedUserPassword = await bcrypt.hash(password, 12);

		// Create new user with associated profile in database transaction
		const newUserRecord = await prisma.user.create({
			data: {
				name,
				email,
				password: hashedUserPassword,
				profile: {
					create: {
						bio: "", // Initialize with empty bio
					},
				},
			},
			select: {
				id: true,
				name: true,
				email: true,
				// Exclude sensitive data like password from response
			},
		});

		return newUserRecord;
	} catch (userRegistrationError) {
		console.error("User registration service error:", userRegistrationError);
		throw userRegistrationError;
	}
};

// Authenticate user login service function
export const authenticateUserLogin = async (userRecord, providedPassword) => {
	try {
		// Verify password against stored hash
		const isPasswordValid = await bcrypt.compare(providedPassword, userRecord.password);
		if (!isPasswordValid) {
			throw new Error("Invalid credentials");
		}

		// Clean up expired refresh tokens for this user before creating new ones
		await prisma.refreshToken.deleteMany({
			where: {
				userId: userRecord.id,
				expiresAt: {
					lt: new Date(), // Less than current time = expired
				},
			},
		});

		// Create JWT access token with user information
		const accessTokenPayload = {
			userId: userRecord.id,
			email: userRecord.email,
			name: userRecord.name,
		};

		const newAccessToken = jwt.sign(
			accessTokenPayload,
			JWT_SECRET_KEY,
			{ expiresIn: "15m" }, // Short-lived for security
		);

		// Generate secure refresh token using crypto
		const refreshTokenValue = crypto.randomBytes(40).toString("hex");
		const refreshTokenExpiryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

		// Store refresh token in database
		await prisma.refreshToken.create({
			data: {
				token: refreshTokenValue,
				userId: userRecord.id,
				expiresAt: refreshTokenExpiryDate,
			},
		});

		// Return authentication result with tokens and user data
		return {
			accessToken: newAccessToken,
			refreshToken: refreshTokenValue,
			user: {
				id: userRecord.id,
				name: userRecord.name,
				email: userRecord.email,
			},
		};
	} catch (userLoginError) {
		console.error("User login service error:", userLoginError);
		throw userLoginError;
	}
};

// Generate new access token using refresh token service function
export const generateNewAccessToken = async (currentRefreshToken) => {
	try {
		if (!currentRefreshToken) {
			throw new Error("Refresh token is required");
		}

		// Find and validate refresh token in database
		const refreshTokenRecord = await prisma.refreshToken.findUnique({
			where: { token: currentRefreshToken },
			include: {
				user: true, // Include user data for token generation
			},
		});

		if (!refreshTokenRecord) {
			throw new Error("Invalid refresh token");
		}

		// Check if refresh token has expired
		if (refreshTokenRecord.expiresAt < new Date()) {
			// Clean up expired token from database
			await prisma.refreshToken.delete({
				where: { token: currentRefreshToken },
			});
			throw new Error("Refresh token expired");
		}

		// Verify user still exists
		if (!refreshTokenRecord.user) {
			throw new Error("User not found");
		}

		// Create new access token with updated user information
		const newAccessTokenPayload = {
			userId: refreshTokenRecord.user.id,
			email: refreshTokenRecord.user.email,
			name: refreshTokenRecord.user.name,
		};

		const newAccessToken = jwt.sign(newAccessTokenPayload, JWT_SECRET_KEY, {
			expiresIn: "15m",
		});

		// Generate new refresh token for rotation security
		const newRefreshTokenValue = crypto.randomBytes(40).toString("hex");
		const newRefreshTokenExpiryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

		// Use database transaction to ensure atomicity of token rotation
		const tokenRotationResult = await prisma.$transaction(async (databaseTransaction) => {
			// Remove the old refresh token
			await databaseTransaction.refreshToken.delete({
				where: { token: currentRefreshToken },
			});

			// Create new refresh token
			await databaseTransaction.refreshToken.create({
				data: {
					token: newRefreshTokenValue,
					userId: refreshTokenRecord.user.id,
					expiresAt: newRefreshTokenExpiryDate,
				},
			});

			// Return new authentication data
			return {
				accessToken: newAccessToken,
				refreshToken: newRefreshTokenValue,
				user: {
					id: refreshTokenRecord.user.id,
					name: refreshTokenRecord.user.name,
					email: refreshTokenRecord.user.email,
				},
			};
		});

		return tokenRotationResult;
	} catch (tokenRefreshError) {
		console.error("Token refresh service error:", tokenRefreshError);
		throw tokenRefreshError;
	}
};

// Remove user session (logout) service function
export const removeUserSession = async (currentRefreshToken) => {
	try {
		if (currentRefreshToken) {
			// Attempt to delete refresh token from database
			await prisma.refreshToken.delete({
				where: { token: currentRefreshToken },
			});
		}
	} catch (sessionRemovalError) {
		// Token might not exist in database, but continue with logout process
		console.log("Refresh token not found during logout:", sessionRemovalError.message);
	}
};

// Logout user from all devices service function
export const logoutUserFromAllDevices = async (userId) => {
	try {
		// Remove all refresh tokens for this user across all devices
		await prisma.refreshToken.deleteMany({
			where: { userId },
		});
	} catch (allDevicesLogoutError) {
		console.error("Logout from all devices service error:", allDevicesLogoutError);
		throw allDevicesLogoutError;
	}
};

// Additional utility function: Clean up expired tokens (can be used in cron jobs)
export const cleanupExpiredRefreshTokens = async () => {
	try {
		const deletedTokensCount = await prisma.refreshToken.deleteMany({
			where: {
				expiresAt: {
					lt: new Date(), // Delete all tokens that expired before now
				},
			},
		});

		console.log(`🧹 Cleaned up ${deletedTokensCount.count} expired refresh tokens`);
		return deletedTokensCount.count;
	} catch (cleanupError) {
		console.error("Token cleanup service error:", cleanupError);
		throw cleanupError;
	}
};

// Additional utility function: Get user session info
export const getUserSessionInformation = async (userId) => {
	try {
		const userSessionsCount = await prisma.refreshToken.count({
			where: {
				userId,
				expiresAt: {
					gt: new Date(), // Count only non-expired tokens
				},
			},
		});

		const userRecord = await prisma.user.findUnique({
			where: { id: userId },
			select: {
				id: true,
				name: true,
				email: true,
			},
		});

		return {
			user: userRecord,
			activeSessions: userSessionsCount,
		};
	} catch (sessionInfoError) {
		console.error("Get user session info error:", sessionInfoError);
		throw sessionInfoError;
	}
};
