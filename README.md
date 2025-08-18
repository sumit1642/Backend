# Blog API Documentation

## Base URL
```
http://localhost:3000
```

## Authentication System
JWT tokens stored in HTTP-only cookies:
- `accessToken`: 15 minutes expiry
- `refreshToken`: 7 days expiry

**Important for Frontend:** 
- Tokens are automatically managed via HTTP-only cookies
- Always include `credentials: 'include'` in fetch requests
- No manual token handling required
- Automatic token refresh on expiry

---

## Complete API Routes Overview

### Public Routes (No Authentication Required)
- `GET /` - Home page with published posts
- `GET /health` - Server health check
- `GET /api` - API information (development only)
- `GET /api/posts` - Get all published posts
- `GET /api/posts/:postId` - Get single post details
- `GET /api/posts/user/:userId` - Get user's published posts
- `GET /api/interactions/posts/:postId/comments` - Get post comments
- `GET /api/tags` - Get all tags with post counts
- `GET /api/tags/:tagId/posts` - Get published posts by tag

### Authentication Routes
- `POST /api/auth/register` - Create new user account
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - User logout

### Protected Routes (Authentication Required)
- `GET /api/posts/my/posts` - Get current user's all posts
- `POST /api/posts` - Create new post
- `PUT/PATCH /api/posts/:postId` - Update post (owner only)
- `DELETE /api/posts/:postId` - Delete post (owner only)
- `POST /api/interactions/posts/:postId/like` - Toggle post like
- `POST /api/interactions/posts/:postId/comments` - Add comment
- `PUT/PATCH /api/interactions/comments/:commentId` - Update comment (owner only)
- `DELETE /api/interactions/comments/:commentId` - Delete comment (owner only)
- `GET /api/profile` - Get current user profile
- `PUT/PATCH /api/profile` - Update user profile
- `GET /api/tags/liked` - Get user's liked tags
- `POST /api/tags/posts/:postId` - Add tag to post (owner only)
- `DELETE /api/tags/posts/:postId/:tagId` - Remove tag from post (owner only)

---

## Authentication Routes (`/api/auth`)

### POST `/api/auth/register`

