import React from 'react';
import { Bell, CheckCircle2 } from 'lucide-react';

export default function NotificationsPage({ notifications, notificationStatus, onRefresh, onMarkRead }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ margin: 0 }}>Notifications</h2>
          <p style={{ color: 'var(--text-secondary)', margin: '0.5rem 0 0' }}>
            {notificationStatus === 'connected'
              ? 'Live notifications are loaded from the independent Python service.'
              : 'Notifications service is offline or unavailable.'}
          </p>
        </div>
        <button onClick={onRefresh} className="btn-secondary" style={{ padding: '0.8rem 1rem' }}>
          Refresh
        </button>
      </div>

      {notifications.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '2rem' }}>
          <Bell size={32} color="var(--text-muted)" />
          <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>
            No notifications yet.
          </p>
        </div>
      ) : (
        <div className="notification-grid">
          {notifications.map((notification) => (
            <div key={notification.id} className="glass-panel" style={{ padding: '1.25rem', position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1rem' }}>{notification.recipient}</h3>
                  <p style={{ margin: '0.35rem 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    {notification.channel || 'SYSTEM'} • {notification.read ? 'Read' : 'Unread'}
                  </p>
                </div>
                {!notification.read && (
                  <button
                    onClick={() => onMarkRead(notification.id)}
                    className="btn-primary"
                    style={{ fontSize: '0.8rem', padding: '0.5rem 0.75rem' }}
                  >
                    <CheckCircle2 size={16} /> Mark read
                  </button>
                )}
              </div>
              <p style={{ marginTop: '1rem', lineHeight: 1.6 }}>{notification.message}</p>
              <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {new Date(notification.created_at).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
