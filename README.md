# Blog API Documentation

## 🚀 Server Configuration

**Base URL:** `http://localhost:3000`  
**Authentication:** JWT tokens via HttpOnly cookies  
**Content-Type:** `application/json`  
**CORS:** Requires `credentials: true` in all requests

## 📋 Response Structure

All responses follow this format:

```json
{
  "status": "success" | "error" | "redirect",
  "message": "Human readable message",
  "data": { /* Response data */ },
  "code": "ERROR_CODE" // Only for specific errors like TOKEN_EXPIRED
}
```

## 🔐 Authentication System

### Cookie-Based JWT Authentication

-   **Access Token:** `accessToken` cookie (15 minutes, HttpOnly)
-   **Refresh Token:** `refreshToken` cookie (7 days, HttpOnly)
-   **Automatic:** Cookies set/cleared by API automatically

### User Object

```json
{
	"id": 1,
	"name": "John Doe",
	"email": "john@example.com"
}
```

---

## 🔑 Authentication Routes & Frontend Actions

### Register Button Click

**Route:** `POST /api/auth/register`

**When to Call:** User clicks "Sign Up" or "Register" button

**Request:**

```json
{
	"name": "John Doe",
	"email": "john@example.com",
	"password": "password123"
}
```

**Success Response (201):**

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

**Frontend Action:** Redirect to dashboard/home page after successful registration

**Error Responses:**

-   **400** - Validation errors:
    ```json
    {
    	"status": "error",
    	"message": "Name is required" // or other validation messages
    }
    ```
-   **409** - Duplicate email:
    ```json
    {
    	"status": "error",
    	"message": "User with this email already exists"
    }
    ```
-   **500** - Server error:
    ```json
    {
    	"status": "error",
    	"message": "Registration failed"
    }
    ```

### Login Button Click

**Route:** `POST /api/auth/login`

**When to Call:** User clicks "Login" or "Sign In" button

**Request:**

```json
{
	"email": "john@example.com",
	"password": "password123"
}
```

**Success Response (200):**

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

**Frontend Action:** Redirect to dashboard/home page after successful login

**Error Responses:**

-   **400** - Validation errors:
    ```json
    {
    	"status": "error",
    	"message": "Email is required" // or "Password is required", "Please provide a valid email address"
    }
    ```
-   **401** - Invalid credentials:
    ```json
    {
    	"status": "error",
    	"message": "Invalid email or password"
    }
    ```
-   **500** - Server error:
    ```json
    {
    	"status": "error",
    	"message": "Login failed"
    }
    ```

### Auto Token Refresh

**Route:** `POST /api/auth/refresh`

**When to Call:**

-   When API returns `TOKEN_EXPIRED` error
-   Automatically before token expires
-   On app initialization to check auth status

**Request:** No body required

**Success Response (200):**

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

**Frontend Action:** Continue with original request, update user state

**Error Response (401):**

```json
{
	"status": "error",
	"message": "Token refresh failed"
}
```

**Frontend Action:** Redirect to login page

### Logout Button Click

**Route:** `POST /api/auth/logout`

**When to Call:** User clicks "Logout" or "Sign Out" button

**Request:** No body required

**Success Response (200):**

```json
{
	"status": "success",
	"message": "Logged out successfully"
}
```

**Frontend Action:** Clear user state, redirect to login/home page

### Redirect Protection for Authenticated Users

**Routes:** `POST /api/auth/register` and `POST /api/auth/login`

**When Already Logged In:** API returns redirect response instead of processing

**Response (302):**

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

**Frontend Action:** Redirect to home page, don't show login/register forms

---

## 📝 Posts Routes & Frontend Actions

### Post Object

```json
{
	"id": 1,
	"title": "My Post Title",
	"content": "Post content here",
	"published": true,
	"createdAt": "2024-01-01T00:00:00.000Z",
	"updatedAt": "2024-01-01T00:00:00.000Z",
	"author": {
		"id": 1,
		"name": "John Doe",
		"email": "john@example.com"
	},
	"commentsCount": 5,
	"likesCount": 12,
	"isLikedByUser": false,
	"tags": [
		{
			"id": 1,
			"name": "javascript"
		}
	]
}
```

### Home Page Load / View All Posts

**Route:** `GET /api/posts?published=true`

**When to Call:**

-   Page load for home/blog page
-   "View All Posts" button click
-   Filter toggle between published/draft posts

**Query Parameters:**

-   `published=true` - Only published posts (default)
-   `published=false` - Only draft posts (for admin/own posts)

**Success Response (200):**

