# Testing Quick Reference

## Common Commands

\`\`\`bash
npm run test              # Run all tests
npm run test:watch       # Watch mode
npm run test:ui          # Visual dashboard
npm run test:coverage    # Coverage report
npm run test:unit        # Unit tests only
npm run test:integration # Integration tests only
npm run test:api         # API tests only
\`\`\`

## Mock Data Quick Access

\`\`\`javascript
// Users
import { mockUsers, mockUserCredentials } from "__mocks__/data/users.mock.js"
mockUsers.validUser
mockUsers.anotherUser
mockUserCredentials.validCredentials

// Posts
import { mockPosts, mockPostInput } from "__mocks__/data/posts.mock.js"
mockPosts.publishedPost
mockPostInput.validPost

// Comments
import { mockComments, mockCommentInput } from "__mocks__/data/comments.mock.js"
mockComments.validComment

// Likes
import { mockLikes, mockLikeInput } from "__mocks__/data/likes.mock.js"
mockLikes.postLike

// Tags
import { mockTags, mockTagInput } from "__mocks__/data/tags.mock.js"
mockTags.technologyTag

// Profiles
import { mockProfiles, mockProfileInput } from "__mocks__/data/profiles.mock.js"
mockProfiles.userProfile

// Refresh Tokens
import { mockRefreshTokens } from "__mocks__/data/refresh-tokens.mock.js"
mockRefreshTokens.validToken
\`\`\`

## Test Utilities Quick Access

\`\`\`javascript
import {
  createMockRequest,
  createMockResponse,
  createMockNext,
  generateTestToken,
  generateExpiredToken,
} from "__tests__/setup/test-utils.js"

// Create mock request
const req = createMockRequest({
  body: { email: "test@example.com" },
  params: { id: 1 },
  query: { page: 1 },
  user: { id: 1 },
  headers: { authorization: "Bearer token" },
  cookies: { token: "value" },
})

// Create mock response
const res = createMockResponse()
res.status(200).json({ data: "value" })

// Create mock next
const next = createMockNext()

// Generate tokens
const token = generateTestToken(1)
const expiredToken = generateExpiredToken(1)
\`\`\`

## Prisma Mock Quick Access

\`\`\`javascript
import { prismaMock } from "__tests__/setup/prisma-mock.js"

// Mock any Prisma operation
prismaMock.user.create.mockResolvedValue(mockUsers.validUser)
prismaMock.user.findUnique.mockResolvedValue(mockUsers.validUser)
prismaMock.user.findMany.mockResolvedValue([mockUsers.validUser])
prismaMock.user.update.mockResolvedValue(mockUsers.validUser)
prismaMock.user.delete.mockResolvedValue(mockUsers.validUser)
prismaMock.user.count.mockResolvedValue(1)

// Clear all mocks
vi.clearAllMocks()

// Clear specific mock
prismaMock.user.create.mockClear()
\`\`\`

## Test Template

\`\`\`javascript
import { describe, it, expect, beforeEach, vi } from "vitest"
import { prismaMock } from "../../setup/prisma-mock.js"
import { mockData } from "../../../__mocks__/data/your-data.mock.js"
import { createMockRequest, createMockResponse } from "../../setup/test-utils.js"

describe("Feature Name - Test Type", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("Specific Functionality", () => {
    it("should do something specific", async () => {
      // Arrange
      const req = createMockRequest({ body: mockData.validItem })
      const res = createMockResponse()
      prismaMock.model.method.mockResolvedValue(mockData.validItem)

      // Act
      // Call function being tested

      // Assert
      expect(prismaMock.model.method).not.toHaveBeenCalled()
      expect(res.statusCode).toBe(200)
    })

    it("should handle error case", async () => {
      // Arrange
      prismaMock.model.method.mockRejectedValue(new Error("Database error"))

      // Act & Assert
      expect(prismaMock.model.method).not.toHaveBeenCalled()
    })
  })
})
\`\`\`

## Common Assertions

\`\`\`javascript
// Equality
expect(value).toBe(expected)
expect(value).toEqual(expected)
expect(value).not.toBe(expected)

// Truthiness
expect(value).toBeTruthy()
expect(value).toBeFalsy()
expect(value).toBeNull()
expect(value).toBeUndefined()

// Numbers
expect(value).toBeGreaterThan(5)
expect(value).toBeLessThan(10)
expect(value).toBeGreaterThanOrEqual(5)

// Strings
expect(value).toMatch(/pattern/)
expect(value).toContain("substring")

// Arrays
expect(array).toContain(item)
expect(array).toHaveLength(3)

// Objects
expect(obj).toHaveProperty("key")
expect(obj).toEqual({ key: "value" })

// Functions
expect(fn).toHaveBeenCalled()
expect(fn).toHaveBeenCalledWith(arg1, arg2)
expect(fn).toHaveBeenCalledTimes(1)
expect(fn).not.toHaveBeenCalled()

// Promises
expect(promise).resolves.toBe(value)
expect(promise).rejects.toThrow()
\`\`\`

## Mock Patterns

### Mock Successful Response
\`\`\`javascript
prismaMock.user.create.mockResolvedValue(mockUsers.validUser)
\`\`\`

### Mock Error Response
\`\`\`javascript
prismaMock.user.create.mockRejectedValue(new Error("Database error"))
\`\`\`

### Mock Multiple Calls
\`\`\`javascript
prismaMock.user.findMany
  .mockResolvedValueOnce([mockUsers.validUser])
  .mockResolvedValueOnce([mockUsers.anotherUser])
\`\`\`

### Mock Implementation
\`\`\`javascript
prismaMock.user.create.mockImplementation((data) => {
  return Promise.resolve({ id: 1, ...data })
})
\`\`\`

## File Locations

\`\`\`
__tests__/
├── unit/services/          # Service unit tests
├── integration/            # Controller integration tests
├── api/                    # API endpoint tests
├── middleware/             # Middleware tests
└── setup/
    ├── test-setup.js       # Global setup
    ├── prisma-mock.js      # Prisma mock
    └── test-utils.js       # Helper utilities

__mocks__/data/            # Mock data files
\`\`\`

## Debugging Tips

1. **Print values**: `console.log("[v0] value:", value)`
2. **Run single test**: `npm run test -- auth.service.test.js`
3. **Run matching tests**: `npm run test -- --grep "should create"`
4. **Use UI**: `npm run test:ui`
5. **Check mock calls**: `console.log(prismaMock.user.create.mock.calls)`

## Common Issues

| Issue | Solution |
|-------|----------|
| Mock not working | Clear mocks in beforeEach: `vi.clearAllMocks()` |
| Test timeout | Increase timeout in vitest.config.js |
| Import errors | Check relative paths and file names |
| Mock not called | Verify mock is set before function call |
| Async issues | Use `async/await` or return promises |

---

**Quick Reference v1.0** - October 2025
