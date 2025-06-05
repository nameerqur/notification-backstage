import {
  Notification,
  NotificationApiResponse,
  NotificationApiError,
} from '../types/notification';

class NotificationServiceConfig {
  private static instance: NotificationServiceConfig;

  private constructor() {}

  static getInstance(): NotificationServiceConfig {
    if (!NotificationServiceConfig.instance) {
      NotificationServiceConfig.instance = new NotificationServiceConfig();
    }
    return NotificationServiceConfig.instance;
  }

  getApiBaseUrl(): string {
    return 'http://localhost:7007';
  }

  getNotificationsEndpoint(): string {
    return `${this.getApiBaseUrl()}/api/notification-backend/notifications`;
  }

  getWebSocketUrl(): string {
    return 'ws://localhost:8080/notifications';
  }
}

class ApiClient {
  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    try {
      const response = await fetch(endpoint, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new NotificationApiError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          endpoint,
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof NotificationApiError) {
        throw error;
      }

      throw new NotificationApiError(
        error instanceof Error ? error.message : 'Unknown network error',
        undefined,
        endpoint,
      );
    }
  }
}

class NotificationTransformer {
  static fromApiResponse(apiResponse: NotificationApiResponse): Notification {
    return {
      id: apiResponse.id,
      message: apiResponse.message,
      timestamp: new Date(apiResponse.timestamp).toLocaleString(),
      read: Boolean(apiResponse.read),
      type: apiResponse.type ?? 'general',
    };
  }

  static fromWebSocketMessage(wsMessage: any): Notification {
    return {
      id: wsMessage.id,
      message: wsMessage.message,
      timestamp: new Date(wsMessage.timestamp).toLocaleString(),
      read: Boolean(wsMessage.read),
      type: wsMessage.type ?? 'general',
    };
  }
}

export class NotificationService {
  private readonly config: NotificationServiceConfig;
  private readonly apiClient: ApiClient;

  constructor() {
    this.config = NotificationServiceConfig.getInstance();
    this.apiClient = new ApiClient();
  }

  async fetchNotifications(): Promise<Notification[]> {
    const endpoint = this.config.getNotificationsEndpoint();

    try {
      const apiResponses = await this.apiClient.request<
        NotificationApiResponse[]
      >(endpoint);
      return apiResponses.map(NotificationTransformer.fromApiResponse);
    } catch (error) {
      if (error instanceof NotificationApiError) {
        throw error;
      }
      throw new NotificationApiError(
        'Failed to fetch notifications',
        undefined,
        endpoint,
      );
    }
  }

  async deleteNotification(id: number): Promise<void> {
    const endpoint = `${this.config.getNotificationsEndpoint()}/${id}`;

    await this.apiClient.request(endpoint, {
      method: 'DELETE',
    });
  }

  async updateNotificationReadStatus(
    id: number,
    read: boolean,
  ): Promise<Notification> {
    const endpoint = `${this.config.getNotificationsEndpoint()}/${id}`;

    const response = await this.apiClient.request<NotificationApiResponse>(
      endpoint,
      {
        method: 'PATCH',
        body: JSON.stringify({ read }),
      },
    );

    return NotificationTransformer.fromApiResponse(response);
  }

  async markAllNotificationsAsRead(): Promise<{
    message: string;
    updated: number;
  }> {
    const endpoint = this.config.getNotificationsEndpoint();

    return await this.apiClient.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify({ read: true }),
    });
  }

  getWebSocketUrl(): string {
    return this.config.getWebSocketUrl();
  }
}

export const notificationService = new NotificationService();
export { NotificationApiError };
