import { memo, useMemo } from 'react';
import { useTheme } from '@material-ui/core/styles';
import {
  Toolbar,
  Container,
  Box,
  Typography,
  Button,
  IconButton,
  Tooltip,
  Card,
  Grid,
  CardContent,
  CardActions,
  Chip,
  CircularProgress,
  Divider,
} from '@material-ui/core';
import { InfoCard, Content } from '@backstage/core-components';
import CheckIcon from '@material-ui/icons/CheckCircle';
import DeleteIcon from '@material-ui/icons/Delete';
import NotificationsActiveIcon from '@material-ui/icons/NotificationsActive';
import RefreshIcon from '@material-ui/icons/Refresh';
import ErrorIcon from '@material-ui/icons/Error';

import { useNotifications } from '../../hooks/useNotifications';
import { NotificationIcon } from '../NotificationIcon';
import { Notification } from '../../types/notification';
import {
  getThemeColors,
  getTypeColor,
  getTypeLabel,
  calculateNotificationStats,
  getAccessibilityLabel,
  COMPONENT_CONSTANTS,
} from '../../utils/notificationUtils';

interface NotificationItemProps {
  notification: Notification;
  onDelete: (id: number) => Promise<void>;
  onToggleRead: (id: number) => Promise<void>;
  themeColors: ReturnType<typeof getThemeColors>;
}

const NotificationItem: React.FC<NotificationItemProps> = memo(
  ({ notification, onDelete, onToggleRead, themeColors }) => {
    const typeColor = getTypeColor(notification.type);
    const accessibilityLabel = getAccessibilityLabel(notification);

    const handleDeleteClick = () => onDelete(notification.id);
    const handleToggleReadClick = () => onToggleRead(notification.id);

    return (
      <article aria-label={accessibilityLabel}>
        <Card
          style={{
            backgroundColor: notification.read
              ? themeColors.readBackground
              : themeColors.unreadBackground,
            marginBottom: 16,
            borderLeft: `4px solid ${typeColor}`,
            transition: `background-color ${COMPONENT_CONSTANTS.ANIMATION_DURATION}ms ease`,
          }}
          elevation={notification.read ? 1 : 3}
        >
          <CardContent style={{ paddingBottom: 8 }}>
            <Box display="flex" alignItems="flex-start" style={{ gap: 16 }}>
              <NotificationIcon type={notification.type} size="medium" />

              <Box flex={1}>
                <Typography
                  variant="body1"
                  style={{
                    fontWeight: notification.read ? 400 : 600,
                    color: notification.read
                      ? themeColors.textColor
                      : typeColor,
                    marginBottom: 4,
                  }}
                >
                  {notification.message}
                </Typography>

                <Box
                  display="flex"
                  alignItems="center"
                  flexWrap="wrap"
                  style={{ gap: 8 }}
                >
                  <Typography
                    variant="caption"
                    style={{ color: themeColors.mutedTextColor }}
                  >
                    {notification.timestamp}
                  </Typography>

                  <Chip
                    label={getTypeLabel(notification.type)}
                    size="small"
                    style={{
                      height: 18,
                      fontSize: 10,
                      backgroundColor: typeColor,
                      color: '#fff',
                      fontWeight: 600,
                    }}
                  />

                  {!notification.read && (
                    <Chip
                      label="NEW"
                      size="small"
                      style={{
                        height: 18,
                        fontSize: 10,
                        backgroundColor: typeColor,
                        color: '#fff',
                        fontWeight: 700,
                      }}
                    />
                  )}
                </Box>
              </Box>
            </Box>
          </CardContent>

          <CardActions style={{ paddingTop: 0, justifyContent: 'flex-end' }}>
            <Tooltip
              title={notification.read ? 'Mark as Unread' : 'Mark as Read'}
            >
              <IconButton
                onClick={handleToggleReadClick}
                color="primary"
                size="small"
                aria-label={
                  notification.read ? 'Mark as unread' : 'Mark as read'
                }
              >
                <CheckIcon style={{ opacity: notification.read ? 0.5 : 1 }} />
              </IconButton>
            </Tooltip>

            <Tooltip title="Delete Notification">
              <IconButton
                onClick={handleDeleteClick}
                color="secondary"
                size="small"
                aria-label="Delete notification"
              >
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          </CardActions>
        </Card>
      </article>
    );
  },
);
NotificationItem.displayName = 'NotificationItem';

interface NotificationStatsProps {
  notifications: Notification[];
}

const NotificationStats: React.FC<NotificationStatsProps> = memo(
  ({ notifications }) => {
    const stats = useMemo(
      () => calculateNotificationStats(notifications),
      [notifications],
    );

    return (
      <Box
        component="section"
        display="flex"
        flexWrap="wrap"
        style={{ gap: 16 }}
        aria-label="Notification statistics"
      >
        {stats.map(({ type, total, unread }) => {
          if (total === 0) return null;

          return (
            <Chip
              key={type}
              label={`${getTypeLabel(type)}: ${total}${
                unread > 0 ? ` (${unread} new)` : ''
              }`}
              style={{
                backgroundColor: getTypeColor(type),
                color: '#fff',
                fontWeight: 600,
                minWidth: 80,
              }}
              size="medium"
            />
          );
        })}
      </Box>
    );
  },
);

