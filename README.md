# Social Post (TaskPlanet-inspired)

Minimal social feed with React + Express + MongoDB. Features email auth, text/image posts, public feed, likes, and comments.

## Quick Start

1) Backend
```bash
cd server
cp .env.example .env  # update MONGODB_URI and JWT_SECRET
npm install
npm run dev
```

2) Frontend
```bash
cd client
npm install
npm run dev
```

Frontend dev server proxies `/api` to `http://localhost:4000` (see `client/vite.config.js`).

## API Overview
- `POST /api/auth/signup { username, email, password }`
- `POST /api/auth/login { email, password }`
- `GET /api/posts` – public feed
- `POST /api/posts` – create text and/or base64 image (auth)
- `POST /api/posts/:id/like` – toggle like (auth)
- `POST /api/posts/:id/comment { text }` – add comment (auth)

Only two collections: `users`, `posts` (with embedded likes/comments).