**Purpose:** Create a new user account and automatically log them in

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com", 
  "password": "password123"
}
```

**Validation Rules:**
- **Name**: 2-50 characters, required, HTML tags stripped, XSS protected
- **Email**: Valid format, unique in system, required, case-insensitive, trimmed
- **Password**: 6-128 characters, required, bcrypt hashed with 12 salt rounds

**Behavior:**
- Creates user record in database
- Creates empty profile for user
- Email is stored in lowercase
- Name is sanitized (HTML stripped)
- Password is securely hashed
- No automatic login after registration

**Success Response:** 201
```json
{
  "status": "success",
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com"
    }
  }
}
```

**Error Responses:**
- **400 Bad Request**: Missing/invalid fields
- **409 Conflict**: Email already exists
- **500 Internal Server Error**: Server error

```json
{
  "status": "error",
  "message": "User with this email already exists"
}
```

### POST `/api/auth/login`

**Purpose:** Authenticate user and set authentication cookies

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Behavior:**
- Validates email format and existence
- Compares password with bcrypt hash
- Cleans up expired refresh tokens for user
- Generates new access token (15min) and refresh token (7 days)
- Sets HTTP-only secure cookies
- If already authenticated, redirects to home

**Success Response:** 200
```json
{
  "status": "success",
  "message": "Logged in successfully",
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com"
    }
  }
}
```

**Special Case - Already Authenticated:** 302
```json
{
  "status": "redirect",
  "message": "Already authenticated",
  "redirectUrl": "/",
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com"
    }
  }
}
```

**Error Responses:**
- **400 Bad Request**: Missing/invalid email format
- **401 Unauthorized**: Invalid credentials
- **500 Internal Server Error**: Server error

### POST `/api/auth/refresh`

**Purpose:** Generate new access token using refresh token (token rotation)

**Request:** No body required (uses refresh token from cookies)

**Behavior:**
- Validates refresh token from cookies
- Checks token expiration
- Verifies user still exists
- Creates new access token (15min) and refresh token (7 days)
- Deletes old refresh token (security)
- Sets new HTTP-only cookies
- Atomic transaction to prevent token conflicts

**Success Response:** 200
```json
{
  "status": "success",
  "message": "Token refreshed successfully",
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com"
    }
  }
}
```

**Error Responses:**
- **401 Unauthorized**: Missing, invalid, or expired refresh token

**Special Error Code for Frontend:**
```json
{
  "status": "error",
  "message": "Access token expired. Please refresh your token.",
  "code": "TOKEN_EXPIRED"
}
```

### POST `/api/auth/logout`

**Purpose:** Clear authentication cookies and invalidate refresh token

**Request:** No body required

**Behavior:**
- Attempts to delete refresh token from database
- Clears access and refresh cookies from browser
- Always returns success (even if token doesn't exist)
- Graceful handling of missing tokens

**Success Response:** 200
```json
{
  "status": "success",
  "message": "Logged out successfully"
}
```

---

## Posts Routes (`/api/posts`)

### GET `/api/posts`

**Purpose:** Retrieve all posts with optional filtering by publication status

**Query Parameters:**
- `published`: "true" (default) | "false" - Filter by publication status

**Authentication:** Optional (enhanced features if authenticated)

**Behavior:**
- Returns published posts by default
- If authenticated, `isLikedByUser` is populated correctly
- Posts ordered by creation date (newest first)
- Includes author info, counts, and tags
- XSS protection on all text fields

**Success Response:** 200
```json
{
  "status": "success",
  "message": "Posts fetched successfully",
  "data": {
    "posts": [
      {
        "id": 1,
        "title": "My First Post",
        "content": "This is the content...",
        "published": true,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z",
        "author": {
          "id": 1,
          "name": "John Doe",
          "email": "john@example.com"
        },
        "commentsCount": 5,
        "likesCount": 10,
        "isLikedByUser": false,
        "tags": [
          {
            "id": 1,
            "name": "javascript"
          }
        ]
      }
    ]
  }
}
```

### GET `/api/posts/:postId`

**Purpose:** Retrieve single post with complete details including comments

**Path Parameters:**
- `postId`: Integer - Post ID to retrieve

**Authentication:** Optional (enhanced features if authenticated)

**Behavior:**
- Returns post details with all comments
- Comments ordered by creation date (newest first)
- Validates postId as positive integer
- If authenticated, `isLikedByUser` is accurate
- Returns 404 if post doesn't exist

**Success Response:** 200
```json
{
  "status": "success",
  "message": "Post fetched successfully",
  "data": {
    "post": {
      "id": 1,
      "title": "My First Post",
      "content": "This is the content...",
      "published": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "author": {
        "id": 1,
        "name": "John Doe",
        "email": "john@example.com"
      },
      "commentsCount": 2,
      "likesCount": 5,
      "isLikedByUser": true,
      "tags": [
        {
          "id": 1,
          "name": "javascript"
        }
      ],
      "comments": [
        {
          "id": 1,
          "content": "Great post!",
          "createdAt": "2024-01-01T00:00:00.000Z",
          "author": {
            "id": 2,
            "name": "Jane Smith"
          }
        }
      ]
    }
  }
}
```

**Error Responses:**
- **400 Bad Request**: Invalid post ID format
- **404 Not Found**: Post doesn't exist

### POST `/api/posts` 🔒

**Purpose:** Create a new blog post

**Authentication:** Required

**Request Body:**
```json
{
  "title": "My New Post",
  "content": "Post content here...",
  "published": false
}
```

**Validation Rules:**
- **Title**: 1-50 characters, required, must be unique per user, HTML stripped
- **Content**: 1-191 characters, required, HTML stripped
- **Published**: Boolean, optional (defaults to false)

**Behavior:**
- Validates user authentication
- Sanitizes input (XSS protection)
- Checks for duplicate title per user
- Creates post with current user as author
- Returns formatted post data
- Updates `updatedAt` timestamp

**Success Response:** 201
```json
{
  "status": "success",
  "message": "Post created successfully",
  "data": {
    "post": {
      "id": 2,
      "title": "My New Post",
      "content": "Post content here...",
      "published": false,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "author": {
        "id": 1,
        "name": "John Doe",
        "email": "john@example.com"
      },
      "commentsCount": 0,
      "likesCount": 0,
      "isLikedByUser": false,
      "tags": []
    }
  }
}
```

**Error Responses:**
- **400 Bad Request**: Invalid/missing required fields
- **401 Unauthorized**: Not authenticated
- **409 Conflict**: Duplicate title for user

### PUT/PATCH `/api/posts/:postId` 🔒

**Purpose:** Update existing post (owner only)

**Authentication:** Required

**Path Parameters:**
- `postId`: Integer - Post ID to update

**Request Body:** (All fields optional for PATCH)
```json
{
  "title": "Updated Title",
  "content": "Updated content...",
  "published": true
}
```

**Validation Rules:**
- **Title**: 1-50 characters if provided, must be unique per user
- **Content**: 1-191 characters if provided
- **Published**: Boolean if provided

**Behavior:**
- Validates post exists and user owns it
- Sanitizes all input fields
- Checks for duplicate title (excluding current post)
- Updates only provided fields
- Handles null/undefined values safely
- Updates `updatedAt` timestamp automatically

**Success Response:** 200
```json
{
  "status": "success",
  "message": "Post updated successfully",
  "data": {
    "post": {
      "id": 1,
      "title": "Updated Title",
      "content": "Updated content...",
      "published": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T01:00:00.000Z",
      "author": {
        "id": 1,
        "name": "John Doe",
        "email": "john@example.com"
      },
      "commentsCount": 0,
      "likesCount": 0,
      "isLikedByUser": false,
      "tags": []
    }
  }
}
```

**Error Responses:**
- **400 Bad Request**: Invalid post ID or validation errors
- **401 Unauthorized**: Not authenticated
- **403 Forbidden**: Not post owner
- **404 Not Found**: Post doesn't exist
- **409 Conflict**: Duplicate title

### DELETE `/api/posts/:postId` 🔒

**Purpose:** Delete post and all related data (owner only)

**Authentication:** Required

**Path Parameters:**
- `postId`: Integer - Post ID to delete

**Behavior:**
- Validates post exists and user owns it
- Uses database transaction for data consistency
- Cascades deletion to comments, likes, post-tag relationships
- Removes user liked tags if no other liked posts have those tags
- Complete cleanup of all related data

**Success Response:** 200
```json
{
  "status": "success",
  "message": "Post deleted successfully"
}
```

**Error Responses:**
- **400 Bad Request**: Invalid post ID
- **401 Unauthorized**: Not authenticated
- **403 Forbidden**: Not post owner
- **404 Not Found**: Post doesn't exist

### GET `/api/posts/user/:userId`

**Purpose:** Get all posts by specific user with privacy rules

**Path Parameters:**
- `userId`: Integer - User ID whose posts to retrieve

**Authentication:** Optional (affects visibility)

**Behavior:**
- If requesting user is NOT the post author: only published posts shown
- If requesting user IS the post author: all posts shown (published + unpublished)
- Posts ordered by creation date (newest first)
- Validates user exists
- Returns empty array if user has no visible posts

**Success Response:** 200
```json
{
  "status": "success",
  "message": "User posts fetched successfully",
  "data": {
    "posts": [
      {
        "id": 1,
        "title": "User's Post",
        "content": "Content...",
        "published": true,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z",
        "author": {
          "id": 2,
          "name": "Jane Smith",
          "email": "jane@example.com"
        },
        "commentsCount": 3,
        "likesCount": 7,
        "isLikedByUser": false,
        "tags": []
      }
    ]
  }
}
```

**Error Responses:**
- **400 Bad Request**: Invalid user ID
- **404 Not Found**: User doesn't exist

### GET `/api/posts/my/posts` 🔒

**Purpose:** Get all posts for authenticated user (published + unpublished)

**Authentication:** Required

**Behavior:**
- Returns ALL posts for authenticated user
- Includes both published and unpublished posts
- Posts ordered by creation date (newest first)
- Full post details with counts and tags
- Only accessible by post owner

**Success Response:** 200
```json
{
  "status": "success",
  "message": "Your posts fetched successfully",
  "data": {
    "posts": [
      {
        "id": 1,
        "title": "My Draft Post",
        "content": "Draft content...",
        "published": false,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z",
        "author": {
          "id": 1,
          "name": "John Doe",
          "email": "john@example.com"
        },
        "commentsCount": 0,
        "likesCount": 0,
        "isLikedByUser": false,
        "tags": []
      }
    ]
  }
}
```

**Error Responses:**
- **401 Unauthorized**: Not authenticated

---

## Interactions Routes (`/api/interactions`)

### POST `/api/interactions/posts/:postId/like` 🔒

**Purpose:** Toggle like status on post (like if not liked, unlike if liked)

**Authentication:** Required

**Path Parameters:**
- `postId`: Integer - Post ID to toggle like

**Behavior:**
- Validates post exists
- Checks current like status for user
- If not liked: creates like, adds user liked tags for post's tags
- If already liked: removes like, removes user liked tags (only if no other liked posts have those tags)
- Uses database transaction for consistency
- Updates like count automatically
- Smart tag management prevents orphaned liked tags

**Success Response (Like):** 200
```json
{
  "status": "success",
  "message": "Post liked successfully",
  "data": {
    "isLiked": true,
    "likeCount": 11
  }
}
```

**Success Response (Unlike):** 200
```json
{
  "status": "success",
  "message": "Post unliked successfully",
  "data": {
    "isLiked": false,
    "likeCount": 10
  }
}
```

**Error Responses:**
- **400 Bad Request**: Invalid post ID
- **401 Unauthorized**: Not authenticated
- **404 Not Found**: Post doesn't exist

### GET `/api/interactions/posts/:postId/comments`

**Purpose:** Get all comments for a specific post

**Authentication:** Not required (public)

**Path Parameters:**
- `postId`: Integer - Post ID to get comments for

**Behavior:**
- Validates post exists
- Returns all comments for the post
- Comments ordered by creation date (newest first)
- Includes comment author information
- No pagination (returns all comments)

**Success Response:** 200
```json
{
  "status": "success",
  "message": "Comments fetched successfully",
  "data": {
    "comments": [
      {
        "id": 1,
        "content": "Great post!",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "author": {
          "id": 2,
          "name": "Jane Smith"
        }
      }
    ]
  }
}
```

**Error Responses:**
- **400 Bad Request**: Invalid post ID
- **404 Not Found**: Post doesn't exist

### POST `/api/interactions/posts/:postId/comments` 🔒

**Purpose:** Add new comment to post

**Authentication:** Required

**Path Parameters:**
- `postId`: Integer - Post ID to comment on

**Request Body:**
```json
{
  "content": "This is my comment on the post."
}
```

**Validation Rules:**
- **Content**: 1-500 characters, required, HTML stripped, trimmed

**Behavior:**
- Validates post exists
- Sanitizes comment content (XSS protection)
- Creates comment with authenticated user as author
- Returns complete comment data with author info
- Updates post's comment count automatically

**Success Response:** 201
```json
{
  "status": "success",
  "message": "Comment added successfully",
  "data": {
    "comment": {
      "id": 2,
      "content": "This is my comment on the post.",
      "createdAt": "2024-01-01T01:00:00.000Z",
      "author": {
        "id": 1,
        "name": "John Doe"
      }
    }
  }
}
```

**Error Responses:**
- **400 Bad Request**: Invalid post ID or content validation
- **401 Unauthorized**: Not authenticated
- **404 Not Found**: Post doesn't exist

### PUT/PATCH `/api/interactions/comments/:commentId` 🔒

**Purpose:** Update existing comment (owner only)

**Authentication:** Required

**Path Parameters:**
- `commentId`: Integer - Comment ID to update

**Request Body:**
```json
{
  "content": "Updated comment content."
}
```

**Validation Rules:**
- **Content**: 1-500 characters, required, HTML stripped, trimmed

**Behavior:**
- Validates comment exists and user owns it
- Sanitizes updated content
- Updates comment content only
- Preserves original creation date
- No updatedAt field for comments

**Success Response:** 200
```json
{
  "status": "success",
  "message": "Comment updated successfully",
  "data": {
    "comment": {
      "id": 1,
      "content": "Updated comment content.",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "author": {
        "id": 1,
        "name": "John Doe"
      }
    }
  }
}
```

**Error Responses:**
- **400 Bad Request**: Invalid comment ID or content validation
- **401 Unauthorized**: Not authenticated
- **403 Forbidden**: Not comment owner
- **404 Not Found**: Comment doesn't exist

### DELETE `/api/interactions/comments/:commentId` 🔒

**Purpose:** Delete comment (owner only)

**Authentication:** Required

**Path Parameters:**
- `commentId`: Integer - Comment ID to delete

**Behavior:**
- Validates comment exists and user owns it
- Deletes comment from database
- Updates post's comment count automatically
- No cascade effects (simple deletion)

**Success Response:** 200
```json
{
  "status": "success",
  "message": "Comment deleted successfully"
}
```

**Error Responses:**
- **400 Bad Request**: Invalid comment ID
- **401 Unauthorized**: Not authenticated
- **403 Forbidden**: Not comment owner
- **404 Not Found**: Comment doesn't exist

---

## Profile Routes (`/api/profile`)

### GET `/api/profile` 🔒

**Purpose:** Get current user's profile information

**Authentication:** Required

**Behavior:**
- Returns authenticated user's profile
- Includes basic user info and bio
- Auto-creates profile if doesn't exist
- Bio defaults to empty string

**Success Response:** 200
```json
{
  "status": "success",
  "message": "Profile fetched successfully",
  "data": {
    "profile": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "bio": "Software developer passionate about web technologies."
    }
  }
}
```

**Error Responses:**
- **401 Unauthorized**: Not authenticated
- **404 Not Found**: User profile not found

### PUT/PATCH `/api/profile` 🔒

**Purpose:** Update current user's profile

**Authentication:** Required

**Request Body:**
```json
{
  "name": "John Smith",
  "bio": "Updated bio description."
}
```

**Validation Rules:**
- **Name**: 2+ characters if provided, HTML stripped, trimmed
- **Bio**: Any length, optional, HTML stripped, can be empty string

**Behavior:**
- Updates only provided fields
- Uses database transaction for consistency
- Creates profile if doesn't exist
- Sanitizes all input (XSS protection)
- Trims whitespace from all fields
- Email cannot be updated via this endpoint

**Success Response:** 200
```json
{
  "status": "success",
  "message": "Profile updated successfully",
  "data": {
    "profile": {
      "id": 1,
      "name": "John Smith",
      "email": "john@example.com",
      "bio": "Updated bio description."
    }
  }
}
```

**Error Responses:**
- **400 Bad Request**: Validation errors (name too short)
- **401 Unauthorized**: Not authenticated
- **404 Not Found**: User not found

---

## Tags Routes (`/api/tags`)

### GET `/api/tags`

**Purpose:** Get all tags with post counts

**Authentication:** Not required (public)

**Behavior:**
- Returns all tags in alphabetical order
- Includes count of posts for each tag
- Only counts published posts in post count
- No pagination (returns all tags)

**Success Response:** 200
```json
{
  "status": "success",
  "message": "Tags fetched successfully",
  "data": {
    "tags": [
      {
        "id": 1,
        "name": "javascript",
        "postsCount": 15
      },
      {
        "id": 2,
        "name": "react",
        "postsCount": 8
      }
    ]
  }
}
```

### GET `/api/tags/:tagId/posts`

**Purpose:** Get all published posts that have a specific tag

**Authentication:** Optional (enhanced features if authenticated)

**Path Parameters:**
- `tagId`: Integer - Tag ID to get posts for

**Behavior:**
- Validates tag exists
- Returns only published posts with the tag
- Posts ordered by creation date (newest first)
- If authenticated, `isLikedByUser` is populated
- Includes full post details with author and counts

**Success Response:** 200
```json
{
  "status": "success",
  "message": "Posts fetched successfully",
  "data": {
    "posts": [
      {
        "id": 1,
        "title": "JavaScript Basics",
        "content": "Learning JavaScript...",
        "published": true,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z",
        "author": {
          "id": 1,
          "name": "John Doe",
          "email": "john@example.com"
        },
        "commentsCount": 3,
        "likesCount": 7,
        "isLikedByUser": false,
        "tags": [
          {
            "id": 1,
            "name": "javascript"
          }
        ]
      }
    ]
  }
}
```

**Error Responses:**
- **400 Bad Request**: Invalid tag ID
- **404 Not Found**: Tag doesn't exist

### POST `/api/tags/posts/:postId` 🔒

**Purpose:** Add tag to post (owner only)

**Authentication:** Required

**Path Parameters:**
- `postId`: Integer - Post ID to add tag to

**Request Body:**
```json
{
  "tagName": "nodejs"
}
```

**Validation Rules:**
- **TagName**: 2-20 characters, required, alphanumeric + hyphens only
- Automatic transformation: lowercase, spaces→hyphens, trimmed

**Behavior:**
- Validates post exists and user owns it
- Transforms tag name (lowercase, spaces to hyphens)
- Creates tag if doesn't exist (auto-creation)
- Checks for duplicate tag on post
- Creates post-tag relationship
- Returns created/found tag

**Tag Transformation Examples:**
- "Node JS" → "node-js"
- "REACT Hooks" → "react-hooks"
- "vue.js" → "vue.js" (periods allowed)

**Success Response:** 201
```json
{
  "status": "success",
  "message": "Tag added to post successfully",
  "data": {
    "tag": {
      "id": 3,
      "name": "nodejs"
    }
  }
}
```

**Error Responses:**
- **400 Bad Request**: Invalid post ID or tag name validation
- **401 Unauthorized**: Not authenticated
- **403 Forbidden**: Not post owner
- **404 Not Found**: Post doesn't exist
- **409 Conflict**: Tag already exists on post

### DELETE `/api/tags/posts/:postId/:tagId` 🔒

**Purpose:** Remove tag from post (owner only)

**Authentication:** Required

**Path Parameters:**
- `postId`: Integer - Post ID to remove tag from
- `tagId`: Integer - Tag ID to remove

**Behavior:**
- Validates post exists and user owns it
- Validates post-tag relationship exists
- Removes post-tag relationship
- Does NOT delete the tag itself (other posts may use it)
- Tag remains in system for reuse

**Success Response:** 200
```json
{
  "status": "success",
  "message": "Tag removed from post successfully"
}
```

**Error Responses:**
- **400 Bad Request**: Invalid post ID or tag ID
- **401 Unauthorized**: Not authenticated
- **403 Forbidden**: Not post owner
- **404 Not Found**: Post doesn't exist or tag not on post

### GET `/api/tags/liked` 🔒

**Purpose:** Get tags from posts the user has liked

**Authentication:** Required

**Behavior:**
- Returns tags from all posts user has liked
- Automatically managed when user likes/unlikes posts
- Tags ordered alphabetically
- Includes post count for each tag
- Updates automatically with like/unlike actions

**Success Response:** 200
```json
{
  "status": "success",
  "message": "Your liked tags fetched successfully",
  "data": {
    "tags": [
      {
        "id": 1,
        "name": "javascript",
        "postsCount": 15
      },
      {
        "id": 2,
        "name": "react", 
        "postsCount": 8
      }
    ]
  }
}
```

**Error Responses:**
- **401 Unauthorized**: Not authenticated

---

## Additional Routes

### GET `/`

**Purpose:** Home page - same as `/api/posts` with published posts

**Authentication:** Optional (enhanced features if authenticated)

**Behavior:**
- Identical to `GET /api/posts`
- Shows all published posts
- Ordered by creation date (newest first)
- If authenticated, like status is accurate

**Success Response:** Same as `GET /api/posts`

### GET `/health`

**Purpose:** Server health check and status

**Authentication:** Not required (public)

**Behavior:**
- Always returns success if server is running
- Includes timestamp and environment info
- Used for monitoring and uptime checks

**Success Response:** 200
```json
{
  "status": "success",
  "message": "Server is running",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "development"
}
```

### GET `/api` (Development Only)

**Purpose:** API documentation and endpoint listing

**Authentication:** Not required (public)

**Behavior:**
- Only available in development mode
- Returns API version and available endpoints
- Useful for API discovery

**Success Response:** 200
```json
{
  "status": "success",
  "message": "Blog API v1.0",
  "endpoints": {
    "auth": "/api/auth",
    "posts": "/api/posts",
    "interactions": "/api/interactions", 
    "profile": "/api/profile",
    "tags": "/api/tags"
  },
  "docs": "Visit /api/docs for detailed documentation"
}
```

### 404 Handler for API Routes (Development Only)

**Purpose:** Handle unknown API endpoints in development

**Behavior:**
- Only in development mode
- Returns available endpoints for debugging

**Response:** 404
```json
{
  "status": "error",
  "message": "API endpoint not found",
  "availableEndpoints": [
    "/api/auth",
    "/api/posts", 
    "/api/interactions",
    "/api/profile",
    "/api/tags"
  ]
}
```

### General 404 Handler

**Purpose:** Handle all other unknown routes

**Response:** 404
```json
{
  "status": "error",
  "message": "Route not found"
}
```

---

## Frontend Implementation Guide

### Authentication Flow
1. **Registration/Login**: POST to auth endpoints, cookies set automatically
2. **API Requests**: Always include `credentials: 'include'` in fetch options
3. **Token Refresh**: Automatic on 401 with `TOKEN_EXPIRED` code
4. **Logout**: POST to logout endpoint, cookies cleared automatically

### Error Handling Patterns

```javascript
// Standard error handling
const response = await fetch('/api/posts', {
  credentials: 'include'
});