NotificationStats.displayName = 'NotificationStats';

interface ErrorDisplayProps {
  error: { message: string; endpoint?: string } | null;
  onDismiss: () => void;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = memo(
  ({ error, onDismiss }) => {
    if (!error) return null;

    return (
      <Card
        style={{
          marginBottom: 24,
          backgroundColor: '#ffebee',
          border: '1px solid #f44336',
          borderRadius: 8,
        }}
        role="alert"
      >
        <CardContent>
          <Box display="flex" alignItems="flex-start" style={{ gap: 12 }}>
            <ErrorIcon style={{ color: '#f44336', marginTop: 2 }} />
            <Box flex={1}>
              <Typography
                variant="h6"
                style={{ color: '#f44336', marginBottom: 8 }}
              >
                Error
              </Typography>
              <Typography variant="body2" style={{ color: '#f44336' }}>
                {error.message}
              </Typography>
              {error.endpoint && (
                <Typography
                  variant="caption"
                  display="block"
                  style={{ marginTop: 8, color: '#f44336' }}
                >
                  Endpoint: {error.endpoint}
                </Typography>
              )}
            </Box>
            <IconButton
              onClick={onDismiss}
              size="small"
              style={{ color: '#f44336' }}
              aria-label="Dismiss error"
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        </CardContent>
      </Card>
    );
  },
);

ErrorDisplay.displayName = 'ErrorDisplay';

export const NotificationCenter: React.FC = () => {
  const theme = useTheme();
  const isDark =
    (theme.palette as any)?.mode === 'dark' ||
    (theme.palette as any)?.type === 'dark' ||
    false;
  const themeColors = useMemo(() => getThemeColors(isDark), [isDark]);

  const {
    notifications,
    loading,
    error,
    deleteNotification,
    toggleNotificationReadStatus,
    markAllAsRead,
    clearError,
    fetchNotifications,
  } = useNotifications();

  const hasNotifications = notifications.length > 0;
  const hasUnreadNotifications = useMemo(
    () => notifications.some(n => !n.read),
    [notifications],
  );

  return (
    <Content>
      <Grid container spacing={3} direction="column">
        <Grid item>
          <InfoCard>
            <Toolbar>
              <Box display="flex" alignItems="center" flex={1}>
                <NotificationsActiveIcon style={{ marginRight: 12 }} />
                <Typography variant="h5">Notification Center</Typography>
                {loading && (
                  <Box display="flex" alignItems="center" ml={2}>
                    <CircularProgress size={16} color="inherit" />
                    <Typography
                      variant="caption"
                      style={{
                        marginLeft: 8,
                        color: isDark ? '#ccc' : '#ddd',
                      }}
                    >
                      Loading...
                    </Typography>
                  </Box>
                )}
              </Box>

              <Box display="flex" style={{ gap: 8 }}>
                <Tooltip title="Refresh notifications">
                  <IconButton
                    onClick={fetchNotifications}
                    disabled={loading}
                    color="inherit"
                    aria-label="Refresh notifications"
                  >
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>

                <Button
                  variant="outlined"
                  color="inherit"
                  startIcon={<CheckIcon />}
                  onClick={markAllAsRead}
                  disabled={loading || !hasUnreadNotifications}
                  aria-label="Mark all notifications as read"
                >
                  Mark All Read
                </Button>
              </Box>
            </Toolbar>
            <Divider style={{ marginTop: 16 }} />
            <CardContent style={{ paddingTop: 30 }}>
              <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                width="100%"
              >
                <ErrorDisplay error={error} onDismiss={clearError} />
                <NotificationStats notifications={notifications} />
              </Box>
            </CardContent>
          </InfoCard>
        </Grid>
        <Grid item>
          <InfoCard>
            <Container
              maxWidth="md"
              style={{ paddingTop: 32, paddingBottom: 32 }}
            >
              {hasNotifications ? (
                <Box
                  component="section"
                  aria-label="Notifications list"
                  role="feed"
                >
                  {notifications.map(notification => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onDelete={deleteNotification}
                      onToggleRead={toggleNotificationReadStatus}
                      themeColors={themeColors}
                    />
                  ))}
                </Box>
              ) : (
                !loading && (
                  <Card
                    style={{
                      textAlign: 'center',
                      padding: 32,
                      border: `2px dashed ${themeColors.cardBorder}`,
                      backgroundColor: 'transparent',
                    }}
                    elevation={0}
                  >
                    <NotificationsActiveIcon
                      style={{
                        fontSize: 48,
                        marginBottom: 16,
                        opacity: 0.5,
                        color: themeColors.mutedTextColor,
                      }}
                    />
                    <Typography
                      variant="h6"
                      style={{
                        color: themeColors.mutedTextColor,
                        marginBottom: 8,
                      }}
                    >
                      No notifications
                    </Typography>
                    <Typography
                      variant="body2"
                      style={{ color: themeColors.mutedTextColor }}
                    >
                      All notifications have been read or deleted
                    </Typography>
                  </Card>
                )
              )}

              {loading && !hasNotifications && (
                <Box display="flex" justifyContent="center" p={4}>
                  <CircularProgress />
                </Box>
              )}
            </Container>
          </InfoCard>
        </Grid>
      </Grid>
    </Content>
  );
};

NotificationCenter.displayName = 'NotificationCenter';
