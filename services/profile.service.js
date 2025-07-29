// services/profile.service.js
import { prisma } from "../utils/prisma.js";

export const getProfile = async (userId) => {
	try {
		const user = await prisma.user.findUnique({
			where: { id: userId },
			include: {
				profile: true,
			},
		});

		if (!user) {
			throw new Error("User not found");
		}

		return {
			id: user.id,
			name: user.name,
			email: user.email,
			bio: user.profile?.bio || "",
		};
	} catch (error) {
		console.error("Get profile error:", error);
		throw error;
	}
};

export const updateProfile = async (userId, updateData) => {
	try {
		const user = await prisma.user.findUnique({
			where: { id: userId },
			include: {
				profile: true,
			},
		});

		if (!user) {
			throw new Error("User not found");
		}

		// Prepare user update data with proper validation
		const userUpdateData = {};
		if (updateData.name !== undefined) {
			const trimmedName = updateData.name ? updateData.name.trim() : "";
			if (trimmedName.length > 0) {
				userUpdateData.name = trimmedName;
			}
		}

		// Use transaction to ensure data consistency
		const result = await prisma.$transaction(async (tx) => {
			// Update user basic info if needed
			let updatedUser = user;
			if (Object.keys(userUpdateData).length > 0) {
				updatedUser = await tx.user.update({
					where: { id: userId },
					data: userUpdateData,
					include: {
						profile: true,
					},
				});
			}

			// Update profile bio if provided
			if (updateData.bio !== undefined) {
				const trimmedBio = updateData.bio ? updateData.bio.trim() : "";

				if (user.profile) {
					await tx.profile.update({
						where: { userId },
						data: { bio: trimmedBio },
					});
				} else {
					await tx.profile.create({
						data: {
							userId,
							bio: trimmedBio,
						},
					});
				}
			}

			// Get final updated data
			const finalUser = await tx.user.findUnique({
				where: { id: userId },
				include: {
					profile: true,
				},
			});

			return {
				id: finalUser.id,
				name: finalUser.name,
				email: finalUser.email,
				bio: finalUser.profile?.bio || "",
			};
		});

		return result;
	} catch (error) {
		console.error("Update profile error:", error);
		throw error;
	}
};
