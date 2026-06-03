import React, { useState } from 'react';
import { UserPlus, User, Lock, Mail, UserCog, Eye, EyeOff } from 'lucide-react';

export default function RegisterPage({ onRegisterSuccess, onSwitchToLogin }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [role, setRole] = useState('STUDENT');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          email,
          password,
          role: role.toUpperCase()
        })
      });

      const data = await res.json();

      if (res.ok) {
        // Store user info and redirect to app
        sessionStorage.setItem('user', JSON.stringify(data));
        onRegisterSuccess(data);
      } else {
        setError(data.error || 'Registration failed.');
      }
    } catch (e) {
      setError('Error connecting to server.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      padding: '1rem'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '450px',
        padding: '2rem',
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <UserPlus size={40} color="#f5576c" style={{ marginBottom: '0.5rem' }} />
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#1f2937' }}>
            Create Account
          </h1>
          <p style={{ color: '#6b7280', marginTop: '0.5rem' }}>
            Join the University Event System
          </p>
        </div>

        {error && (
          <div style={{
            padding: '0.75rem 1rem',
            backgroundColor: '#fee2e2',
            borderRadius: '8px',
            color: '#dc2626',
            fontSize: '0.85rem',
            marginBottom: '1rem',
            border: '1px solid #fecaca'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.85rem',
              fontWeight: 600,
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              <User size={16} />
              Username
            </label>
            <input
              type="text"
              placeholder="Choose a username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '0.95rem',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.85rem',
              fontWeight: 600,
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              <Mail size={16} />
              Email Address
            </label>
            <input
              type="email"
              placeholder="your@university.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '0.95rem',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.85rem',
              fontWeight: 600,
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              <UserCog size={16} />
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '0.95rem',
                boxSizing: 'border-box',
                backgroundColor: 'white',
                cursor: 'pointer'
              }}
            >
              <option value="STUDENT">Student</option>
              <option value="ORGANIZER">Event Organizer</option>
              <option value="ADMIN">Administrator</option>
            </select>
          </div>

          <div>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.85rem',
              fontWeight: 600,
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              <Lock size={16} />
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem 3rem 0.75rem 0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '0.95rem',
                  boxSizing: 'border-box'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#6b7280',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center'
                }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.85rem',
              fontWeight: 600,
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              <Lock size={16} />
              Confirm Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem 3rem 0.75rem 0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '0.95rem',
                  boxSizing: 'border-box'
                }}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((current) => !current)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#6b7280',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center'
                }}
                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              padding: '0.75rem',
              backgroundColor: isLoading ? '#9ca3af' : '#f5576c',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.95rem',
              fontWeight: 600,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              marginTop: '0.5rem'
            }}
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p style={{
          textAlign: 'center',
          marginTop: '1.5rem',
          color: '#6b7280',
          fontSize: '0.9rem'
        }}>
          Already have an account?{' '}
          <a href="#login" onClick={(e) => {
            e.preventDefault();
            onSwitchToLogin();
          }} style={{
            color: '#f5576c',
            fontWeight: 600,
            cursor: 'pointer',
            textDecoration: 'none'
          }}>
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
