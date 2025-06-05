import sqlite3 from 'sqlite3';
import { Notification, NotificationType } from '../type/notification.type';
import { websocketService } from './websocket.service.ts';

let db: sqlite3.Database;

export async function initNotificationDb() {
  db = new sqlite3.Database('./notifications.sqlite');

  await new Promise<void>((resolve, reject) => {
    db.run(
      `CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        message TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        type TEXT NOT NULL DEFAULT 'general',
        read BOOLEAN DEFAULT 0
      )`,
      err => (err ? reject(err) : resolve()),
    );
  });
}

export async function getAllNotifications(): Promise<Notification[]> {
  if (!db) await initNotificationDb();
  return new Promise((resolve, reject) => {
    db.all(
      'SELECT * FROM notifications ORDER BY timestamp DESC',
      (err, rows: Notification[]) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      },
    );
  });
}

export async function updateAllNotifications(read: boolean): Promise<number> {
  if (!db) await initNotificationDb();
  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE notifications SET read = ?',
      [read],
      function updateAllNotificationsCallback(
        this: sqlite3.RunResult,
        err: Error | null,
      ) {
        if (err) {
          reject(err);
        } else {
          websocketService.broadcastNotificationCount();
          resolve(this.changes || 0);
        }
      },
    );
  });
}

export async function createNotification(
  message: string,
  type: NotificationType,
): Promise<Notification> {
  if (!db) await initNotificationDb();
  const timestamp = Date.now();
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO notifications (message, timestamp, type, read) VALUES (?, ?, ?, ?)',
      [message, timestamp, type, false],
      function notificationInsertCallback(
        this: sqlite3.RunResult,
        err: Error | null,
      ) {
        if (err) {
          reject(err);
        } else {
          const notification: Notification = {
            id: this.lastID!,
            message,
            timestamp,
            type,
            read: false,
          };
          websocketService.broadcastNotification(notification);
          resolve(notification);
        }
      },
    );
  });
}

export async function deleteNotification(id: number): Promise<boolean> {
  if (!db) await initNotificationDb();
  return new Promise((resolve, reject) => {
    db.run(
      'DELETE FROM notifications WHERE id = ?',
      [id],
      function deleteNotificationCallback(
        this: sqlite3.RunResult,
        err: Error | null,
      ) {
        if (err) {
          reject(err);
        } else {
          websocketService.broadcastNotificationCount();
          resolve(this.changes! > 0);
        }
      },
    );
  });
}

async function getNotificationById(id: number): Promise<Notification | null> {
  if (!db) await initNotificationDb();

  return new Promise((resolve, reject) => {
    db.get(
      'SELECT * FROM notifications WHERE id = ?',
      [id],
      (err, row: Notification) => {
        if (err) {
          reject(err);
        } else {
          resolve(row || null);
        }
      },
    );
  });
}

export async function updateNotification(
  id: number,
  updates: { read?: boolean },
): Promise<Notification | null> {
  if (!db) await initNotificationDb();

  const fields: string[] = [];
  const values: any[] = [];

  if (typeof updates.read === 'boolean') {
    fields.push('read = ?');
    values.push(updates.read);
  }

  if (fields.length === 0) {
    return null;
  }

  values.push(id);

  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE notifications SET ${fields.join(', ')} WHERE id = ?`,
      values,
      async function updateNotificationCallback(
        this: sqlite3.RunResult,
        updateErr: Error | null,
      ) {
        if (updateErr) {
          reject(updateErr);
        } else if (this.changes === 0) {
          resolve(null);
        } else {
          try {
            const updated = await getNotificationById(id);
            websocketService.broadcastNotificationCount();
            resolve(updated);
          } catch (err) {
            reject(err);
          }
        }
      },
    );
  });
}

initNotificationDb().catch(console.error);
