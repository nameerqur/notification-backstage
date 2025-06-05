import express, { Router } from 'express';
import { notificationController } from '../controller/notification.controller';

export const notificationRouter = (logger: any): Router => {
  const router = express.Router();
  const controller = notificationController(logger);

  router.get('/notifications', controller.getAllNotifications);
  router.post('/notifications', controller.createNotification);
  router.delete('/notifications/:id', controller.deleteNotification);
  router.patch('/notifications/:id', controller.updateNotification);
  router.patch('/notifications', controller.updateAllNotifications);

  return router;
};
