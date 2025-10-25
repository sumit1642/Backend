import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

if (process.env.NODE_ENV !== "test") {
	// Handle connection errors
	prisma
		.$connect()
		.then(() => {
			console.log("📅 Database connected successfully");
		})
		.catch((error) => {
			console.error("❌ Database connection failed:", error);
			process.exit(1);
		});

	// Graceful shutdown
	const gracefulShutdown = async () => {
		console.log("🔄 Shutting down gracefully...");
		await prisma.$disconnect();
		process.exit(0);
	};

	process.on("SIGINT", gracefulShutdown);
	process.on("SIGTERM", gracefulShutdown);
	process.on("beforeExit", async () => {
		await prisma.$disconnect();
	});
}
