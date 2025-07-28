// middleware/auth/ValidateUser.js
import { prisma } from "../../utils/prisma.js";

// Email validation helper
const isValidEmail = (email) => {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
};

// LOGIN: Validate email & password presence + if user exists
export const loginValidation = async (req, res, next) => {
	try {
		const { email, password } = req.body;

		// Input validation
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

		// Email format validation
		if (!isValidEmail(email.trim())) {
			return res.status(400).json({
				status: "error",
				message: "Please provide a valid email address",
			});
		}

		// Find user in database
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

// REGISTER: Validate name, email, password presence + check if user already exists
export const registerValidation = async (req, res, next) => {
	try {
		const { name, email, password } = req.body;

		// Input validation
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

		// Additional validation
		if (name.trim().length < 2) {
			return res.status(400).json({
				status: "error",
				message: "Name must be at least 2 characters long",
			});
		}

		if (name.trim().length > 50) {
			return res.status(400).json({
				status: "error",
				message: "Name must be less than 50 characters",
			});
		}

		// Email format validation
		if (!isValidEmail(email.trim())) {
			return res.status(400).json({
				status: "error",
				message: "Please provide a valid email address",
			});
		}

		// Password strength validation
		if (password.length < 6) {
			return res.status(400).json({
				status: "error",
				message: "Password must be at least 6 characters long",
			});
		}

		if (password.length > 128) {
			return res.status(400).json({
				status: "error",
				message: "Password must be less than 128 characters",
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

		// Normalize data for next middleware/controller
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
