// __tests__/setup/test-setup.js
import { vi } from "vitest";

vi.doMock("@prisma/client", () => {
	const prismaMock = {
		user: {
			create: vi.fn(),
			findUnique: vi.fn(),
			findMany: vi.fn(),
			findFirst: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
			count: vi.fn(),
		},
		post: {
			create: vi.fn(),
			findUnique: vi.fn(),
			findMany: vi.fn(),
			findFirst: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
			count: vi.fn(),
		},
		comment: {
			create: vi.fn(),
			findUnique: vi.fn(),
			findMany: vi.fn(),
			findFirst: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
			count: vi.fn(),
		},
		like: {
			create: vi.fn(),
			findUnique: vi.fn(),
			findMany: vi.fn(),
			findFirst: vi.fn(),
			delete: vi.fn(),
			count: vi.fn(),
		},
		tag: {
			create: vi.fn(),
			findUnique: vi.fn(),
			findMany: vi.fn(),
			findFirst: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
			count: vi.fn(),
		},
		profile: {
			create: vi.fn(),
			findUnique: vi.fn(),
			findMany: vi.fn(),
			findFirst: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
			count: vi.fn(),
		},
		refreshToken: {
			create: vi.fn(),
			findUnique: vi.fn(),
			findMany: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(),
		},
		$disconnect: vi.fn(),
		$transaction: vi.fn((callback) => callback(prismaMock)),
	};

	return {
		PrismaClient: vi.fn(() => prismaMock),
	};
});

process.env.NODE_ENV = "test";
process.env.JWT_SECRET_KEY = "test-secret-key-minimum-32-characters-here";
process.env.ACCESS_TOKEN_EXPIRY = "15m";
process.env.REFRESH_TOKEN_EXPIRY = "7d";
process.env.COOKIE_EXPIRE = "604800000";
process.env.DATABASE_URL = "mysql://root:123sumit@localhost:3306/test_db";
process.env.PORT = "3002";
process.env.ALLOWED_ORIGINS = "http://localhost:5173";
process.env.RATE_LIMIT_WINDOW_MS = "900000";
process.env.RATE_LIMIT_MAX_REQUESTS = "100";

global.console = {
	...console,
	log: vi.fn(),
	debug: vi.fn(),
	info: vi.fn(),
	warn: vi.fn(),
	error: vi.fn(),
};
