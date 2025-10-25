# Blog Platform Frontend

A modern, full-featured blog platform built with Next.js 16, React 19, and TypeScript.

## Features

- **User Authentication**: JWT-based authentication with HTTP-only cookies
- **Post Management**: Create, edit, delete, and publish blog posts
- **Comments System**: Add, edit, and delete comments on posts
- **Likes System**: Like/unlike posts with optimistic updates
- **Tags System**: Organize posts with tags
- **User Profiles**: View and edit user information
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Advanced Caching**: TanStack Query with optimistic updates
- **State Management**: Redux Toolkit for global UI state

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **UI Library**: React 19
- **Language**: TypeScript
- **State Management**: Redux Toolkit + TanStack Query
- **Styling**: Tailwind CSS v4
- **Forms**: React Hook Form + Zod
- **HTTP Client**: Axios
- **Icons**: Lucide React
- **Notifications**: Sonner
- **UI Components**: shadcn/ui

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
\`\`\`bash
git clone <repository-url>
cd blog-frontend
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Set up environment variables:
\`\`\`bash
cp .env.example .env.local
\`\`\`

4. Update `.env.local` with your API URL:
\`\`\`
NEXT_PUBLIC_API_URL=http://localhost:3000
\`\`\`

### Development

Start the development server:
\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

Build for production:
\`\`\`bash
npm run build
npm start
\`\`\`

## Project Structure

\`\`\`
blog-frontend/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth routes
│   ├── (protected)/       # Protected routes
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── auth/              # Auth components
│   ├── comments/          # Comment components
│   ├── layout/            # Layout components
│   ├── posts/             # Post components
│   ├── tags/              # Tag components
│   ├── user/              # User components
│   ├── ui/                # UI components
│   └── providers.tsx      # Redux & Query providers
├── hooks/                 # Custom React hooks
├── lib/                   # Utility functions
├── services/              # API service layer
├── store/                 # Redux store
├── types/                 # TypeScript types
└── middleware.ts          # Next.js middleware
\`\`\`

## API Integration

The frontend connects to a Blog API backend. Ensure the backend is running on the URL specified in `NEXT_PUBLIC_API_URL`.

### Key API Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/posts` - Get all posts
- `POST /api/posts` - Create post (protected)
- `GET /api/posts/:id` - Get post details
- `PUT /api/posts/:id` - Update post (protected)
- `DELETE /api/posts/:id` - Delete post (protected)
- `POST /api/interactions/posts/:id/like` - Like post (protected)
- `POST /api/interactions/posts/:id/comments` - Add comment (protected)

## State Management

### Redux Store

Global UI state is managed with Redux Toolkit:
- `authSlice`: User authentication state
- `apiSlice`: API availability state
- `uiSlice`: UI state (modals, notifications)
- `filterSlice`: Filter and search state

### TanStack Query

Server state is managed with TanStack Query:
- Automatic caching and invalidation
- Optimistic updates for mutations
- Background refetching
- Stale-while-revalidate behavior

## Authentication Flow

1. User registers or logs in
2. Backend returns JWT tokens in HTTP-only cookies
3. Frontend automatically includes cookies in requests
4. Tokens are automatically refreshed on expiry
5. User state is persisted to localStorage

## Development Guidelines

### Adding a New Page

1. Create a new route in `app/` directory
2. Create corresponding components in `components/`
3. Use custom hooks for data fetching
4. Handle loading and error states

### Adding a New API Endpoint

1. Create service function in `services/`
2. Create custom hook in `hooks/`
3. Use in components with proper error handling

### Styling

- Use Tailwind CSS utility classes
- Follow the design system in `globals.css`
- Use shadcn/ui components for consistency

## Troubleshooting

### API Connection Issues

- Ensure backend is running on the correct URL
- Check `NEXT_PUBLIC_API_URL` in `.env.local`
- Verify CORS settings on backend

### Authentication Issues

- Clear browser cookies and localStorage
- Check if tokens are being set correctly
- Verify backend token generation

### Build Issues

- Clear `.next` directory: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Check TypeScript errors: `npm run build`

## Deployment

### Vercel

1. Push code to GitHub
2. Connect repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy

### Other Platforms

1. Build the project: `npm run build`
2. Deploy the `.next` directory
3. Set environment variables on the platform
4. Ensure Node.js 18+ is available

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.