```json
{
  "status": "success",
  "message": "Posts fetched successfully",
  "data": {
    "posts": [Post, Post, ...]
  }
}
```

**Frontend Action:** Display posts list, no redirect needed

**Error Response (500):**

```json
{
	"status": "error",
	"message": "Failed to fetch posts"
}
```

### View Single Post Click

**Route:** `GET /api/posts/:postId`

**When to Call:**

-   User clicks on post title/card
-   Direct link to post
-   "Read More" button click

**Success Response (200):**

```json
{
  "status": "success",
  "message": "Post fetched successfully",
  "data": {
    "post": {
      ...Post,
      "comments": [
        {
          "id": 1,
          "content": "Great post!",
          "createdAt": "2024-01-01T00:00:00.000Z",
          "author": {
            "id": 2,
            "name": "Jane Doe"
          }
        }
      ]
    }
  }
}
```

**Frontend Action:** Display post detail page with comments

**Error Responses:**

-   **400** - Invalid post ID:
    ```json
    {
    	"status": "error",
    	"message": "Invalid post ID"
    }
    ```
-   **404** - Post not found:
    ```json
    {
    	"status": "error",
    	"message": "Post not found"
    }
    ```
-   **500** - Server error:
    ```json
    {
    	"status": "error",
    	"message": "Failed to fetch post"
    }
    ```

### Create Post Button Click

**Route:** `POST /api/posts`

**When to Call:**

-   "Create Post" or "Publish" button click
-   "Save Draft" button click (with `published: false`)

**Authentication Required:** Yes - redirect to login if not authenticated

**Request:**

```json
{
	"title": "My New Post",
	"content": "Post content here...",
	"published": true
}
```

**Success Response (201):**

```json
{
  "status": "success",
  "message": "Post created successfully",
  "data": {
    "post": Post
  }
}
```

**Frontend Action:** Redirect to post detail page or posts list

**Error Responses:**

-   **401** - Unauthorized (no token):
    ```json
    {
    	"status": "error",
    	"message": "Access token required. Please login."
    }
    ```
-   **401** - Token expired:
    ```json
    {
    	"status": "error",
    	"message": "Access token expired. Please refresh your token.",
    	"code": "TOKEN_EXPIRED"
    }
    ```
-   **400** - Validation errors:
    ```json
    {
    	"status": "error",
    	"message": "Title is required" // or "Content is required"
    }
    ```
-   **409** - Duplicate title:
    ```json
    {
    	"status": "error",
    	"message": "You already have a post with this title"
    }
    ```
-   **500** - Server error:
    ```json
    {
    	"status": "error",
    	"message": "Failed to create post"
    }
    ```

### Edit Post Button Click

**Route:** `PUT /api/posts/:postId` or `PATCH /api/posts/:postId`

**When to Call:**

-   "Edit" button click on post
-   "Update Post" or "Save Changes" button click

**Authentication Required:** Yes - must be post author

**Request (all fields optional):**

```json
{
	"title": "Updated Title",
	"content": "Updated content",
	"published": false
}
```

**Success Response (200):**

```json
{
  "status": "success",
  "message": "Post updated successfully",
  "data": {
    "post": Post
  }
}
```

**Frontend Action:** Update post in UI, optionally redirect to post detail

**Error Responses:**

-   **400** - Validation errors:
    ```json
    {
    	"status": "error",
    	"message": "Invalid post ID" // or "No update data provided"
    }
    ```
-   **401** - Unauthorized:
    ```json
    {
    	"status": "error",
    	"message": "Access token required. Please login."
    }
    ```
-   **403** - Not post owner:
    ```json
    {
    	"status": "error",
    	"message": "You can only update your own posts"
    }
    ```
-   **404** - Post not found:
    ```json
    {
    	"status": "error",
    	"message": "Post not found"
    }
    ```
-   **409** - Title conflict:
    ```json
    {
    	"status": "error",
    	"message": "You already have a post with this title"
    }
    ```
-   **500** - Server error:
    ```json
    {
    	"status": "error",
    	"message": "Failed to update post"
    }
    ```

### Delete Post Button Click

**Route:** `DELETE /api/posts/:postId`

**When to Call:**

-   "Delete" button click (usually with confirmation dialog)
-   "Move to Trash" button click

**Authentication Required:** Yes - must be post author

**Success Response (200):**

```json
{
	"status": "success",
	"message": "Post deleted successfully"
}
```

**Frontend Action:** Remove post from UI, redirect to posts list if on detail page

**Error Responses:**

-   **400** - Invalid post ID:
    ```json
    {
    	"status": "error",
    	"message": "Invalid post ID"
    }
    ```
