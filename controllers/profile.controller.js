// controllers/profile.controller.js
import { getProfile, updateProfile } from "../services/profile.service.js";

export const getProfileController = async (req, res) => {
	try {
		const userId = req.user.userId;
		const profile = await getProfile(userId);

		return res.status(200).json({
			status: "success",
			message: "Profile fetched successfully",
			data: { profile },
		});
	} catch (err) {
		console.error("Get Profile Controller Error:", err);

		if (err.message === "User not found") {
			return res.status(404).json({
				status: "error",
				message: "User not found",
			});
		}

		return res.status(500).json({
			status: "error",
			message: "Failed to fetch profile",
		});
	}
};

export const updateProfileController = async (req, res) => {
	try {
		const userId = req.user.userId;
		const { name, bio } = req.body;

		const updateData = {};

		// FIXED: Apply proper validation and trimming before setting updateData
		if (name !== undefined) {
			// Enhanced validation for name with proper trimming
			const trimmedName = name ? name.trim() : "";
			if (!trimmedName || trimmedName.length < 2) {
				return res.status(400).json({
					status: "error",
					message: "Name must be at least 2 characters long",
				});
			}
			updateData.name = trimmedName; // Use the trimmed value
		}

		if (bio !== undefined) {
			updateData.bio = bio;
		}

		if (Object.keys(updateData).length === 0) {
			return res.status(400).json({
				status: "error",
				message: "No update data provided",
			});
		}

		const profile = await updateProfile(userId, updateData);

		return res.status(200).json({
			status: "success",
			message: "Profile updated successfully",
			data: { profile },
		});
	} catch (err) {
		console.error("Update Profile Controller Error:", err);

		if (err.message === "User not found") {
			return res.status(404).json({
				status: "error",
				message: "User not found",
			});
		}

		return res.status(500).json({
			status: "error",
			message: "Failed to update profile",
		});
	}
};
