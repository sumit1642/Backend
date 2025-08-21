// middleware/auth.middleware.js (FIXED)
import { prisma } from "../utils/prisma.js";
import jwt from "jsonwebtoken";

// Ensure JWT secret is set
const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;
if (!JWT_SECRET_KEY) {
	console.error("❌ JWT_SECRET_KEY environment variable is required");
	process.exit(1);
}

// Basic email validation using regex pattern
const validateEmailFormat = (emailAddress) => {
	const emailValidationRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailValidationRegex.test(emailAddress);
};

// Sanitize user input to prevent XSS attacks
const sanitizeUserInput = (userInput) => {
	if (typeof userInput !== "string") return userInput;
	return userInput
		.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "") // Remove script tags
		.replace(/<[^>]*>/g, "") // Remove all HTML tags
		.trim(); // Remove leading/trailing whitespace
};

// FIXED: Middleware to redirect authenticated users away from auth pages
export const redirectIfAuthenticated = async (req, res, next) => {
	try {
		const userAccessToken = req.cookies?.accessToken;

		// If no access token, check for refresh token and try silent refresh
		if (!userAccessToken) {
			const refreshToken = req.cookies?.refreshToken;

			if (refreshToken) {
				try {
					// Verify refresh token exists in database
					const refreshTokenRecord = await prisma.refreshToken.findUnique({
						where: { token: refreshToken },
						include: { user: true },
					});

					// If valid refresh token exists, user is authenticated
					if (refreshTokenRecord && refreshTokenRecord.expiresAt > new Date()) {
						return res.status(302).json({
							status: "redirect",
							message: "Already authenticated",
							redirectUrl: "/",
							data: {
								user: {
									id: refreshTokenRecord.user.id,
									name: refreshTokenRecord.user.name,
									email: refreshTokenRecord.user.email,
								},
							},
						});
					}
				} catch (refreshCheckError) {
					// If refresh token check fails, clear it and allow access to auth pages
					res.clearCookie("refreshToken", { path: "/" });
				}
			}

			return next(); // Allow access to auth pages
		}

		// Verify if the access token is valid
		try {
			const decodedTokenPayload = jwt.verify(userAccessToken, JWT_SECRET_KEY);

			// If token is valid, user is authenticated - redirect to home page
			return res.status(302).json({
				status: "redirect",
				message: "Already authenticated",
				redirectUrl: "/",
				data: {
					user: {
						id: decodedTokenPayload.userId,
						name: decodedTokenPayload.name,
						email: decodedTokenPayload.email,
					},
				},
			});
		} catch (tokenVerificationError) {
			// If access token is invalid but we have refresh token, try to refresh
			const refreshToken = req.cookies?.refreshToken;

			if (refreshToken) {
				try {
					const refreshTokenRecord = await prisma.refreshToken.findUnique({
						where: { token: refreshToken },
						include: { user: true },
					});

					if (refreshTokenRecord && refreshTokenRecord.expiresAt > new Date()) {
						return res.status(302).json({
							status: "redirect",
							message: "Already authenticated",
							redirectUrl: "/",
							data: {
								user: {
									id: refreshTokenRecord.user.id,
									name: refreshTokenRecord.user.name,
									email: refreshTokenRecord.user.email,
								},
							},
						});
					}
				} catch (refreshError) {
					// Clear invalid tokens
					res.clearCookie("refreshToken", { path: "/" });
				}
			}

			// Clear invalid access token and allow access to auth pages
			res.clearCookie("accessToken", { path: "/" });
			return next();
		}
	} catch (unexpectedError) {
		console.error("Redirect if authenticated middleware error:", unexpectedError);
		// On error, allow access to auth pages (fail gracefully)
		return next();
	}
};

// REGISTER validation middleware
export const validateRegistrationData = async (req, res, next) => {
	try {
		const { name, email, password } = req.body;

		// Validate required fields presence
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

		// Sanitize and validate user name
		const sanitizedUserName = sanitizeUserInput(name.trim());
		if (sanitizedUserName.length < 2) {
			return res.status(400).json({
				status: "error",
				message: "Name must be at least 2 characters long",
			});
		}

		if (sanitizedUserName.length > 50) {
			return res.status(400).json({
				status: "error",
				message: "Name cannot be longer than 50 characters",
			});
		}

		// Sanitize and validate email address
		const sanitizedEmailAddress = email.trim().toLowerCase();
		if (!validateEmailFormat(sanitizedEmailAddress)) {
			return res.status(400).json({
				status: "error",
				message: "Please provide a valid email address",
			});
		}

		// Validate password strength requirements
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

		// Check if user with this email already exists in database
		const existingUserRecord = await prisma.user.findUnique({
			where: { email: sanitizedEmailAddress },
		});

		if (existingUserRecord) {
			return res.status(409).json({
				status: "error",
				message: "User with this email already exists",
			});
		}

		// Prepare clean data for next middleware/controller
		req.body = {
			name: sanitizedUserName,
			email: sanitizedEmailAddress,
			password: password, // Keep original password for bcrypt hashing
		};

		next();
	} catch (registrationValidationError) {
		console.error("Registration validation error:", registrationValidationError);
		return res.status(500).json({
			status: "error",
			message: "Validation failed",
		});
	}
};

// LOGIN validation middleware
export const validateLoginCredentials = async (req, res, next) => {
	try {
		const { email, password } = req.body;

		// Validate required login fields
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

		// Sanitize and validate email format
		const sanitizedEmailAddress = email.trim().toLowerCase();
		if (!validateEmailFormat(sanitizedEmailAddress)) {
			return res.status(400).json({
				status: "error",
				message: "Please provide a valid email address",
			});
		}

		// Find user record in database
		const userRecord = await prisma.user.findUnique({
			where: { email: sanitizedEmailAddress },
		});

		if (!userRecord) {
			return res.status(401).json({
				status: "error",
				message: "Invalid email or password",
			});
		}

		// Attach found user to request for next middleware/controller
		req.foundUserRecord = userRecord;
		req.body.password = password; // Keep original password for bcrypt comparison

		next();
	} catch (loginValidationError) {
		console.error("Login validation error:", loginValidationError);
		return res.status(500).json({
			status: "error",
			message: "Validation failed",
		});
	}
};
