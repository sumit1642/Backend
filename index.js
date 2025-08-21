// index.js (FIXED)
import express from "express";
import cookieParser from "cookie-parser";
import { authenticationRoutes } from "./routes/auth.routes.js";
import { postRoute } from "./routes/post.routes.js";
import { interactionRoute } from "./routes/interaction.routes.js";
import { profileRoute } from "./routes/profile.routes.js";
import { tagRoute } from "./routes/tag.routes.js";
import { getAllPostsController } from "./controllers/post.controller.js";
import { optionalAuth } from "./middleware/posts.middleware.js";
import { prisma } from "./utils/prisma.js";
import { processAllRemainingInteractions } from "./middleware/interaction.debounce.middleware.js";
import { debugRoutes } from "./routes/debug.routes.js";

const app = express();

// FIXED: Security headers middleware - protect against common vulnerabilities
app.use((req, res, next) => {
	res.setHeader("X-Content-Type-Options", "nosniff");
	res.setHeader("X-Frame-Options", "DENY");
	res.setHeader("X-XSS-Protection", "1; mode=block");

	// FIXED: Add security headers for better cookie handling
	if (process.env.NODE_ENV === "production") {
		res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
	}

	next();
});

// Basic middleware configuration
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// FIXED: Enhanced CORS configuration for better cookie handling
const corsConfigurationOptions = {
	origin: function (origin, callback) {
		// Allow requests with no origin (mobile apps, curl, etc.)
		if (!origin) return callback(null, true);

		if (process.env.NODE_ENV === "production") {
			const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [];
			if (allowedOrigins.includes(origin)) {
				return callback(null, true);
			} else {
				return callback(new Error("Not allowed by CORS"));
			}
		} else {
			// Development mode - allow localhost variants
			const developmentOrigins = [
				"http://localhost:5173",
				"http://localhost:3000",
				"http://127.0.0.1:5173",
				"http://127.0.0.1:3000",
			];

			if (developmentOrigins.includes(origin)) {
				return callback(null, true);
			} else {
				return callback(new Error("Not allowed by CORS"));
			}
		}
	},
	credentials: true, // CRITICAL: Allow cookies to be sent
	methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
	allowedHeaders: [
		"Origin",
		"X-Requested-With",
		"Content-Type",
		"Accept",
		"Authorization",
		"x-last-interaction-time",
		"x-force-debounce",
		"x-rapid-comment",
	],
	optionsSuccessStatus: 200,
};

// FIXED: Apply CORS middleware with proper cookie support
app.use((req, res, next) => {
	const requestOrigin = req.headers.origin;

	// Handle CORS origin
	if (process.env.NODE_ENV === "production") {
		const allowedOriginsList = process.env.ALLOWED_ORIGINS?.split(",") || [];
		if (allowedOriginsList.includes(requestOrigin)) {
			res.header("Access-Control-Allow-Origin", requestOrigin);
		}
	} else {
		// Development mode - be more permissive with localhost
		const developmentOrigins = [
			"http://localhost:5173",
			"http://localhost:3000",
			"http://127.0.0.1:5173",
			"http://127.0.0.1:3000",
		];

		if (developmentOrigins.includes(requestOrigin)) {
			res.header("Access-Control-Allow-Origin", requestOrigin);
		}
	}

	// CRITICAL: Enable credentials for cookie handling
	res.header("Access-Control-Allow-Credentials", "true");
	res.header("Access-Control-Allow-Headers", corsConfigurationOptions.allowedHeaders.join(", "));
	res.header("Access-Control-Allow-Methods", corsConfigurationOptions.methods.join(", "));

	// Handle preflight OPTIONS requests
	if (req.method === "OPTIONS") {
		return res.status(200).end();
	}
	next();
});

// Debug routes (only in development)
if (process.env.NODE_ENV !== "production") {
	app.use("/debug", debugRoutes);
}

// Health check endpoint - verify server status
app.get("/health", (req, res) => {
	res.status(200).json({
		status: "success",
		message: "Server is running",
		timestamp: new Date().toISOString(),
		environment: process.env.NODE_ENV || "development",
	});
});

// API Routes configuration
app.use("/api/auth", authenticationRoutes);
app.use("/api/posts", postRoute);
app.use("/api/interactions", interactionRoute);
app.use("/api/profile", profileRoute);
app.use("/api/tags", tagRoute);

// Home route - display all published posts with optional authentication
app.get("/", optionalAuth, getAllPostsController);

// API Documentation endpoint
if (process.env.NODE_ENV !== "production") {
	app.get("/api", (req, res) => {
		res.status(200).json({
			status: "success",
			message: "Blog API v1.0",
			endpoints: {
				auth: "/api/auth",
				posts: "/api/posts",
				interactions: "/api/interactions",
				profile: "/api/profile",
				tags: "/api/tags",
			},
			docs: "Visit /api/docs for detailed documentation",
		});
	});

	// 404 handler specifically for API routes
	app.use("/api", (req, res) => {
		res.status(404).json({
			status: "error",
			message: "API endpoint not found",
			availableEndpoints: ["/api/auth", "/api/posts", "/api/interactions", "/api/profile", "/api/tags"],
		});
	});
}

// General 404 handler for all other routes
app.use((req, res) => {
	res.status(404).json({
		status: "error",
		message: "Route not found",
	});
});

// Enhanced error handling middleware
app.use((err, req, res, next) => {
	console.error("Unhandled application error:", {
		message: err.message,
		stack: err.stack,
		url: req.url,
		method: req.method,
		timestamp: new Date().toISOString(),
	});

	// Don't expose internal errors in production environment
	if (process.env.NODE_ENV === "production") {
		res.status(err.status || 500).json({
			status: "error",
			message: "Internal server error",
		});
	} else {
		res.status(err.status || 500).json({
			status: "error",
			message: err.message,
			stack: err.stack,
		});
	}
});

// UPDATED: Enhanced graceful shutdown with interaction processing
const handleGracefulShutdown = async (signalName) => {
	console.log(`\n🔄 Received ${signalName}, shutting down gracefully...`);
	try {
		// Process any remaining queued interactions before shutdown
		await processAllRemainingInteractions();
		console.log("✅ Processed all remaining user interactions");

		// Close database connection properly before exiting
		await prisma.$disconnect();
		console.log("📅 Database connection closed successfully");
		process.exit(0);
	} catch (shutdownError) {
		console.error("❌ Error during graceful shutdown:", shutdownError);
		process.exit(1);
	}
};

process.on("SIGTERM", () => handleGracefulShutdown("SIGTERM"));
process.on("SIGINT", () => handleGracefulShutdown("SIGINT"));

// FIXED: Test database connection on startup
const testDatabaseConnection = async () => {
	try {
		await prisma.$queryRaw`SELECT 1`;
		console.log("📅 Database connected successfully");
	} catch (error) {
		console.error("❌ Database connection failed:", error);
		process.exit(1);
	}
};

// Start server
const SERVER_PORT = process.env.PORT || 3000;

app.listen(SERVER_PORT, async () => {
	console.log(`🚀 Server running on http://localhost:${SERVER_PORT}`);
	console.log(`📊 Health check: http://localhost:${SERVER_PORT}/health`);
	console.log(`📖 API info: http://localhost:${SERVER_PORT}/api`);
	console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);

	// Test database connection
	await testDatabaseConnection();
});
