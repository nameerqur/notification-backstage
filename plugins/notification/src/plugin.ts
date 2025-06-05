import {
  createPlugin,
  createRoutableExtension,
} from '@backstage/core-plugin-api';

import { rootRouteRef } from './routes';

export const notificationPlugin = createPlugin({
  id: 'notification',
  routes: {
    root: rootRouteRef,
  },
});

export const NotificationPage = notificationPlugin.provide(
  createRoutableExtension({
    name: 'NotificationPage',
    component: () =>
      import('./components/NotificationMainComponent').then(
        m => m.NotificationMainComponent,
      ),
    mountPoint: rootRouteRef,
  }),
);
