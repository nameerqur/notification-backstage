import { Request, Response } from 'express';
import {
  getAllNotifications,
  createNotification,
  deleteNotification,
  updateNotification,
  updateAllNotifications,
} from '../service/notification.service';

export const notificationController = (logger: any) => ({
  async getAllNotifications(_: Request, res: Response) {
    try {
      logger.info('Getting notifications');
      const notifications = await getAllNotifications();
      res.send(notifications);
    } catch (error) {
      logger.error('Error getting notifications:', error);
      res.status(500).send({ error: 'Failed to fetch notifications' });
    }
  },

  async createNotification(req: Request, res: Response) {
    const { message, type } = req.body;
    if (!message) {
      res.status(400).send({ error: 'Message is required' });
      return;
    }
    try {
      logger.info(`New notification: ${message}`);
      const notification = await createNotification(message, type);
      res.status(201).send(notification);
    } catch (error) {
      logger.error('Error creating notification:', error);
      res.status(500).send({ error: 'Failed to create notification' });
    }
  },

  async deleteNotification(req: Request, res: Response) {
    const { id } = req.params;
    try {
      const success = await deleteNotification(parseInt(id, 10));
      if (success) {
        res.status(204).send();
      } else {
        res.status(404).send({ error: 'Notification not found' });
      }
    } catch (error) {
      logger.error('Error deleting notification:', error);
      res.status(500).send({ error: 'Failed to delete notification' });
    }
  },

  async updateNotification(req: Request, res: Response) {
    const { id } = req.params;
    const { read } = req.body;

    if (typeof read !== 'boolean') {
      res.status(400).send({ error: 'read field must be a boolean' });
      return;
    }

    try {
      const notification = await updateNotification(parseInt(id, 10), { read });
      if (notification) {
        res.status(200).send(notification);
      } else {
        res.status(404).send({ error: 'Notification not found' });
      }
    } catch (error) {
      logger.error('Error updating notification:', error);
      res.status(500).send({ error: 'Failed to update notification' });
    }
  },

  async updateAllNotifications(req: Request, res: Response) {
    const { read } = req.body;

    if (typeof read !== 'boolean') {
      res.status(400).send({ error: 'read field must be a boolean' });
      return;
    }

    try {
      const updatedCount = await updateAllNotifications(read);
      res.status(200).send({
        message: `All notifications marked as ${read ? 'read' : 'unread'}`,
        updated: updatedCount,
      });
    } catch (error) {
      logger.error('Error updating all notifications:', error);
      res.status(500).send({ error: 'Failed to update notifications' });
    }
  },
});
