import express from 'express';
import request from 'supertest';

jest.mock('../service/notification.service', () => ({
  getAllNotifications: jest.fn(),
  createNotification: jest.fn(),
  deleteNotification: jest.fn(),
  updateNotification: jest.fn(),
  updateAllNotifications: jest.fn(),
}));

jest.mock('../service/websocket.service', () => ({
  websocketService: {
    broadcastNotification: jest.fn(),
    broadcastNotificationCount: jest.fn(),
  },
}));

import {
  getAllNotifications,
  createNotification,
  deleteNotification,
  updateNotification,
  updateAllNotifications,
} from '../service/notification.service';
import { notificationRouter } from '../router/notification.router';

const mockGetAllNotifications = getAllNotifications as jest.MockedFunction<
  typeof getAllNotifications
>;
const mockCreateNotification = createNotification as jest.MockedFunction<
  typeof createNotification
>;
const mockDeleteNotification = deleteNotification as jest.MockedFunction<
  typeof deleteNotification
>;
const mockUpdateNotification = updateNotification as jest.MockedFunction<
  typeof updateNotification
>;
const mockUpdateAllNotifications =
  updateAllNotifications as jest.MockedFunction<typeof updateAllNotifications>;

const mockNotification = {
  id: 1,
  message: 'Test notification',
  timestamp: Date.now(),
  type: 'info' as const,
  read: false,
};

describe('NotificationController', () => {
  let app: express.Express;
  const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    const router = notificationRouter(mockLogger);
    app = express();
    app.use(express.json());
    app.use(router);
  });

  describe('GET /notifications', () => {
    it('should return all notifications', async () => {
      mockGetAllNotifications.mockResolvedValue([mockNotification]);

      const response = await request(app).get('/notifications');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([mockNotification]);
      expect(mockGetAllNotifications).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith('Getting notifications');
    });

    it('should handle errors when fetching notifications', async () => {
      mockGetAllNotifications.mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/notifications');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Failed to fetch notifications' });
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error getting notifications:',
        expect.any(Error),
      );
    });
  });

  describe('POST /notifications', () => {
    it('should create a new notification', async () => {
      mockCreateNotification.mockResolvedValue(mockNotification);

      const response = await request(app).post('/notifications').send({
        message: 'Test notification',
        type: 'info',
      });

      expect(response.status).toBe(201);
      expect(response.body).toEqual(mockNotification);
      expect(mockCreateNotification).toHaveBeenCalledWith(
        'Test notification',
        'info',
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        'New notification: Test notification',
      );
    });

    it('should handle creation errors', async () => {
      mockCreateNotification.mockRejectedValue(new Error('Creation failed'));

      const response = await request(app).post('/notifications').send({
        message: 'Test notification',
        type: 'info',
      });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Failed to create notification' });
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error creating notification:',
        expect.any(Error),
      );
    });
  });

  describe('DELETE /notifications/:id', () => {
    it('should delete a notification', async () => {
      mockDeleteNotification.mockResolvedValue(true);

      const response = await request(app).delete('/notifications/1');

      expect(response.status).toBe(204);
      expect(mockDeleteNotification).toHaveBeenCalledWith(1);
    });

    it('should return 404 when notification not found', async () => {
      mockDeleteNotification.mockResolvedValue(false);

      const response = await request(app).delete('/notifications/999');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Notification not found' });
    });
  });

  describe('PATCH /notifications/:id', () => {
    it('should update a notification', async () => {
      const updatedNotification = { ...mockNotification, read: true };
      mockUpdateNotification.mockResolvedValue(updatedNotification);

      const response = await request(app)
        .patch('/notifications/1')
        .send({ read: true });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(updatedNotification);
      expect(mockUpdateNotification).toHaveBeenCalledWith(1, { read: true });
    });

    it('should return 404 when notification not found', async () => {
      mockUpdateNotification.mockResolvedValue(null);

      const response = await request(app)
        .patch('/notifications/999')
        .send({ read: true });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Notification not found' });
    });

    it('should validate read field type', async () => {
      const response = await request(app)
        .patch('/notifications/1')
        .send({ read: 'invalid' });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'read field must be a boolean' });
      expect(mockUpdateNotification).not.toHaveBeenCalled();
    });
  });

  describe('PATCH /notifications', () => {
    it('should update all notifications', async () => {
      mockUpdateAllNotifications.mockResolvedValue(1);

      const response = await request(app)
        .patch('/notifications')
        .send({ read: true });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: 'All notifications marked as read',
        updated: 1,
      });
      expect(mockUpdateAllNotifications).toHaveBeenCalledWith(true);
    });

    it('should validate read field type for bulk update', async () => {
      const response = await request(app)
        .patch('/notifications')
        .send({ read: 'invalid' });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'read field must be a boolean' });
      expect(mockUpdateAllNotifications).not.toHaveBeenCalled();
    });
  });
});
