// controllers/auth.controller.js
import {
	createNewUserAccount,
	authenticateUserLogin,
	generateNewAccessToken,
	removeUserSession,
} from "../services/auth.service.js";

// Create secure cookie configuration for different token types
const createSecureCookieConfiguration = (maxAgeInMilliseconds) => ({
	httpOnly: true, // Prevent client-side JavaScript access for security
	secure: process.env.NODE_ENV === "production", // HTTPS only in production
	sameSite: "strict", // CSRF protection
	path: "/", // Cookie available on all routes
	maxAge: maxAgeInMilliseconds, // Cookie expiration time
});

// Register new user controller
export const registerNewUser = async (req, res) => {
	try {
		const { name, email, password } = req.body;
		const newUserData = await createNewUserAccount({ name, email, password });

		return res.status(201).json({
			status: "success",
			message: "User registered successfully",
			data: { user: newUserData },
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

		// Set secure authentication cookies
		const accessTokenExpiryTime = 15 * 60 * 1000; // 15 minutes
		const refreshTokenExpiryTime = 7 * 24 * 60 * 60 * 1000; // 7 days

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

// Refresh user access token controller
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

		// Set new secure authentication cookies
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

		// Clear authentication cookies on token refresh failure
		res.clearCookie("accessToken", { path: "/" });
		res.clearCookie("refreshToken", { path: "/" });

		return res.status(401).json({
			status: "error",
			message: "Token refresh failed",
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
