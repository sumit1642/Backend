// utils/authHelper.js (Client-side authentication helper)

class AuthenticationManager {
	constructor(baseApiUrl = "/api") {
		this.baseApiUrl = baseApiUrl;
		this.isRefreshingToken = false;
		this.refreshPromise = null;
		this.authListeners = new Set();
	}

	// Add authentication state change listener
	addAuthListener(callback) {
		this.authListeners.add(callback);
		return () => this.authListeners.delete(callback);
	}

	// Notify all listeners of auth state changes
	notifyAuthListeners(isAuthenticated, user = null) {
		this.authListeners.forEach((callback) => {
			try {
				callback({ isAuthenticated, user });
			} catch (error) {
				console.error("Auth listener error:", error);
			}
		});
	}

	// Enhanced fetch with automatic token refresh
	async authenticatedFetch(url, options = {}) {
		try {
			// Make initial request
			let response = await fetch(url, {
				...options,
				credentials: "include", // Include cookies
			});

			// If token expired (401), try to refresh automatically
			if (response.status === 401) {
				const responseData = await response.json();

				if (responseData.code === "TOKEN_EXPIRED" || responseData.code === "NO_ACCESS_TOKEN") {
					console.log("Access token expired, attempting refresh...");

					const refreshSuccess = await this.refreshAccessToken();

					if (refreshSuccess) {
						// Retry original request with new token
						response = await fetch(url, {
							...options,
							credentials: "include",
						});
					} else {
						// Refresh failed, notify listeners and redirect to login
						this.notifyAuthListeners(false);
						throw new Error("Authentication failed - please login again");
					}
				}
			}

			return response;
		} catch (error) {
			console.error("Authenticated fetch error:", error);
			throw error;
		}
	}

	// Refresh access token using refresh token
	async refreshAccessToken() {
		// Prevent multiple simultaneous refresh attempts
		if (this.isRefreshingToken) {
			return this.refreshPromise;
		}

		this.isRefreshingToken = true;
		this.refreshPromise = this._performTokenRefresh();

		try {
			const result = await this.refreshPromise;
			return result;
		} finally {
			this.isRefreshingToken = false;
			this.refreshPromise = null;
		}
	}

	async _performTokenRefresh() {
		try {
			const response = await fetch(`${this.baseApiUrl}/auth/refresh`, {
				method: "POST",
				credentials: "include",
				headers: {
					"Content-Type": "application/json",
				},
			});

			if (response.ok) {
				const data = await response.json();
				console.log("Token refreshed successfully");

				// Notify listeners that user is still authenticated
				this.notifyAuthListeners(true, data.data.user);
				return true;
			} else {
				const errorData = await response.json();
				console.log("Token refresh failed:", errorData.message);

				// Clear any invalid cookies and notify listeners
				this.notifyAuthListeners(false);
				return false;
			}
		} catch (error) {
			console.error("Token refresh network error:", error);
			return false;
		}
	}

	// Login user
	async login(email, password) {
		try {
			const response = await fetch(`${this.baseApiUrl}/auth/login`, {
				method: "POST",
				credentials: "include",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ email, password }),
			});

			const data = await response.json();

			if (response.ok) {
				this.notifyAuthListeners(true, data.data.user);
				return { success: true, data };
			} else {
				return { success: false, error: data.message };
			}
		} catch (error) {
			console.error("Login error:", error);
			return { success: false, error: "Network error during login" };
		}
	}

	// FIXED: Register user with auto-login
	async register(name, email, password) {
		try {
			const response = await fetch(`${this.baseApiUrl}/auth/register`, {
				method: "POST",
				credentials: "include",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ name, email, password }),
			});

			const data = await response.json();

			if (response.ok) {
				// Check if user was auto-logged in
				if (data.data.autoLogin) {
					this.notifyAuthListeners(true, data.data.user);
					return {
						success: true,
						data,
						autoLogin: true,
						message: "Registration successful! You are now logged in.",
					};
				} else {
					// Registration successful but not auto-logged in
					return {
						success: true,
						data,
						autoLogin: false,
						message: "Registration successful! Please log in.",
					};
				}
			} else {
				return { success: false, error: data.message };
			}
		} catch (error) {
			console.error("Registration error:", error);
			return { success: false, error: "Network error during registration" };
		}
	}

	// Logout user
	async logout() {
		try {
			await fetch(`${this.baseApiUrl}/auth/logout`, {
				method: "POST",
				credentials: "include",
			});

			this.notifyAuthListeners(false);
			return true;
		} catch (error) {
			console.error("Logout error:", error);
			// Still notify listeners even if request failed
			this.notifyAuthListeners(false);
			return false;
		}
	}

	// Check current authentication status
	async checkAuthStatus() {
		try {
			const response = await fetch(`${this.baseApiUrl}/profile`, {
				method: "GET",
				credentials: "include",
			});

			if (response.ok) {
				const data = await response.json();
				this.notifyAuthListeners(true, data.data.profile);
				return { isAuthenticated: true, user: data.data.profile };
			} else if (response.status === 401) {
				// Try to refresh token
				const refreshSuccess = await this.refreshAccessToken();
				if (refreshSuccess) {
					// Try profile request again
					const retryResponse = await fetch(`${this.baseApiUrl}/profile`, {
						method: "GET",
						credentials: "include",
					});

					if (retryResponse.ok) {
						const retryData = await retryResponse.json();
						this.notifyAuthListeners(true, retryData.data.profile);
						return { isAuthenticated: true, user: retryData.data.profile };
					}
				}

				this.notifyAuthListeners(false);
				return { isAuthenticated: false };
			} else {
				this.notifyAuthListeners(false);
				return { isAuthenticated: false };
			}
		} catch (error) {
			console.error("Auth status check error:", error);
			this.notifyAuthListeners(false);
			return { isAuthenticated: false };
		}
	}
}

// Create singleton instance
const authManager = new AuthenticationManager();

// Export convenience functions
export const login = (email, password) => authManager.login(email, password);
export const register = (name, email, password) => authManager.register(name, email, password);
export const logout = () => authManager.logout();
export const checkAuthStatus = () => authManager.checkAuthStatus();
export const addAuthListener = (callback) => authManager.addAuthListener(callback);
export const authenticatedFetch = (url, options) => authManager.authenticatedFetch(url, options);

// Auto-refresh token periodically (every 10 minutes)
if (typeof window !== "undefined") {
	setInterval(() => {
		authManager.refreshAccessToken().catch((error) => {
			console.log("Periodic token refresh failed:", error.message);
		});
	}, 10 * 60 * 1000); // 10 minutes
}

export default authManager;
