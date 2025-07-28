// middleware/posts/isAuthenticated.js
import jwt from "jsonwebtoken";

export const isAuthenticated = async (req, res, next) => {
	try {
		const accessToken = req.signedCookies?.accessToken;

		if (!accessToken) {
			return res.status(401).json({
				status: "error",
				message: "Access token required. Please login.",
			});
		}

		// Verify access token
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

		if (err.name === "JsonWebTokenError") {
			return res.status(401).json({
				status: "error",
				message: "Invalid access token.",
			});
		}

		return res.status(401).json({
			status: "error",
			message: "Authentication failed",
		});
	}
};

// Optional middleware - doesn't fail if no token
export const optionalAuth = async (req, res, next) => {
	try {
		const accessToken = req.signedCookies?.accessToken;

		if (accessToken) {
			const decoded = jwt.verify(accessToken, process.env.JWT_SECRET_KEY || "secretkey");
			req.user = decoded;
		}

		next();
	} catch (err) {
		// Don't fail, just continue without user data
		console.log("Optional auth failed:", err.message);
		next();
	}
};
