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
