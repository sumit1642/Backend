// controllers/auth.controller.js (FIXED)
import {
	createNewUserAccount,
	authenticateUserLogin,
	generateNewAccessToken,
	removeUserSession,
} from "../services/auth.service.js";

// FIXED: Create secure cookie configuration for different token types
const createSecureCookieConfiguration = (maxAgeInMilliseconds) => ({
	httpOnly: true, // Prevent client-side JavaScript access for security
	secure: process.env.NODE_ENV === "production", // HTTPS only in production
	sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax", // More permissive in development
	path: "/", // Cookie available on all routes
	maxAge: maxAgeInMilliseconds, // Cookie expiration time
});

// FIXED: Register new user controller with auto-login
export const registerNewUser = async (req, res) => {
	try {
		const { name, email, password } = req.body;

		// Create user with auto-login enabled
		const registrationResult = await createNewUserAccount({ name, email, password }, true);

		// Set authentication cookies if tokens were generated
		if (registrationResult.accessToken && registrationResult.refreshToken) {
			const accessTokenExpiryTime = 15 * 60 * 1000; // 15 minutes
			const refreshTokenExpiryTime = 7 * 24 * 60 * 60 * 1000; // 7 days

			// Clear any existing cookies first
			res.clearCookie("accessToken", { path: "/" });
			res.clearCookie("refreshToken", { path: "/" });

			res.cookie(
				"accessToken",
				registrationResult.accessToken,
				createSecureCookieConfiguration(accessTokenExpiryTime),
			);

			res.cookie(
				"refreshToken",
				registrationResult.refreshToken,
				createSecureCookieConfiguration(refreshTokenExpiryTime),
			);

			return res.status(201).json({
				status: "success",
				message: "User registered and logged in successfully",
				data: {
					user: registrationResult.user,
					autoLogin: true,
				},
			});
		}

		// Fallback if auto-login failed
		return res.status(201).json({
			status: "success",
			message: "User registered successfully",
			data: { user: registrationResult },
		});
	} catch (registrationError) {
		console.error("User registration error:", registrationError);

		// Handle specific registration errors
		if (registrationError.message === "User already exists") {
			return res.status(409).json({
				status: "error",
				message: "User already exists",
			});
		}

		if (registrationError.message.includes("Password")) {
			return res.status(400).json({
				status: "error",
				message: registrationError.message,
			});
		}

		return res.status(500).json({
			status: "error",
			message: "Registration failed",
		});
	}
};

// Login existing user controller
export const loginUser = async (req, res) => {
	try {
		const userRecord = req.foundUserRecord; // From validation middleware
		const { password } = req.body;
		const authenticationResult = await authenticateUserLogin(userRecord, password);

		// FIXED: Adjusted token expiry times for better user experience
		const accessTokenExpiryTime = 15 * 60 * 1000; // 15 minutes
		const refreshTokenExpiryTime = 7 * 24 * 60 * 60 * 1000; // 7 days

		// Clear any existing cookies first to prevent conflicts
		res.clearCookie("accessToken", { path: "/" });
		res.clearCookie("refreshToken", { path: "/" });

		// Set secure authentication cookies
		res.cookie(
			"accessToken",
			authenticationResult.accessToken,
			createSecureCookieConfiguration(accessTokenExpiryTime),
		);

		res.cookie(
			"refreshToken",
			authenticationResult.refreshToken,
			createSecureCookieConfiguration(refreshTokenExpiryTime),
		);

		return res.status(200).json({
			status: "success",
			message: "Logged in successfully",
			data: { user: authenticationResult.user },
		});
	} catch (loginError) {
		console.error("User login error:", loginError);

		if (loginError.message === "Invalid credentials") {
			return res.status(401).json({
				status: "error",
				message: "Invalid email or password",
			});
		}

		return res.status(500).json({
			status: "error",
			message: "Login failed",
		});
	}
};

// FIXED: Refresh user access token controller
export const refreshUserToken = async (req, res) => {
	try {
		const currentRefreshToken = req.cookies.refreshToken;

		if (!currentRefreshToken) {
			return res.status(401).json({
				status: "error",
				message: "Refresh token required",
			});
		}

		const tokenRefreshResult = await generateNewAccessToken(currentRefreshToken);

		// FIXED: Set new secure authentication cookies with proper configuration
		const accessTokenExpiryTime = 15 * 60 * 1000; // 15 minutes
		const refreshTokenExpiryTime = 7 * 24 * 60 * 60 * 1000; // 7 days

		res.cookie(
			"accessToken",
			tokenRefreshResult.accessToken,
			createSecureCookieConfiguration(accessTokenExpiryTime),
		);

		res.cookie(
			"refreshToken",
			tokenRefreshResult.refreshToken,
			createSecureCookieConfiguration(refreshTokenExpiryTime),
		);

		return res.status(200).json({
			status: "success",
			message: "Token refreshed successfully",
			data: { user: tokenRefreshResult.user },
		});
	} catch (tokenRefreshError) {
		console.error("Token refresh error:", tokenRefreshError);

		// FIXED: Only clear cookies on specific token errors, not all errors
		if (
			tokenRefreshError.message === "Invalid refresh token" ||
			tokenRefreshError.message === "Refresh token expired" ||
			tokenRefreshError.message === "User not found"
		) {
			// Clear authentication cookies only for invalid/expired tokens
			res.clearCookie("accessToken", { path: "/" });
			res.clearCookie("refreshToken", { path: "/" });

			return res.status(401).json({
				status: "error",
				message: "Token refresh failed - please login again",
				code: "REFRESH_TOKEN_INVALID",
			});
		}

		// For other errors (like database errors), don't clear cookies
		return res.status(500).json({
			status: "error",
			message: "Token refresh temporarily unavailable",
			code: "REFRESH_TOKEN_ERROR",
		});
	}
};

// Logout current user controller
export const logoutCurrentUser = async (req, res) => {
	try {
		const currentRefreshToken = req.cookies.refreshToken;
		await removeUserSession(currentRefreshToken);

		// Clear authentication cookies from browser
		res.clearCookie("accessToken", { path: "/" });
		res.clearCookie("refreshToken", { path: "/" });

		return res.status(200).json({
			status: "success",
			message: "Logged out successfully",
		});
	} catch (logoutError) {
		console.error("User logout error:", logoutError);

		// Still clear cookies even if there's a server error
		res.clearCookie("accessToken", { path: "/" });
		res.clearCookie("refreshToken", { path: "/" });

		return res.status(200).json({
			status: "success",
			message: "Logged out successfully",
		});
	}
};
