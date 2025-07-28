// middleware/posts/isAuthenticated.js
import jwt from "jsonwebtoken";

export const isAuthenticated = (req, res, next) => {
	const token = req.signedCookies?.token;

	if (!token) {
		return res.status(401).json({
			msg: "You must be logged in to perform this action",
		});
	}

	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY || "secretkey");
		req.user = decoded;
		next();
	} catch (err) {
		console.error("JWT verification error:", err);
		return res.status(401).json({ msg: "Invalid or expired token" });
	}
};
