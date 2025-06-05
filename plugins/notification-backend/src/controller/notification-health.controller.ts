import { Request, Response } from 'express';

export const notificationHealthController = (logger: any) => ({
  async checkNotificationHealth(_req: Request, res: Response): Promise<void> {
    try {
      logger.info('Processing health check request');
      res.send({
        message: 'Backend is working',
        features: {
          notifications: 'active',
          websockets: 'active',
        },
      });
    } catch (error) {
      logger.error('Error fetching notifications:', error);
      res.status(500).send({ error: 'Failed to fetch notifications' });
    }
  },
});
