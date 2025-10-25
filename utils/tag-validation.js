/**
 * Validates and normalizes a tag name
 * @param {string} tagName - The tag name to validate
 * @returns {string|null} - Normalized tag name or null if invalid
 */
export const validateTagName = (tagName) => {
	if (!tagName || typeof tagName !== "string") {
		return null;
	}

	const normalized = tagName.trim().toLowerCase().replace(/\s+/g, "-");

	// Check length constraints
	if (normalized.length < 2 || normalized.length > 20) {
		return null;
	}

	// Check for valid characters (alphanumeric and hyphens only)
	if (!/^[a-z0-9-]+$/.test(normalized)) {
		return null;
	}

	return normalized;
};

/**
 * Decodes a URL-encoded tag name and validates it
 * @param {string} encodedTagName - The URL-encoded tag name
 * @returns {string|null} - Validated tag name or null if invalid
 */
export const decodeAndValidateTagName = (encodedTagName) => {
	try {
		const decodedName = decodeURIComponent(encodedTagName);
		return validateTagName(decodedName);
	} catch (error) {
		console.error("Tag name decoding error:", error);
		return null;
	}
};

/**
 * Encodes a tag name for use in URLs
 * @param {string} tagName - The tag name to encode
 * @returns {string} - URL-encoded tag name
 */
export const encodeTagName = (tagName) => {
	return encodeURIComponent(tagName);
};

/**
 * @param {string} tagsString - Comma-separated tag names (URL-encoded)
 * @returns {string[]|null} - Array of validated tag names or null if invalid
 */
export const parseAndValidateMultipleTags = (tagsString) => {
	if (!tagsString || typeof tagsString !== "string") {
		return null;
	}

	try {
		// Split by comma and decode each tag
		const tagNames = tagsString
			.split(",")
			.map((tag) => {
				const decoded = decodeURIComponent(tag.trim());
				return validateTagName(decoded);
			})
			.filter((tag) => tag !== null);

		// Return null if no valid tags or if any tag failed validation
		if (tagNames.length === 0 || tagNames.length !== tagsString.split(",").length) {
			return null;
		}

		// Remove duplicates while preserving order
		return [...new Set(tagNames)];
	} catch (error) {
		console.error("Multiple tags parsing error:", error);
		return null;
	}
};

/**
 * @param {string[]} tagNames - Array of tag names
 * @returns {string} - Comma-separated URL-encoded tag names
 */
export const encodeMultipleTags = (tagNames) => {
	if (!Array.isArray(tagNames) || tagNames.length === 0) {
		return "";
	}

	return tagNames.map((tag) => encodeURIComponent(tag)).join(",");
};