const data = await response.json();

if (data.status === 'error') {
  if (data.code === 'TOKEN_EXPIRED') {
    // Attempt token refresh
    await refreshToken();
    // Retry original request
  } else {
    // Handle other errors
    showError(data.message);
  }
}
```

### CORS Configuration
```javascript
// Required fetch configuration
const options = {
  method: 'POST',
  credentials: 'include', // REQUIRED for cookies
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(data)
};
```

### Input Validation (Client-Side)
- **Post Title**: Max 50 characters, required
- **Post Content**: Max 191 characters, required  
- **Comment Content**: Max 500 characters, required
- **Tag Name**: 2-20 characters, alphanumeric + hyphens only
- **User Name**: Min 2 characters, max 50 characters
- **Bio**: Any length, optional
- **Email**: Valid format required
- **Password**: 6-128 characters required

### State Management Tips

#### Like Button State
```javascript
const [isLiked, setIsLiked] = useState(post.isLikedByUser);
const [likeCount, setLikeCount] = useState(post.likesCount);

const handleLike = async () => {
  try {
    const response = await fetch(`/api/interactions/posts/${post.id}/like`, {
      method: 'POST',
      credentials: 'include'
    });
    
    const data = await response.json();
    
    if (data.status === 'success') {
      setIsLiked(data.data.isLiked);
      setLikeCount(data.data.likeCount);
    }
  } catch (error) {
    // Handle error
  }
};
```

#### Comment Management
```javascript
const [comments, setComments] = useState([]);

