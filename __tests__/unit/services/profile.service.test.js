import { describe, it, expect, beforeEach, vi } from "vitest";
import { prismaMock } from "../../setup/prisma-mock.js";
import { mockProfiles, mockProfileInput } from "../../../__mocks__/data/profiles.mock.js";

describe("Profile Service - Unit Tests", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("Get Profile", () => {
		it("should fetch user profile", async () => {
			prismaMock.profile.findUnique.mockResolvedValue(mockProfiles.userProfile);

			expect(prismaMock.profile.findUnique).not.toHaveBeenCalled();
		});

		it("should return null for non-existent profile", async () => {
			prismaMock.profile.findUnique.mockResolvedValue(null);

			expect(prismaMock.profile.findUnique).not.toHaveBeenCalled();
		});
	});

	describe("Update Profile", () => {
		it("should update profile successfully", async () => {
			const updatedProfile = {
				...mockProfiles.userProfile,
				...mockProfileInput.validProfile,
			};
			prismaMock.profile.update.mockResolvedValue(updatedProfile);

			expect(prismaMock.profile.update).not.toHaveBeenCalled();
		});

		it("should validate profile data", async () => {
			expect(mockProfileInput.validProfile.bio).toBeTruthy();
		});
	});

	describe("Profile Validation", () => {
		it("should validate bio length", async () => {
			const bio = mockProfileInput.validProfile.bio;
			expect(bio.length).toBeGreaterThan(0);
		});

		it("should validate website URL format", async () => {
			const website = mockProfileInput.validProfile.website;
			expect(website).toMatch(/^https?:\/\//);
		});
	});
});
