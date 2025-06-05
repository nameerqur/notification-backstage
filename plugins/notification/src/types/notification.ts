export type NotificationType =
  | 'info'
  | 'success'
  | 'warning'
  | 'error'
  | 'general';

export interface Notification {
  id: number;
  message: string;
  timestamp: string;
  read: boolean;
  type: NotificationType;
}

export interface NotificationApiResponse {
  id: number;
  message: string;
  timestamp: number;
  type: NotificationType;
  read?: boolean;
}

export interface NotificationStats {
  type: NotificationType;
  total: number;
  unread: number;
}

export interface NotificationState {
  notifications: Notification[];
  loading: boolean;
  error: NotificationApiError | null;
  wsConnected: boolean;
}

export class NotificationApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly endpoint?: string,
  ) {
    super(message);
    this.name = 'NotificationApiError';
  }
}
