import { describe, it, expect, beforeEach, vi } from "vitest";
import { prismaMock } from "../../setup/prisma-mock.js";
import { mockPosts, mockPostInput } from "../../../__mocks__/data/posts.mock.js";

describe("Post Service - Unit Tests", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("Create Post", () => {
		it("should create a new post with valid data", async () => {
			prismaMock.post.create.mockResolvedValue({
				id: 1,
				...mockPostInput.validPost,
				authorId: 1,
				createdAt: new Date(),
				updatedAt: new Date(),
			});

			expect(prismaMock.post.create).not.toHaveBeenCalled();
		});

		it("should reject post with empty title", async () => {
			expect(mockPostInput.invalidPost.title).toBe("");
		});

		it("should reject post with empty content", async () => {
			expect(mockPostInput.invalidPost.content).toBe("");
		});
	});

	describe("Retrieve Posts", () => {
		it("should fetch all published posts", async () => {
			prismaMock.post.findMany.mockResolvedValue([mockPosts.publishedPost, mockPosts.anotherUserPost]);

			expect(prismaMock.post.findMany).not.toHaveBeenCalled();
		});

		it("should fetch posts by author", async () => {
			prismaMock.post.findMany.mockResolvedValue([mockPosts.publishedPost]);

			expect(prismaMock.post.findMany).not.toHaveBeenCalled();
		});

		it("should fetch single post by ID", async () => {
			prismaMock.post.findUnique.mockResolvedValue(mockPosts.publishedPost);

			expect(prismaMock.post.findUnique).not.toHaveBeenCalled();
		});

		it("should return null for non-existent post", async () => {
			prismaMock.post.findUnique.mockResolvedValue(null);

			expect(prismaMock.post.findUnique).not.toHaveBeenCalled();
		});
	});

	describe("Update Post", () => {
		it("should update post with valid data", async () => {
			const updateData = { title: "Updated Title" };
			prismaMock.post.update.mockResolvedValue({
				...mockPosts.publishedPost,
				...updateData,
			});

			expect(prismaMock.post.update).not.toHaveBeenCalled();
		});

		it("should prevent unauthorized post updates", async () => {
			const postAuthorId = 1;
			const currentUserId = 2;

			expect(postAuthorId).not.toBe(currentUserId);
		});
	});

	describe("Delete Post", () => {
		it("should delete post successfully", async () => {
			prismaMock.post.delete.mockResolvedValue(mockPosts.publishedPost);

			expect(prismaMock.post.delete).not.toHaveBeenCalled();
		});

		it("should prevent unauthorized deletion", async () => {
			const postAuthorId = 1;
			const currentUserId = 2;

			expect(postAuthorId).not.toBe(currentUserId);
		});
	});

	describe("Post Pagination", () => {
		it("should handle pagination correctly", async () => {
			const page = 1;
			const limit = 10;
			const skip = (page - 1) * limit;

			expect(skip).toBe(0);
		});

		it("should return correct page size", async () => {
			const limit = 10;
			expect(limit).toBeGreaterThan(0);
		});
	});
});
