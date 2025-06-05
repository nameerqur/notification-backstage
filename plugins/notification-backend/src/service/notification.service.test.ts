import sqlite3 from 'sqlite3';
import {
  initNotificationDb,
  getAllNotifications,
  createNotification,
  deleteNotification,
  updateNotification,
  updateAllNotifications,
} from './notification.service';

jest.mock('./websocket.service.ts', () => ({
  websocketService: {
    broadcastNotification: jest.fn(),
    broadcastNotificationCount: jest.fn(),
  },
}));

jest.mock('sqlite3');

const mockDb = {
  run: jest.fn(),
  all: jest.fn(),
  get: jest.fn(),
  close: jest.fn(),
};

describe('notification.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (sqlite3.Database as unknown as jest.Mock).mockImplementation(() => mockDb);
  });

  describe('initNotificationDb', () => {
    it('should initialize database and create table', async () => {
      mockDb.run.mockImplementation((_query, callback) => {
        callback(null);
      });

      await initNotificationDb();

      expect(sqlite3.Database).toHaveBeenCalledWith('./notifications.sqlite');
      expect(mockDb.run).toHaveBeenCalledWith(
        expect.stringContaining('CREATE TABLE IF NOT EXISTS notifications'),
        expect.any(Function),
      );
    });

    it('should handle database creation error', async () => {
      const error = new Error('Database error');
      mockDb.run.mockImplementation((_query, callback) => {
        callback(error);
      });

      await expect(initNotificationDb()).rejects.toThrow('Database error');
    });
  });

  describe('getAllNotifications', () => {
    it('should fetch all notifications', async () => {
      const mockNotifications = [
        { id: 1, message: 'Test 1', timestamp: 123, type: 'info', read: false },
        {
          id: 2,
          message: 'Test 2',
          timestamp: 124,
          type: 'warning',
          read: true,
        },
      ];

      mockDb.all.mockImplementation((_query, callback) => {
        callback(null, mockNotifications);
      });

      const result = await getAllNotifications();

      expect(result).toEqual(mockNotifications);
      expect(mockDb.all).toHaveBeenCalledWith(
        'SELECT * FROM notifications ORDER BY timestamp DESC',
        expect.any(Function),
      );
    });

    it('should handle database error when fetching notifications', async () => {
      const error = new Error('Fetch error');
      mockDb.all.mockImplementation((_query, callback) => {
        callback(error, null);
      });

      await expect(getAllNotifications()).rejects.toThrow('Fetch error');
    });
  });

  describe('createNotification', () => {
    it('should create a notification', async () => {
      const mockResult = { lastID: 123 };
      mockDb.run.mockImplementation((_query, _params, callback) => {
        callback.call(mockResult, null);
      });

      const result = await createNotification('Test message', 'info');

      expect(result).toEqual({
        id: 123,
        message: 'Test message',
        timestamp: expect.any(Number),
        type: 'info',
        read: false,
      });
    });

    it('should handle creation error', async () => {
      const error = new Error('Create error');
      mockDb.run.mockImplementation((_query, _params, callback) => {
        callback(error);
      });

      await expect(createNotification('Test', 'info')).rejects.toThrow(
        'Create error',
      );
    });
  });

  describe('deleteNotification', () => {
    it('should delete notification and return true when successful', async () => {
      const mockResult = { changes: 1 };
      mockDb.run.mockImplementation((_query, _params, callback) => {
        callback.call(mockResult, null);
      });

      const result = await deleteNotification(1);

      expect(result).toBe(true);
      expect(mockDb.run).toHaveBeenCalledWith(
        'DELETE FROM notifications WHERE id = ?',
        [1],
        expect.any(Function),
      );
    });

    it('should return false when no rows affected', async () => {
      const mockResult = { changes: 0 };
      mockDb.run.mockImplementation((_query, _params, callback) => {
        callback.call(mockResult, null);
      });

      const result = await deleteNotification(999);

      expect(result).toBe(false);
    });

    it('should handle delete error', async () => {
      const error = new Error('Delete error');
      mockDb.run.mockImplementation((_query, _params, callback) => {
        callback(error);
      });

      await expect(deleteNotification(1)).rejects.toThrow('Delete error');
    });
  });

  describe('updateNotification', () => {
    it('should update notification read status', async () => {
      const mockUpdateResult = { changes: 1 };
      const mockNotification = { id: 1, message: 'Test', read: true };

      mockDb.run.mockImplementation((_query, _params, callback) => {
        callback.call(mockUpdateResult, null);
      });

      mockDb.get.mockImplementation((_query, _params, callback) => {
        callback(null, mockNotification);
      });

      const result = await updateNotification(1, { read: true });

      expect(result).toEqual(mockNotification);
      expect(mockDb.run).toHaveBeenCalledWith(
        'UPDATE notifications SET read = ? WHERE id = ?',
        [true, 1],
        expect.any(Function),
      );
    });

    it('should handle update error', async () => {
      const error = new Error('Update error');
      mockDb.run.mockImplementation((_query, _params, callback) => {
        callback(error);
      });

      await expect(updateNotification(1, { read: true })).rejects.toThrow(
        'Update error',
      );
    });

    it('should handle getNotificationById error', async () => {
      const mockUpdateResult = { changes: 1 };
      const getError = new Error('Get error');

      mockDb.run.mockImplementation((_query, _params, callback) => {
        callback.call(mockUpdateResult, null);
      });

      mockDb.get.mockImplementation((_query, _params, callback) => {
        callback(getError, null);
      });

      await expect(updateNotification(1, { read: true })).rejects.toThrow(
        'Get error',
      );
    });
  });

  describe('updateAllNotifications', () => {
    it('should update all notifications', async () => {
      const mockResult = { changes: 5 };
      mockDb.run.mockImplementation((_query, _params, callback) => {
        callback.call(mockResult, null);
      });

      const result = await updateAllNotifications(true);

      expect(result).toBe(5);
      expect(mockDb.run).toHaveBeenCalledWith(
        'UPDATE notifications SET read = ?',
        [true],
        expect.any(Function),
      );
    });

    it('should return 0 when no changes made', async () => {
      const mockResult = { changes: undefined };
      mockDb.run.mockImplementation((_query, _params, callback) => {
        callback.call(mockResult, null);
      });

      const result = await updateAllNotifications(false);

      expect(result).toBe(0);
    });
  });
});
