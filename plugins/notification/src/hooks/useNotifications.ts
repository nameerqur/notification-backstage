import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Notification,
  NotificationState,
  NotificationApiError,
} from '../types/notification';
import {
  notificationService,
  NotificationApiError as ServiceError,
} from '../services/notificationService';
import { COMPONENT_CONSTANTS } from '../utils/notificationUtils';

export const useNotifications = () => {
  const [state, setState] = useState<NotificationState>({
    notifications: [],
    loading: false,
    error: null,
    wsConnected: false,
  });
  const updateState = useCallback((updates: Partial<NotificationState>) => {
    setState(prevState => ({ ...prevState, ...updates }));
  }, []);
  const clearError = useCallback(() => {
    updateState({ error: null });
  }, [updateState]);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleApiError = useCallback(
    (error: unknown, fallbackMessage: string) => {
      if (error instanceof ServiceError) {
        updateState({
          error: new NotificationApiError(
            error.message,
            error.status,
            error.endpoint,
          ),
        });
      } else {
        updateState({
          error: new NotificationApiError(
            error instanceof Error ? error.message : fallbackMessage,
          ),
        });
      }
    },
    [updateState],
  );

  const fetchNotifications = useCallback(async () => {
    try {
      updateState({ loading: true, error: null });

      const notifications = await notificationService.fetchNotifications();

      updateState({
        notifications,
        loading: false,
      });
    } catch (error) {
      updateState({ loading: false });
      handleApiError(error, 'Failed to fetch notifications');
    }
  }, [updateState, handleApiError]);

  const deleteNotification = useCallback(
    async (id: number) => {
      const originalNotifications = state.notifications;

      try {
        updateState({
          notifications: state.notifications.filter(n => n.id !== id),
        });

        await notificationService.deleteNotification(id);
      } catch (error) {
        updateState({ notifications: originalNotifications });
        handleApiError(error, 'Failed to delete notification');

        await fetchNotifications();
      }
    },
    [state.notifications, updateState, handleApiError, fetchNotifications],
  );

  const toggleNotificationReadStatus = useCallback(
    async (id: number) => {
      const notification = state.notifications.find(n => n.id === id);
      if (!notification) return;

      const originalNotifications = state.notifications;
      const newReadStatus = !notification.read;

      try {
        updateState({
          notifications: state.notifications.map(n =>
            n.id === id ? { ...n, read: newReadStatus } : n,
          ),
        });

        await notificationService.updateNotificationReadStatus(
          id,
          newReadStatus,
        );
      } catch (error) {
        updateState({ notifications: originalNotifications });
        handleApiError(error, 'Failed to update notification status');

        await fetchNotifications();
      }
    },
    [state.notifications, updateState, handleApiError, fetchNotifications],
  );

  const addNotification = useCallback((notification: Notification) => {
    setState(prevState => {
      const isDuplicate = prevState.notifications.some(
        n => n.id === notification.id,
      );
      if (isDuplicate) {
        return prevState;
      }

      return {
        ...prevState,
        notifications: [notification, ...prevState.notifications],
      };
    });
  }, []);

  const markAllAsRead = useCallback(async () => {
    const originalNotifications = state.notifications;

    try {
      updateState({
        notifications: state.notifications.map(n => ({ ...n, read: true })),
      });

      await notificationService.markAllNotificationsAsRead();
    } catch (error) {
      updateState({ notifications: originalNotifications });
      handleApiError(error, 'Failed to mark all notifications as read');

      await fetchNotifications();
    }
  }, [state.notifications, updateState, handleApiError, fetchNotifications]);

  const connectWebSocket = useCallback(() => {
    const wsUrl = notificationService.getWebSocketUrl();

    try {
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        updateState({ wsConnected: true });
      };

      wsRef.current.onclose = () => {
        updateState({ wsConnected: false });

        reconnectTimeoutRef.current = setTimeout(
          connectWebSocket,
          COMPONENT_CONSTANTS.WEBSOCKET_RECONNECT_DELAY,
        );
      };

      wsRef.current.onmessage = event => {
        const rawMessage = JSON.parse(event.data);

        if (
          rawMessage.type === 'connection' ||
          rawMessage.type === 'notification_count'
        ) {
          return;
        }

        const notification: Notification = {
          id: rawMessage.id,
          message: rawMessage.message,
          timestamp: new Date(rawMessage.timestamp).toLocaleString(),
          read: Boolean(rawMessage.read),
          type: rawMessage.type ?? 'general',
        };

        addNotification(notification);
      };
    } catch (error) {
      handleApiError(error, 'Failed to establish WebSocket connection');
      updateState({ wsConnected: false });
    }
  }, [updateState, addNotification, handleApiError]);

  const disconnectWebSocket = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    updateState({ wsConnected: false });
  }, [updateState]);

  useEffect(() => {
    fetchNotifications();
    connectWebSocket();

    return () => {
      disconnectWebSocket();
    };
  }, [fetchNotifications, connectWebSocket, disconnectWebSocket]);

  useEffect(() => {
    return () => {
      disconnectWebSocket();
    };
  }, [disconnectWebSocket]);

  return {
    notifications: state.notifications,
    loading: state.loading,
    error: state.error,
    wsConnected: state.wsConnected,

    fetchNotifications,
    deleteNotification,
    toggleNotificationReadStatus,
    markAllAsRead,
    clearError,

    connectWebSocket,
    disconnectWebSocket,
  };
};