// Add comment
const addComment = async (content) => {
  const response = await fetch(`/api/interactions/posts/${postId}/comments`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content })
  });
  
  const data = await response.json();
  if (data.status === 'success') {
    setComments(prev => [data.data.comment, ...prev]);
  }
};

// Delete comment
const deleteComment = async (commentId) => {
  const response = await fetch(`/api/interactions/comments/${commentId}`, {
    method: 'DELETE',
    credentials: 'include'
  });
  
  if (response.ok) {
    setComments(prev => prev.filter(c => c.id !== commentId));
  }
};
```

### URL Patterns and Routing

#### Public Routes (No Auth Check)
- `/` - Home page with published posts
- `/posts` - All published posts  
- `/posts/:id` - Single post view
- `/users/:id/posts` - User's published posts
- `/tags` - All tags
- `/tags/:id/posts` - Posts by tag
- `/login` - Login page
- `/register` - Registration page

#### Protected Routes (Auth Required)
- `/dashboard` - User dashboard with all posts
- `/posts/create` - Create new post
- `/posts/:id/edit` - Edit post (owner only)
- `/profile` - User profile
- `/profile/edit` - Edit profile

### Data Relationships

#### Post Object Structure
```javascript
{
  id: number,
  title: string,
  content: string,
  published: boolean,
  createdAt: string (ISO date),
  updatedAt: string (ISO date),
  author: {
    id: number,
    name: string,
    email: string
  },
  commentsCount: number,
  likesCount: number,
  isLikedByUser: boolean, // Only if authenticated
  tags: Array<{id: number, name: string}>,
  comments?: Array<Comment> // Only in single post view
}
```

#### Comment Object Structure
```javascript
{
  id: number,
  content: string,
  createdAt: string (ISO date),
  author: {
    id: number,
    name: string
  }
}
```

#### User/Profile Object Structure
```javascript
{
  id: number,
  name: string,
  email: string,
  bio?: string
}
```

#### Tag Object Structure
```javascript
{
  id: number,
  name: string,
  postsCount: number
}
```

### Caching Strategies

#### Browser Cache Headers
- API responses include appropriate cache headers
- Static content cached longer than dynamic content
- Authentication-dependent content not cached

#### Frontend Cache Invalidation
- Invalidate post list after creating/updating/deleting posts
- Invalidate single post after updating comments/likes
- Invalidate user profile after updates
- Invalidate tag lists after adding/removing tags

### Security Considerations

#### XSS Prevention
- All user input is sanitized on backend
- HTML tags stripped from text inputs
- Use `textContent` instead of `innerHTML` when displaying user content

#### CSRF Protection
- SameSite cookies provide CSRF protection
- No additional CSRF tokens needed
- Secure cookie flags in production

#### Authentication Security
- HTTP-only cookies prevent XSS token theft
- Automatic token refresh reduces exposure window
- Secure cookie transmission in production

### Performance Optimizations

#### Lazy Loading
- Load comments only when post is viewed
- Paginate post lists for large datasets
- Load user profiles on demand

#### Optimistic Updates
- Update UI immediately for likes/unlikes
- Revert on server error
- Show loading states for slower operations

#### Debouncing
- Debounce search inputs
- Debounce auto-save functionality
- Rate limit API calls

---

## Backend Architecture Details

### Database Schema
- **MySQL** database with Prisma ORM
- Foreign key constraints ensure data integrity
- Cascade deletions for related records
- Composite unique constraints for business rules

### Security Implementation
- **bcrypt** password hashing (12 salt rounds)
- **JWT** tokens with short expiration times
- **HTTP-only cookies** prevent client-side access
- **CORS** properly configured for cross-origin requests
- **Security headers** for protection against common attacks

### Data Processing Pipeline
1. **Input Validation**: Required fields, format checking, length limits
2. **Sanitization**: HTML tag removal, XSS prevention
3. **Normalization**: Email lowercase, tag name transformation
4. **Business Logic**: Ownership checks, duplicate validation
5. **Database Operations**: Transactions for consistency
6. **Response Formatting**: Consistent structure, sensitive data exclusion

### Error Handling Strategy
- **Consistent Error Format**: All errors return same structure
- **Appropriate HTTP Status Codes**: 400/401/403/404/409/500
- **No Sensitive Information**: Error messages don't expose system details
- **Graceful Degradation**: Partial failures handled appropriately

### Performance Features
- **Database Indexes**: On frequently queried columns
- **Query Optimization**: Selective field loading, join optimization
- **Connection Pooling**: Efficient database connection management
- **Request Size Limits**: 10MB limit prevents abuse

### Monitoring and Logging
- **Health Check Endpoint**: `/health` for uptime monitoring
- **Error Logging**: Detailed server-side error tracking
- **Request Logging**: API usage monitoring
- **Graceful Shutdown**: Proper database connection cleanup

---

## Testing Guidelines

### API Testing Scenarios

#### Authentication Tests
- Valid registration with all fields
- Registration with duplicate email
- Login with valid credentials
- Login with invalid credentials
- Token refresh with valid token
- Token refresh with expired token
- Logout functionality

#### Posts Tests
- Create post with valid data
- Create post with duplicate title
- Update own post
- Attempt to update other user's post
- Delete own post
- Attempt to delete other user's post
- Get published posts (public)
- Get own posts (including unpublished)

#### Interactions Tests
- Like post when not liked
- Unlike post when liked
- Add valid comment
- Edit own comment
- Attempt to edit other user's comment
- Delete own comment
- Get comments for post

#### Profile Tests
- Get own profile
- Update profile with valid data
- Update profile with invalid data

#### Tags Tests
- Add valid tag to post
- Add duplicate tag to post
- Remove tag from post
- Get posts by tag
- Get user's liked tags

### Edge Cases to Test
- Invalid ID formats (non-numeric, negative)
- Missing required fields
- Empty string inputs
- Extremely long inputs
- Special characters in inputs
- Concurrent operations (race conditions)
- Network timeouts
- Database connection failures

### Security Tests
- XSS injection attempts
- SQL injection attempts
- CSRF attack simulation
- Authentication bypass attempts
- Authorization bypass attempts
- Rate limiting validation

---

## Environment Configuration

### Required Environment Variables
```bash
# .env

