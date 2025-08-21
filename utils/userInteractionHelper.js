// utils/userInteractionHelper.js (Frontend Helper)

// Storage for user interaction tracking
const userInteractionTracker = {
	lastInteractionTimes: new Map(),
	optimisticUpdates: new Map(),
	eventListeners: new Map(),
};

// Configuration constants
const RAPID_INTERACTION_THRESHOLD = 2000; // 2 seconds
const OPTIMISTIC_UPDATE_CLEANUP_DELAY = 10000; // 10 seconds

// Track when user made last interaction
function recordUserInteractionTime(interactionEndpoint) {
	userInteractionTracker.lastInteractionTimes.set(interactionEndpoint, Date.now());
}

// Check if user is making rapid interactions
function isUserMakingRapidInteractions(interactionEndpoint, customThreshold = RAPID_INTERACTION_THRESHOLD) {
	const lastInteractionTime = userInteractionTracker.lastInteractionTimes.get(interactionEndpoint);
	return lastInteractionTime && Date.now() - lastInteractionTime < customThreshold;
}

// Create HTTP headers for interaction requests
function createInteractionRequestHeaders(interactionEndpoint, options = {}) {
	const requestHeaders = {
		"Content-Type": "application/json",
	};

	if (isUserMakingRapidInteractions(interactionEndpoint)) {
		const lastTime = userInteractionTracker.lastInteractionTimes.get(interactionEndpoint);
		requestHeaders["x-last-interaction-time"] = lastTime.toString();
	}

	if (options.forceDebounce) {
		requestHeaders["x-force-debounce"] = "true";
	}

	if (options.rapidComment) {
		requestHeaders["x-rapid-comment"] = "true";
	}

	return requestHeaders;
}

// Handle like/unlike interactions with optimistic updates
async function handleLikeInteraction(postId, baseApiUrl = "/api") {
	const interactionEndpoint = `posts/${postId}/like`;
	const isRapidInteraction = isUserMakingRapidInteractions(interactionEndpoint);

	// Apply optimistic update immediately for better user experience
	applyOptimisticLikeUpdate(postId);

	const requestHeaders = createInteractionRequestHeaders(interactionEndpoint);
	recordUserInteractionTime(interactionEndpoint);

	try {
		const response = await fetch(`${baseApiUrl}/interactions/${interactionEndpoint}`, {
			method: "POST",
			credentials: "include",
			headers: requestHeaders,
		});

		const responseData = await response.json();

		if (responseData.status === "success") {
			// Handle debounced response
			if (responseData.queuedInteractionsCount) {
				console.log(`Like interaction queued. ${responseData.queuedInteractionsCount} interactions pending.`);
				// Keep optimistic update since operation is queued
				return {
					...responseData,
					isOptimisticUpdate: true,
				};
			}

			// Handle immediate response
			return responseData;
		} else {
			// Revert optimistic update on error
			revertOptimisticLikeUpdate(postId);
			return responseData;
		}
	} catch (networkError) {
		console.error("Like interaction failed:", networkError);
		revertOptimisticLikeUpdate(postId);
		throw networkError;
	}
}

// Handle comment creation with debouncing support
async function handleAddCommentInteraction(postId, commentContent, baseApiUrl = "/api") {
	const interactionEndpoint = `posts/${postId}/comments`;
	const isRapidInteraction = isUserMakingRapidInteractions(interactionEndpoint, 1000); // More sensitive for comments

	const requestHeaders = createInteractionRequestHeaders(interactionEndpoint, {
		rapidComment: isRapidInteraction,
	});

	recordUserInteractionTime(interactionEndpoint);

	try {
		const response = await fetch(`${baseApiUrl}/interactions/${interactionEndpoint}`, {
			method: "POST",
			credentials: "include",
			headers: requestHeaders,
			body: JSON.stringify({ content: commentContent }),
		});

		const responseData = await response.json();

		if (responseData.queuedInteractionsCount) {
			console.log(`Comment queued for processing. ${responseData.queuedInteractionsCount} interactions pending.`);
		}

		return responseData;
	} catch (networkError) {
		console.error("Add comment interaction failed:", networkError);
		throw networkError;
	}
}

