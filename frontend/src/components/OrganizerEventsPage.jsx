import React, { useMemo, useState } from 'react';
import { CalendarDays, Users, Trash2, Pencil, RefreshCcw, PlusCircle } from 'lucide-react';

export default function OrganizerEventsPage({ events, currentUser, registrationServiceBase, registrationCounts = {}, onEdit, onDelete, onOpenCreateForm }) {
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [isLoadingParticipants, setIsLoadingParticipants] = useState(false);
  const [participantError, setParticipantError] = useState(null);

  const organizerEvents = useMemo(
    () => events.filter((event) => `${event.organizerId}` === `${currentUser.id}`),
    [events, currentUser.id]
  );

  const activeEvent = organizerEvents.find((event) => event.id === selectedEventId);

  const loadParticipants = async (eventId) => {
    if (!eventId) return;
    setParticipantError(null);
    setIsLoadingParticipants(true);
    try {
      const response = await fetch(`${registrationServiceBase}/registrations?eventId=${encodeURIComponent(eventId)}`);
      if (!response.ok) {
        throw new Error('Unable to load participants');
      }
      const data = await response.json();
      setParticipants(data);
      setSelectedEventId(eventId);
    } catch (error) {
      setParticipantError(error.message);
    } finally {
      setIsLoadingParticipants(false);
    }
  };

  const handleParticipantRemove = async (eventId, studentEmail) => {
    try {
      const response = await fetch(`${registrationServiceBase}/registrations/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ eventId, studentEmail })
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Unable to remove participant');
      }
      await loadParticipants(eventId);
    } catch (error) {
      setParticipantError(error.message);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ margin: 0 }}>My Events</h2>
            <p style={{ marginTop: '0.75rem', color: 'var(--text-secondary)' }}>
              Review the events you organize, manage participant lists, and keep event details up to date.
            </p>
          </div>
          <button className="btn-primary" onClick={onOpenCreateForm}>
            <PlusCircle size={16} /> Add event
          </button>
        </div>
      </div>

      {organizerEvents.length === 0 ? (
        <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
          <Users size={32} color="var(--text-muted)" />
          <h3 style={{ marginTop: '1rem' }}>No created events yet</h3>
          <p style={{ color: 'var(--text-secondary)' }}>
            Publish your first event and start collecting student registrations.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1.25rem' }}>
          {organizerEvents.map((event) => (
            <div key={event.id} className="glass-panel" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                <div>
                  <h3 style={{ margin: 0 }}>{event.title}</h3>
                  <p style={{ margin: '0.5rem 0', color: 'var(--text-secondary)' }}>{event.description}</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    <span>{event.typeName || event.type}</span>
                    <span>{new Date(event.date).toLocaleString()}</span>
                    <span>{registrationCounts[event.id] || 0} registered</span>
                    <span>{event.capacity} seats</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
                  <button className="btn-secondary" onClick={() => onEdit(event)}>
                    <Pencil size={16} /> Edit
                  </button>
                  <button className="btn-secondary" onClick={() => onDelete(event.id)}>
                    <Trash2 size={16} /> Delete
                  </button>
                  <button className="btn-primary" onClick={() => loadParticipants(event.id)}>
                    <RefreshCcw size={16} /> Participants
                  </button>
                </div>
              </div>

              {selectedEventId === event.id && (
                <div style={{ marginTop: '1.25rem', borderTop: '1px solid rgba(148, 163, 184, 0.15)', paddingTop: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
                    <h4 style={{ margin: 0 }}>Participant roster</h4>
                    {isLoadingParticipants && <span style={{ color: 'var(--text-secondary)' }}>Loading...</span>}
                  </div>

                  {participantError && (
                    <div style={{ marginTop: '0.75rem', color: '#dc2626' }}>{participantError}</div>
                  )}

                  {participants.length === 0 && !isLoadingParticipants ? (
                    <div style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>
                      No participants are registered for this event yet.
                    </div>
                  ) : (
                    <div style={{ marginTop: '1rem', display: 'grid', gap: '0.75rem' }}>
                      {participants.map((participant) => (
                        <div key={participant.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', padding: '0.95rem', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-md)' }}>
                          <div>
                            <div style={{ fontWeight: 600 }}>{participant.studentEmail}</div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                              {new Date(participant.createdAt).toLocaleString()}
                            </div>
                          </div>
                          <button className="btn-secondary" onClick={() => handleParticipantRemove(event.id, participant.studentEmail)}>
                            <Trash2 size={16} /> Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
