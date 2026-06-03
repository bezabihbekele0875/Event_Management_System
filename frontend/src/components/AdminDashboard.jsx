import React from 'react';
import { Users, LayoutDashboard, ShieldAlert, Pencil, Trash2, PlusCircle, RefreshCcw } from 'lucide-react';

export default function AdminDashboard({ users, events, loadingUsers, onRefreshUsers, onDeleteUser, onEditEvent, onDeleteEvent, onOpenCreateForm }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ margin: 0 }}>Admin Dashboard</h2>
            <p style={{ marginTop: '0.75rem', color: 'var(--text-secondary)' }}>
              Manage user accounts and event operations in one secure admin portal.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button className="btn-secondary" onClick={onRefreshUsers}>
              <RefreshCcw size={16} /> Refresh users
            </button>
            <button className="btn-primary" onClick={onOpenCreateForm}>
              <PlusCircle size={16} /> Create event
            </button>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div className="glass-panel" style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <ShieldAlert size={20} color="var(--brand-primary)" />
            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Managed users</div>
              <strong>{users.length}</strong>
            </div>
          </div>
        </div>
        <div className="glass-panel" style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Users size={20} color="var(--brand-secondary)" />
            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Active events</div>
              <strong>{events.length}</strong>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gap: '1.5rem' }}>
        <section className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ margin: 0 }}>Manage Users</h3>
              <p style={{ margin: '0.5rem 0 0', color: 'var(--text-secondary)' }}>
                Administrators can remove inactive users or review account roles.
              </p>
            </div>
          </div>

          {loadingUsers ? (
            <p>Loading users...</p>
          ) : users.length === 0 ? (
            <div className="glass-panel" style={{ padding: '1rem', textAlign: 'center' }}>
              No users available yet.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '0.75rem 0', color: 'var(--text-secondary)' }}>Username</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem 0', color: 'var(--text-secondary)' }}>Email</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem 0', color: 'var(--text-secondary)' }}>Role</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem 0', color: 'var(--text-secondary)' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} style={{ borderTop: '1px solid rgba(148, 163, 184, 0.15)' }}>
                      <td style={{ padding: '0.75rem 0' }}>{user.username}</td>
                      <td style={{ padding: '0.75rem 0' }}>{user.email}</td>
                      <td style={{ padding: '0.75rem 0' }}>{user.role}</td>
                      <td style={{ padding: '0.75rem 0' }}>
                        <button
                          className="btn-secondary"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                          onClick={() => onDeleteUser(user.id)}
                        >
                          <Trash2 size={14} /> Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ margin: 0 }}>Manage Events</h3>
              <p style={{ margin: '0.5rem 0 0', color: 'var(--text-secondary)' }}>
                Review event details, update schedules, or remove events from the system.
              </p>
            </div>
          </div>

          {events.length === 0 ? (
            <div className="glass-panel" style={{ padding: '1rem', textAlign: 'center' }}>
              No events available yet.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '0.75rem 0', color: 'var(--text-secondary)' }}>Title</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem 0', color: 'var(--text-secondary)' }}>Date</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem 0', color: 'var(--text-secondary)' }}>Type</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem 0', color: 'var(--text-secondary)' }}>Capacity</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem 0', color: 'var(--text-secondary)' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event) => (
                    <tr key={event.id} style={{ borderTop: '1px solid rgba(148, 163, 184, 0.15)' }}>
                      <td style={{ padding: '0.75rem 0' }}>{event.title}</td>
                      <td style={{ padding: '0.75rem 0' }}>{new Date(event.date).toLocaleString()}</td>
                      <td style={{ padding: '0.75rem 0' }}>{event.typeName || event.type}</td>
                      <td style={{ padding: '0.75rem 0' }}>{event.capacity}</td>
                      <td style={{ padding: '0.75rem 0', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button className="btn-secondary" onClick={() => onEditEvent(event)}>
                          <Pencil size={14} /> Edit
                        </button>
                        <button className="btn-secondary" onClick={() => onDeleteEvent(event.id)}>
                          <Trash2 size={14} /> Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
