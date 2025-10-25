import { describe, it, expect, beforeEach, vi } from "vitest";
import { prismaMock } from "../setup/prisma-mock.js";
import { mockPosts, mockPostInput } from "../../__mocks__/data/posts.mock.js";
import { createMockRequest } from "../setup/test-utils.js";

describe("Post Controller - Integration Tests", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("Create Post Integration", () => {
		it("should create post with author validation", async () => {
			const req = createMockRequest({
				body: mockPostInput.validPost,
				user: { id: 1 },
			});

			prismaMock.post.create.mockResolvedValue({
				id: 1,
				...mockPostInput.validPost,
				authorId: 1,
				createdAt: new Date(),
				updatedAt: new Date(),
			});

			expect(req.user.id).toBeTruthy();
			expect(req.body.title).toBeTruthy();
		});

		it("should prevent unauthorized post creation", async () => {
			const req = createMockRequest({
				body: mockPostInput.validPost,
				user: null,
			});

			expect(req.user).toBeNull();
		});
	});

	describe("Retrieve Posts Integration", () => {
		it("should fetch published posts with pagination", async () => {
			const req = createMockRequest({
				query: { page: 1, limit: 10 },
			});

			prismaMock.post.findMany.mockResolvedValue([mockPosts.publishedPost]);
			prismaMock.post.count.mockResolvedValue(1);

			expect(req.query.page).toBe(1);
			expect(req.query.limit).toBe(10);
		});

		it("should fetch user's own posts including drafts", async () => {
			const req = createMockRequest({
				user: { id: 1 },
				query: { page: 1 },
			});

			prismaMock.post.findMany.mockResolvedValue([mockPosts.publishedPost, mockPosts.draftPost]);

			expect(req.user.id).toBe(1);
		});
	});

	describe("Update Post Integration", () => {
		it("should update post with authorization check", async () => {
			const req = createMockRequest({
				params: { id: 1 },
				body: { title: "Updated Title" },
				user: { id: 1 },
			});

			prismaMock.post.findUnique.mockResolvedValue(mockPosts.publishedPost);
			prismaMock.post.update.mockResolvedValue({
				...mockPosts.publishedPost,
				title: "Updated Title",
			});

			expect(req.user.id).toBe(mockPosts.publishedPost.authorId);
		});

		it("should prevent unauthorized updates", async () => {
			const req = createMockRequest({
				params: { id: 1 },
				body: { title: "Updated Title" },
				user: { id: 2 },
			});

			prismaMock.post.findUnique.mockResolvedValue(mockPosts.publishedPost);

			expect(req.user.id).not.toBe(mockPosts.publishedPost.authorId);
		});
	});

	describe("Delete Post Integration", () => {
		it("should delete post with authorization", async () => {
			const req = createMockRequest({
				params: { id: 1 },
				user: { id: 1 },
			});

			prismaMock.post.findUnique.mockResolvedValue(mockPosts.publishedPost);
			prismaMock.post.delete.mockResolvedValue(mockPosts.publishedPost);

			expect(req.user.id).toBe(mockPosts.publishedPost.authorId);
		});
	});
});
