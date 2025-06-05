import { useEffect, useState } from 'react';
import { Badge, SvgIconProps } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import NotificationsIcon from '@material-ui/icons/Notifications';

const useStyles = makeStyles(theme => ({
  badge: {
    '& .MuiBadge-badge': {
      backgroundColor: theme.palette.error.main,
      color: theme.palette.error.contrastText,
      fontSize: '0.75rem',
      minWidth: '18px',
      height: '18px',
      borderRadius: '9px',
    },
  },
}));

export const NotificationIcon = (props: SvgIconProps) => {
  const classes = useStyles();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;

    const fetchNotificationCount = async () => {
      try {
        const response = await fetch(
          'http://localhost:7007/api/notification-backend/notifications',
        );
        if (response.ok) {
          const notifications = await response.json();
          const unread = notifications.filter(
            (n: any) => n.read === 0 || n.read === false,
          ).length;
          setUnreadCount(unread);
        }
      } catch (error) {
        // Error
      }
    };

    const connectWebSocket = () => {
      try {
        ws = new WebSocket('ws://localhost:8080/notifications');

        ws.onopen = () => {
          if (reconnectTimeout) {
            clearTimeout(reconnectTimeout);
            reconnectTimeout = null;
          }
        };

        ws.onclose = () => {
          if (!reconnectTimeout) {
            reconnectTimeout = setTimeout(connectWebSocket, 3000);
          }
        };

        ws.onerror = () => {
          // Error
        };

        ws.onmessage = event => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'notification_count') {
              setUnreadCount(data.unreadCount || 0);
            } else if (data.type === 'connection') {
              fetchNotificationCount();
            } else if (data.id && data.message) {
              if (!data.read) {
                setUnreadCount(prev => prev + 1);
              }
            }
          } catch (error) {
            // Error
          }
        };
      } catch (error) {
        // Error
      }
    };

    fetchNotificationCount();
    connectWebSocket();

    return () => {
      if (ws) {
        ws.close();
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, []);

  return (
    <Badge
      badgeContent={unreadCount}
      className={classes.badge}
      max={99}
      showZero={false}
      color="error"
    >
      <NotificationsIcon {...props} />
    </Badge>
  );
};
