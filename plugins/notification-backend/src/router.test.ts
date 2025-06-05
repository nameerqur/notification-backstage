import express from 'express';
import request from 'supertest';

import { createRouter } from './router';

jest.mock('./controller/notification.controller', () => ({
  notificationController: jest.fn(() => ({
    getAllNotifications: (_req: any, res: any) => res.json([]),
    createNotification: (_req: any, res: any) =>
      res.status(201).json({ id: 1, message: 'test' }),
    deleteNotification: (_req: any, res: any) => res.json({ success: true }),
    updateNotification: (_req: any, res: any) => res.json({ success: true }),
    updateAllNotifications: (_req: any, res: any) => res.json({ updated: 0 }),
  })),
}));

describe('createRouter', () => {
  let app: express.Express;
  const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  };

  beforeAll(async () => {
    const router = await createRouter({ logger: mockLogger });
    app = express();
    app.use(router);
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: 'Backend is working',
        features: {
          notifications: 'active',
          websockets: 'active',
        },
      });
    });
  });

  describe('notification endpoints', () => {
    it('should delegate to notification controller', async () => {
      const response = await request(app).get('/notifications');
      expect(response.status).toBe(200);
    });
  });
});
