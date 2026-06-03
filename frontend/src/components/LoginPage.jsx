import React, { useState } from 'react';
import { LogIn, User, Lock, Mail, Eye, EyeOff } from 'lucide-react';

export default function LoginPage({ onLoginSuccess, onSwitchToRegister }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (res.ok) {
        // Store user info in sessionStorage
        sessionStorage.setItem('user', JSON.stringify(data));
        onLoginSuccess(data);
      } else {
        setError(data.error || 'Login failed.');
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
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '1rem'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        padding: '2rem',
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <LogIn size={40} color="#667eea" style={{ marginBottom: '0.5rem' }} />
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#1f2937' }}>
            Welcome Back
          </h1>
          <p style={{ color: '#6b7280', marginTop: '0.5rem' }}>
            Sign in to your account
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
                Username or email
            </label>
            <input
              type="text"
                placeholder="Enter your username or email"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '0.95rem',
                boxSizing: 'border-box',
                transition: 'all 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
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
              <Lock size={16} />
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem 3rem 0.75rem 0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '0.95rem',
                  boxSizing: 'border-box',
                  transition: 'all 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
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

          <button
            type="submit"
            disabled={isLoading}
            style={{
              padding: '0.75rem',
              backgroundColor: isLoading ? '#9ca3af' : '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.95rem',
              fontWeight: 600,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              marginTop: '0.5rem',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => !isLoading && (e.target.style.backgroundColor = '#5568d3')}
            onMouseLeave={(e) => !isLoading && (e.target.style.backgroundColor = '#667eea')}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p style={{
          textAlign: 'center',
          marginTop: '1.5rem',
          color: '#6b7280',
          fontSize: '0.9rem'
        }}>
          Don't have an account?{' '}
          <a href="#register" onClick={(e) => {
            e.preventDefault();
            onSwitchToRegister();
          }} style={{
            color: '#667eea',
            fontWeight: 600,
            cursor: 'pointer',
            textDecoration: 'none'
          }}>
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
}
