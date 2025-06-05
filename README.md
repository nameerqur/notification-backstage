# [Backstage](https://backstage.io) Notification Plugin

A notification Assignment using Backstage rest and websocket.

## Features

- Notifications using WebSocket
- REST API for managing notifications
- SQLite (Inmemory) database storage
- Mock servers for testing
- Tests

## Architecture

The plugin consists of two main parts:

### Backend Plugin

- SQLite database for notifications
- REST API
- WebSocket server broadcasting notifications and its count

### Frontend Plugin

- Notification center UI
- WebSocket client for live updates
- Statistics view
- Mark as read/unread, delete notifications

## Installation

```bash
yarn install
```

### To test all

```bash
yarn test:all
```

### To run

```bash
yarn start
```

### Demo ReadMe to run the mock endpoints to populate notifications

[Demo Documentation](mock-servers/DEMO_README.md).

## API Example

Create notification:

```bash
curl -X POST http://localhost:7007/api/notification-backend/notifications \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Your message",
    "type": "info"
  }'
```

Get notifications:

```bash
curl http://localhost:7007/api/notification-backend/notifications
```
