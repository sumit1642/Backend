// middleware/interaction.debounce.middleware.js
import { prisma } from "../utils/prisma.js";
import rateLimit from "express-rate-limit";

// In-memory storage for pending user interactions
const pendingUserInteractions = new Map();
const userInteractionTimers = new Map();

// Configuration constants
const INTERACTION_DEBOUNCE_DELAY = 3000; // 3 seconds
const MAX_PENDING_INTERACTIONS_PER_USER = 50;
const CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes

// Rate limiting configurations
export const likeInteractionRateLimit = rateLimit({
	windowMs: 1 * 60 * 1000, // 1 minute
	max: 30, // 30 likes per minute per IP
	message: {
		status: "error",
		message: "Too many like interactions. Please slow down.",
	},
	standardHeaders: true,
	legacyHeaders: false,
});

export const commentInteractionRateLimit = rateLimit({
	windowMs: 1 * 60 * 1000, // 1 minute
	max: 10, // 10 comments per minute per IP
	message: {
		status: "error",
		message: "Too many comment interactions. Please slow down.",
	},
	standardHeaders: true,
	legacyHeaders: false,
});

// Create interaction queue for user-post combination
function createUserInteractionQueue(userId, resourceId) {
	return {
		userId: userId,
		resourceId: resourceId,
		pendingInteractions: [],
		lastActivityTimestamp: Date.now(),

		addInteraction: function (interactionData) {
			// Remove conflicting interactions
			this.pendingInteractions = this.pendingInteractions.filter(
				(existingInteraction) => !isInteractionConflicting(existingInteraction, interactionData),
			);

			this.pendingInteractions.push(interactionData);
			this.lastActivityTimestamp = Date.now();

			// Prevent memory overflow
			if (this.pendingInteractions.length > MAX_PENDING_INTERACTIONS_PER_USER) {
				this.pendingInteractions = this.pendingInteractions.slice(-MAX_PENDING_INTERACTIONS_PER_USER);
			}
		},

		hasInteractions: function () {
			return this.pendingInteractions.length > 0;
		},

		getAllInteractions: function () {
			return [...this.pendingInteractions];
		},

		clearInteractions: function () {
			this.pendingInteractions = [];
		},
	};
}

// Check if two interactions conflict with each other
function isInteractionConflicting(existingInteraction, newInteraction) {
	// Same operation type on same resource = conflicting
	if (
		existingInteraction.interactionType === newInteraction.interactionType &&
		existingInteraction.targetResourceId === newInteraction.targetResourceId
	) {
		return true;
	}

	// Like/unlike on same post = conflicting
	if (
		(existingInteraction.interactionType === "TOGGLE_LIKE" ||
			existingInteraction.interactionType === "TOGGLE_UNLIKE") &&
		(newInteraction.interactionType === "TOGGLE_LIKE" || newInteraction.interactionType === "TOGGLE_UNLIKE") &&
		existingInteraction.targetResourceId === newInteraction.targetResourceId
	) {
		return true;
	}

	return false;
}

// Create debounced interaction middleware
export function createInteractionDebounceMiddleware(interactionType) {
	return async (req, res, next) => {
		const authenticatedUserId = req.user.userId;
		const targetPostId = req.params.postId;
		const targetCommentId = req.params.commentId;
		const targetResourceId = targetPostId || targetCommentId;

		// Create unique identifier for user-resource combination
		const userResourceKey = `user_${authenticatedUserId}_resource_${targetResourceId}`;

		try {
			// Get or create interaction queue for this user-resource combination
			let userInteractionQueue = pendingUserInteractions.get(userResourceKey);
			if (!userInteractionQueue) {
				userInteractionQueue = createUserInteractionQueue(authenticatedUserId, targetResourceId);
				pendingUserInteractions.set(userResourceKey, userInteractionQueue);
			}

			// Create interaction data object
			const interactionData = {
				interactionType: interactionType,
				targetResourceId: targetResourceId,
				requestData: { ...req.body },
				requestParams: { ...req.params },
				processingTimestamp: Date.now(),
				originalRequestInfo: {
					httpMethod: req.method,
					requestUrl: req.url,
					requestBody: req.body,
					requestParams: req.params,
				},
			};

			// Add interaction to queue
			userInteractionQueue.addInteraction(interactionData);

			// Clear existing processing timer for this user-resource combination
			const existingProcessingTimer = userInteractionTimers.get(userResourceKey);
			if (existingProcessingTimer) {
				clearTimeout(existingProcessingTimer);
			}

			// Set new processing timer
			const newProcessingTimer = setTimeout(async () => {
				await processQueuedUserInteractions(userResourceKey);
			}, INTERACTION_DEBOUNCE_DELAY);

			userInteractionTimers.set(userResourceKey, newProcessingTimer);

			// Send immediate response with optimistic data
			const optimisticResponseData = await generateOptimisticResponse(interactionData, authenticatedUserId);

			res.status(200).json({
				status: "success",
				message: "Interaction queued for processing",
				queuedInteractionsCount: userInteractionQueue.pendingInteractions.length,
				willProcessInMilliseconds: INTERACTION_DEBOUNCE_DELAY,
				optimisticData: optimisticResponseData,
			});
		} catch (middlewareError) {
			console.error("Interaction debounce middleware error:", middlewareError);
			// Fallback to immediate processing
			next();
		}
	};
}

