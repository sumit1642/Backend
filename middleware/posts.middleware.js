// middleware/posts.middleware.js
import jwt from "jsonwebtoken";

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
		const decoded = jwt.verify(accessToken, process.env.JWT_SECRET_KEY || "secretkey");
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

		return res.status(401).json({
			status: "error",
			message: "Invalid access token.",
		});
	}
};

// Optional authentication - continues even if no token
export const optionalAuth = async (req, res, next) => {
	try {
		const accessToken = req.cookies?.accessToken;

		if (accessToken) {
			const decoded = jwt.verify(accessToken, process.env.JWT_SECRET_KEY || "secretkey");
			req.user = decoded;
		}
		// Continue regardless of token presence
		next();
	} catch (err) {
		// Don't fail, just continue without user data
		console.log("Optional auth failed:", err.message);
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

		if (title.trim().length > 50) {
			return res.status(400).json({
				status: "error",
				message: "Title cannot be longer than 50 characters",
			});
		}
	}

	// Content validation
	if (content !== undefined) {
		if (!content || !content.trim()) {
			return res.status(400).json({
				status: "error",
				message: "Content cannot be empty",
			});
		}

		if (content.trim().length > 191) {
			return res.status(400).json({
				status: "error",
				message: "Content cannot be longer than 191 characters",
			});
		}
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

	if (content.trim().length > 500) {
		return res.status(400).json({
			status: "error",
			message: "Comment cannot be longer than 500 characters",
		});
	}

	next();
};
