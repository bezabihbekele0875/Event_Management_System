import React, { useState } from 'react';
import { Bell, CheckCircle2, Trash2, RotateCcw } from 'lucide-react';

export default function NotificationsPage({ notifications, notificationStatus, onRefresh, onMarkRead, onDelete, onClearAll }) {
  const [markingId, setMarkingId] = useState(null);
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ margin: 0 }}>Notifications</h2>
          <p style={{ color: 'var(--text-secondary)', margin: '0.5rem 0 0' }}>
            {notificationStatus === 'connected'
              ? `${notifications.length} total · ${unreadCount} unread`
              : 'Notifications service is offline or unavailable.'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={onRefresh} className="btn-secondary" style={{ padding: '0.8rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <RotateCcw size={16} />
            Refresh
          </button>
          {notifications.length > 0 && (
            <button
              onClick={() => onClearAll()}
              className="btn-secondary"
              style={{ padding: '0.8rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.2)' }}
            >
              <Trash2 size={16} />
              Clear All
            </button>
          )}
        </div>
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
            <div 
              key={notification.id} 
              className="glass-panel" 
              style={{ 
                padding: '1.25rem', 
                position: 'relative',
                opacity: notification.read ? 0.7 : 1,
                borderLeft: notification.read ? '3px solid rgba(255,255,255,0.1)' : '3px solid rgba(99, 102, 241, 0.5)',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>{notification.recipient}</h3>
                    {!notification.read && (
                      <span style={{ 
                        background: 'rgba(99, 102, 241, 0.2)', 
                        color: '#a5b4fc', 
                        padding: '0.15rem 0.4rem', 
                        borderRadius: '2px', 
                        fontSize: '0.65rem', 
                        fontWeight: 700 
                      }}>
                        NEW
                      </span>
                    )}
                  </div>
                  <p style={{ margin: '0.25rem 0 0', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                    {notification.channel} • {notification.read ? 'Read' : 'Unread'}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  {!notification.read && (
                    <button
                      onClick={async () => {
                        setMarkingId(notification.id);
                        try {
                          await onMarkRead(notification.id);
                        } finally {
                          setMarkingId(null);
                        }
                      }}
                      title="Mark as read"
                      disabled={markingId === notification.id}
                      style={{
                        background: 'rgba(16, 185, 129, 0.1)',
                        color: '#34d399',
                        padding: '0.4rem 0.6rem',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid rgba(16, 185, 129, 0.2)',
                        fontSize: '0.8rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        cursor: markingId === notification.id ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <CheckCircle2 size={14} /> {markingId === notification.id ? 'Marking...' : 'Mark'}
                    </button>
                  )}
                    <button
                      onClick={() => onDelete(notification.id)}
                      title="Delete notification"
                      style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        color: '#f87171',
                        padding: '0.4rem 0.6rem',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        fontSize: '0.8rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseOver={(e) => e.target.style.background = 'rgba(239, 68, 68, 0.2)'}
                      onMouseOut={(e) => e.target.style.background = 'rgba(239, 68, 68, 0.1)'}
                    >
                      <Trash2 size={14} />
                    </button>
                </div>
              </div>
              <p style={{ marginTop: '0.75rem', marginBottom: '1rem', lineHeight: 1.6, color: 'var(--text-primary)' }}>{notification.message}</p>
              <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {new Date(notification.created_at).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
