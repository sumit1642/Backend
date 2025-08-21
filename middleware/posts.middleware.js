// middleware/posts.middleware.js (FIXED)
import jwt from "jsonwebtoken";
import { prisma } from "../utils/prisma.js";

// Ensure JWT secret is set
const JWT_SECRET = process.env.JWT_SECRET_KEY;
if (!JWT_SECRET) {
	console.error("❌ JWT_SECRET_KEY environment variable is required");
	process.exit(1);
}

// Sanitize input to prevent XSS
const sanitizeInput = (input) => {
	if (typeof input !== "string") return input;
	return input
		.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
		.replace(/<[^>]*>/g, "")
		.trim();
};

// FIXED: Function to refresh access token automatically (simplified internal call)
const attemptTokenRefresh = async (refreshToken) => {
	if (!refreshToken) {
		return null;
	}

	try {
		// Check if refresh token exists in database
		const refreshTokenRecord = await prisma.refreshToken.findUnique({
			where: { token: refreshToken },
			include: { user: true },
		});

		if (!refreshTokenRecord || refreshTokenRecord.expiresAt < new Date()) {
			return null;
		}

		// Generate new access token
		const newAccessTokenPayload = {
			userId: refreshTokenRecord.user.id,
			email: refreshTokenRecord.user.email,
			name: refreshTokenRecord.user.name,
		};

		const newAccessToken = jwt.sign(newAccessTokenPayload, JWT_SECRET, {
			expiresIn: "15m",
		});

		return {
			accessToken: newAccessToken,
			user: {
				userId: refreshTokenRecord.user.id,
				email: refreshTokenRecord.user.email,
				name: refreshTokenRecord.user.name,
			},
		};
	} catch (error) {
		console.log("Internal token refresh failed:", error.message);
		return null;
	}
};

// FIXED: Required authentication - with automatic token refresh
export const requireAuth = async (req, res, next) => {
	try {
		const accessToken = req.cookies?.accessToken;

		if (!accessToken) {
			// Try to refresh token automatically
			const refreshToken = req.cookies?.refreshToken;
			const refreshResult = await attemptTokenRefresh(refreshToken);

			if (refreshResult) {
				// Set new access token cookie
				const accessTokenExpiryTime = 15 * 60 * 1000; // 15 minutes
				res.cookie("accessToken", refreshResult.accessToken, {
					httpOnly: true,
					secure: process.env.NODE_ENV === "production",
					sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
					path: "/",
					maxAge: accessTokenExpiryTime,
				});

				req.user = refreshResult.user;
				return next();
			}

			return res.status(401).json({
				status: "error",
				message: "Access token required. Please login.",
				code: "NO_ACCESS_TOKEN",
			});
		}

		try {
			// Verify token
			const decoded = jwt.verify(accessToken, JWT_SECRET);
			req.user = decoded;
			next();
		} catch (tokenError) {
			console.log("JWT verification error:", tokenError.message);

			// If token is expired, try to refresh automatically
			if (tokenError.name === "TokenExpiredError") {
				const refreshToken = req.cookies?.refreshToken;
				const refreshResult = await attemptTokenRefresh(refreshToken);

				if (refreshResult) {
					// Set new access token cookie
					const accessTokenExpiryTime = 15 * 60 * 1000; // 15 minutes
					res.cookie("accessToken", refreshResult.accessToken, {
						httpOnly: true,
						secure: process.env.NODE_ENV === "production",
						sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
						path: "/",
						maxAge: accessTokenExpiryTime,
					});

					req.user = refreshResult.user;
					return next();
				}

				return res.status(401).json({
					status: "error",
					message: "Access token expired. Please refresh your token.",
					code: "TOKEN_EXPIRED",
				});
			}

			if (tokenError.name === "JsonWebTokenError") {
				return res.status(401).json({
					status: "error",
					message: "Invalid access token.",
					code: "INVALID_TOKEN",
				});
			}

			return res.status(401).json({
				status: "error",
				message: "Authentication failed.",
				code: "AUTH_FAILED",
			});
		}
	} catch (err) {
		console.error("Auth middleware error:", err);
		return res.status(500).json({
			status: "error",
			message: "Authentication system error.",
		});
	}
};

