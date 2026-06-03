import React from 'react';
import { CalendarDays, Users, Pencil, Trash2, Check } from 'lucide-react';

export default function EventCard({ event, currentRole, isRegistered, seatsReserved = 0, registrationServiceOnline = true, onRegister, onCancel, onEdit, onDelete }) {
  

  const capacity = Number(event.capacity) || 0;
  const seatsTaken = Number(seatsReserved) || 0;
  const availableSeats = Math.max(0, capacity - seatsTaken);
  const isFull = availableSeats <= 0;
  const registrationDisabled = !registrationServiceOnline;

  const getTypeConfig = (typeName) => {
    switch (typeName?.toLowerCase()) {
      case 'workshop':
        return { gradient: 'var(--workshop-gradient)', label: 'Workshop', bg: 'rgba(139, 92, 246, 0.1)', color: '#a78bfa' };
      case 'seminar':
        return { gradient: 'var(--seminar-gradient)', label: 'Seminar', bg: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa' };
      case 'training':
        return { gradient: 'var(--training-gradient)', label: 'Training', bg: 'rgba(16, 185, 129, 0.1)', color: '#34d399' };
      case 'club activity':
      case 'clubactivity':
        return { gradient: 'var(--club-gradient)', label: 'Club Activity', bg: 'rgba(245, 158, 11, 0.1)', color: '#fbbf24' };
      default:
        return { gradient: 'var(--brand-gradient)', label: 'Event', bg: 'rgba(255, 255, 255, 0.05)', color: '#a1a1aa' };
    }
  };

  const typeConfig = getTypeConfig(event.typeName || event.type);

  const formatDate = (dateStr) => {
    try {
      const options = { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
      return new Date(dateStr).toLocaleDateString('en-US', options);
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="glass-panel animate-fade-in" style={{
      display: 'flex',
      flexDirection: 'column',
      padding: '1.5rem',
      position: 'relative',
      overflow: 'hidden',
      transition: 'var(--transition-smooth)',
      minHeight: '260px'
    }}>
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '4px',
        background: typeConfig.gradient
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <span style={{
          background: typeConfig.bg,
          color: typeConfig.color,
          padding: '0.25rem 0.75rem',
          borderRadius: 'var(--radius-full)',
          fontSize: '0.75rem',
          fontWeight: 700,
          border: '1px solid rgba(255,255,255,0.05)'
        }}>
          {typeConfig.label}
        </span>

        {(currentRole === 'ORGANIZER' || currentRole === 'ADMIN') && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => onEdit(event)}
              style={{
                background: 'rgba(255,255,255,0.05)',
                color: 'var(--text-secondary)',
                padding: '0.4rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                display: 'flex'
              }}
              title="Edit Event"
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={() => onDelete(event.id)}
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                color: '#f87171',
                padding: '0.4rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                display: 'flex'
              }}
              title="Cancel Event"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>

      <div style={{ flexGrow: 1, marginBottom: '1.25rem' }}>
        <h3 style={{
          fontSize: '1.15rem',
          fontWeight: 700,
          color: 'var(--text-primary)',
          marginBottom: '0.5rem',
          lineHeight: '1.3'
        }}>
          {event.title}
        </h3>
        <p style={{
          fontSize: '0.85rem',
          color: 'var(--text-secondary)',
          lineHeight: '1.4',
          marginBottom: '1rem',
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }}>
          {event.description}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
          <CalendarDays size={14} />
          <span>{formatDate(event.date)}</span>
        </div>
      </div>

      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-secondary)' }}>
            <Users size={12} />
            <span>Capacity Seats</span>
          </span>
          <span style={{ fontWeight: 600, color: isFull ? '#f87171' : 'var(--text-primary)' }}>
            {availableSeats} / {capacity} available
          </span>
        </div>
        <div style={{
          height: '6px',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: 'var(--radius-full)',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${Math.min(100, (seatsTaken / Math.max(1, capacity)) * 100)}%`,
            height: '100%',
            background: typeConfig.gradient,
            borderRadius: 'var(--radius-full)',
            transition: 'width 0.3s ease'
          }} />
        </div>
      </div>

      <div style={{ marginTop: 'auto' }}>
        {isRegistered ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.25rem',
              fontSize: '0.8rem',
              background: 'rgba(16, 185, 129, 0.1)',
              color: '#34d399',
              padding: '0.4rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid rgba(16, 185, 129, 0.2)'
            }}>
              <Check size={14} />
              <span>Registered Successfully</span>
            </div>
            <button
              onClick={() => onCancel(event.id)}
              className="btn-secondary"
              style={{ width: '100%', padding: '0.5rem', fontSize: '0.85rem' }}
            >
              Cancel My Reservation
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => onRegister(event.id)}
                className="btn-primary"
                disabled={isFull || registrationDisabled}
                style={{
                  flexGrow: 1,
                  padding: '0.5rem',
                  fontSize: '0.85rem',
                  background: (isFull || registrationDisabled) ? 'var(--text-muted)' : typeConfig.gradient,
                  boxShadow: (isFull || registrationDisabled) ? 'none' : '0 4px 12px rgba(99, 102, 241, 0.2)',
                  cursor: (isFull || registrationDisabled) ? 'not-allowed' : 'pointer'
                }}
              >
                {registrationDisabled ? 'Registration offline' : isFull ? 'Sold Out' : 'Register Now'}
              </button>
            </div>
            {registrationDisabled && (
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                The registration service is unavailable. Please try again later.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
