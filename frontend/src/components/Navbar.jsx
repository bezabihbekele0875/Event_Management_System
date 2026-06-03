import React from 'react';
import { Calendar, User, Award, ShieldAlert, LogOut } from 'lucide-react';

export default function Navbar({ currentRole, pages = [], username, selectedPage, onNavigate, onLogout }) {
  const getRoleInfo = () => {
    switch (currentRole) {
      case 'STUDENT':
        return { name: 'Student Portal', icon: User, color: '#10b981' };
      case 'ORGANIZER':
        return { name: 'Organizer Studio', icon: Award, color: '#8b5cf6' };
      case 'ADMIN':
        return { name: 'Admin Terminal', icon: ShieldAlert, color: '#3b82f6' };
      default:
        return { name: 'Event Portal', icon: User, color: '#10b981' };
    }
  };

  const roleInfo = getRoleInfo();
  const Icon = roleInfo.icon;
  const pagesToRender = pages.length ? pages : ['Home', 'Events', 'My Registrations', 'Notifications'];

  return (
    <nav className="glass-panel" style={{
      display: 'flex',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '1rem 1.5rem',
      gap: '1rem',
      margin: '1.5rem 0',
      position: 'sticky',
      top: '1rem',
      zIndex: 100
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{
          background: 'var(--brand-gradient)',
          padding: '0.55rem',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <Calendar size={24} color="white" />
        </div>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
            EVENT<span style={{ color: 'var(--brand-primary)' }}>HUB</span>
          </h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{roleInfo.name}</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        {pagesToRender.map((page) => (
          <button
            key={page}
            onClick={() => onNavigate(page)}
            style={{
              padding: '0.6rem 1rem',
              borderRadius: '999px',
              border: selectedPage === page ? '1px solid var(--brand-primary)' : '1px solid var(--border-color)',
              background: selectedPage === page ? 'var(--brand-primary)' : 'transparent',
              color: selectedPage === page ? 'white' : 'var(--text-primary)',
              cursor: 'pointer',
              fontWeight: 600,
              transition: 'all 0.2s'
            }}
          >
            {page}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.55rem 1rem',
          background: 'var(--bg-surface-elevated)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)'
        }}>
          <Icon size={16} color={roleInfo.color} />
          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{username}</span>
        </div>
        <button
          onClick={onLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.55rem 1rem',
            background: 'rgba(239, 68, 68, 0.12)',
            color: '#dc2626',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            fontSize: '0.85rem',
            fontWeight: 600
          }}
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </nav>
  );
}
