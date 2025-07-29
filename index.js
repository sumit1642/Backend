// index.js
import express from "express";
import cookieParser from "cookie-parser";
import { authRoute } from "./routes/auth.routes.js";
import { postRoute } from "./routes/post.routes.js";
import { interactionRoute } from "./routes/interaction.routes.js";
import { profileRoute } from "./routes/profile.routes.js";
import { getAllPostsController } from "./controllers/post.controller.js";
import { optionalAuth } from "./middleware/posts.middleware.js";

const app = express();

// Security headers
app.use((req, res, next) => {
	res.setHeader("X-Content-Type-Options", "nosniff");
	res.setHeader("X-Frame-Options", "DENY");
	res.setHeader("X-XSS-Protection", "1; mode=block");
	next();
});

// Basic middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// CORS configuration
const corsOptions = {
	origin:
		process.env.NODE_ENV === "production"
			? process.env.ALLOWED_ORIGINS?.split(",") || false
			: "http://localhost:3000",
	credentials: true,
	methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
	allowedHeaders: ["Origin", "X-Requested-With", "Content-Type", "Accept", "Authorization"],
	optionsSuccessStatus: 200,
};

// Apply CORS
app.use((req, res, next) => {
	const origin = req.headers.origin;

	if (process.env.NODE_ENV === "production") {
		const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [];
		if (allowedOrigins.includes(origin)) {
			res.header("Access-Control-Allow-Origin", origin);
		}
	} else {
		res.header("Access-Control-Allow-Origin", corsOptions.origin);
	}

	res.header("Access-Control-Allow-Credentials", "true");
	res.header("Access-Control-Allow-Headers", corsOptions.allowedHeaders.join(", "));
	res.header("Access-Control-Allow-Methods", corsOptions.methods.join(", "));

	if (req.method === "OPTIONS") {
		return res.status(200).end();
	}
	next();
});

// Health check
app.get("/health", (req, res) => {
	res.status(200).json({
		status: "success",
		message: "Server is running",
		timestamp: new Date().toISOString(),
		environment: process.env.NODE_ENV || "development",
	});
});

// API Routes
app.use("/api/auth", authRoute);
app.use("/api/posts", postRoute);
app.use("/api/interactions", interactionRoute);
app.use("/api/profile", profileRoute);

// Home route - show all published posts
app.get("/", optionalAuth, getAllPostsController);

// API Documentation route
app.get("/api", (req, res) => {
	res.status(200).json({
		status: "success",
		message: "Blog API v1.0",
		endpoints: {
			auth: "/api/auth",
			posts: "/api/posts",
			interactions: "/api/interactions",
			profile: "/api/profile",
		},
		docs: "Visit /api/docs for detailed documentation",
	});
});

// 404 handler for API routes
app.use("/api", (req, res) => {
	res.status(404).json({
		status: "error",
		message: "API endpoint not found",
		availableEndpoints: ["/api/auth", "/api/posts", "/api/interactions", "/api/profile"],
	});
});

// General 404 handler
app.use((req, res) => {
	res.status(404).json({
		status: "error",
		message: "Route not found",
	});
});

// Enhanced error handler
app.use((err, req, res, next) => {
	console.error("Unhandled Error:", {
		message: err.message,
		stack: err.stack,
		url: req.url,
		method: req.method,
		timestamp: new Date().toISOString(),
	});

	// Don't expose internal errors in production
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

// Graceful shutdown
const gracefulShutdown = (signal) => {
	console.log(`\n🔄 Received ${signal}, shutting down gracefully...`);
	process.exit(0);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
	console.log(`🚀 Server running on http://localhost:${PORT}`);
	console.log(`📊 Health check: http://localhost:${PORT}/health`);
	console.log(`📖 API info: http://localhost:${PORT}/api`);
	console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
});
