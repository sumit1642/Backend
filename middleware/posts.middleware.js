// middleware/post.middleware.js
import { isAuthenticated } from "./posts/isAuthenticated.js";

export const requireAuth = [isAuthenticated];
