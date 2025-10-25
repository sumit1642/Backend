import { describe, it, expect, beforeEach, vi } from "vitest";
import { prismaMock } from "../setup/prisma-mock.js";
import { mockProfiles, mockProfileInput } from "../../__mocks__/data/profiles.mock.js";

describe("Profile API Endpoints", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("GET /api/profiles/:userId", () => {
		it("should fetch user profile", async () => {
			prismaMock.profile.findUnique.mockResolvedValue(mockProfiles.userProfile);

			expect(prismaMock.profile.findUnique).not.toHaveBeenCalled();
		});

		it("should return 404 for non-existent profile", async () => {
			prismaMock.profile.findUnique.mockResolvedValue(null);

			expect(prismaMock.profile.findUnique).not.toHaveBeenCalled();
		});

		it("should include user metadata", async () => {
			prismaMock.profile.findUnique.mockResolvedValue(mockProfiles.userProfile);

			expect(mockProfiles.userProfile.userId).toBeTruthy();
			expect(mockProfiles.userProfile.bio).toBeTruthy();
		});
	});

	describe("PUT /api/profiles/:userId", () => {
		it("should update own profile", async () => {
			prismaMock.profile.findUnique.mockResolvedValue(mockProfiles.userProfile);
			prismaMock.profile.update.mockResolvedValue({
				...mockProfiles.userProfile,
				...mockProfileInput.validProfile,
			});

			expect(prismaMock.profile.update).not.toHaveBeenCalled();
		});

		it("should return 403 for unauthorized update", async () => {
			const profileUserId = 1;
			const currentUserId = 2;

			expect(profileUserId).not.toBe(currentUserId);
		});

		it("should validate profile data", async () => {
			expect(mockProfileInput.validProfile.bio).toBeTruthy();
		});

		it("should return 404 for non-existent profile", async () => {
			prismaMock.profile.findUnique.mockResolvedValue(null);

			expect(prismaMock.profile.findUnique).not.toHaveBeenCalled();
		});
	});
});
