import {
  coreServices,
  createBackendPlugin,
} from '@backstage/backend-plugin-api';
import { createRouter } from './router';

export const notificationPlugin = createBackendPlugin({
  pluginId: 'notification-backend',
  register(env) {
    env.registerInit({
      deps: {
        logger: coreServices.logger,
        httpRouter: coreServices.httpRouter,
      },
      async init({ logger, httpRouter }) {
        httpRouter.addAuthPolicy({ path: '/health', allow: 'unauthenticated' });
        httpRouter.addAuthPolicy({
          path: '/notifications',
          allow: 'unauthenticated',
        });
        httpRouter.addAuthPolicy({ path: '/ws', allow: 'unauthenticated' });

        logger.info('Setting up notification router with WebSocket support');

        const router = await createRouter({ logger });
        httpRouter.use(router);

        logger.info('Notification backend plugin initialized successfully');
      },
    });
  },
});