// Handle comment updates (always debounced)
async function handleUpdateCommentInteraction(commentId, updatedContent, baseApiUrl = "/api") {
	const interactionEndpoint = `comments/${commentId}`;
	recordUserInteractionTime(interactionEndpoint);

	try {
		const response = await fetch(`${baseApiUrl}/interactions/${interactionEndpoint}`, {
			method: "PUT",
			credentials: "include",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ content: updatedContent }),
		});

		const responseData = await response.json();

		if (responseData.queuedInteractionsCount) {
			console.log(`Comment update queued. ${responseData.queuedInteractionsCount} interactions pending.`);
		}

		return responseData;
	} catch (networkError) {
		console.error("Update comment interaction failed:", networkError);
		throw networkError;
	}
}

// Apply optimistic like update for immediate UI feedback
function applyOptimisticLikeUpdate(postId) {
	const currentOptimisticState = userInteractionTracker.optimisticUpdates.get(`like_post_${postId}`) || {
		isLikedByUser: false,
		likesCount: 0,
	};

	const newOptimisticState = {
		isLikedByUser: !currentOptimisticState.isLikedByUser,
		likesCount: currentOptimisticState.likesCount + (currentOptimisticState.isLikedByUser ? -1 : 1),
		updateTimestamp: Date.now(),
	};

	userInteractionTracker.optimisticUpdates.set(`like_post_${postId}`, newOptimisticState);

	// Emit custom event for UI components to listen to
	emitOptimisticUpdateEvent("like", postId, newOptimisticState);
}

// Revert optimistic like update on error
function revertOptimisticLikeUpdate(postId) {
	userInteractionTracker.optimisticUpdates.delete(`like_post_${postId}`);
	emitOptimisticRevertEvent("like", postId);
}

// Emit optimistic update events for UI components
function emitOptimisticUpdateEvent(interactionType, resourceId, updateData) {
	// Use document events instead of window for better compatibility
	if (typeof document !== "undefined") {
		document.dispatchEvent(
			new CustomEvent("userOptimisticUpdate", {
				detail: {
					interactionType: interactionType,
					resourceId: resourceId,
					updateData: updateData,
				},
			}),
		);
	}
}

// Emit revert events
function emitOptimisticRevertEvent(interactionType, resourceId) {
	if (typeof document !== "undefined") {
		document.dispatchEvent(
			new CustomEvent("userOptimisticRevert", {
				detail: {
					interactionType: interactionType,
					resourceId: resourceId,
				},
			}),
		);
	}
}

// Get current optimistic state for UI
function getCurrentOptimisticState(interactionType, resourceId) {
	return userInteractionTracker.optimisticUpdates.get(`${interactionType}_${resourceId}`);
}

// Clean up old optimistic updates to prevent memory leaks
function cleanupOldOptimisticUpdates() {
	const currentTimestamp = Date.now();

	for (const [updateKey, updateData] of userInteractionTracker.optimisticUpdates.entries()) {
		if (currentTimestamp - updateData.updateTimestamp > OPTIMISTIC_UPDATE_CLEANUP_DELAY) {
			userInteractionTracker.optimisticUpdates.delete(updateKey);
		}
	}
}

// Set up periodic cleanup
if (typeof setInterval !== "undefined") {
	setInterval(cleanupOldOptimisticUpdates, OPTIMISTIC_UPDATE_CLEANUP_DELAY);
}

// Event listener helpers for UI frameworks
function addOptimisticUpdateListener(callback) {
	if (typeof document !== "undefined") {
		const handleOptimisticUpdate = (event) => {
			callback(event.detail);
		};

		document.addEventListener("userOptimisticUpdate", handleOptimisticUpdate);

		// Return cleanup function
		return () => {
			document.removeEventListener("userOptimisticUpdate", handleOptimisticUpdate);
		};
	}

	return () => {}; // No-op cleanup function
}

function addOptimisticRevertListener(callback) {
	if (typeof document !== "undefined") {
		const handleOptimisticRevert = (event) => {
			callback(event.detail);
		};

		document.addEventListener("userOptimisticRevert", handleOptimisticRevert);

		return () => {
			document.removeEventListener("userOptimisticRevert", handleOptimisticRevert);
		};
	}

	return () => {};
}

// Export all functions for use in components
export {
	handleLikeInteraction,
	handleAddCommentInteraction,
	handleUpdateCommentInteraction,
	getCurrentOptimisticState,
	addOptimisticUpdateListener,
	addOptimisticRevertListener,
	recordUserInteractionTime,
	isUserMakingRapidInteractions,
};