# Server Configuration
NODE_ENV=development                    # development | production
PORT=3000                              # Server port

# Database Configuration
DATABASE_URL="mysql://root:123sumit@localhost:3306/MediumClone"

# JWT Configuration (REQUIRED - Must be at least 32 characters)
JWT_SECRET_KEY="super-secure-key-minimum-32-characters-here"

# Token Expiry Settings
ACCESS_TOKEN_EXPIRY="15m"              # Access token expiry (15 minutes)
REFRESH_TOKEN_EXPIRY="604800000"       # Refresh token expiry (7 days in ms)

# CORS Configuration
ALLOWED_ORIGINS="http://localhost:5173"  # Frontend URL(s), comma-separated for multiple

# Rate Limiting
RATE_LIMIT_WINDOW_MS="900000"          # Rate limit window (15 minutes in ms)
RATE_LIMIT_MAX_REQUESTS="100"          # Max requests per window

# Content Limits
MAX_CONTENT_LENGTH="100000"            # Maximum post content length
MAX_BIO_LENGTH="500"                   # Maximum bio length
MAX_TITLE_LENGTH="120"                 # Maximum post title length

# Database Performance (Optional)
DATABASE_CONNECTION_LIMIT="10"         # Max database connections
DATABASE_TIMEOUT="30000"               # Database timeout (30 seconds in ms)
```

### Environment Variable Details

#### Core Configuration
- **NODE_ENV**: Controls security features, error verbosity, and CORS behavior
- **PORT**: Server port (defaults to 3000 if not specified)
- **DATABASE_URL**: MySQL connection string with credentials and database name

#### Security Configuration
- **JWT_SECRET_KEY**: Must be at least 32 characters for security
- **ACCESS_TOKEN_EXPIRY**: Short-lived token for API access (15 minutes recommended)
- **REFRESH_TOKEN_EXPIRY**: Long-lived token for renewal (7 days recommended)

#### Network Configuration
- **ALLOWED_ORIGINS**: Frontend URLs allowed to make requests (CORS)
- **RATE_LIMIT_WINDOW_MS**: Time window for rate limiting (15 minutes)
- **RATE_LIMIT_MAX_REQUESTS**: Maximum requests per user per window

#### Content Validation
- **MAX_CONTENT_LENGTH**: Post content character limit (100,000 chars)
- **MAX_BIO_LENGTH**: User bio character limit (500 chars)
- **MAX_TITLE_LENGTH**: Post title character limit (120 chars)

### Development vs Production Settings

#### Development Environment
```bash
NODE_ENV=development
ALLOWED_ORIGINS="http://localhost:5173"
# Less restrictive error reporting
# Additional API documentation endpoints available
```

#### Production Environment
```bash
NODE_ENV=production
ALLOWED_ORIGINS="https://yourdomain.com,https://www.yourdomain.com"
# Enhanced security features
# Sanitized error messages
# Secure cookie flags enabled
```

### Security Features by Environment

#### Development Mode
- Detailed error messages in responses
- `/api` documentation endpoint available
- CORS allows localhost origins
- Less strict security headers

#### Production Mode
- Sanitized error messages
- No documentation endpoints
- HTTPS-only cookies
- Strict security headers
- Enhanced CORS validation

### Database Configuration

#### Connection String Format
```
mysql://[username]:[password]@[host]:[port]/[database_name]
```

#### Connection Pool Settings
- **CONNECTION_LIMIT**: Maximum concurrent database connections
- **TIMEOUT**: Maximum time to wait for database response
- Automatic connection cleanup on server shutdown

### Docker Configuration
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --only=production

# Generate Prisma client
RUN npx prisma generate

# Copy application code
COPY . .

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start application
CMD ["npm", "start"]
```

