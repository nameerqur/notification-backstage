import { websocketService } from '../service/websocket.service';

export const initializeNotificationWebSocket = () => {
  websocketService.start(
    Number(process.env.WS_PORT) || 8080,
    process.env.WS_PATH ?? '/notifications',
  );
};
