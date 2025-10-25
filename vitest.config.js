// vitest.config.js
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
	test: {
		globals: true,
		environment: "node",
		setupFiles: ["./__tests__/setup/test-setup.js"],
		coverage: {
			provider: "v8",
			reporter: ["text", "json", "html", "lcov"],
			exclude: ["node_modules/", "__tests__/", "**/*.test.js", "**/*.spec.js"],
			lines: 70,
			functions: 70,
			branches: 70,
			statements: 70,
		},
		testTimeout: 10000,
		hookTimeout: 10000,
	},
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./"),
		},
	},
});