// FIXED: Optional authentication - with silent token refresh
export const optionalAuth = async (req, res, next) => {
	try {
		const accessToken = req.cookies?.accessToken;

		if (accessToken) {
			try {
				const decoded = jwt.verify(accessToken, JWT_SECRET);
				req.user = decoded;
			} catch (tokenError) {
				// If token is expired, try silent refresh
				if (tokenError.name === "TokenExpiredError") {
					const refreshToken = req.cookies?.refreshToken;
					const refreshResult = await attemptTokenRefresh(refreshToken);

					if (refreshResult) {
						// Set new access token cookie
						const accessTokenExpiryTime = 15 * 60 * 1000; // 15 minutes
						res.cookie("accessToken", refreshResult.accessToken, {
							httpOnly: true,
							secure: process.env.NODE_ENV === "production",
							sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
							path: "/",
							maxAge: accessTokenExpiryTime,
						});

						req.user = refreshResult.user;
					}
				}
				// For other token errors, just continue without user data
			}
		}

		// Continue regardless of token presence or refresh result
		next();
	} catch (err) {
		// Don't fail, just continue without user data
		console.log("Optional auth error:", err.message);
		next();
	}
};

// Validate post data
export const validatePostData = (req, res, next) => {
	const { title, content } = req.body;

	// Title validation
	if (title !== undefined) {
		if (!title || !title.trim()) {
			return res.status(400).json({
				status: "error",
				message: "Title cannot be empty",
			});
		}

		const sanitizedTitle = sanitizeInput(title.trim());
		if (sanitizedTitle.length > 50) {
			return res.status(400).json({
				status: "error",
				message: "Title cannot be longer than 50 characters",
			});
		}

		req.body.title = sanitizedTitle;
	}

	// Content validation
	if (content !== undefined) {
		if (!content || !content.trim()) {
			return res.status(400).json({
				status: "error",
				message: "Content cannot be empty",
			});
		}

		const sanitizedContent = sanitizeInput(content.trim());
		if (sanitizedContent.length > 191) {
			return res.status(400).json({
				status: "error",
				message: "Content cannot be longer than 191 characters",
			});
		}

		req.body.content = sanitizedContent;
	}

	next();
};

// Validate comment data
export const validateCommentData = (req, res, next) => {
	const { content } = req.body;

	if (!content || !content.trim()) {
		return res.status(400).json({
			status: "error",
			message: "Comment content is required",
		});
	}

	const sanitizedContent = sanitizeInput(content.trim());
	if (sanitizedContent.length > 500) {
		return res.status(400).json({
			status: "error",
			message: "Comment cannot be longer than 500 characters",
		});
	}

	if (sanitizedContent.length < 1) {
		return res.status(400).json({
			status: "error",
			message: "Comment content is required",
		});
	}

	req.body.content = sanitizedContent;
	next();
};

// Validate tag data
export const validateTagData = (req, res, next) => {
	const { tagName } = req.body;

	if (!tagName || !tagName.trim()) {
		return res.status(400).json({
			status: "error",
			message: "Tag name is required",
		});
	}

	const sanitizedTagName = sanitizeInput(tagName.trim()).toLowerCase();

	if (sanitizedTagName.length < 2) {
		return res.status(400).json({
			status: "error",
			message: "Tag name must be at least 2 characters long",
		});
	}

	if (sanitizedTagName.length > 20) {
		return res.status(400).json({
			status: "error",
			message: "Tag name cannot be longer than 20 characters",
		});
	}

	// Check for valid tag characters (alphanumeric and hyphens)
	if (!/^[a-z0-9-]+$/.test(sanitizedTagName)) {
		return res.status(400).json({
			status: "error",
			message: "Tag name can only contain lowercase letters, numbers, and hyphens",
		});
	}

	req.body.tagName = sanitizedTagName;
	next();
};
