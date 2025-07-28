// middleware/auth.middleware.js
import { prisma } from "../utils/prisma.js";

// Basic email validation
const isValidEmail = (email) => {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
};

// REGISTER validation
export const registerValidation = async (req, res, next) => {
	try {
		const { name, email, password } = req.body;

		// Check required fields
		if (!name || !name.trim()) {
			return res.status(400).json({
				status: "error",
				message: "Name is required",
			});
		}

		if (!email || !email.trim()) {
			return res.status(400).json({
				status: "error",
				message: "Email is required",
			});
		}

		if (!password || !password.trim()) {
			return res.status(400).json({
				status: "error",
				message: "Password is required",
			});
		}

		// Basic validation
		if (name.trim().length < 2) {
			return res.status(400).json({
				status: "error",
				message: "Name must be at least 2 characters long",
			});
		}

		if (!isValidEmail(email.trim())) {
			return res.status(400).json({
				status: "error",
				message: "Please provide a valid email address",
			});
		}

		if (password.length < 6) {
			return res.status(400).json({
				status: "error",
				message: "Password must be at least 6 characters long",
			});
		}

		// Check if user already exists
		const existingUser = await prisma.user.findUnique({
			where: { email: email.trim().toLowerCase() },
		});

		if (existingUser) {
			return res.status(409).json({
				status: "error",
				message: "User with this email already exists",
			});
		}

		// Clean data for next step
		req.body = {
			name: name.trim(),
			email: email.trim().toLowerCase(),
			password: password,
		};

		next();
	} catch (error) {
		console.error("Register validation error:", error);
		return res.status(500).json({
			status: "error",
			message: "Internal server error",
		});
	}
};

// LOGIN validation
export const loginValidation = async (req, res, next) => {
	try {
		const { email, password } = req.body;

		// Check required fields
		if (!email || !email.trim()) {
			return res.status(400).json({
				status: "error",
				message: "Email is required",
			});
		}

		if (!password || !password.trim()) {
			return res.status(400).json({
				status: "error",
				message: "Password is required",
			});
		}

		// Basic email validation
		if (!isValidEmail(email.trim())) {
			return res.status(400).json({
				status: "error",
				message: "Please provide a valid email address",
			});
		}

		// Find user
		const user = await prisma.user.findUnique({
			where: { email: email.trim().toLowerCase() },
		});

		if (!user) {
			return res.status(401).json({
				status: "error",
				message: "Invalid email or password",
			});
		}

		req.foundUser = user;
		next();
	} catch (error) {
		console.error("Login validation error:", error);
		return res.status(500).json({
			status: "error",
			message: "Internal server error",
		});
	}
};
