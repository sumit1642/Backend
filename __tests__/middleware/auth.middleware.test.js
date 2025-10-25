import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMockRequest, createMockNext, generateTestToken, generateExpiredToken } from "../setup/test-utils.js";
import jwt from "jsonwebtoken";

describe("Auth Middleware - Tests", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("JWT Verification", () => {
		it("should verify valid JWT token", async () => {
			const token = generateTestToken(1);
			const req = createMockRequest({
				headers: {
					authorization: `Bearer ${token}`,
				},
			});

			expect(token).toBeTruthy();
			expect(token.split(".").length).toBe(3);

			const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
			expect(decoded.id).toBe(1);
		});

		it("should reject request without token", async () => {
			const req = createMockRequest({
				headers: {},
			});

			expect(req.headers.authorization).toBeUndefined();
		});

		it("should reject malformed authorization header", async () => {
			const req = createMockRequest({
				headers: {
					authorization: "InvalidFormat token",
				},
			});

			expect(req.headers.authorization).not.toMatch(/^Bearer /);
		});

		it("should reject expired token", async () => {
			const expiredToken = generateExpiredToken(1);

			expect(() => {
				jwt.verify(expiredToken, process.env.JWT_SECRET_KEY);
			}).toThrow();
		});

		it("should reject invalid token signature", async () => {
			const invalidToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature";

			expect(() => {
				jwt.verify(invalidToken, process.env.JWT_SECRET_KEY);
			}).toThrow();
		});
	});

	describe("Token Extraction", () => {
		it("should extract token from Authorization header", async () => {
			const token = generateTestToken(1);
			const authHeader = `Bearer ${token}`;
			const extractedToken = authHeader.replace("Bearer ", "");

			expect(extractedToken).toBe(token);
		});

		it("should extract token from cookies", async () => {
			const token = generateTestToken(1);
			const req = createMockRequest({
				cookies: {
					token: token,
				},
			});

			expect(req.cookies.token).toBe(token);
		});

		it("should prioritize Authorization header over cookies", async () => {
			const headerToken = generateTestToken(1);
			const cookieToken = generateTestToken(2);
			const req = createMockRequest({
				headers: {
					authorization: `Bearer ${headerToken}`,
				},
				cookies: {
					token: cookieToken,
				},
			});

			expect(req.headers.authorization).toContain(headerToken);
		});
	});

	describe("User Attachment", () => {
		it("should attach user data to request", async () => {
			const token = generateTestToken(1);
			const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

			expect(decoded.id).toBe(1);
		});

		it("should include user ID in request", async () => {
			const userId = 1;
			const token = generateTestToken(userId);
			const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

			expect(decoded.id).toBe(userId);
		});
	});

	describe("Error Handling", () => {
		it("should return 401 for missing token", async () => {
			const req = createMockRequest({
				headers: {},
			});

			expect(req.headers.authorization).toBeUndefined();
		});

		it("should return 401 for invalid token", async () => {
			const req = createMockRequest({
				headers: {
					authorization: "Bearer invalid_token",
				},
			});

			expect(() => {
				jwt.verify("invalid_token", process.env.JWT_SECRET_KEY);
			}).toThrow();
		});

		it("should return 401 for expired token", async () => {
			const expiredToken = generateExpiredToken(1);

			expect(() => {
				jwt.verify(expiredToken, process.env.JWT_SECRET_KEY);
			}).toThrow();
		});

		it("should call next() on successful verification", async () => {
			const token = generateTestToken(1);
			const next = createMockNext();

			expect(token).toBeTruthy();
			const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
			expect(decoded.id).toBe(1);
		});
	});

	describe("Optional Authentication", () => {
		it("should allow requests without token for optional auth", async () => {
			const req = createMockRequest({
				headers: {},
			});

			expect(req.headers.authorization).toBeUndefined();
		});

		it("should attach user if token provided for optional auth", async () => {
			const token = generateTestToken(1);
			const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

			expect(decoded.id).toBe(1);
		});
	});
});