-   **401** - Unauthorized:
    ```json
    {
    	"status": "error",
    	"message": "Access token required. Please login."
    }
    ```
-   **403** - Not post owner:
    ```json
    {
    	"status": "error",
    	"message": "You can only delete your own posts"
    }
    ```
-   **404** - Post not found:
    ```json
    {
    	"status": "error",
    	"message": "Post not found"
    }
    ```
-   **500** - Server error:
    ```json
    {
    	"status": "error",
    	"message": "Failed to delete post"
    }
    ```

### My Posts Page Load

**Route:** `GET /api/posts/my/posts`

**When to Call:**

-   "My Posts" navigation click
-   "Dashboard" or "My Content" page load

**Authentication Required:** Yes

**Success Response (200):**

```json
{
  "status": "success",
  "message": "Your posts fetched successfully",
  "data": {
    "posts": [Post, Post, ...]
  }
}
```

**Frontend Action:** Display user's posts (both published and drafts)

**Error Responses:**

-   **401** - Unauthorized:
    ```json
    {
    	"status": "error",
    	"message": "Access token required. Please login."
    }
    ```
-   **500** - Server error:
    ```json
    {
    	"status": "error",
    	"message": "Failed to fetch your posts"
    }
    ```

### User Profile Posts Click

**Route:** `GET /api/posts/user/:userId`

**When to Call:**

-   Click on author name/profile
-   "View Author's Posts" button click
-   User profile page load

**Success Response (200):**

```json
{
  "status": "success",
  "message": "User posts fetched successfully",
  "data": {
    "posts": [Post, Post, ...]
  }
}
```

**Frontend Action:** Display user's published posts only (unless viewing own profile)

**Error Responses:**

-   **400** - Invalid user ID:
    ```json
    {
    	"status": "error",
    	"message": "Invalid user ID"
    }
    ```
-   **404** - User not found:
    ```json
    {
    	"status": "error",
    	"message": "User not found"
    }
    ```
-   **500** - Server error:
    ```json
    {
    	"status": "error",
    	"message": "Failed to fetch user posts"
    }
    ```

---

## 💬 Interactions Routes & Frontend Actions

### Comment Object

```json
{
	"id": 1,
	"content": "This is my comment",
	"createdAt": "2024-01-01T00:00:00.000Z",
	"author": {
		"id": 1,
		"name": "John Doe"
	}
}
```

### Load Comments

**Route:** `GET /api/interactions/posts/:postId/comments`

**When to Call:**

-   Post detail page load
-   "Show Comments" button click
-   "Refresh Comments" action

**Success Response (200):**

```json
{
  "status": "success",
  "message": "Comments fetched successfully",
  "data": {
    "comments": [Comment, Comment, ...]
  }
}
```

**Frontend Action:** Display comments list under post

**Error Responses:**

-   **400** - Invalid post ID:
    ```json
    {
    	"status": "error",
    	"message": "Invalid post ID"
    }
    ```
-   **404** - Post not found:
    ```json
    {
    	"status": "error",
    	"message": "Post not found"
    }
    ```
-   **500** - Server error:
    ```json
    {
    	"status": "error",
    	"message": "Failed to fetch comments"
    }
    ```

### Add Comment Button Click

**Route:** `POST /api/interactions/posts/:postId/comments`

**When to Call:**

-   "Post Comment" or "Submit" button click
-   "Reply" button click (if implementing)

**Authentication Required:** Yes

**Request:**

```json
{
	"content": "This is my comment"
}
```

**Success Response (201):**

```json
{
  "status": "success",
  "message": "Comment added successfully",
  "data": {
    "comment": Comment
  }
}
```

**Frontend Action:** Add comment to comments list, clear comment form

**Error Responses:**

-   **400** - Validation errors:
    ```json
    {
    	"status": "error",
    	"message": "Comment content is required" // or "Invalid post ID"
    }
    ```
-   **401** - Unauthorized:
    ```json
    {
    	"status": "error",
    	"message": "Access token required. Please login."
    }
    ```
-   **404** - Post not found:
    ```json
    {
    	"status": "error",
    	"message": "Post not found"
    }
    ```
-   **500** - Server error:
    ```json
    {
    	"status": "error",
    	"message": "Failed to add comment"
    }
    ```

### Edit Comment Button Click

**Route:** `PUT /api/interactions/comments/:commentId` or
`PATCH /api/interactions/comments/:commentId`

**When to Call:**

-   "Edit" button click on comment
-   "Save Changes" button click in edit mode

**Authentication Required:** Yes - must be comment author

**Request:**

