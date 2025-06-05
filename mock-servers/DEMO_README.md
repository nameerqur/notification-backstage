## Mock Servers

### Description

- `rest-server.ts` - send or recieve notification using rest
- `websocket-server.ts` - Sends notifications from websockett

### How to use them

```bash
yarn mock:rest

yarn mock:websocket

yarn mock:all
```

To run all together

```bash
yarn demo:notifications
```

This starts up both servers plus your main app so you can see notifications in action.

### Try the APIs with curl

#### REST Mock Server (http://localhost:3001)

Send a notification to Backstage:

```bash
curl -X POST http://localhost:3001/send-to-backstage \
  -H "Content-Type: application/json" \
  -d '{"source": "Test", "type": "info", "count": 1}'
```

Start random notifications:

```bash
curl -X POST http://localhost:3001/start-random-notifications \
  -H "Content-Type: application/json" \
  -d '{"interval": 5000}'
```

Stop random notifications:

```bash
curl -X POST http://localhost:3001/stop-random-notifications
```

Health check:

```bash
curl http://localhost:3001/health
```

#### WebSocket Mock Control Server (http://localhost:3002)

Send a single notification:

```bash
curl -X POST http://localhost:3002/send-notification \
  -H "Content-Type: application/json" \
  -d '{"source": "WebSocket Mock", "type": "info", "message": "Hello from WebSocket!"}'
```

Start random notifications:

```bash
curl -X POST http://localhost:3002/start-random \
  -H "Content-Type: application/json" \
  -d '{"interval": 10000}'
```

Stop random notifications:

```bash
curl -X POST http://localhost:3002/stop-random
```

Simulate Jira notifications:

```bash
curl -X POST http://localhost:3002/simulate-jira
```

Simulate GitLab notifications:

```bash
curl -X POST http://localhost:3002/simulate-gitlab
```

Simulate Confluence notifications:

```bash
curl -X POST http://localhost:3002/simulate-confluence
```

Health check:

```bash
curl http://localhost:3002/health
```
