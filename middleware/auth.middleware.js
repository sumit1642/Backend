// middleware/auth.middleware.js
import { prisma } from "../utils/prisma.js";

// Basic email validation
const isValidEmail = (email) => {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
};

// Sanitize input to prevent XSS
const sanitizeInput = (input) => {
	if (typeof input !== "string") return input;
	return input
		.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
		.replace(/<[^>]*>/g, "")
		.trim();
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

		// Sanitize and validate name
		const sanitizedName = sanitizeInput(name.trim());
		if (sanitizedName.length < 2) {
			return res.status(400).json({
				status: "error",
				message: "Name must be at least 2 characters long",
			});
		}

		if (sanitizedName.length > 50) {
			return res.status(400).json({
				status: "error",
				message: "Name cannot be longer than 50 characters",
			});
		}

		// Validate email
		const sanitizedEmail = email.trim().toLowerCase();
		if (!isValidEmail(sanitizedEmail)) {
			return res.status(400).json({
				status: "error",
				message: "Please provide a valid email address",
			});
		}

		// Validate password
		if (password.length < 6) {
			return res.status(400).json({
				status: "error",
				message: "Password must be at least 6 characters long",
			});
		}

		if (password.length > 128) {
			return res.status(400).json({
				status: "error",
				message: "Password cannot be longer than 128 characters",
			});
		}

		// Check if user already exists
		const existingUser = await prisma.user.findUnique({
			where: { email: sanitizedEmail },
		});

		if (existingUser) {
			return res.status(409).json({
				status: "error",
				message: "User with this email already exists",
			});
		}

		// Clean data for next step
		req.body = {
			name: sanitizedName,
			email: sanitizedEmail,
			password: password,
		};

		next();
	} catch (error) {
		console.error("Register validation error:", error);
		return res.status(500).json({
			status: "error",
			message: "Validation failed",
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

		// Sanitize and validate email
		const sanitizedEmail = email.trim().toLowerCase();
		if (!isValidEmail(sanitizedEmail)) {
			return res.status(400).json({
				status: "error",
				message: "Please provide a valid email address",
			});
		}

		// Find user
		const user = await prisma.user.findUnique({
			where: { email: sanitizedEmail },
		});

		if (!user) {
			return res.status(401).json({
				status: "error",
				message: "Invalid email or password",
			});
		}

		req.foundUser = user;
		req.body.password = password; // Keep original password for bcrypt comparison
		next();
	} catch (error) {
		console.error("Login validation error:", error);
		return res.status(500).json({
			status: "error",
			message: "Validation failed",
		});
	}
};