```json
{
	"content": "Updated comment content"
}
```

**Success Response (200):**

```json
{
  "status": "success",
  "message": "Comment updated successfully",
  "data": {
    "comment": Comment
  }
}
```

**Frontend Action:** Update comment in UI, exit edit mode

**Error Responses:**

-   **400** - Validation errors:
    ```json
    {
    	"status": "error",
    	"message": "Comment content is required" // or "Invalid comment ID"
    }
    ```
-   **401** - Unauthorized:
    ```json
    {
    	"status": "error",
    	"message": "Access token required. Please login."
    }
    ```
-   **403** - Not comment owner:
    ```json
    {
    	"status": "error",
    	"message": "You can only update your own comments"
    }
    ```
-   **404** - Comment not found:
    ```json
    {
    	"status": "error",
    	"message": "Comment not found"
    }
    ```
-   **500** - Server error:
    ```json
    {
    	"status": "error",
    	"message": "Failed to update comment"
    }
    ```

### Delete Comment Button Click

**Route:** `DELETE /api/interactions/comments/:commentId`

**When to Call:**

-   "Delete" button click on comment (with confirmation)
-   "Remove" action click

**Authentication Required:** Yes - must be comment author

**Success Response (200):**

```json
{
	"status": "success",
	"message": "Comment deleted successfully"
}
```

**Frontend Action:** Remove comment from UI

**Error Responses:**

-   **400** - Invalid comment ID:
    ```json
    {
    	"status": "error",
    	"message": "Invalid comment ID"
    }
    ```
-   **401** - Unauthorized:
    ```json
    {
    	"status": "error",
    	"message": "Access token required. Please login."
    }
    ```
-   **403** - Not comment owner:
    ```json
    {
    	"status": "error",
    	"message": "You can only delete your own comments"
    }
    ```
-   **404** - Comment not found:
    ```json
    {
    	"status": "error",
    	"message": "Comment not found"
    }
    ```
-   **500** - Server error:
    ```json
    {
    	"status": "error",
    	"message": "Failed to delete comment"
    }
    ```

### Like/Unlike Button Click

**Route:** `POST /api/interactions/posts/:postId/like`

**When to Call:**

-   "Like" button click (heart, thumbs up, etc.)
-   "Unlike" button click (same button, toggle behavior)

**Authentication Required:** Yes

**Success Response (200):**

```json
{
	"status": "success",
	"message": "Post liked successfully", // or "Post unliked successfully"
	"data": {
		"isLiked": true,
		"likeCount": 5
	}
}
```

**Frontend Action:**

-   Update like button state (filled/unfilled)
-   Update like count display
-   No redirect needed

**Error Responses:**

-   **400** - Invalid post ID:
    ```json
    {
    	"status": "error",
    	"message": "Invalid post ID"
    }
    ```
-   **401** - Unauthorized:
    ```json
    {
    	"status": "error",
    	"message": "Access token required. Please login."
    }
    ```
-   **404** - Post not found:
    ```json
    {
    	"status": "error",
    	"message": "Post not found"
    }
    ```
-   **500** - Server error:
    ```json
    {
    	"status": "error",
    	"message": "Failed to toggle like"
    }
    ```

---

## 👤 Profile Routes & Frontend Actions

### Profile Object

```json
{
	"id": 1,
	"name": "John Doe",
	"email": "john@example.com",
	"bio": "This is my bio"
}
```

### Profile Page Load

**Route:** `GET /api/profile`

**When to Call:**

-   "Profile" navigation click
-   "Settings" or "Account" page load
-   "Edit Profile" button click

**Authentication Required:** Yes

**Success Response (200):**

```json
{
  "status": "success",
  "message": "Profile fetched successfully",
  "data": {
    "profile": Profile
  }
}
```

**Frontend Action:** Display profile information in form/view

**Error Responses:**

-   **401** - Unauthorized:
    ```json
    {
    	"status": "error",
    	"message": "Access token required. Please login."
    }
    ```
-   **404** - User not found:
    ```json
    {
    	"status": "error",
    	"message": "User not found"
    }
    ```
-   **500** - Server error:
    ```json
    {
    	"status": "error",
    	"message": "Failed to fetch profile"
    }
    ```

### Update Profile Button Click

**Route:** `PUT /api/profile` or `PATCH /api/profile`

**When to Call:**

-   "Save Profile" button click
-   "Update" button click in profile form

**Authentication Required:** Yes

**Request (all fields optional):**

```json
{
	"name": "Updated Name",
	"bio": "Updated bio content"
}
```

**Success Response (200):**

