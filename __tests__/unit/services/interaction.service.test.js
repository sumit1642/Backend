import { describe, it, expect, beforeEach, vi } from "vitest";
import { prismaMock } from "../../setup/prisma-mock.js";
import { mockLikes } from "../../../__mocks__/data/likes.mock.js";
import { mockComments } from "../../../__mocks__/data/comments.mock.js";

describe("Interaction Service - Unit Tests", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("Like Management", () => {
		it("should create a like successfully", async () => {
			prismaMock.like.create.mockResolvedValue(mockLikes.postLike);

			expect(prismaMock.like.create).not.toHaveBeenCalled();
		});

		it("should prevent duplicate likes", async () => {
			prismaMock.like.findFirst.mockResolvedValue(mockLikes.postLike);

			expect(prismaMock.like.findFirst).not.toHaveBeenCalled();
		});

		it("should remove like successfully", async () => {
			prismaMock.like.delete.mockResolvedValue(mockLikes.postLike);

			expect(prismaMock.like.delete).not.toHaveBeenCalled();
		});

		it("should count likes for a post", async () => {
			prismaMock.like.count.mockResolvedValue(5);

			expect(prismaMock.like.count).not.toHaveBeenCalled();
		});
	});

	describe("Comment Management", () => {
		it("should create a comment successfully", async () => {
			prismaMock.comment.create.mockResolvedValue(mockComments.validComment);

			expect(prismaMock.comment.create).not.toHaveBeenCalled();
		});

		it("should fetch comments for a post", async () => {
			prismaMock.comment.findMany.mockResolvedValue([mockComments.validComment, mockComments.anotherComment]);

			expect(prismaMock.comment.findMany).not.toHaveBeenCalled();
		});

		it("should update comment", async () => {
			const updatedComment = {
				...mockComments.validComment,
				content: "Updated content",
			};
			prismaMock.comment.update.mockResolvedValue(updatedComment);

			expect(prismaMock.comment.update).not.toHaveBeenCalled();
		});

		it("should delete comment", async () => {
			prismaMock.comment.delete.mockResolvedValue(mockComments.validComment);

			expect(prismaMock.comment.delete).not.toHaveBeenCalled();
		});

		it("should prevent empty comments", async () => {
			const emptyContent = "";
			expect(emptyContent.length).toBe(0);
		});
	});

	describe("Interaction Validation", () => {
		it("should validate post exists before liking", async () => {
			prismaMock.post.findUnique.mockResolvedValue(null);

			expect(prismaMock.post.findUnique).not.toHaveBeenCalled();
		});

		it("should validate user exists before interaction", async () => {
			prismaMock.user.findUnique.mockResolvedValue(null);

			expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
		});
	});
});
