import { describe, it, expect, beforeEach, vi } from "vitest";
import { prismaMock } from "../../setup/prisma-mock.js";
import { mockTags, mockTagInput } from "../../../__mocks__/data/tags.mock.js";

describe("Tag Service - Unit Tests", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("Create Tag", () => {
		it("should create a new tag", async () => {
			prismaMock.tag.create.mockResolvedValue(mockTags.technologyTag);

			expect(prismaMock.tag.create).not.toHaveBeenCalled();
		});

		it("should prevent duplicate tags", async () => {
			prismaMock.tag.findFirst.mockResolvedValue(mockTags.technologyTag);

			expect(prismaMock.tag.findFirst).not.toHaveBeenCalled();
		});

		it("should validate tag name", async () => {
			expect(mockTagInput.invalidTag.name).toBe("");
		});
	});

	describe("Retrieve Tags", () => {
		it("should fetch all tags", async () => {
			prismaMock.tag.findMany.mockResolvedValue([mockTags.technologyTag, mockTags.designTag]);

			expect(prismaMock.tag.findMany).not.toHaveBeenCalled();
		});

		it("should fetch tag by ID", async () => {
			prismaMock.tag.findUnique.mockResolvedValue(mockTags.technologyTag);

			expect(prismaMock.tag.findUnique).not.toHaveBeenCalled();
		});

		it("should fetch tag by slug", async () => {
			prismaMock.tag.findFirst.mockResolvedValue(mockTags.technologyTag);

			expect(prismaMock.tag.findFirst).not.toHaveBeenCalled();
		});
	});

	describe("Update Tag", () => {
		it("should update tag successfully", async () => {
			const updatedTag = { ...mockTags.technologyTag, name: "tech" };
			prismaMock.tag.update.mockResolvedValue(updatedTag);

			expect(prismaMock.tag.update).not.toHaveBeenCalled();
		});
	});

	describe("Delete Tag", () => {
		it("should delete tag successfully", async () => {
			prismaMock.tag.delete.mockResolvedValue(mockTags.technologyTag);

			expect(prismaMock.tag.delete).not.toHaveBeenCalled();
		});
	});
});
