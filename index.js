// index.js
import express from "express";
import cookieParser from "cookie-parser";
import { authRoute } from "./routes/auth.routes.js";
import { postRoute } from "./routes/post.routes.js";
import { getAllPostsController } from "./controllers/post.controller.js";

const app = express();

app.use(express.json());
app.use(cookieParser(process.env.COOKIE_SECRET || "yourSecretHere"));

// Routes
app.use("/api/auth", authRoute);
app.use("/api/posts", postRoute);

// Home route should list all published posts
app.get("/", getAllPostsController);

app.listen(3000, () => {
	console.log("Server running on http://localhost:3000");
});
