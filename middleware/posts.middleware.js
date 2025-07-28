// middleware/posts.middleware.js
import { isAuthenticated, optionalAuth } from "./posts/isAuthenticated.js";

export const requireAuth = [isAuthenticated];
export const optionalAuth = [optionalAuth];
