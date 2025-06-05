import { screen, fireEvent, waitFor } from '@testing-library/react';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { registerMswTestHooks, renderInTestApp } from '@backstage/test-utils';
import { NotificationCenter } from './NotificationComponent';

class MockWebSocket {
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;

  constructor(public url: string) {
    setTimeout(() => {
      if (this.onopen) {
        this.onopen(new Event('open'));
      }
    }, 100);
  }

  close() {
    if (this.onclose) {
      this.onclose(new CloseEvent('close'));
    }
  }
}

(global as any).WebSocket = MockWebSocket;

const renderWithTheme = (component: React.ReactElement) => {
  return renderInTestApp(component);
};

describe('NotificationCenter', () => {
  const server = setupServer();
  registerMswTestHooks(server);

  beforeEach(() => {
    server.use(
      rest.get(
        'http://localhost:7007/api/notification-backend/notifications',
        (_, res, ctx) => {
          return res(ctx.status(200), ctx.json([]));
        },
      ),
      rest.patch(
        'http://localhost:7007/api/notification-backend/notifications/:id',
        (_, res, ctx) => {
          return res(ctx.status(200), ctx.json({}));
        },
      ),
      rest.patch(
        'http://localhost:7007/api/notification-backend/notifications',
        (_, res, ctx) => {
          return res(
            ctx.status(200),
            ctx.json({
              message: 'All notifications marked as read',
              updated: 0,
            }),
          );
        },
      ),
      rest.delete(
        'http://localhost:7007/api/notification-backend/notifications/:id',
        (_, res, ctx) => {
          return res(ctx.status(200), ctx.json({}));
        },
      ),
    );
  });

  it('renders notification center title', async () => {
    await renderWithTheme(<NotificationCenter />);

    expect(screen.getByText('Notification Center')).toBeInTheDocument();
  });

  it('fetches notifications on mount', async () => {
    const mockNotifications = [
      {
        id: 1,
        message: 'Test notification',
        timestamp: Date.now(),
        type: 'info',
        read: false,
      },
    ];

    server.use(
      rest.get(
        'http://localhost:7007/api/notification-backend/notifications',
        (_, res, ctx) => {
          return res(ctx.status(200), ctx.json(mockNotifications));
        },
      ),
    );

    await renderWithTheme(<NotificationCenter />);

    await waitFor(() => {
      expect(screen.getByText('Test notification')).toBeInTheDocument();
    });
  });

  it('shows notification statistics', async () => {
    const mockNotifications = [
      {
        id: 1,
        message: 'Info message',
        timestamp: Date.now(),
        type: 'info',
        read: false,
      },
      {
        id: 2,
        message: 'Success message',
        timestamp: Date.now(),
        type: 'success',
        read: false,
      },
      {
        id: 3,
        message: 'Warning message',
        timestamp: Date.now(),
        type: 'warning',
        read: false,
      },
    ];

    server.use(
      rest.get(
        'http://localhost:7007/api/notification-backend/notifications',
        (_, res, ctx) => {
          return res(ctx.status(200), ctx.json(mockNotifications));
        },
      ),
    );

    await renderWithTheme(<NotificationCenter />);

    await waitFor(() => {
      expect(screen.getByText('Info: 1 (1 new)')).toBeInTheDocument();
      expect(screen.getByText('Success: 1 (1 new)')).toBeInTheDocument();
      expect(screen.getByText('Warning: 1 (1 new)')).toBeInTheDocument();
    });
  });

  it('shows empty state when no notifications', async () => {
    await renderWithTheme(<NotificationCenter />);

    await waitFor(() => {
      expect(screen.getByText('No notifications')).toBeInTheDocument();
      expect(
        screen.getByText('All notifications have been read or deleted'),
      ).toBeInTheDocument();
    });
  });

  it('can mark notifications as read/unread', async () => {
    const mockNotifications = [
      {
        id: 1,
        message: 'Test notification',
        timestamp: Date.now(),
        type: 'info',
        read: false,
      },
    ];

    server.use(
      rest.get(
        'http://localhost:7007/api/notification-backend/notifications',
        (_, res, ctx) => {
          return res(ctx.status(200), ctx.json(mockNotifications));
        },
      ),
    );

    await renderWithTheme(<NotificationCenter />);

    await waitFor(() => {
      expect(screen.getByText('Test notification')).toBeInTheDocument();
    });

    const readButton = screen.getByTitle('Mark as Read');
    fireEvent.click(readButton);

    await waitFor(() => {
      expect(screen.getByTitle('Mark as Unread')).toBeInTheDocument();
    });
  });

  it('can delete notifications', async () => {
    const mockNotifications = [
      {
        id: 1,
        message: 'Test notification',
        timestamp: Date.now(),
        type: 'info',
        read: false,
      },
    ];

    server.use(
      rest.get(
        'http://localhost:7007/api/notification-backend/notifications',
        (_, res, ctx) => {
          return res(ctx.status(200), ctx.json(mockNotifications));
        },
      ),
    );

    await renderWithTheme(<NotificationCenter />);

    await waitFor(() => {
      expect(screen.getByText('Test notification')).toBeInTheDocument();
    });

    const deleteButton = screen.getByTitle('Delete Notification');
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(screen.queryByText('Test notification')).not.toBeInTheDocument();
    });
  });

  it('can mark all notifications as read', async () => {
    const mockNotifications = [
      {
        id: 1,
        message: 'Test 1',
        timestamp: Date.now(),
        type: 'info',
        read: false,
      },
      {
        id: 2,
        message: 'Test 2',
        timestamp: Date.now(),
        type: 'info',
        read: false,
      },
    ];

    server.use(
      rest.get(
        'http://localhost:7007/api/notification-backend/notifications',
        (_, res, ctx) => {
          return res(ctx.status(200), ctx.json(mockNotifications));
        },
      ),
    );

    await renderWithTheme(<NotificationCenter />);

    await waitFor(() => {
      expect(screen.getByText('Test 1')).toBeInTheDocument();
    });

    const markAllReadButton = screen.getByText('Mark All Read');
    fireEvent.click(markAllReadButton);

    await waitFor(() => {
      const unreadButtons = screen.queryAllByTitle('Mark as Read');
      expect(unreadButtons).toHaveLength(0);
    });
  });
});
