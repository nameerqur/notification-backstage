import express, { Router } from 'express';
import { notificationHealthController } from '../controller/notification-health.controller';

export const notificationHealthRouter = (logger: any): Router => {
  const router = express.Router();
  const controller = notificationHealthController(logger);

  router.get('/health', controller.checkNotificationHealth);

  return router;
};
