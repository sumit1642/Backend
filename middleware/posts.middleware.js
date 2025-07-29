// middleware/posts.middleware.js
import jwt from "jsonwebtoken";

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

// Required authentication - fails if no token
export const requireAuth = async (req, res, next) => {
	try {
		const accessToken = req.cookies?.accessToken;

		if (!accessToken) {
			return res.status(401).json({
				status: "error",
				message: "Access token required. Please login.",
			});
		}

		// Verify token
		const decoded = jwt.verify(accessToken, JWT_SECRET);
		req.user = decoded;
		next();
	} catch (err) {
		console.error("JWT verification error:", err);

		if (err.name === "TokenExpiredError") {
			return res.status(401).json({
				status: "error",
				message: "Access token expired. Please refresh your token.",
				code: "TOKEN_EXPIRED",
			});
		}

		if (err.name === "JsonWebTokenError") {
			return res.status(401).json({
				status: "error",
				message: "Invalid access token.",
			});
		}

		return res.status(401).json({
			status: "error",
			message: "Authentication failed.",
		});
	}
};

// Optional authentication - continues even if no token
export const optionalAuth = async (req, res, next) => {
	try {
		const accessToken = req.cookies?.accessToken;

		if (accessToken) {
			try {
				const decoded = jwt.verify(accessToken, JWT_SECRET);
				req.user = decoded;
			} catch (err) {
				// Don't fail, just continue without user data
				console.log("Optional auth failed:", err.message);
			}
		}

		// Continue regardless of token presence
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