### Docker Compose Setup
```yaml
version: '3.8'

services:
  blog-api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=mysql://root:password@db:3306/MediumClone
      - JWT_SECRET_KEY=your-super-secure-production-key-here
      - ALLOWED_ORIGINS=https://yourdomain.com
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: password
      MYSQL_DATABASE: MediumClone
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
    restart: unless-stopped

volumes:
  mysql_data:
```

### Health Monitoring & Deployment

#### Health Check Endpoint
- **URL**: `GET /health`
- **Purpose**: Server status monitoring
- **Response**: Includes timestamp, environment, and status
- **Use**: Load balancer health checks, uptime monitoring

#### Monitoring Recommendations
```javascript
// Example health check script
const healthCheck = async () => {
  try {
    const response = await fetch('http://localhost:3000/health');
    const data = await response.json();
    
    if (data.status === 'success') {
      console.log('✅ Server healthy');
    } else {
      console.log('❌ Server unhealthy');
    }
  } catch (error) {
    console.log('❌ Server unreachable');
  }
};
```

#### Production Deployment Checklist
- [ ] Set `NODE_ENV=production`
- [ ] Use strong JWT secret (32+ characters)
- [ ] Configure proper ALLOWED_ORIGINS
- [ ] Set up HTTPS/SSL certificates
- [ ] Configure reverse proxy (nginx/Apache)
- [ ] Set up database backups
- [ ] Configure log rotation
- [ ] Set up monitoring/alerting
- [ ] Test rate limiting
- [ ] Verify CORS configuration

