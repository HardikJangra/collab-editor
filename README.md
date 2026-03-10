# Collaborative Markdown Editor

A real-time collaborative markdown editor built with React, TypeScript, Node.js, Socket.io, and MongoDB.

## Features

- **Real-Time Sync** — WebSocket-powered live collaboration via Socket.io
- **Live Markdown Preview** — Instant rendered preview with GFM + syntax highlighting  
- **User Presence** — See who's currently editing with color-coded avatars
- **Autosave** — Documents auto-save every 5 seconds to MongoDB
- **Markdown Toolbar** — One-click insertion for all common markdown syntax
- **Shareable Links** — Unique document URLs (`/doc/:docId`)
- **Rate Limiting** — Express rate limiting on all API routes
- **Responsive** — Works on mobile and desktop

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite |
| Real-Time | Socket.io (client + server) |
| Backend | Node.js, Express.js |
| Database | MongoDB + Mongoose |
| Markdown | react-markdown, remark-gfm, rehype-highlight |
| Routing | React Router v6 |
| Styling | CSS Modules + CSS Variables |

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### Installation

```bash
# Clone & install all dependencies
git clone https://github.com/yourusername/collab-markdown-editor
cd collab-markdown-editor
npm run install:all

# Configure environment
cp server/.env.example server/.env
# Edit server/.env with your MongoDB URI

# Start both servers
npm run dev
```

The app will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

## Project Structure

```
collab-editor/
├── client/               # React + TypeScript frontend
│   └── src/
│       ├── components/   # Editor, Preview, Toolbar, UserList, StatusBar
│       ├── pages/        # HomePage, EditorPage
│       ├── hooks/        # useSocket, useDebounce
│       ├── services/     # socket.ts, api.ts
│       ├── types/        # TypeScript interfaces
│       └── utils/        # username generator
│
└── server/               # Node.js + Express backend
    ├── controllers/      # documentController.js
    ├── models/           # Document.js (Mongoose)
    ├── routes/           # documentRoutes.js
    ├── socket/           # socketHandler.js
    ├── middleware/        # rateLimiter.js
    └── config/           # db.js
```

## API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/documents` | Create new document |
| GET | `/api/documents/:docId` | Get document by ID |
| PUT | `/api/documents/:docId` | Save/update document |
| DELETE | `/api/documents/:docId` | Delete document |

## WebSocket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `join-document` | Client → Server | Join a document room |
| `editor-change` | Client → Server | Broadcast content change |
| `title-change` | Client → Server | Broadcast title change |
| `save-document` | Client → Server | Trigger DB save |
| `document-loaded` | Server → Client | Initial document state |
| `editor-update` | Server → Client | Receive content change |
| `users-update` | Server → Client | Updated user presence list |
| `document-saved` | Server → Client | Save confirmation |

## Deployment

**Frontend (Vercel)**
```bash
cd client && npm run build
# Deploy dist/ to Vercel
```

**Backend (Railway/Render)**
```bash
# Set environment variables:
# MONGODB_URI, CLIENT_URL, NODE_ENV=production, PORT
```

## Resume Description

> Built a **Real-Time Collaborative Markdown Editor** using React, TypeScript, Node.js, and WebSockets enabling multiple users to simultaneously edit and preview Markdown documents with live synchronization, autosave to MongoDB, shareable document links, user presence indicators, and a rich formatting toolbar.
