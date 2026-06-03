import React, { useState } from 'react';
import EventCard from './EventCard';
import { Search, Info } from 'lucide-react';

export default function EventList({ events, currentRole, registeredEventIds, registrationCounts = {}, registrationServiceOnline, onRegister, onCancel, onEdit, onDelete }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL');

  const filters = [
    { id: 'ALL', name: 'All Events' },
    { id: 'WORKSHOP', name: 'Workshops' },
    { id: 'SEMINAR', name: 'Seminars' },
    { id: 'TRAINING', name: 'Trainings' },
    { id: 'CLUBACTIVITY', name: 'Club Activities' }
  ];

  const filteredEvents = events.filter((e) => {
    const matchesSearch = e.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          e.description?.toLowerCase().includes(searchQuery.toLowerCase());

    let matchesCategory = true;
    if (activeFilter !== 'ALL') {
      const type = (e.typeName || e.type || '').toLowerCase();
      const filter = activeFilter.toLowerCase();
      if (filter === 'clubactivity') {
        matchesCategory = type.includes('club') || type.includes('activity');
      } else {
        matchesCategory = type === filter;
      }
    }

    return matchesSearch && matchesCategory;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '1rem',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.8rem',
                fontWeight: 600,
                backgroundColor: activeFilter === f.id ? 'var(--text-primary)' : 'var(--bg-surface-elevated)',
                color: activeFilter === f.id ? 'var(--bg-base)' : 'var(--text-secondary)',
                border: '1px solid var(--border-color)',
                transition: 'var(--transition-smooth)'
              }}
            >
              {f.name}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', width: '100%', maxWidth: '300px' }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '2.25rem', fontSize: '0.85rem', borderRadius: 'var(--radius-full)' }}
          />
        </div>
      </div>

      {filteredEvents.length > 0 ? (
        <div className="event-grid">
          {filteredEvents.map((e) => (
            <EventCard
              key={e.id}
              event={e}
              currentRole={currentRole}
              isRegistered={registeredEventIds.includes(String(e.id))}
              seatsReserved={registrationCounts[e.id] || 0}
              registrationServiceOnline={registrationServiceOnline}
              onRegister={onRegister}
              onCancel={onCancel}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      ) : (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
          <Info size={36} color="var(--text-muted)" />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>No Events Found</h3>
          <p style={{ fontSize: '0.85rem' }}>
            We couldn't find any events matching your selected search query or category filters.
          </p>
        </div>
      )}
    </div>
  );
}
