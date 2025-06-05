import {
  NotificationType,
  Notification,
  NotificationStats,
} from '../types/notification';

export const NOTIFICATION_TYPE_CONFIG = {
  info: {
    color: '#2196f3',
    label: 'Info',
  },
  success: {
    color: '#4caf50',
    label: 'Success',
  },
  warning: {
    color: '#ff9800',
    label: 'Warning',
  },
  error: {
    color: '#f44336',
    label: 'Error',
  },
  general: {
    color: '#757575',
    label: 'General',
  },
} as const;

export const getThemeColors = (isDark: boolean) => ({
  unreadBackground: isDark ? '#2d3a4a' : '#fffbe6',
  readBackground: isDark ? '#23272f' : '#f0f0f0',
  cardBorder: isDark ? '#333' : '#ddd',
  textColor: isDark ? '#fff' : '#222',
  mutedTextColor: isDark ? '#aaa' : '#888',
  errorBackground: isDark ? '#2d1b1b' : '#ffebee',
  errorBorder: '#f44336',
  errorColor: '#f44336',
});

export const getTypeColor = (type: NotificationType): string => {
  return (
    NOTIFICATION_TYPE_CONFIG[type]?.color ||
    NOTIFICATION_TYPE_CONFIG.general.color
  );
};

export const getTypeLabel = (type: NotificationType): string => {
  return (
    NOTIFICATION_TYPE_CONFIG[type]?.label ||
    NOTIFICATION_TYPE_CONFIG.general.label
  );
};

export const calculateNotificationStats = (
  notifications: Notification[],
): NotificationStats[] => {
  const types: NotificationType[] = [
    'info',
    'success',
    'warning',
    'error',
    'general',
  ];

  return types.map(type => {
    const typeNotifications = notifications.filter(n => n.type === type);
    const unreadCount = typeNotifications.filter(n => !n.read).length;

    return {
      type,
      total: typeNotifications.length,
      unread: unreadCount,
    };
  });
};

export const getAccessibilityLabel = (notification: Notification): string => {
  const readStatus = notification.read ? 'read' : 'unread';
  const typeLabel = getTypeLabel(notification.type);
  return `${typeLabel} notification, ${readStatus}: ${notification.message}`;
};

export const COMPONENT_CONSTANTS = {
  WEBSOCKET_RECONNECT_DELAY: 3000,
  ANIMATION_DURATION: 200,
} as const;
