# Blog API Documentation for Frontend Development

## 🚀 Server Configuration

**Base URL:** `http://localhost:3000`
**Environment:** Development
**Authentication:** Cookie-based JWT tokens (automatic handling)

## 📋 General API Response Structure

All API responses follow this consistent structure:

```json
{
  "status": "success" | "error" | "redirect",
  "message": "Human readable message",
  "data": { /* Response data */ },
  "code": "ERROR_CODE" // Only for specific errors
}
```

## 🔐 Authentication System

### Cookie-Based Authentication
- **Access Token:** `accessToken` (15 minutes, HttpOnly)
- **Refresh Token:** `refreshToken` (7 days, HttpOnly)
- **Automatic:** Cookies are set/cleared automatically by the API

### Auth States for Frontend
```typescript
interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
}

interface User {
  id: number;
  name: string;
  email: string;
}
```

---

## 📚 API Endpoints

### 🔑 Authentication Endpoints

#### 1. Register New User
```http
POST /api/auth/register
```

**Request Body:**
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

**Error Responses:**
- `400` - Validation errors (missing/invalid fields)
- `409` - User already exists
- `500` - Registration failed

#### 2. Login User
```http
POST /api/auth/login
```

**Request Body:**
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

**Error Responses:**
- `400` - Validation errors
- `401` - Invalid credentials
- `500` - Login failed

#### 3. Refresh Token
```http
POST /api/auth/refresh
```

**No Request Body Required**

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

**Error Response (401):**
```json
{
  "status": "error",
  "message": "Token refresh failed"
}
```

#### 4. Logout User
```http
POST /api/auth/logout
```

**Success Response (200):**
```json
{
  "status": "success",
  "message": "Logged out successfully"
}
```

---

### 📝 Post Management Endpoints

#### Post Object Structure
```typescript
interface Post {
  id: number;
  title: string;
  content: string;
  published: boolean;
  createdAt: string; // ISO date
  updatedAt: string; // ISO date
  author: {
    id: number;
    name: string;
    email: string;
  };
  commentsCount: number;
  likesCount: number;
  isLikedByUser: boolean; // false if not authenticated
  tags: Tag[];
}

interface Tag {
  id: number;
  name: string;
}
```

#### 1. Get All Posts
```http
GET /api/posts?published=true
```

**Query Parameters:**
- `published` (optional): `"true"` | `"false"` - Default: `"true"`

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

#### 2. Get Single Post
```http
GET /api/posts/:postId
```

**Success Response (200):**
```json
{
  "status": "success",
  "message": "Post fetched successfully",
  "data": {
    "post": {
      ...Post,
      "comments": [Comment, Comment, ...]
    }
  }
}
```

**Error Response (404):**
```json
{
  "status": "error",
  "message": "Post not found"
}
```

#### 3. Create Post (Auth Required)
```http
POST /api/posts
```

**Request Body:**
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

**Error Responses:**
- `400` - Validation errors
- `401` - Authentication required
- `409` - Title already exists for user
- `500` - Creation failed

#### 4. Update Post (Auth Required)
```http
PUT /api/posts/:postId
PATCH /api/posts/:postId
```

