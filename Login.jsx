import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const from      = location.state?.from?.pathname || '/dashboard';

  const [form, setForm]       = useState({ email: '', password: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw]   = useState(false);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await login(form.email, form.password);
      if (res.success) {
        navigate(from, { replace: true });
      } else {
        setError(res.error || 'Login failed. Please try again.');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logoRow}>
          <div style={styles.logoMark} />
          <span style={styles.logoText}>College Compass</span>
        </div>

        <div style={styles.cardHeader}>
          <h1 style={styles.cardTitle}>Welcome back</h1>
          <p style={styles.cardSub}>Sign in to your account to continue</p>
        </div>

        {error && (
          <div style={styles.errorBox}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
              <circle cx="8" cy="8" r="7" stroke="#dc2626" strokeWidth="1.5"/>
              <path d="M8 5v3.5M8 11h.01" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Email address</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              required
              style={styles.input}
              autoFocus
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPw ? 'text' : 'password'}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
                style={{ ...styles.input, paddingRight: '3rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                style={styles.eyeBtn}
                aria-label={showPw ? 'Hide password' : 'Show password'}
              >
                {showPw ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ ...styles.submitBtn, opacity: loading ? 0.75 : 1 }}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                <span style={styles.spinner} /> Signing in...
              </span>
            ) : 'Sign In'}
          </button>
        </form>

        <p style={styles.switchText}>
          Don't have an account?{' '}
          <Link to="/signup" style={styles.link}>Create one free</Link>
        </p>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input:focus {
          outline: none;
          border-color: #2563eb !important;
          box-shadow: 0 0 0 3px rgba(37,99,235,0.12) !important;
          background: #fff !important;
        }
      `}</style>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f5f7fa',
    padding: '1.5rem',
    boxSizing: 'border-box',
  },
  card: {
    background: 'white',
    borderRadius: 14,
    padding: '2.75rem 2.5rem',
    width: '100%',
    maxWidth: 420,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06), 0 8px 32px rgba(0,0,0,0.06)',
    border: '1px solid #e8eaed',
  },
  logoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    marginBottom: '2rem',
  },
  logoMark: {
    width: 28,
    height: 28,
    borderRadius: 8,
    background: 'linear-gradient(135deg, #1d4ed8, #4338ca)',
    flexShrink: 0,
  },
  logoText: {
    fontSize: '1rem',
    fontWeight: 700,
    color: '#111827',
    letterSpacing: '-0.01em',
  },
  cardHeader: {
    marginBottom: '1.75rem',
  },
  cardTitle: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: '#111827',
    margin: '0 0 0.35rem 0',
    letterSpacing: '-0.02em',
  },
  cardSub: {
    color: '#6b7280',
    fontSize: '0.9rem',
    margin: 0,
  },
  errorBox: {
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: 8,
    padding: '0.75rem 1rem',
    color: '#dc2626',
    fontSize: '0.875rem',
    marginBottom: '1.25rem',
    display: 'flex',
    gap: '0.6rem',
    alignItems: 'flex-start',
    lineHeight: 1.5,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.45rem',
  },
  label: {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: '#374151',
  },
  input: {
    width: '100%',
    padding: '0.7rem 0.9rem',
    border: '1.5px solid #d1d5db',
    borderRadius: 8,
    fontSize: '0.95rem',
    color: '#111827',
    background: '#fafafa',
    transition: 'border-color 0.15s, box-shadow 0.15s, background 0.15s',
    boxSizing: 'border-box',
  },
  eyeBtn: {
    position: 'absolute',
    right: '0.75rem',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '0.2rem',
    lineHeight: 0,
    display: 'flex',
    alignItems: 'center',
  },
  submitBtn: {
    width: '100%',
    padding: '0.8rem',
    background: '#1d4ed8',
    color: 'white',
    border: 'none',
    borderRadius: 8,
    fontSize: '0.95rem',
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: '0.1rem',
    transition: 'opacity 0.15s, background 0.15s',
    letterSpacing: '0.01em',
  },
  spinner: {
    display: 'inline-block',
    width: 15,
    height: 15,
    border: '2px solid rgba(255,255,255,0.3)',
    borderTop: '2px solid white',
    borderRadius: '50%',
    animation: 'spin 0.75s linear infinite',
  },
  switchText: {
    textAlign: 'center',
    color: '#6b7280',
    fontSize: '0.875rem',
    marginTop: '1.5rem',
    marginBottom: 0,
  },
  link: {
    color: '#2563eb',
    fontWeight: 600,
    textDecoration: 'none',
  },
};
