import React, { useEffect, useState } from 'react';
import Navbar from './components/Navbar';
import EventList from './components/EventList';
import RegistrationForm from './components/RegistrationForm';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import NotificationsPage from './components/NotificationsPage';
import MyRegistrationsPage from './components/MyRegistrationsPage';
import AdminDashboard from './components/AdminDashboard';
import OrganizerEventsPage from './components/OrganizerEventsPage';

// API base URLs for the backend services used by the UI.
const eventServiceBase = '/api/events';
const registrationServiceBase = 'http://localhost:5001';
const notificationServiceBase = 'http://localhost:5000';
// The default pages available in the navbar for authenticated users.
const pages = ['Home', 'Events', 'My Registrations', 'Notifications'];

export default function App() {
  // Persisted auth state and UI visibility controls.
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authUser, setAuthUser] = useState(null);
  const [showRegisterPage, setShowRegisterPage] = useState(false);
  const [page, setPage] = useState('Home');

  // Event, registration, and notification data state.
  const [events, setEvents] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [registrationCounts, setRegistrationCounts] = useState({});
  const [registrationStatus, setRegistrationStatus] = useState('connecting');
  const [notifications, setNotifications] = useState([]);

  // UI state for event management forms and alerts.
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [alert, setAlert] = useState(null);
  const [backendStatus, setBackendStatus] = useState('connecting');
  const [notificationStatus, setNotificationStatus] = useState('connecting');

  // Admin-only data state.
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Role-specific navigation pages for each user type.
  const rolePages = {
    STUDENT: ['Home', 'Events', 'My Registrations', 'Notifications'],
    ORGANIZER: ['Home', 'My Events', 'Notifications'],
    ADMIN: ['Home', 'Dashboard', 'Notifications']
  };
  const availablePages = authUser ? rolePages[authUser.role] || rolePages.STUDENT : [];

  // Organizer-specific computed values for dashboard stats.
  const organizerEvents = authUser?.role === 'ORGANIZER'
    ? events.filter((event) => `${event.organizerId}` === `${authUser.id}`)
    : [];
  const organizerRegistrationCount = organizerEvents.reduce(
    (total, event) => total + (registrationCounts[event.id] || 0),
    0
  );

  // Admin dashboard data summary.
  const totalUserCount = users.length;

  // Load persisted user session from browser storage on component mount.
  useEffect(() => {
    const stored = sessionStorage.getItem('user');
    if (stored) {
      try {
        const user = JSON.parse(stored);
        setAuthUser(user);
        setIsAuthenticated(true);
      } catch {
        sessionStorage.removeItem('user');
      }
    }
  }, []);

  // Fetch app data whenever a user logs in successfully.
  useEffect(() => {
    if (isAuthenticated) {
      fetchEvents();
      fetchNotifications();
      fetchRegistrations();
      fetchRegistrationCounts();
    }
  }, [isAuthenticated]);

  // Common UI alert helper used across event and registration actions.
  const triggerAlert = (message, type = 'success') => {
    setAlert({ message, type });
    setTimeout(() => setAlert(null), 4500);
  };

  // Load the admin user list only for ADMIN role.
  const fetchUsers = async () => {
    if (!authUser?.role || authUser.role !== 'ADMIN') return;

    setLoadingUsers(true);
    try {
      const response = await fetch('/api/admin/users', {
        headers: {
          'X-User-Role': authUser.role
        }
      });
      if (!response.ok) {
        throw new Error('Unable to load user list');
      }
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.warn(error);
      triggerAlert('Failed to load admin users.', 'error');
    } finally {
      setLoadingUsers(false);
    }
  };

  // Keep the selected page valid for the current user role.
  useEffect(() => {
    if (!authUser) return;
    const available = rolePages[authUser.role] || rolePages.STUDENT;
    if (!available.includes(page)) {
      setPage(available[0]);
    }
  }, [authUser?.role, page]);

  // Refresh admin-only data when the authenticated user becomes an admin.
  useEffect(() => {
    if (authUser?.role === 'ADMIN') {
      fetchUsers();
    }
  }, [authUser?.role]);

  // Handle successful login and persist the authenticated user.
  const handleLoginSuccess = (user) => {
    sessionStorage.setItem('user', JSON.stringify(user));
    setAuthUser(user);
    setIsAuthenticated(true);
    setShowRegisterPage(false);
    setPage('Home');
    triggerAlert(`Welcome back, ${user.username}!`);
  };

  // Handle successful user registration and sign the user in.
  const handleRegisterSuccess = (user) => {
    sessionStorage.setItem('user', JSON.stringify(user));
    setAuthUser(user);
    setIsAuthenticated(true);
    setShowRegisterPage(false);
    setPage('Home');
    triggerAlert(`Account created for ${user.username}`);
  };

  // Handle logout and clear local application state.
  const handleLogout = () => {
    sessionStorage.removeItem('user');
    setAuthUser(null);
    setIsAuthenticated(false);
    setEvents([]);
    setRegistrations([]);
    setNotifications([]);
    triggerAlert('Signed out successfully.', 'success');
  };

  // Fetch the list of events from the EventCard backend.
  const fetchEvents = async () => {
    try {
      const response = await fetch(eventServiceBase);
      if (!response.ok) {
        throw new Error('Failed to load events');
      }
      const data = await response.json();
      setEvents(data);
      setBackendStatus('connected');
    } catch (error) {
      console.warn(error);
      setBackendStatus('offline');
      triggerAlert('Event service unavailable. You can still use the UI in demo mode.', 'error');
    }
  };

  // Fetch the current user's registrations from the registration backend.
  const fetchRegistrations = async () => {
    if (!authUser?.email) return;
    try {
      const response = await fetch(`${registrationServiceBase}/registrations?studentEmail=${encodeURIComponent(authUser.email)}`);
      if (!response.ok) {
        throw new Error('Unable to load registrations');
      }
      const data = await response.json();
      setRegistrations(data);
      setRegistrationStatus('connected');
    } catch (error) {
      console.warn(error);
      setRegistrationStatus('offline');
    }
  };

  // Fetch registration counts for event summaries.
  const fetchRegistrationCounts = async () => {
    try {
      const response = await fetch(`${registrationServiceBase}/registrations/counts`);
      if (!response.ok) {
        throw new Error('Unable to load registration counts');
      }
      const data = await response.json();
      setRegistrationCounts(data);
      setRegistrationStatus('connected');
    } catch (error) {
      console.warn(error);
      setRegistrationStatus('offline');
    }
  };

  // Fetch notifications for the signed-in user or all notifications for admins.
  const fetchNotifications = async () => {
    const url = authUser?.role === 'ADMIN'
      ? `${notificationServiceBase}/notifications`
      : `${notificationServiceBase}/notifications?recipient=${encodeURIComponent(authUser.email)}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Notifications service unreachable');
      }
      const data = await response.json();
      setNotifications(data);
      setNotificationStatus('connected');
    } catch (error) {
      console.warn(error);
      setNotificationStatus('offline');
    }
  };

  // Delete a specific notification for the authenticated user.
  const handleDeleteNotification = async (notificationId) => {
    if (!authUser) return;
    try {
      const response = await fetch(`${notificationServiceBase}/notifications/${notificationId}`, { method: 'DELETE' });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete notification');
      }
      setNotifications(notifications.filter(n => n.id !== notificationId));
      triggerAlert('Notification deleted');
    } catch (error) {
      console.warn(error);
      setNotifications(notifications.filter(n => n.id !== notificationId));
      triggerAlert('Notification deleted');
    }
  };

  // Clear all notifications for the authenticated user.
  const handleClearAllNotifications = async () => {
    if (!authUser) return;
    try {
      const response = await fetch(`${notificationServiceBase}/notifications?recipient=${encodeURIComponent(authUser.email)}`, { method: 'DELETE' });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to clear notifications');
      }
      setNotifications([]);
      triggerAlert('All notifications cleared');
    } catch (error) {
      console.warn(error);
      setNotifications([]);
      triggerAlert('All notifications cleared');
    }
  };

  // Register the authenticated user for a selected event via the registration service.
  const handleRegister = async (eventId) => {
    if (!authUser) return;
    if (registrationStatus !== 'connected') {
      triggerAlert('Registration service unavailable. Please try again later.', 'error');
      return;
    }

    const payload = { eventId, studentEmail: authUser.email };
    try {
      const response = await fetch(`${registrationServiceBase}/registrations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to register');
      }
      const message = notificationStatus === 'offline'
        ? 'Registered successfully. Notification service is currently unavailable.'
        : 'Registered successfully. Notification request sent.';
      triggerAlert(message);
      await fetchRegistrations();
      await fetchRegistrationCounts();
      await fetchNotifications();
    } catch (error) {
      triggerAlert(error.message, 'error');
    }
  };

  // Cancel an existing registration for the authenticated user.
  const handleCancel = async (eventId) => {
    if (!authUser) return;
    if (registrationStatus !== 'connected') {
      triggerAlert('Registration service unavailable. Please try again later.', 'error');
      return;
    }

    const payload = { eventId, studentEmail: authUser.email };
    try {
      const response = await fetch(`${registrationServiceBase}/registrations/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to cancel registration');
      }
      const message = notificationStatus === 'offline'
        ? 'Registration cancelled. Notification service is currently unavailable.'
        : 'Registration cancelled. Notification request sent.';
      triggerAlert(message);
      await fetchRegistrations();
      await fetchRegistrationCounts();
      await fetchNotifications();
    } catch (error) {
      triggerAlert(error.message, 'error');
    }
  };

  // Admin action to delete another user account from the system.
  const handleDeleteUser = async (userId) => {
    if (!authUser || authUser.role !== 'ADMIN') return;
    if (`${authUser.id}` === `${userId}`) {
      triggerAlert('Cannot delete your own administrator account.', 'error');
      return;
    }

    if (!window.confirm('Remove this user from the system?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'X-User-Role': authUser.role
        }
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove user');
      }
      triggerAlert('User removed successfully.');
      await fetchUsers();
    } catch (error) {
      triggerAlert(error.message, 'error');
    }
  };

  // Submit a new event or update an existing event through the event API.
  const handleFormSubmit = async (formData) => {
    if (!authUser) return;
    const isEdit = Boolean(formData.id);
    const url = isEdit ? `${eventServiceBase}/${formData.id}` : eventServiceBase;
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': authUser.id,
          'X-User-Role': authUser.role
        },
        body: JSON.stringify(formData)
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save event');
      }
      triggerAlert(isEdit ? 'Event updated.' : 'Event created.');
      setIsFormOpen(false);
      setEditingEvent(null);
      await fetchEvents();
    } catch (error) {
      triggerAlert(error.message, 'error');
    }
  };

  // Delete an event owned by the authenticated organizer or admin.
  const handleDelete = async (eventId) => {
    if (!authUser) return;
    if (!window.confirm('Are you sure you want to delete this event?')) {
      return;
    }

    try {
      const response = await fetch(`${eventServiceBase}/${eventId}`, {
        method: 'DELETE',
        headers: {
          'X-User-Id': authUser.id,
          'X-User-Role': authUser.role
        }
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Event delete failed');
      }
      triggerAlert('Event deleted.');
      await fetchEvents();
    } catch (error) {
      triggerAlert(error.message, 'error');
    }
  };

  // Open the event form for creating a new event.
  const openCreateForm = () => {
    setEditingEvent(null);
    setIsFormOpen(true);
  };

  // Open the event form for editing an existing event.
  const openEditForm = (event) => {
    setEditingEvent(event);
    setIsFormOpen(true);
  };

  // Show login or register flow until the user is authenticated.
  if (!isAuthenticated) {
    return showRegisterPage ? (
      <RegisterPage onRegisterSuccess={handleRegisterSuccess} onSwitchToLogin={() => setShowRegisterPage(false)} />
    ) : (
      <LoginPage onLoginSuccess={handleLoginSuccess} onSwitchToRegister={() => setShowRegisterPage(true)} />
    );
  }

  const registeredEventIds = registrations.map((registration) => registration.eventId);

  return (
    <div style={{ maxWidth: '1160px', margin: '0 auto', padding: '1.5rem' }}>
      {alert && (
        <div style={{
          position: 'fixed',
          top: '1rem',
          right: '1rem',
          zIndex: 1000,
          padding: '1rem 1.25rem',
          borderRadius: '16px',
          backgroundColor: alert.type === 'error' ? 'rgba(239, 68, 68, 0.95)' : 'rgba(59, 130, 246, 0.95)',
          color: 'white',
          boxShadow: '0 18px 50px rgba(0,0,0,0.2)'
        }}>
          {alert.message}
        </div>
      )}

      {/* Main navigation bar for the authenticated user */}
      <Navbar
        currentRole={authUser.role}
        pages={availablePages}
        username={authUser.username}
        selectedPage={page}
        onNavigate={setPage}
        onLogout={handleLogout}
      />

      {/* Page content changes depending on navigation selection */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Home dashboard with role-specific summaries and status cards */}
      {page === 'Home' && (
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h1 style={{ margin: 0, fontSize: '2rem' }}>Welcome back, {authUser.username}</h1>
            <p style={{ marginTop: '0.75rem', color: 'var(--text-secondary)' }}>
              {authUser.role === 'STUDENT'
                ? 'Browse the events catalog, manage your registrations, and stay on top of notifications.'
                : authUser.role === 'ORGANIZER'
                  ? 'Manage your created events, review sign-ups, and keep participants informed.'
                  : 'Overview the platform operations, manage users, and keep event activity under control.'}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginTop: '1.5rem' }}>
              {authUser.role === 'STUDENT' && (
                <>
                  <div className="glass-panel" style={{ padding: '1rem' }}>
                    <strong>{events.length}</strong>
                    <div>Active events</div>
                  </div>
                  <div className="glass-panel" style={{ padding: '1rem' }}>
                    <strong>{registrations.length}</strong>
                    <div>My registrations</div>
                  </div>
                  <div className="glass-panel" style={{ padding: '1rem' }}>
                    <strong>{notificationStatus === 'connected' ? notifications.length : 0}</strong>
                    <div>Notifications loaded</div>
                  </div>
                </>
              )}

              {authUser.role === 'ORGANIZER' && (
                <>
                  <div className="glass-panel" style={{ padding: '1rem' }}>
                    <strong>{organizerEvents.length}</strong>
                    <div>Created events</div>
                  </div>
                  <div className="glass-panel" style={{ padding: '1rem' }}>
                    <strong>{organizerRegistrationCount}</strong>
                    <div>Participant sign-ups</div>
                  </div>
                  <div className="glass-panel" style={{ padding: '1rem' }}>
                    <strong>{notificationStatus === 'connected' ? notifications.length : 0}</strong>
                    <div>Notifications loaded</div>
                  </div>
                </>
              )}

              {authUser.role === 'ADMIN' && (
                <>
                  <div className="glass-panel" style={{ padding: '1rem' }}>
                    <strong>{events.length}</strong>
                    <div>Active events</div>
                  </div>
                  <div className="glass-panel" style={{ padding: '1rem' }}>
                    <strong>{totalUserCount}</strong>
                    <div>Registered users</div>
                  </div>
                  <div className="glass-panel" style={{ padding: '1rem' }}>
                    <strong>{notificationStatus === 'connected' ? notifications.length : 0}</strong>
                    <div>Notifications loaded</div>
                  </div>
                </>
              )}
            </div>
            <div className="glass-panel" style={{ padding: '1rem' }}>
              <strong>{registrationStatus === 'connected' ? 'Online' : registrationStatus === 'offline' ? 'Offline' : 'Connecting'}</strong>
              <div>Registration service</div>
            </div>
          </div>
        )}

        {/* Event catalog page for browsing, registering, and managing events */}
        {page === 'Events' && (
          <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h2>Event Catalog</h2>
                <p style={{ color: 'var(--text-secondary)' }}>
                  Browse, search, and manage events from the catalog.
                </p>
              </div>
              {(authUser.role === 'ORGANIZER' || authUser.role === 'ADMIN') && (
                <button className="btn-primary" onClick={openCreateForm}>
                  Create event
                </button>
              )}
            </div>
            {registrationStatus !== 'connected' && (
              <div className="glass-panel" style={{ padding: '1rem', marginBottom: '1rem', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                <strong style={{ display: 'block', marginBottom: '0.4rem' }}>Registration service unavailable.</strong>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  You can still browse events, but registrations and cancellations are temporarily disabled until the service is restored.
                </span>
              </div>
            )}
            <EventList
              events={events}
              currentRole={authUser.role}
              registeredEventIds={registeredEventIds}
              registrationCounts={registrationCounts}
              registrationServiceOnline={registrationStatus === 'connected'}
              onRegister={handleRegister}
              onCancel={handleCancel}
              onEdit={openEditForm}
              onDelete={handleDelete}
            />
          </section>
        )}

        {/* Student view showing the user's current registrations */}
        {page === 'My Registrations' && (
          <MyRegistrationsPage
            registrations={registrations}
            onCancel={handleCancel}
          />
        )}

        {/* Organizer view for managing created events and sign-up counts */}
        {page === 'My Events' && authUser.role === 'ORGANIZER' && (
          <OrganizerEventsPage
            events={events}
            currentUser={authUser}
            registrationServiceBase={registrationServiceBase}
            registrationCounts={registrationCounts}
            onEdit={openEditForm}
            onDelete={handleDelete}
            onOpenCreateForm={openCreateForm}
          />
        )}

        {/* Admin dashboard for user and event management */}
        {page === 'Dashboard' && authUser.role === 'ADMIN' && (
          <AdminDashboard
            users={users}
            events={events}
            loadingUsers={loadingUsers}
            onRefreshUsers={fetchUsers}
            onDeleteUser={handleDeleteUser}
            onEditEvent={openEditForm}
            onDeleteEvent={handleDelete}
            onOpenCreateForm={openCreateForm}
          />
        )}

        {/* Notifications page for viewing and marking notifications read */}
        {page === 'Notifications' && (
          <NotificationsPage
            notifications={notifications}
            notificationStatus={notificationStatus}
            onRefresh={fetchNotifications}
            onMarkRead={async (id) => {
              try {
                const response = await fetch(`${notificationServiceBase}/notifications/${id}/read`, { method: 'PUT' });
                if (!response.ok) throw new Error('Update failed');
                await fetchNotifications();
                triggerAlert('Marked as read');
              } catch (error) {
                triggerAlert(error.message, 'error');
              }
            }}
            onDelete={handleDeleteNotification}
            onClearAll={handleClearAllNotifications}
          />
        )}
      </div>

      {/* Modal form for creating or editing events. */}
      <RegistrationForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingEvent(null);
        }}
        onSubmit={handleFormSubmit}
        editEvent={editingEvent}
      />
    </div>
  );
}
