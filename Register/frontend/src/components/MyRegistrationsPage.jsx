import React from 'react';
import { BookOpen, XCircle } from 'lucide-react';

export default function MyRegistrationsPage({ registrations, onCancel }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ margin: 0 }}>My Registrations</h2>
          <p style={{ color: 'var(--text-secondary)', margin: '0.5rem 0 0' }}>
            Review your upcoming sign-ups and cancel a registration if needed.
          </p>
        </div>
      </div>

      {registrations.length === 0 ? (
        <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
          <BookOpen size={32} color="var(--text-muted)" />
          <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>
            You have not registered for any events yet.
          </p>
        </div>
      ) : (
        <div className="event-grid">
          {registrations.map((registration) => (
            <div key={registration.id} className="glass-panel" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: 0 }}>{registration.eventTitle}</h3>
                  <p style={{ margin: '0.35rem 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    {registration.eventType}
                  </p>
                </div>
                <button
                  onClick={() => onCancel(registration.eventId)}
                  className="btn-secondary"
                  style={{ padding: '0.55rem 0.9rem' }}
                >
                  <XCircle size={16} /> Cancel
                </button>
              </div>
              <p style={{ marginTop: '1rem', lineHeight: 1.6 }}>{registration.eventDescription}</p>
              <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                <span>{new Date(registration.eventDate).toLocaleString()}</span>
                <span>{registration.eventCapacity ?? '—'} seats</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
