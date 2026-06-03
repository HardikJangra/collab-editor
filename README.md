# Collaborative Editor

A real-time collaborative document editor inspired by modern tools like Google Docs, enabling multiple users to edit documents simultaneously with live synchronization, presence tracking, and version history.

## 🚀 Features

### Real-Time Collaboration

* Multi-user document editing
* Instant synchronization across connected clients
* WebSocket-powered communication
* Low-latency updates

### Presence System

* Live collaborator tracking
* Active user indicators
* Real-time user presence updates
* Collaborative editing awareness

### Document Version History

* Automatic document snapshots
* Manual version creation
* Version timeline with timestamps
* Version creator tracking
* Preview historical versions
* Restore previous document states
* Audit trail for document changes

### Version Restoration

* One-click rollback to previous versions
* Real-time restoration updates across all connected users
* Collaboration continues seamlessly after restore
* Restore actions recorded as new versions

### Persistence Layer

* MongoDB database storage
* Automatic document saving
* Version data persistence
* Scalable document management

## 🛠️ Tech Stack

### Frontend

* React.js
* JavaScript
* CSS
* Socket.IO Client

### Backend

* Node.js
* Express.js
* Socket.IO
* MongoDB
* Mongoose

### Real-Time Communication

* WebSockets via Socket.IO

## 🏗️ System Architecture

User A
↓
WebSocket
↓
Node.js + Socket.IO Server
↓
MongoDB
↓
Version History Service
↓
WebSocket Broadcast
↓
User B / User C

## 📂 Core Features Implemented

### Real-Time Document Synchronization

Every document update is broadcast to connected collaborators using WebSockets, ensuring all users see changes instantly.

### Presence Tracking

The system tracks active collaborators and updates user presence in real time.

### Version History System

The editor maintains document snapshots and allows users to:

* View historical versions
* Preview previous content
* Restore any version
* Track version ownership and timestamps

### Restore Workflow

1. User selects a historical version
2. Version content is loaded
3. Document state is updated
4. Update is broadcast to all collaborators
5. New version record is created for auditability

## ⚡ Performance Optimizations

* Debounced updates
* Efficient WebSocket event handling
* Snapshot-based versioning
* Duplicate version prevention
* Optimized MongoDB queries

## 🔒 Future Improvements

* PDF Export
* Markdown Export
* Rich Text Formatting
* Role-Based Permissions
* Comment System
* Document Sharing Links
* Rate Limiting
* End-to-End Encryption

## 📸 Screenshots

Add project screenshots here.

## 🚀 Getting Started

### Backend

```bash
cd server
npm install
npm run dev
```

### Frontend

```bash
cd client
npm install
npm run dev
```

### Environment Variables

Create a `.env` file inside the server directory:

```env
MONGODB_URI=your_mongodb_connection_string
PORT=5000
```

## 🎯 Learning Outcomes

This project demonstrates:

* Real-time systems design
* WebSocket communication
* Multi-user synchronization
* Database schema design
* Version control concepts
* Event-driven architecture
* Backend API development
* Full-stack application development

## 📄 License

MIT License
