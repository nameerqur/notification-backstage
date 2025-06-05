import { Server as WebSocketServer, WebSocket } from 'ws';
import { getAllNotifications } from './notification.service';
import { Notification } from '../type/notification.type';

type Client = WebSocket;

class WebSocketService {
  wss: WebSocketServer | null = null;
  clients = new Set<Client>();
  started = false;

  start(port: number, path: string) {
    if (this.started) return;
    if (this._isTestEnv()) {
      console.log('Skipping WebSocket server in test environment');
      this.started = true;
      return;
    }

    this.wss = new WebSocketServer({ port, path });

    this.wss.on('connection', (ws: Client) => {
      this.clients.add(ws);

      ws.send(
        JSON.stringify({
          type: 'connection',
          message: 'Connected to notification stream',
          timestamp: Date.now(),
        }),
      );

      ws.on('close', () => this.clients.delete(ws));
      ws.on('error', () => this.clients.delete(ws));
    });

    this.started = true;
    console.log(`WebSocket server started on ws://localhost:${port}${path}`);
  }

  stop() {
    if (this.wss && this.started) {
      this.wss.close();
      this.clients.forEach(client => client.close());
      this.clients.clear();
      this.started = false;
      console.log('WebSocket server stopped');
    }
  }

  broadcastNotification(notification: Notification) {
    if (this._isTestEnv()) {
      console.info('WebSocket server not initialized, cannot broadcast');
      return;
    }
    this._broadcast(JSON.stringify(notification));
    this.broadcastNotificationCount();
  }

  broadcastNotificationCount() {
    if (this._isTestEnv()) {
      console.info('WebSocket server not initialized, cannot broadcast');
      return;
    }
    getAllNotifications()
      .then(notifications => {
        const unreadCount = notifications.filter(n => !n.read).length;
        const data = JSON.stringify({
          type: 'notification_count',
          unreadCount,
          timestamp: Date.now(),
        });
        this._broadcast(data);
      })
      .catch(err => {
        console.error('Failed to broadcast notification count:', err);
      });
  }

  private _isTestEnv(): boolean {
    return process.env.NODE_ENV === 'test' || !!process.env.JEST_WORKER_ID;
  }

  private _broadcast(data: string) {
    this.clients.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      } else {
        this.clients.delete(ws);
      }
    });
  }
}

export const websocketService = new WebSocketService();
