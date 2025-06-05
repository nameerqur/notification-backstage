export type NotificationType =
  | 'info'
  | 'success'
  | 'warning'
  | 'error'
  | 'general';

export type Notification = {
  id: number;
  message: string;
  timestamp: number;
  type: NotificationType;
  read?: boolean;
};
