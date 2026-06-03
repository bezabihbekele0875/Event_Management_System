import React, { useState, useEffect } from 'react';
import { CalendarRange, Activity, MessageSquare, Tag, Terminal, ShieldAlert } from 'lucide-react';

export default function Dashboard({ currentRole, events, registeredEventIds = [], adminStats, notificationLogs, onCreateClick }) {
  
  // Student Registered Events Filter
  const registeredEvents = events.filter(e => registeredEventIds.includes(String(e.id)));

  // Admin Logs status badge formatter
  const renderStatus = (status) => {
    const isSuccess = status?.toLowerCase() === 'success';
    return (
      <span style={{
        background: isSuccess ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
        color: isSuccess ? '#34d399' : '#f87171',
        padding: '0.15rem 0.5rem',
        borderRadius: 'var(--radius-sm)',
        fontSize: '0.7rem',
        fontWeight: 700,
        border: isSuccess ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)'
      }}>
        {status?.toUpperCase() || 'SUCCESS'}
      </span>
    );
  };

  return (
    <div style={{ marginBottom: '2rem' }}>
      
      {/* 1. STUDENT VIEW */}
      {currentRole === 'STUDENT' && (
        <div className="glass-panel" style={{ padding: '1.5rem', border: '1px dashed rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <CalendarRange size={18} color="var(--brand-primary)" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Your Registered Schedule</h3>
          </div>

          {registeredEvents.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {registeredEvents.map(e => (
                <div key={e.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.75rem 1rem',
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)'
                }}>
                  <div>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 700 }}>{e.title}</h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Date: {new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <span style={{
                    fontSize: '0.7rem',
                    background: 'rgba(255,255,255,0.05)',
                    color: 'var(--text-secondary)',
                    padding: '0.2rem 0.6rem',
                    borderRadius: 'var(--radius-full)'
                  }}>
                    {e.typeName || e.type}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>
              You haven't registered for any events yet. Select an event below to get started.
            </p>
          )}
        </div>
      )}

      {/* 2. ORGANIZER VIEW */}
      {currentRole === 'ORGANIZER' && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--brand-gradient)',
          padding: '1.5rem 2rem',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)'
        }}>
          <div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'white' }}>Organizer Studio Dashboard</h3>
            <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)', marginTop: '0.25rem' }}>
              Create training modules, seminars, club workshops, and view capacity registers.
            </p>
          </div>
          <button
            onClick={onCreateClick}
            style={{
              backgroundColor: 'white',
              color: 'var(--brand-primary)',
              padding: '0.75rem 1.5rem',
              borderRadius: 'var(--radius-md)',
              fontWeight: 700,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}
          >
            Create New Event
          </button>
        </div>
      )}

      {/* 3. ADMIN VIEW */}
      {currentRole === 'ADMIN' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Operational statistics cards */}
          <div className="stats-grid">
            <div className="glass-panel stat-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                <CalendarRange size={16} color="#6366f1" />
                <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Total Active Events</span>
              </div>
              <div className="stat-value">{adminStats.totalEvents || events.length}</div>
            </div>

            <div className="glass-panel stat-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                <Activity size={16} color="#10b981" />
                <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Total Registrations</span>
              </div>
              <div className="stat-value">{adminStats.totalRegistrations || 0}</div>
            </div>

            <div className="glass-panel stat-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                <Tag size={16} color="#8b5cf6" />
                <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Categories Seeded</span>
              </div>
              <div className="stat-value">4</div>
            </div>

            <div className="glass-panel stat-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                <MessageSquare size={16} color="#f59e0b" />
                <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Sent Notifications</span>
              </div>
              <div className="stat-value">{notificationLogs.length}</div>
            </div>
          </div>

          {/* Activity Logs (Integration monitoring) */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem',
              borderBottom: '1px solid var(--border-color)',
              paddingBottom: '0.75rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Terminal size={18} color="var(--brand-primary)" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Notification Audit Logs</h3>
              </div>
              <span style={{
                fontSize: '0.7rem',
                color: 'var(--text-secondary)',
                backgroundColor: 'rgba(255,255,255,0.05)',
                padding: '0.2rem 0.5rem',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}>
                <ShieldAlert size={12} color="#f59e0b" />
                Sync Mode: Real-time (Flask)
              </span>
            </div>

            {notificationLogs.length > 0 ? (
              <div style={{
                maxHeight: '220px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                fontFamily: 'monospace',
                fontSize: '0.75rem'
              }}>
                {notificationLogs.map((log, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '0.6rem 0.8rem',
                    background: 'rgba(0,0,0,0.2)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    gap: '0.25rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>{log.timestamp ? log.timestamp.split('T')[1].substring(0, 8) : '00:00:00'}</span>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <span style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>
                          {log.recipient}
                        </span>
                        {renderStatus(log.status)}
                      </div>
                    </div>
                    <span style={{ color: 'var(--text-secondary)', wordBreak: 'break-all' }}>
                      &gt; {log.message}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1.5rem' }}>
                No notifications logs generated yet. Registers or cancels will trigger logs.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