**Request Body:**
```json
{
  "title": "Updated Title", // optional
  "content": "Updated content", // optional
  "published": false // optional
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

**Error Responses:**
- `400` - Validation errors
- `401` - Authentication required
- `403` - Not your post
- `404` - Post not found
- `409` - Title already exists

#### 5. Delete Post (Auth Required)
```http
DELETE /api/posts/:postId
```

**Success Response (200):**
```json
{
  "status": "success",
  "message": "Post deleted successfully"
}
```

#### 6. Get My Posts (Auth Required)
```http
GET /api/posts/my/posts
```

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

#### 7. Get User Posts
```http
GET /api/posts/user/:userId
```

**Success Response (200):**
```json
{
  "status": "success",
  "message": "User posts fetched successfully",
  "data": {
    "posts": [Post, Post, ...] // Only published if not own posts
  }
}
```

---

### 💬 Comments & Likes (Interactions)

#### Comment Object Structure
```typescript
interface Comment {
  id: number;
  content: string;
  createdAt: string; // ISO date
  author: {
    id: number;
    name: string;
  };
}
```

#### 1. Get Comments for Post
```http
GET /api/interactions/posts/:postId/comments
```

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

#### 2. Add Comment (Auth Required)
```http
POST /api/interactions/posts/:postId/comments
```

**Request Body:**
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

#### 3. Update Comment (Auth Required)
```http
PUT /api/interactions/comments/:commentId
PATCH /api/interactions/comments/:commentId
```

**Request Body:**
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

#### 4. Delete Comment (Auth Required)
```http
DELETE /api/interactions/comments/:commentId
```

**Success Response (200):**
```json
{
  "status": "success",
  "message": "Comment deleted successfully"
}
```

#### 5. Toggle Like (Auth Required)
```http
POST /api/interactions/posts/:postId/like
```

**Success Response (200):**
```json
{
  "status": "success",
  "message": "Post liked successfully" | "Post unliked successfully",
  "data": {
    "isLiked": true,
    "likeCount": 5
  }
}
```

---

### 👤 Profile Management

#### Profile Object Structure
```typescript
interface Profile {
  id: number;
  name: string;
  email: string;
  bio: string;
}
```

#### 1. Get My Profile (Auth Required)
```http
GET /api/profile
```

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

#### 2. Update Profile (Auth Required)
```http
PUT /api/profile
PATCH /api/profile
```

**Request Body:**
```json
{
  "name": "Updated Name", // optional
  "bio": "Updated bio content" // optional
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

---

### 🏷️ Tags Management

#### Tag Object Structure
```typescript
interface TagWithCount {
  id: number;
  name: string;
  postsCount: number;
}
```

#### 1. Get All Tags
```http
GET /api/tags
```

**Success Response (200):**
```json
{
  "status": "success",
  "message": "Tags fetched successfully",
  "data": {
    "tags": [TagWithCount, TagWithCount, ...]
  }
}
```

#### 2. Get Posts by Tag
```http
GET /api/tags/:tagId/posts
```

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

#### 3. Add Tag to Post (Auth Required)
```http
POST /api/tags/posts/:postId
```

**Request Body:**
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

#### 4. Remove Tag from Post (Auth Required)
```http
DELETE /api/tags/posts/:postId/:tagId
```

**Success Response (200):**
```json
{
  "status": "success",
  "message": "Tag removed from post successfully"
}
```

#### 5. Get My Liked Tags (Auth Required)
```http
GET /api/tags/liked
```

**Success Response (200):**
```json
{
  "status": "success",
  "message": "Your liked tags fetched successfully",
  "data": {
    "tags": [TagWithCount, TagWithCount, ...]
  }
}
```

---

## 🚨 Error Handling

### Common HTTP Status Codes

| Code | Meaning | When It Occurs |
|------|---------|----------------|
| `200` | Success | Successful GET, PUT, PATCH, DELETE |
| `201` | Created | Successful POST (creation) |
| `400` | Bad Request | Validation errors, missing required fields |
| `401` | Unauthorized | Authentication required or token expired |
| `403` | Forbidden | Access denied (not your resource) |
| `404` | Not Found | Resource doesn't exist |
| `409` | Conflict | Duplicate data (email exists, title exists) |
| `500` | Server Error | Internal server error |

### Token Expiration Handling

When access token expires:
```json
{
  "status": "error",
  "message": "Access token expired. Please refresh your token.",
  "code": "TOKEN_EXPIRED"
}
```

**Frontend should:**
1. Detect `TOKEN_EXPIRED` code
2. Call `POST /api/auth/refresh`
3. Retry original request
4. If refresh fails, redirect to login

---

## 🔧 React Frontend Implementation Guide

### 1. Setup Axios with Interceptors

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000',
  withCredentials: true, // Important for cookies
});

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.data?.code === 'TOKEN_EXPIRED') {
      try {
        await api.post('/api/auth/refresh');
        return api.request(error.config); // Retry original request
      } catch (refreshError) {
        // Redirect to login
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
```

### 2. Auth Context Provider

```typescript
interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);
```

### 3. API Service Functions

```typescript
// Posts API
export const postsAPI = {
  getAll: (published = true) => 
    api.get(`/api/posts?published=${published}`),
  
  getById: (id: number) => 
    api.get(`/api/posts/${id}`),
  
  create: (data: CreatePostData) => 
    api.post('/api/posts', data),
  
  update: (id: number, data: UpdatePostData) => 
    api.put(`/api/posts/${id}`, data),
  
  delete: (id: number) => 
    api.delete(`/api/posts/${id}`),
  
  getMy: () => 
    api.get('/api/posts/my/posts'),
};

// Comments API
export const commentsAPI = {
  getForPost: (postId: number) => 
    api.get(`/api/interactions/posts/${postId}/comments`),
  
  add: (postId: number, content: string) => 
    api.post(`/api/interactions/posts/${postId}/comments`, { content }),
  
  update: (id: number, content: string) => 
    api.put(`/api/interactions/comments/${id}`, { content }),
  
  delete: (id: number) => 
    api.delete(`/api/interactions/comments/${id}`),
};

// Likes API
export const likesAPI = {
  toggle: (postId: number) => 
    api.post(`/api/interactions/posts/${postId}/like`),
};
```

### 4. React Query Integration

```typescript
// Custom hooks with React Query
export const useGetPosts = (published = true) => {
  return useQuery({
    queryKey: ['posts', published],
    queryFn: () => postsAPI.getAll(published),
  });
};

export const useGetPost = (id: number) => {
  return useQuery({
    queryKey: ['post', id],
    queryFn: () => postsAPI.getById(id),
  });
};

export const useCreatePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: postsAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['posts']);
    },
  });
};
```

### 5. Error Handling Component

```typescript
interface ApiError {
  response?: {
    data: {
      status: 'error';
      message: string;
      code?: string;
    };
  };
}

const ErrorMessage: React.FC<{ error: ApiError }> = ({ error }) => {
  const message = error.response?.data?.message || 'Something went wrong';
  return <div className="error-message">{message}</div>;
};
```

---

## 🛡️ Security Considerations for Frontend

1. **No Token Storage:** Tokens are handled via HttpOnly cookies
2. **CORS:** Configured for `http://localhost:3000`
3. **Input Validation:** Always validate on frontend before sending
4. **XSS Protection:** API sanitizes all inputs
5. **Error Messages:** Don't expose sensitive information

---

## 🧪 Testing the API

### Using curl:

```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}' \
  -c cookies.txt

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' \
  -c cookies.txt

# Create Post
curl -X POST http://localhost:3000/api/posts \
  -H "Content-Type: application/json" \
  -d '{"title":"My First Post","content":"Hello World!","published":true}' \
  -b cookies.txt
```

### Health Check:
```bash
curl http://localhost:3000/health
```

---

## 📝 Additional Notes for me

1. **Database:** MySQL with Prisma ORM
2. **Pagination:** Not implemented yet (ready for future enhancement)
3. **File Uploads:** Not implemented (posts are text-only)
4. **Real-time:** Not implemented (no WebSocket support)
5. **Email Verification:** Not implemented
6. **Password Reset:** Not implemented

This API is production-ready for a blog platform with all core features implemented and properly secured.
