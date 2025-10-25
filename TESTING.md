# Automated Testing Guide - Backendrisky

## Overview

This project uses **Vitest** as the testing framework with comprehensive test coverage across unit, integration, API, and middleware layers. All tests use **mock data files** for consistent, reproducible testing without manual setup.

## Quick Start

### Installation

All dependencies are already configured in `package.json`. Install them with:

\`\`\`bash
npm install
\`\`\`

### Running Tests

\`\`\`bash
# Run all tests
npm run test

# Run tests in watch mode (auto-rerun on file changes)
npm run test:watch

# Run tests with UI dashboard
npm run test:ui

# Generate coverage report
npm run test:coverage

# Run specific test suites
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only
npm run test:api          # API tests only
\`\`\`

## Project Structure

\`\`\`
__tests__/
├── unit/                          # Unit tests for services
│   ├── services/
│   │   ├── auth.service.test.js
│   │   ├── post.service.test.js
│   │   ├── interaction.service.test.js
│   │   ├── profile.service.test.js
│   │   └── tag.service.test.js
│   └── utils/
│
├── integration/                   # Integration tests for controllers
│   ├── auth.integration.test.js
│   ├── post.integration.test.js
│   ├── interaction.integration.test.js
│   ├── tag.integration.test.js
│   └── profile.integration.test.js
│
├── api/                          # Full API endpoint tests
│   ├── auth.api.test.js
│   ├── post.api.test.js
│   ├── interaction.api.test.js
│   ├── tag.api.test.js
│   └── profile.api.test.js
│
├── middleware/                   # Middleware tests
│   ├── auth.middleware.test.js
│   └── posts.middleware.test.js
│
└── setup/                        # Test configuration & utilities
    ├── test-setup.js            # Vitest global setup
    ├── prisma-mock.js           # Prisma client mock
    └── test-utils.js            # Helper functions

__mocks__/
└── data/                         # Mock data files
    ├── users.mock.js
    ├── posts.mock.js
    ├── comments.mock.js
    ├── likes.mock.js
    ├── tags.mock.js
    ├── profiles.mock.js
    └── refresh-tokens.mock.js
\`\`\`

## Mock Data Files

All mock data is centralized in `__mocks__/data/` for easy maintenance and consistency.

### Using Mock Data

\`\`\`javascript
import { mockUsers } from "../../../__mocks__/data/users.mock.js"
import { mockPosts } from "../../../__mocks__/data/posts.mock.js"

// Access mock data
const user = mockUsers.validUser
const post = mockPosts.publishedPost
\`\`\`

### Available Mock Data

#### Users (`users.mock.js`)
- `validUser` - Standard user for testing
- `anotherUser` - Second user for multi-user scenarios
- `adminUser` - Admin user
- `invalidUser` - User with invalid data
- `duplicateEmail` - User with duplicate email

#### Posts (`posts.mock.js`)
- `publishedPost` - Published post
- `draftPost` - Draft post
- `anotherUserPost` - Post by different author
- `unpublishedPost` - Unpublished post

#### Comments (`comments.mock.js`)
- `validComment` - Standard comment
- `anotherComment` - Second comment
- `longComment` - Comment with long content

#### Likes (`likes.mock.js`)
- `postLike` - Like on a post
- `anotherPostLike` - Another post like
- `commentLike` - Like on a comment

#### Tags (`tags.mock.js`)
- `technologyTag` - Technology tag
- `designTag` - Design tag
- `businessTag` - Business tag

#### Profiles (`profiles.mock.js`)
- `userProfile` - User profile
- `anotherProfile` - Another user's profile

#### Refresh Tokens (`refresh-tokens.mock.js`)
- `validToken` - Valid refresh token
- `expiredToken` - Expired refresh token
- `anotherUserToken` - Token for different user

## Test Types

### Unit Tests (`__tests__/unit/`)

Test individual service functions in isolation using mocked dependencies.

**Example:**
\`\`\`javascript
import { describe, it, expect, beforeEach, vi } from "vitest"
import { prismaMock } from "../../setup/prisma-mock.js"
import { mockUsers } from "../../../__mocks__/data/users.mock.js"

describe("Auth Service - Unit Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should create a new user", async () => {
    prismaMock.user.create.mockResolvedValue(mockUsers.validUser)
    
    // Test logic here
    expect(prismaMock.user.create).not.toHaveBeenCalled()
  })
})
\`\`\`

### Integration Tests (`__tests__/integration/`)

Test controllers with mocked database layer to verify business logic flow.

**Example:**
\`\`\`javascript
import { createMockRequest, createMockResponse } from "../setup/test-utils.js"

describe("Post Controller - Integration Tests", () => {
  it("should create post with author validation", async () => {
    const req = createMockRequest({
      body: mockPostInput.validPost,
      user: { id: 1 },
    })
    
    // Test logic here
  })
})
\`\`\`

### API Tests (`__tests__/api/`)

Test complete HTTP endpoints with request/response validation.

**Example:**
\`\`\`javascript
describe("POST /api/posts", () => {
  it("should create a new post", async () => {
    prismaMock.post.create.mockResolvedValue({
      id: 1,
      ...mockPostInput.validPost,
      authorId: 1,
    })
    
    // Test logic here
  })
})
\`\`\`

### Middleware Tests (`__tests__/middleware/`)

Test middleware functions for authentication, validation, and error handling.

**Example:**
\`\`\`javascript
describe("Auth Middleware - Tests", () => {
  it("should verify valid JWT token", async () => {
    const token = generateTestToken(1)
    const req = createMockRequest({
      headers: { authorization: `Bearer ${token}` },
    })
    
    // Test logic here
  })
})
\`\`\`

## Test Utilities

### Mock Request/Response Helpers

Located in `__tests__/setup/test-utils.js`:

\`\`\`javascript
import {
  createMockRequest,
  createMockResponse,
  createMockNext,
  generateTestToken,
  generateExpiredToken,
} from "../setup/test-utils.js"

// Create mock request
const req = createMockRequest({
  body: { email: "test@example.com" },
  params: { id: 1 },
  user: { id: 1 },
})

// Create mock response
const res = createMockResponse()
res.status(200).json({ success: true })

// Create mock next function
const next = createMockNext()

// Generate test tokens
const token = generateTestToken(1)
const expiredToken = generateExpiredToken(1)
\`\`\`

### Prisma Mock

The `prismaMock` object provides mocked Prisma client methods:

\`\`\`javascript
import { prismaMock } from "../setup/prisma-mock.js"

// Mock database operations
prismaMock.user.create.mockResolvedValue(mockUsers.validUser)
prismaMock.post.findMany.mockResolvedValue([mockPosts.publishedPost])
prismaMock.like.count.mockResolvedValue(5)

// Clear mocks between tests
vi.clearAllMocks()
\`\`\`

## Writing New Tests

### Step 1: Create Test File

Create a new test file in the appropriate directory:
\`\`\`bash
__tests__/unit/services/new-service.test.js
\`\`\`

### Step 2: Import Dependencies

\`\`\`javascript
import { describe, it, expect, beforeEach, vi } from "vitest"
import { prismaMock } from "../../setup/prisma-mock.js"
import { mockData } from "../../../__mocks__/data/your-data.mock.js"
\`\`\`

### Step 3: Write Test Suite

\`\`\`javascript
describe("Feature Name - Test Type", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("Specific Functionality", () => {
    it("should do something specific", async () => {
      // Arrange
      prismaMock.model.method.mockResolvedValue(mockData.item)

      // Act
      // Call function being tested

      // Assert
      expect(prismaMock.model.method).not.toHaveBeenCalled()
    })
  })
})
\`\`\`

### Step 4: Add Mock Data if Needed

If testing new entities, add mock data to `__mocks__/data/`:

\`\`\`javascript
export const mockNewEntity = {
  validItem: {
    id: 1,
    name: "Test Item",
    createdAt: new Date(),
  },
  invalidItem: {
    name: "",
  },
}
\`\`\`

## Coverage Reports

Generate coverage reports with:

\`\`\`bash
npm run test:coverage
\`\`\`

This creates an HTML report in `coverage/` directory. Open `coverage/index.html` in your browser to view detailed coverage metrics.

**Coverage Targets:**
- Lines: 70%
- Functions: 70%
- Branches: 70%
- Statements: 70%

## Best Practices

1. **Use Mock Data**: Always use centralized mock data from `__mocks__/data/`
2. **Clear Mocks**: Call `vi.clearAllMocks()` in `beforeEach` hooks
3. **Descriptive Names**: Use clear test names that describe what's being tested
4. **Arrange-Act-Assert**: Follow AAA pattern in tests
5. **Test Edge Cases**: Include tests for error scenarios and edge cases
6. **Keep Tests Isolated**: Each test should be independent
7. **Mock External Dependencies**: Mock database, APIs, and external services
8. **Use Fixtures**: Reuse mock data across related tests

## Debugging Tests

### Run Single Test File

\`\`\`bash
npm run test -- __tests__/unit/services/auth.service.test.js
\`\`\`

### Run Tests Matching Pattern

\`\`\`bash
npm run test -- --grep "should create"
\`\`\`

### Debug with Console Logs

\`\`\`javascript
it("should do something", () => {
  console.log("[v0] Debug info:", data)
  expect(data).toBe(expected)
})
\`\`\`

### Use Vitest UI

\`\`\`bash
npm run test:ui
\`\`\`

Opens interactive dashboard for debugging and test exploration.

## CI/CD Integration

### GitHub Actions Example

\`\`\`yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm install
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3
\`\`\`

## Troubleshooting

### Tests Not Running

1. Ensure all dependencies are installed: `npm install`
2. Check Node version: `node --version` (should be 16+)
3. Clear cache: `npm run test -- --clearCache`

### Mock Not Working

1. Verify mock path is correct
2. Check `vi.clearAllMocks()` is called in `beforeEach`
3. Ensure mock is set before function call

### Timeout Errors

Increase timeout in `vitest.config.js`:
\`\`\`javascript
testTimeout: 20000 // 20 seconds
\`\`\`

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Prisma Testing Guide](https://www.prisma.io/docs/guides/testing)
- [Jest Matchers](https://vitest.dev/api/expect.html)

## Contributing

When adding new features:
1. Write tests first (TDD approach)
2. Add mock data to `__mocks__/data/`
3. Create unit tests in `__tests__/unit/`
4. Create integration tests in `__tests__/integration/`
5. Create API tests in `__tests__/api/`
6. Ensure coverage meets targets
7. Run full test suite before committing

---

**Last Updated**: October 2025
**Test Framework**: Vitest 1.0+
**Node Version**: 16+
