import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

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
  count?: number;
}

interface RandomNotificationRequest {
  interval?: number;
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

app.post('/send-to-backstage', async (req, res) => {
  const {
    source = 'Mock Server',
    type,
    count = 1,
  }: NotificationRequest = req.body;

  try {
    const notifications: Notification[] = [];
    for (let i = 0; i < count; i++) {
      const notification = generateMockNotification(source, type);

      const response = await fetch(
        'http://localhost:7007/api/notification-backend/notifications',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: notification.message,
            type: notification.type,
          }),
        },
      );

      if (response.ok) {
        notifications.push(notification);
      }
    }

    res.json({
      success: true,
      sent: notifications.length,
      notifications,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.post('/start-random-notifications', (req, res) => {
  const { interval = 5000 }: RandomNotificationRequest = req.body;

  const intervalId = setInterval(async () => {
    const source = sources[Math.floor(Math.random() * sources.length)];
    const type =
      notificationTypes[Math.floor(Math.random() * notificationTypes.length)];
    const notification = generateMockNotification(source, type);

    try {
      await fetch(
        'http://localhost:7007/api/notification-backend/notifications',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: notification.message,
            type: notification.type,
          }),
        },
      );
    } catch (error) {
      console.error(
        'Error:',
        error instanceof Error ? error.message : 'Unknown error',
      );
    }
  }, interval);

  (app.locals as any).notificationInterval = intervalId;

  res.json({
    success: true,
    message: `Sending random notifications every ${interval}ms`,
  });
});

app.post('/stop-random-notifications', (_req, res) => {
  if ((app.locals as any).notificationInterval) {
    clearInterval((app.locals as any).notificationInterval);
    (app.locals as any).notificationInterval = null;
    res.json({ success: true, message: 'Random notifications stopped' });
  } else {
    res.json({ success: false, message: 'Not running anything to stop' });
  }
});

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    port: PORT,
  });
});

app.get('/config', (_req, res) => {
  res.json({
    sources,
    types: notificationTypes,
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
