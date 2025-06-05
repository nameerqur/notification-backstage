import WebSocket, { WebSocketServer } from 'ws';
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3002;
const WS_PORT = 3003;

app.use(cors());
app.use(express.json());

interface Notification {
  id: number;
  message: string;
  timestamp: number;
  type: NotificationType;
  source: string;
}

interface NotificationRequest {
  source?: string;
  type?: NotificationType;
  message?: string;
}

interface RandomNotificationRequest {
  interval?: number;
}

interface WebSocketMessage {
  type: string;
  message: string;
  notificationType?: NotificationType;
  timestamp?: string;
}

type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'general';

const notificationTypes: NotificationType[] = [
  'info',
  'success',
  'warning',
  'error',
  'general',
];
const sources: string[] = ['Jira', 'Confluence', 'GitLab', 'Own Develop Tool'];

let backstageWs: WebSocket | null = null;
let isConnected = false;
let reconnectInterval: NodeJS.Timeout | null = null;
let notificationInterval: NodeJS.Timeout | null = null;

const generateMockNotification = (
  source: string,
  type?: NotificationType,
): Notification => ({
  id: Math.floor(Math.random() * 100000),
  message: `${source}: ${getRandomMessage(type)}`,
  timestamp: Date.now(),
  type:
    type ||
    notificationTypes[Math.floor(Math.random() * notificationTypes.length)],
  source,
});

const getRandomMessage = (type?: NotificationType): string => {
  const messages: Record<NotificationType, string[]> = {
    info: ['Build successfully', 'Successful response'],
    success: ['Tests passed', 'Issue resolved'],
    warning: ['Warning: High memory', 'Warning: Disk space running low'],
    error: ['Error occurred server', 'Error service unavailable'],
    general: ['General reminder 1', 'General reminder 2'],
  };

  const typeMessages = messages[type || 'general'] || messages.general;
  return typeMessages[Math.floor(Math.random() * typeMessages.length)];
};

const connectToBackstage = (): void => {
  try {
    backstageWs = new WebSocket('ws://localhost:8080/notifications');

    backstageWs.on('open', () => {
      console.log('Websocket connected');
      isConnected = true;
      if (reconnectInterval) {
        clearInterval(reconnectInterval);
        reconnectInterval = null;
      }
    });

    backstageWs.on('close', () => {
      console.log('Websocket disconnected');
      isConnected = false;

      if (!reconnectInterval) {
        reconnectInterval = setInterval(() => {
          console.log('Trying to reconnect');
          connectToBackstage();
        }, 3000);
      }
    });

    backstageWs.on('error', (error: Error) => {
      console.error('Websocket error:', error.message);
      isConnected = false;
    });

    backstageWs.on('message', (data: WebSocket.Data) => {
      console.log('Message:', data.toString());
    });
  } catch (error) {
    console.error(
      'Error:',
      error instanceof Error ? error.message : 'Unknown error',
    );
  }
};

const sendNotificationViaHttp = async (
  message: string,
  type: NotificationType,
): Promise<any> => {
  try {
    const response = await fetch(
      'http://localhost:7007/api/notification-backend/notifications',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message, type }),
      },
    );

    if (response.ok) {
      const result = await response.json();
      return result;
    } else {
      console.error('Error:', response.statusText);
    }
  } catch (error) {
    console.error(
      'Error:',
      error instanceof Error ? error.message : 'Unknown error',
    );
  }
};

app.post('/send-notification', async (req, res) => {
  const {
    source = 'WebSocket Mock',
    type,
    message,
  }: NotificationRequest = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const notification = await sendNotificationViaHttp(
    `${source}: ${message}`,
    type || 'general',
  );

  if (notification) {
    res.json({ success: true, notification });
  } else {
    res
      .status(500)
      .json({ success: false, error: 'Failed to send notification' });
  }
});

app.post('/start-random', (req, res) => {
  const { interval = 10000 }: RandomNotificationRequest = req.body;

  if (notificationInterval) {
    clearInterval(notificationInterval);
  }

  notificationInterval = setInterval(async () => {
    const source = sources[Math.floor(Math.random() * sources.length)];
    const type =
      notificationTypes[Math.floor(Math.random() * notificationTypes.length)];
    const notification = generateMockNotification(source, type);

    await sendNotificationViaHttp(notification.message, notification.type);
  }, interval);

  res.json({
    success: true,
    message: `Started sending random notifications every ${interval}ms`,
  });
});

app.post('/stop-random', (_req, res) => {
  if (notificationInterval) {
    clearInterval(notificationInterval);
    notificationInterval = null;
    res.json({ success: true, message: 'Stopped random notifications' });
  } else {
    res.json({ success: false, message: 'No active notification interval' });
  }
});

app.post('/simulate-jira', async (_req, res) => {
  const notifications = [
    {
      type: 'info' as NotificationType,
      message: 'New issue created: PROJ-123',
    },
    {
      type: 'success' as NotificationType,
      message: 'Issue resolved: PROJ-122',
    },
    { type: 'warning' as NotificationType, message: 'Issue overdue: PROJ-121' },
  ];

  const results: any[] = [];
  for (const notif of notifications) {
    const result = await sendNotificationViaHttp(
      `Jira: ${notif.message}`,
      notif.type,
    );
    if (result) results.push(result);
  }

  res.json({ success: true, sent: results.length, notifications: results });
});

app.post('/simulate-gitlab', async (_req, res) => {
  const notifications = [
    { type: 'info' as NotificationType, message: 'New merge request opened' },
    { type: 'success' as NotificationType, message: 'Pipeline passed' },
    { type: 'error' as NotificationType, message: 'Pipeline failed' },
  ];

  const results: any[] = [];
  for (const notif of notifications) {
    const result = await sendNotificationViaHttp(
      `GitLab: ${notif.message}`,
      notif.type,
    );
    if (result) results.push(result);
  }

  res.json({ success: true, sent: results.length, notifications: results });
});

app.post('/simulate-confluence', async (_req, res) => {
  const notifications = [
    {
      type: 'info' as NotificationType,
      message: 'Page updated: "API Documentation"',
    },
    { type: 'general' as NotificationType, message: 'New comment on page' },
  ];

  const results: any[] = [];
  for (const notif of notifications) {
    const result = await sendNotificationViaHttp(
      `Confluence: ${notif.message}`,
      notif.type,
    );
    if (result) results.push(result);
  }

  res.json({ success: true, sent: results.length, notifications: results });
});

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    connected: isConnected,
    timestamp: new Date().toISOString(),
    ports: { http: PORT, websocket: WS_PORT },
  });
});

app.listen(PORT, () => {
  console.log(`WebSocket server running on http://localhost:${PORT}`);
  setTimeout(connectToBackstage, 1000);
});

const wss = new WebSocketServer({ port: WS_PORT });

wss.on('connection', (ws: WebSocket) => {
  console.log(`Client connected`);

  ws.on('message', (message: WebSocket.Data) => {
    try {
      const data: WebSocketMessage = JSON.parse(message.toString());
      if (data.type === 'notification') {
        sendNotificationViaHttp(
          data.message,
          data.notificationType || 'general',
        );
      }
    } catch (error) {
      console.error(
        'Error:',
        error instanceof Error ? error.message : 'Unknown error',
      );
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });

  ws.send(
    JSON.stringify({
      type: 'welcome',
      message: 'Connected to webSocket',
      timestamp: new Date().toISOString(),
    }),
  );
});