```json
{
  "status": "success",
  "message": "Profile updated successfully",
  "data": {
    "profile": Profile
  }
}
```

**Frontend Action:** Update profile display, show success message

**Error Responses:**

-   **400** - Validation errors:
    ```json
    {
    	"status": "error",
    	"message": "No update data provided" // or "Name must be at least 2 characters long"
    }
    ```
-   **401** - Unauthorized:
    ```json
    {
    	"status": "error",
    	"message": "Access token required. Please login."
    }
    ```
-   **404** - User not found:
    ```json
    {
    	"status": "error",
    	"message": "User not found"
    }
    ```
-   **500** - Server error:
    ```json
    {
    	"status": "error",
    	"message": "Failed to update profile"
    }
    ```

---

## 🏷️ Tags Routes & Frontend Actions

### Tag Object

```json
{
	"id": 1,
	"name": "javascript",
	"postsCount": 15
}
```

### Load All Tags

**Route:** `GET /api/tags`

**When to Call:**

-   Tags page load
-   Tag selector dropdown load
-   "Browse Tags" button click

**Success Response (200):**

```json
{
  "status": "success",
  "message": "Tags fetched successfully",
  "data": {
    "tags": [Tag, Tag, ...]
  }
}
```

**Frontend Action:** Display tags list or populate dropdown

**Error Response (500):**

```json
{
	"status": "error",
	"message": "Failed to fetch tags"
}
```

### Tag Click / Filter by Tag

**Route:** `GET /api/tags/:tagId/posts`

**When to Call:**

-   Tag button/chip click
-   "View posts with this tag" click
-   Tag filter selection

**Success Response (200):**

```json
{
  "status": "success",
  "message": "Posts fetched successfully",
  "data": {
    "posts": [Post, Post, ...]
  }
}
```

**Frontend Action:** Display filtered posts, update URL/breadcrumb

**Error Responses:**

-   **400** - Invalid tag ID:
    ```json
    {
    	"status": "error",
    	"message": "Invalid tag ID"
    }
    ```
-   **404** - Tag not found:
    ```json
    {
    	"status": "error",
    	"message": "Tag not found"
    }
    ```
-   **500** - Server error:
    ```json
    {
    	"status": "error",
    	"message": "Failed to fetch posts by tag"
    }
    ```

### Add Tag to Post Button Click

**Route:** `POST /api/tags/posts/:postId`

**When to Call:**

-   "Add Tag" button click in post editor
-   Tag input submit in post form
-   "Save Tags" button click

**Authentication Required:** Yes - must be post author

**Request:**

```json
{
	"tagName": "javascript"
}
```

**Success Response (201):**

```json
{
	"status": "success",
	"message": "Tag added to post successfully",
	"data": {
		"tag": {
			"id": 1,
			"name": "javascript"
		}
	}
}
```

**Frontend Action:** Add tag to post's tag list, clear input

**Error Responses:**

-   **400** - Validation errors:
    ```json
    {
    	"status": "error",
    	"message": "Tag name is required" // or validation rules
    }
    ```
-   **401** - Unauthorized:
    ```json
    {
    	"status": "error",
    	"message": "Access token required. Please login."
    }
    ```
-   **403** - Not post owner:
    ```json
    {
    	"status": "error",
    	"message": "You can only add tags to your own posts"
    }
    ```
-   **404** - Post not found:
    ```json
    {
    	"status": "error",
    	"message": "Post not found"
    }
    ```
-   **409** - Tag already exists:
    ```json
    {
    	"status": "error",
    	"message": "Tag already exists on this post"
    }
    ```
-   **500** - Server error:
    ```json
    {
    	"status": "error",
    	"message": "Failed to add tag to post"
    }
    ```

### Remove Tag from Post Click

**Route:** `DELETE /api/tags/posts/:postId/:tagId`

**When to Call:**

-   "X" button click on tag chip
-   "Remove Tag" button click
-   Tag deletion in post editor

**Authentication Required:** Yes - must be post author

**Success Response (200):**

```json
{
	"status": "success",
	"message": "Tag removed from post successfully"
}
```

**Frontend Action:** Remove tag from post's tag list

**Error Responses:**

-   **400** - Invalid IDs:
    ```json
    {
    	"status": "error",
    	"message": "Invalid post ID" // or "Invalid tag ID"
    }
    ```
-   **401** - Unauthorized:
    ```json
    {
    	"status": "error",
    	"message": "Access token required. Please login."
    }
    ```
-   **403** - Not post owner:
    ```json
    {
      "status": "error",
      "message": "You can only remove tags from your own posts"
    ```
