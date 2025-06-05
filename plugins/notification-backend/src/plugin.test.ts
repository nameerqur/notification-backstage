import { startTestBackend } from '@backstage/backend-test-utils';
import { notificationPlugin } from './plugin';
import request from 'supertest';

describe('notificationPlugin', () => {
  it('should provide health endpoint', async () => {
    const { server } = await startTestBackend({
      features: [notificationPlugin],
    });

    const response = await request(server)
      .get('/api/notification-backend/health')
      .expect(200);

    expect(response.body).toEqual({
      message: 'Backend is working',
      features: {
        notifications: 'active',
        websockets: 'active',
      },
    });
  });
});