// Process all queued interactions for specific user-resource combination
async function processQueuedUserInteractions(userResourceKey) {
	try {
		const userInteractionQueue = pendingUserInteractions.get(userResourceKey);
		if (!userInteractionQueue || !userInteractionQueue.hasInteractions()) {
			return;
		}

		const queuedInteractions = userInteractionQueue.getAllInteractions();
		console.log(`Processing ${queuedInteractions.length} queued interactions for ${userResourceKey}`);

		// Process all interactions within database transaction
		await prisma.$transaction(async (databaseTransaction) => {
			for (const singleInteraction of queuedInteractions) {
				await executeSingleInteraction(singleInteraction, databaseTransaction);
			}
		});

		// Clean up processed interactions
		userInteractionQueue.clearInteractions();
		pendingUserInteractions.delete(userResourceKey);
		userInteractionTimers.delete(userResourceKey);

		console.log(`Successfully processed ${queuedInteractions.length} interactions for ${userResourceKey}`);
	} catch (processingError) {
		console.error(`Error processing queued interactions for ${userResourceKey}:`, processingError);
		// Could implement retry logic here if needed
	}
}

// Execute single interaction within transaction
async function executeSingleInteraction(interactionData, databaseTransaction) {
	const { interactionType, targetResourceId, requestData, requestParams } = interactionData;

	try {
		switch (interactionType) {
			case "TOGGLE_LIKE":
				await executeToggleLikeInteraction(requestParams.postId, requestData.userId, databaseTransaction);
				break;

			case "ADD_COMMENT":
				await executeAddCommentInteraction(
					requestParams.postId,
					requestData.userId,
					requestData.content,
					databaseTransaction,
				);
				break;

			case "UPDATE_COMMENT":
				await executeUpdateCommentInteraction(
					requestParams.commentId,
					requestData.userId,
					requestData.content,
					databaseTransaction,
				);
				break;

			case "DELETE_COMMENT":
				await executeDeleteCommentInteraction(requestParams.commentId, requestData.userId, databaseTransaction);
				break;

			default:
				console.warn(`Unknown interaction type: ${interactionType}`);
		}
	} catch (executionError) {
		console.error(`Error executing ${interactionType} interaction:`, executionError);
		throw executionError;
	}
}

// Database interaction executors
async function executeToggleLikeInteraction(postId, userId, databaseTransaction) {
	const existingLikeRecord = await databaseTransaction.like.findUnique({
		where: { userId_postId: { userId, postId: parseInt(postId) } },
	});

	if (existingLikeRecord) {
		await databaseTransaction.like.delete({
			where: { userId_postId: { userId, postId: parseInt(postId) } },
		});
	} else {
		await databaseTransaction.like.create({
			data: { userId, postId: parseInt(postId) },
		});
	}
}

async function executeAddCommentInteraction(postId, userId, commentContent, databaseTransaction) {
	await databaseTransaction.comment.create({
		data: {
			content: commentContent,
			postId: parseInt(postId),
			authorId: userId,
		},
	});
}

async function executeUpdateCommentInteraction(commentId, userId, updatedContent, databaseTransaction) {
	await databaseTransaction.comment.updateMany({
		where: {
			id: parseInt(commentId),
			authorId: userId,
		},
		data: { content: updatedContent },
	});
}

async function executeDeleteCommentInteraction(commentId, userId, databaseTransaction) {
	await databaseTransaction.comment.deleteMany({
		where: {
			id: parseInt(commentId),
			authorId: userId,
		},
	});
}

// Generate optimistic response for immediate user feedback
async function generateOptimisticResponse(interactionData, userId) {
	const { interactionType, targetResourceId } = interactionData;

	try {
		switch (interactionType) {
			case "TOGGLE_LIKE":
				const currentLikeRecord = await prisma.like.findUnique({
					where: { userId_postId: { userId, postId: parseInt(targetResourceId) } },
				});
				return {
					isLikedByUser: !currentLikeRecord,
					isOptimisticResponse: true,
				};

			case "ADD_COMMENT":
				return {
					message: "Comment will be added shortly",
					isOptimisticResponse: true,
				};

			case "UPDATE_COMMENT":
				return {
					message: "Comment will be updated shortly",
					isOptimisticResponse: true,
				};

			default:
				return { isOptimisticResponse: true };
		}
	} catch (optimisticError) {
		return { isOptimisticResponse: true };
	}
}

// Cleanup old pending interactions (prevent memory leaks)
function cleanupExpiredInteractions() {
	const currentTimestamp = Date.now();
	const expirationThreshold = 5 * 60 * 1000; // 5 minutes

	for (const [userResourceKey, interactionQueue] of pendingUserInteractions.entries()) {
		if (currentTimestamp - interactionQueue.lastActivityTimestamp > expirationThreshold) {
			pendingUserInteractions.delete(userResourceKey);

			const processingTimer = userInteractionTimers.get(userResourceKey);
			if (processingTimer) {
				clearTimeout(processingTimer);
				userInteractionTimers.delete(userResourceKey);
			}
		}
	}
}

// Run cleanup periodically
setInterval(cleanupExpiredInteractions, CLEANUP_INTERVAL);

// Process remaining interactions before server shutdown
export async function processAllRemainingInteractions() {
	console.log("Processing all remaining interactions before server shutdown...");

	const processingPromises = Array.from(pendingUserInteractions.keys()).map((userResourceKey) =>
		processQueuedUserInteractions(userResourceKey),
	);

	await Promise.allSettled(processingPromises);
	console.log("Finished processing all remaining interactions");
}