#### Scaling Considerations
- Database connection pooling handles concurrent users
- Stateless design allows horizontal scaling
- Rate limiting prevents abuse
- HTTP-only cookies work with load balancers
- Health checks enable auto-recovery

---

🔒 = Requires Authentication

**Note**: This API uses HTTP-only cookies for authentication. Always include `credentials: 'include'` in your fetch requests to ensure proper authentication handling.
---

## Additional Error Responses

### Authentication Error Codes

All authentication endpoints may return additional error scenarios:

#### Token Refresh Advanced Errors

**Database Transaction Failure:**
```json
{
  "status": "error",
  "message": "Token refresh failed"
}
```

**User Account Deleted During Session:**
```json
{
  "status": "error", 
  "message": "Token refresh failed"
}
```

---

## Enhanced Query Parameters

### GET `/api/posts` - Advanced Filtering

**Additional Query Parameter Behavior:**
- When `published` parameter is omitted entirely: defaults to `"true"`
- When `published=""` (empty string): treated as `"true"`
- Case insensitive: `"True"`, `"TRUE"`, `"false"`, `"FALSE"` all work

---

## Tag Name Transformation Rules

### POST `/api/tags/posts/:postId` - Complete Transformation Logic

**Tag Name Processing:**
```javascript
// Transformation pipeline
"Node JS Example" → "node-js-example"
"  React Hooks  " → "react-hooks"
"NEXT.js" → "next.js"
"Vue3" → "vue3"
```

