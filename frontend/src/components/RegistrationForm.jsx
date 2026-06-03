import React, { useState, useEffect } from 'react';
import { X, CalendarPlus } from 'lucide-react';

export default function RegistrationForm({ isOpen, onClose, onSubmit, editEvent }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [capacity, setCapacity] = useState(50);
  const [type, setType] = useState('WORKSHOP');

  useEffect(() => {
    if (editEvent) {
      setTitle(editEvent.title || '');
      setDescription(editEvent.description || '');
      setDate(editEvent.date || '');
      setCapacity(editEvent.capacity || 50);
      setType(editEvent.typeName?.toUpperCase() || editEvent.type?.toUpperCase() || 'WORKSHOP');
    } else {
      setTitle('');
      setDescription('');
      setDate('');
      setCapacity(50);
      setType('WORKSHOP');
    }
  }, [editEvent, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title || !description || !date) {
      alert('Please fill in all fields.');
      return;
    }
    onSubmit({
      id: editEvent?.id,
      title,
      description,
      date,
      capacity: parseInt(capacity, 10),
      type
    });
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '500px',
        padding: '2rem',
        position: 'relative',
        boxShadow: 'var(--shadow-glass)',
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            background: 'none',
            color: 'var(--text-secondary)',
            border: 'none',
            padding: '0.25rem',
            display: 'flex'
          }}
        >
          <X size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <CalendarPlus size={20} color="var(--brand-primary)" />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>
            {editEvent ? 'Modify Event Details' : 'Create University Event'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Event Name</label>
            <input
              type="text"
              placeholder="e.g. Intro to Computer Science"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Event Category</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              disabled={!!editEvent}
              style={{ cursor: editEvent ? 'not-allowed' : 'pointer', opacity: editEvent ? 0.6 : 1 }}
            >
              <option value="WORKSHOP">Workshop</option>
              <option value="SEMINAR">Seminar</option>
              <option value="TRAINING">Training</option>
              <option value="CLUBACTIVITY">Club Activity</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Date & Time</label>
            <input
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Seat Limit (Capacity)</label>
            <input
              type="number"
              min="1"
              max="500"
              value={capacity}
              onChange={(e) => setCapacity(parseInt(e.target.value || '0', 10))}
              required
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Detailed Description</label>
            <textarea
              placeholder="What will students learn or do at this event?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows="3"
              style={{ resize: 'none' }}
              required
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              style={{ flex: 1 }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              style={{ flex: 2 }}
            >
              {editEvent ? 'Save Changes' : 'Publish Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
