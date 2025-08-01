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
  "code": "ERROR_CODE" // Only for specific errors
}
```

## 🔐 Authentication System

### Cookie-Based JWT Authentication
- **Access Token:** `accessToken` cookie (15 minutes, HttpOnly)
- **Refresh Token:** `refreshToken` cookie (7 days, HttpOnly)
- **Automatic:** Cookies set/cleared by API automatically

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
- **400** - Show validation errors on form
- **409** - Show "Email already exists" error
- **500** - Show generic error message

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
- **400** - Show validation errors on form
- **401** - Show "Invalid credentials" error
- **500** - Show generic error message

### Auto Token Refresh
**Route:** `POST /api/auth/refresh`

**When to Call:** 
- When API returns `TOKEN_EXPIRED` error
- Automatically before token expires
- On app initialization to check auth status

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

**Error Response (401):** Redirect to login page

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
- Page load for home/blog page
- "View All Posts" button click
- Filter toggle between published/draft posts

**Query Parameters:**
- `published=true` - Only published posts (default)
- `published=false` - Only draft posts (for admin/own posts)

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

### View Single Post Click
**Route:** `GET /api/posts/:postId`

**When to Call:** 
- User clicks on post title/card
- Direct link to post
- "Read More" button click

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

**Error Response (404):** Show "Post not found" page or redirect to home

### Create Post Button Click
**Route:** `POST /api/posts`

**When to Call:** 
- "Create Post" or "Publish" button click
- "Save Draft" button click (with `published: false`)

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
- **401** - Redirect to login page
- **400** - Show validation errors on form
- **409** - Show "Title already exists" error

### Edit Post Button Click
**Route:** `PUT /api/posts/:postId` or `PATCH /api/posts/:postId`

**When to Call:** 
- "Edit" button click on post
- "Update Post" or "Save Changes" button click

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
- **401** - Redirect to login page
- **403** - Show "Not authorized" error
- **404** - Show "Post not found" error

### Delete Post Button Click
**Route:** `DELETE /api/posts/:postId`

**When to Call:** 
- "Delete" button click (usually with confirmation dialog)
- "Move to Trash" button click

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
- **401** - Redirect to login page
- **403** - Show "Not authorized" error
- **404** - Show "Post not found" error

### My Posts Page Load
**Route:** `GET /api/posts/my/posts`

**When to Call:** 
- "My Posts" navigation click
- "Dashboard" or "My Content" page load

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

**Error Response (401):** Redirect to login page

### User Profile Posts Click
**Route:** `GET /api/posts/user/:userId`

**When to Call:** 
- Click on author name/profile
- "View Author's Posts" button click
- User profile page load

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

**Error Response (404):** Show "User not found" page

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
- Post detail page load
- "Show Comments" button click
- "Refresh Comments" action

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

### Add Comment Button Click
**Route:** `POST /api/interactions/posts/:postId/comments`

**When to Call:** 
- "Post Comment" or "Submit" button click
- "Reply" button click (if implementing)

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
- **401** - Redirect to login or show login modal
- **400** - Show validation error on form
- **404** - Show "Post not found" error

### Edit Comment Button Click
**Route:** `PUT /api/interactions/comments/:commentId` or `PATCH /api/interactions/comments/:commentId`

**When to Call:** 
- "Edit" button click on comment
- "Save Changes" button click in edit mode

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
- **401** - Redirect to login page
- **403** - Show "Not authorized" error
- **404** - Show "Comment not found" error

### Delete Comment Button Click
**Route:** `DELETE /api/interactions/comments/:commentId`

**When to Call:** 
- "Delete" button click on comment (with confirmation)
- "Remove" action click

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
- **401** - Redirect to login page
- **403** - Show "Not authorized" error
- **404** - Show "Comment not found" error

### Like/Unlike Button Click
**Route:** `POST /api/interactions/posts/:postId/like`

**When to Call:** 
- "Like" button click (heart, thumbs up, etc.)
- "Unlike" button click (same button, toggle behavior)

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
- Update like button state (filled/unfilled)
- Update like count display
- No redirect needed

**Error Responses:**
- **401** - Redirect to login or show login modal
- **404** - Show "Post not found" error

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
- "Profile" navigation click
- "Settings" or "Account" page load
- "Edit Profile" button click

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

**Error Response (401):** Redirect to login page

### Update Profile Button Click
**Route:** `PUT /api/profile` or `PATCH /api/profile`

**When to Call:** 
- "Save Profile" button click
- "Update" button click in profile form

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
- **401** - Redirect to login page
- **400** - Show validation errors on form

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
- Tags page load
- Tag selector dropdown load
- "Browse Tags" button click

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

### Tag Click / Filter by Tag
**Route:** `GET /api/tags/:tagId/posts`

**When to Call:** 
- Tag button/chip click
- "View posts with this tag" click
- Tag filter selection

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

**Error Response (404):** Show "Tag not found" message

### Add Tag to Post Button Click
**Route:** `POST /api/tags/posts/:postId`

**When to Call:** 
- "Add Tag" button click in post editor
- Tag input submit in post form
- "Save Tags" button click

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
- **401** - Redirect to login page
- **403** - Show "Not authorized" error
- **400** - Show validation error
- **409** - Show "Tag already exists on post" error

### Remove Tag from Post Click
**Route:** `DELETE /api/tags/posts/:postId/:tagId`

**When to Call:** 
- "X" button click on tag chip
- "Remove Tag" button click
- Tag deletion in post editor

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
- **401** - Redirect to login page
- **403** - Show "Not authorized" error
- **404** - Show "Tag not found on post" error

### My Liked Tags Page Load
**Route:** `GET /api/tags/liked`

**When to Call:** 
- "My Interests" page load
- "Liked Tags" navigation click
- "My Tags" section load

**Authentication Required:** Yes

**Success Response (200):**
```json
{
  "status": "success",
  "message": "Your liked tags fetched successfully",
  "data": {
    "tags": [Tag, Tag, ...]
  }
}
```

**Frontend Action:** Display user's liked tags (from posts they liked)

**Error Response (401):** Redirect to login page

---

## 🌐 Additional Routes & Actions

### Health Check
**Route:** `GET /health`

**When to Call:** 
- App initialization
- Connection testing
- Server status monitoring

**Response (200):**
```json
{
  "status": "success",
  "message": "Server is running",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "development"
}
```

**Frontend Action:** Update connection status indicator

### API Info
**Route:** `GET /api`

**When to Call:** 
- API discovery
- Documentation link click

**Response (200):**
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

### Home Route
**Route:** `GET /`

**When to Call:** Home page load (alternative to `/api/posts`)

**Response:** Same as `GET /api/posts` with published posts

---

## 🚨 Error Handling & Redirects

### HTTP Status Codes
- **200** - Success (GET, PUT, PATCH, DELETE)
- **201** - Created (POST)
- **302** - Redirect (already authenticated)
- **400** - Bad Request (validation errors)
- **401** - Unauthorized (auth required/expired)
- **403** - Forbidden (not your resource)
- **404** - Not Found (resource doesn't exist)
- **409** - Conflict (duplicate data)
- **500** - Server Error

### Token Expiration Handling
When any API call returns:

```json
{
  "status": "error",
  "message": "Access token expired. Please refresh your token.",
  "code": "TOKEN_EXPIRED"
}
```

**Frontend Action:**
1. Call `POST /api/auth/refresh`
2. If refresh succeeds → retry original request
3. If refresh fails → redirect to login page

### Authentication Required Errors
When unauthenticated user tries protected action:

```json
{
  "status": "error",
  "message": "Access token required. Please login."
}
```

**Frontend Action:** 
- Show login modal, OR
- Redirect to login page with return URL

### Authorization Errors
When user tries to modify others' content:

```json
{
  "status": "error",
  "message": "You can only update your own posts"
}
```

**Frontend Action:** Show error message, don't redirect

### 404 Errors
For API routes:
```json
{
  "status": "error",
  "message": "API endpoint not found",
  "availableEndpoints": ["/api/auth", "/api/posts", "/api/interactions", "/api/profile", "/api/tags"]
}
```

For other routes:
```json
{
  "status": "error",
  "message": "Route not found"
}
```

**Frontend Action:** Show 404 page or redirect to home

---

## 🔄 Frontend Route Changes Based on API Responses

### When to Change Frontend Routes

1. **Successful Login/Register** → Redirect to dashboard/home
2. **Successful Logout** → Redirect to login/home  
3. **401 Authentication Required** → Redirect to login
4. **Already Authenticated (302)** → Redirect to home
5. **Post Created** → Redirect to post detail or posts list
6. **Post Deleted** → Redirect to posts list (if on detail page)
7. **404 Post Not Found** → Redirect to home or show 404 page
8. **404 User Not Found** → Redirect to home or show 404 page

### When NOT to Change Routes

1. **Like/Unlike Actions** → Update UI state only
2. **Comment Add/Edit/Delete** → Update comments list only
3. **Tag Add/Remove** → Update tags list only
4. **Profile Update** → Show success message only
5. **Load Comments/Tags** → Update relevant UI section only
6. **Validation Errors (400)** → Show errors on current form
7. **Authorization Errors (403)** → Show error message on current page

---

## 🔐 Authentication Flow & Route Protection

### Public Routes (No Auth Required)
- `GET /health`
- `GET /api`
- `GET /`
- `GET /api/posts` (published only)
- `GET /api/posts/:postId`
- `GET /api/posts/user/:userId` (published only)
- `GET /api/interactions/posts/:postId/comments`
- `GET /api/tags`
- `GET /api/tags/:tagId/posts`

### Protected Routes (Auth Required)
- `GET /api/posts/my/posts`
- `POST /api/posts`
- `PUT/PATCH /api/posts/:postId`
- `DELETE /api/posts/:postId`
- `POST /api/interactions/posts/:postId/comments`
- `PUT/PATCH /api/interactions/comments/:commentId`
- `DELETE /api/interactions/comments/:commentId`
- `POST /api/interactions/posts/:postId/like`
- `GET /api/profile`
- `PUT/PATCH /api/profile`
- `POST /api/tags/posts/:postId`
- `DELETE /api/tags/posts/:postId/:tagId`
- `GET /api/tags/liked`

### Auth-Blocked Routes (Redirect if Authenticated)
- `POST /api/auth/register`
- `POST /api/auth/login`

---

## 🛠️ Data Validation Rules

### Posts
- **Title:** Required, max 50 characters, unique per user
- **Content:** Required, max 191 characters
- **Published:** Boolean, defaults to false

### Comments
- **Content:** Required, max 500 characters, min 1 character

### Tags
- **Name:** Required, 2-20 characters, lowercase, alphanumeric + hyphens only

### User Registration
- **Name:** Required, min 2 characters, max 50 characters
- **Email:** Required, valid email format, unique globally
- **Password:** Required, min 6 characters, max 128 characters

### Profile Updates
- **Name:** Optional, min 2 characters if provided
- **Bio:** Optional, any length

---

## ⚠️ Not Implemented Features

- Email verification
- Password reset
- File uploads
- Real-time notifications
- Search functionality
- Pagination
- User roles/admin panel
- Post categories
- Email notifications
- Two-factor authentication
- Social login
- Post scheduling
- Image handling
- Rich text editor API
- Bulk operations
- Data export
- User blocking
- Report system