**Validation Regex:** `/^[a-z0-9-]+$/`

**Additional Validation Errors:**
```json
{
  "status": "error",
  "message": "Tag name can only contain lowercase letters, numbers, and hyphens"
}
```

---

## Database Cascade Behaviors

### DELETE `/api/posts/:postId` - Detailed Cascade Effects

**Automatic Deletions (in order):**
1. All `Comment` records where `postId` matches
2. All `Like` records where `postId` matches  
3. All `PostTag` relationships where `postId` matches
4. Smart cleanup of `UserLikedTag` records (only if no other liked posts have those tags)
5. Post record itself

**Transaction Rollback:** If any step fails, entire deletion is reversed.

---

## Middleware Validation Details

### Profile Update - Enhanced Name Validation

**Name Processing Logic:**
```javascript
// Empty/null handling
"" → Error: "Name must be at least 2 characters long"
null → Error: "Name must be at least 2 characters long"
"   " → Error: "Name must be at least 2 characters long" 
"A" → Error: "Name must be at least 2 characters long"
"Ab" → Valid: "Ab"
```

---

## Comment Validation Extended

### POST/PUT/PATCH Comment Endpoints - Character Limits

**Content Validation:**
- **Minimum:** 1 character after trimming and HTML removal
- **Maximum:** 500 characters after trimming and HTML removal
- **HTML Stripping:** All HTML tags removed before validation
- **XSS Protection:** Script tags specifically targeted and removed

**Example Transformations:**
```javascript
"<script>alert('xss')</script>Hello" → "Hello"
"<b>Bold text</b>" → "Bold text"
"   Valid comment   " → "Valid comment"
```

---

## Advanced Authentication Behaviors

### Redirect Logic for Auth Routes

**POST `/api/auth/register` and `/api/auth/login`:**

If user already has valid access token:
```json
{
  "status": "redirect",
  "message": "Already authenticated", 
  "redirectUrl": "/",
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com"
    }
  }
}
```

**Status Code:** 302

**Behavior:** Middleware checks access token validity before allowing registration/login.

---

## Post Content Constraints

### Content Field Limitations

**Database Constraints:**
- **Title:** VARCHAR(50) - enforced at database level
- **Content:** VARCHAR(191) - enforced at database level  
- **Unique Constraint:** `(authorId, title)` - prevents duplicate titles per user

**Validation Sequence:**
1. Required field check
2. HTML sanitization  
3. Length validation
4. Database uniqueness check (for titles)

---

## Like System Smart Tag Management

### POST `/api/interactions/posts/:postId/like` - Tag Logic Details

**When Liking a Post:**
```javascript
// Adds user liked tags for ALL tags on the post
post.tags.forEach(tag => {
  UserLikedTag.upsert({userId, tagId: tag.id})
})
```

**When Unliking a Post:**
```javascript
// Only removes tags NOT present in other liked posts
const otherLikedPostTags = getUserOtherLikedPostTags(userId, excludePostId)
post.tags.forEach(tag => {
  if (!otherLikedPostTags.includes(tag.id)) {
    UserLikedTag.delete({userId, tagId: tag.id})
  }
})
```

**Transaction Safety:** All like/unlike operations use database transactions.

---

## Error Handler Differences by Environment

### Development vs Production Error Responses

**Development Mode Error:**
```json
{
  "status": "error",
  "message": "Detailed error message",
  "stack": "Error stack trace here..."
}
```

**Production Mode Error:**
```json
{
  "status": "error", 
  "message": "Internal server error"
}
```

**Stack Traces:** Only included in development environment.

---

## Cookie Configuration Details

### Authentication Cookie Settings

**Development:**
```javascript
{
  httpOnly: true,
  secure: false,        // HTTP allowed
  sameSite: "strict", 
  path: "/",
  maxAge: 900000        // 15 minutes for access token
}
```

**Production:**
```javascript
{
  httpOnly: true,
  secure: true,         // HTTPS required
  sameSite: "strict",
  path: "/", 
  maxAge: 900000
}
```

---

## Graceful Shutdown Behavior

### Server Termination Process

**Shutdown Sequence (on SIGTERM/SIGINT):**
1. Log shutdown message
2. Call `prisma.$disconnect()`
3. Log successful database closure
4. `process.exit(0)`

**Error During Shutdown:**
1. Log shutdown error
2. `process.exit(1)`

**Console Output:**
```
🔄 Received SIGTERM, shutting down gracefully...
📅 Database connection closed successfully
```
