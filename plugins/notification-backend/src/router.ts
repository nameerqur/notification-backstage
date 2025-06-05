import express from 'express';
import Router from 'express-promise-router';
import { notificationRouter } from './router/notification.router';
import { notificationHealthRouter } from './router/notification-health.router';
import { initializeNotificationWebSocket } from './router/websocket.router';

export interface RouterOptions {
  logger: any;
}

export async function createRouter(
  options: RouterOptions,
): Promise<express.Router> {
  const { logger } = options;

  const router = Router();
  router.use(express.json());

  const notificationHealthRoute = notificationHealthRouter(logger);
  router.use('/', notificationHealthRoute);

  initializeNotificationWebSocket();

  const notificationRoutes = notificationRouter(logger);
  router.use('/', notificationRoutes);

  return router;
}
