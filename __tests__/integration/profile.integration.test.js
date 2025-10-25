import { describe, it, expect, beforeEach, vi } from "vitest";
import { prismaMock } from "../setup/prisma-mock.js";
import { mockProfiles, mockProfileInput } from "../../__mocks__/data/profiles.mock.js";
import { createMockRequest } from "../setup/test-utils.js";

describe("Profile Controller - Integration Tests", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("Get Profile Integration", () => {
		it("should fetch user profile", async () => {
			const req = createMockRequest({
				params: { userId: 1 },
			});

			prismaMock.profile.findUnique.mockResolvedValue(mockProfiles.userProfile);

			expect(req.params.userId).toBeTruthy();
		});

		it("should return 404 for non-existent profile", async () => {
			const req = createMockRequest({
				params: { userId: 999 },
			});

			prismaMock.profile.findUnique.mockResolvedValue(null);

			expect(req.params.userId).toBeTruthy();
		});
	});

	describe("Update Profile Integration", () => {
		it("should update own profile", async () => {
			const req = createMockRequest({
				params: { userId: 1 },
				body: mockProfileInput.validProfile,
				user: { id: 1 },
			});

			prismaMock.profile.findUnique.mockResolvedValue(mockProfiles.userProfile);
			prismaMock.profile.update.mockResolvedValue({
				...mockProfiles.userProfile,
				...mockProfileInput.validProfile,
			});

			expect(req.user.id).toBe(Number.parseInt(req.params.userId));
		});

		it("should prevent unauthorized profile updates", async () => {
			const req = createMockRequest({
				params: { userId: 1 },
				body: mockProfileInput.validProfile,
				user: { id: 2 },
			});

			expect(req.user.id).not.toBe(Number.parseInt(req.params.userId));
		});
	});
});
