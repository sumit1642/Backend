// controllers/debug.controller.js (For development debugging)
import jwt from "jsonwebtoken";
import { prisma } from "../utils/prisma.js";

const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;

// Debug authentication status
export const debugAuthStatus = async (req, res) => {
	if (process.env.NODE_ENV === "production") {
		return res.status(404).json({
			status: "error",
			message: "Debug endpoints not available in production",
		});
	}

	try {
		const accessToken = req.cookies?.accessToken;
		const refreshToken = req.cookies?.refreshToken;

		const debugInfo = {
			timestamp: new Date().toISOString(),
			cookies: {
				hasAccessToken: !!accessToken,
				hasRefreshToken: !!refreshToken,
				accessTokenLength: accessToken?.length || 0,
				refreshTokenLength: refreshToken?.length || 0,
			},
			headers: {
				userAgent: req.headers["user-agent"],
				origin: req.headers.origin,
				cookie: req.headers.cookie ? "Present" : "Missing",
			},
		};

		// Analyze access token if present
		if (accessToken) {
			try {
				const decoded = jwt.verify(accessToken, JWT_SECRET_KEY);
				debugInfo.accessToken = {
					valid: true,
					userId: decoded.userId,
					email: decoded.email,
					name: decoded.name,
					expiresAt: new Date(decoded.exp * 1000).toISOString(),
				};
			} catch (tokenError) {
				debugInfo.accessToken = {
					valid: false,
					error: tokenError.name,
					message: tokenError.message,
				};
			}
		}

		// Analyze refresh token if present
		if (refreshToken) {
			try {
				const refreshTokenRecord = await prisma.refreshToken.findUnique({
					where: { token: refreshToken },
					include: { user: true },
				});

				if (refreshTokenRecord) {
					debugInfo.refreshToken = {
						valid: true,
						userId: refreshTokenRecord.userId,
						expiresAt: refreshTokenRecord.expiresAt.toISOString(),
						isExpired: refreshTokenRecord.expiresAt < new Date(),
						user: {
							id: refreshTokenRecord.user.id,
							name: refreshTokenRecord.user.name,
							email: refreshTokenRecord.user.email,
						},
					};
				} else {
					debugInfo.refreshToken = {
						valid: false,
						error: "Token not found in database",
					};
				}
			} catch (refreshError) {
				debugInfo.refreshToken = {
					valid: false,
					error: refreshError.message,
				};
			}
		}

		return res.status(200).json({
			status: "success",
			message: "Authentication debug information",
			data: debugInfo,
		});
	} catch (error) {
		console.error("Debug auth status error:", error);
		return res.status(500).json({
			status: "error",
			message: "Debug failed",
			error: error.message,
		});
	}
};

// Debug all active sessions
export const debugActiveSessions = async (req, res) => {
	if (process.env.NODE_ENV === "production") {
		return res.status(404).json({
			status: "error",
			message: "Debug endpoints not available in production",
		});
	}

	try {
		const allSessions = await prisma.refreshToken.findMany({
			include: {
				user: {
					select: {
						id: true,
						name: true,
						email: true,
					},
				},
			},
			orderBy: { createdAt: "desc" },
		});

		const sessionSummary = allSessions.map((session) => ({
			tokenId: session.id,
			userId: session.userId,
			userName: session.user.name,
			userEmail: session.user.email,
			createdAt: session.createdAt,
			expiresAt: session.expiresAt,
			isExpired: session.expiresAt < new Date(),
			tokenPreview: session.token.substring(0, 8) + "...",
		}));

		return res.status(200).json({
			status: "success",
			message: "Active sessions debug information",
			data: {
				totalSessions: allSessions.length,
				expiredSessions: allSessions.filter((s) => s.expiresAt < new Date()).length,
				activeSessions: allSessions.filter((s) => s.expiresAt >= new Date()).length,
				sessions: sessionSummary,
			},
		});
	} catch (error) {
		console.error("Debug active sessions error:", error);
		return res.status(500).json({
			status: "error",
			message: "Debug failed",
			error: error.message,
		});
	}
};

// Clean up expired tokens manually
export const debugCleanupTokens = async (req, res) => {
	if (process.env.NODE_ENV === "production") {
		return res.status(404).json({
			status: "error",
			message: "Debug endpoints not available in production",
		});
	}

	try {
		const deletedCount = await prisma.refreshToken.deleteMany({
			where: {
				expiresAt: {
					lt: new Date(),
				},
			},
		});

		return res.status(200).json({
			status: "success",
			message: `Cleaned up ${deletedCount.count} expired tokens`,
			data: { deletedCount: deletedCount.count },
		});
	} catch (error) {
		console.error("Debug cleanup tokens error:", error);
		return res.status(500).json({
			status: "error",
			message: "Cleanup failed",
			error: error.message,
		});
	}
};
