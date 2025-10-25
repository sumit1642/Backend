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
