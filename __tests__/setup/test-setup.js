import { vi } from "vitest";
import { prismaMock } from "./prisma-mock.js";

vi.mock("@prisma/client", () => ({
	PrismaClient: vi.fn(() => prismaMock),
}));

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret-key-for-testing-only";
process.env.JWT_EXPIRE = "7d";
process.env.COOKIE_EXPIRE = "7";
process.env.DATABASE_URL = "mysql://root:123sumit@localhost:3306/test_db";
process.env.PORT = "3001";

global.console = {
	...console,
	log: vi.fn(),
	debug: vi.fn(),
	info: vi.fn(),
	warn: vi.fn(),
	error: vi.fn(),
};
