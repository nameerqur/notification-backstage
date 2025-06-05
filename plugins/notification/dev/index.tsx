import { createDevApp } from '@backstage/dev-utils';
import { notificationPlugin, NotificationPage } from '../src/plugin';

createDevApp()
  .registerPlugin(notificationPlugin)
  .addPage({
    element: <NotificationPage />,
    title: 'Root Page',
    path: '/notification',
  })
  .render();
