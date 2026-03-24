'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, Eye, EyeOff, Building2 } from 'lucide-react';
import { login } from '@/lib/auth';
import { ensureSeeded } from '@/lib/store';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Forgot password flow
  const [step, setStep] = useState<'login' | 'forgot-email' | 'forgot-otp' | 'forgot-new-password'>('login');
  const [resetEmail, setResetEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpHash, setOtpHash] = useState('');
  const [otpExpiresAt, setOtpExpiresAt] = useState<number | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => { ensureSeeded(); }, []);

  // Timer logic for OTP expiry
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 'forgot-otp' && otpExpiresAt) {
      interval = setInterval(() => {
        const remaining = Math.max(0, Math.floor((otpExpiresAt - Date.now()) / 1000));
        setTimeLeft(remaining);
        if (remaining === 0) {
          clearInterval(interval);
        }
      }, 1000);
      // set immediate value
      const remaining = Math.max(0, Math.floor((otpExpiresAt - Date.now()) / 1000));
      setTimeLeft(remaining);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [step, otpExpiresAt]);

  const handleResendOtp = async () => {
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to resend OTP');
      
      if (data.hash) {
        setOtpHash(data.hash);
        setOtpExpiresAt(data.expiresAt);
        setMessage('A new OTP has been sent to your email.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to resend OTP');
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      if (step === 'login') {
        const session = await login(email.trim(), password);
        if (!session) {
          setError('Invalid email or password. Please try again.');
          setLoading(false);
          return;
        }
        if (session.role === 'admin') router.replace('/admin');
        else router.replace('/employee');
      } else if (step === 'forgot-email') {
        const res = await fetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: resetEmail.trim() }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to send OTP');
        
        if (data.hash) {
          setOtpHash(data.hash);
          setOtpExpiresAt(data.expiresAt);
          setStep('forgot-otp');
        } else {
          // generic success response to prevent email enumeration
          setStep('forgot-otp');
        }
        setLoading(false);
      } else if (step === 'forgot-otp') {
        if (!otp || otp.length < 6) {
          setError('Please enter a valid 6-digit OTP');
          setLoading(false);
          return;
        }
        setStep('forgot-new-password');
        setLoading(false);
      } else if (step === 'forgot-new-password') {
        const res = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: resetEmail.trim(), otp, hash: otpHash, expiresAt: otpExpiresAt, newPassword }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to reset password');
        
        setMessage('Password reset successful. Please login with your new password.');
        setStep('login');
        setResetEmail('');
        setOtp('');
        setOtpHash('');
        setOtpExpiresAt(null);
        setNewPassword('');
        setLoading(false);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(ellipse at 60% 10%, rgba(37,99,235,0.18) 0%, transparent 60%), var(--bg-base)',
      padding: '1rem',
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 60, height: 60, borderRadius: 16,
            background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem',
            boxShadow: '0 8px 24px rgba(37,99,235,0.4)',
          }}>
            <Building2 size={28} color="#fff" />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>DOT ADS</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: 4 }}>
            Employee Management System
          </p>
        </div>

        {/* Card */}
        <div className="card" style={{ boxShadow: 'var(--shadow-lg)' }}>
          {step === 'login' && (
            <>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.25rem' }}>Welcome back</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1.5rem' }}>
                Sign in to continue to your dashboard
              </p>
            </>
          )}

          {step === 'forgot-email' && (
            <>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.25rem' }}>Forgot Password</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1.5rem' }}>
                Enter your email address to receive an OTP.
              </p>
            </>
          )}

          {step === 'forgot-otp' && (
            <>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.25rem' }}>Enter OTP</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1.5rem' }}>
                We have sent a 6-digit code to your email.
              </p>
            </>
          )}

          {step === 'forgot-new-password' && (
            <>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.25rem' }}>New Password</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1.5rem' }}>
                Create a new strong password.
              </p>
            </>
          )}

          {message && (
            <div style={{
              background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
              borderRadius: 8, padding: '0.625rem 0.875rem',
              color: 'var(--green)', fontSize: '0.8rem', marginBottom: '1rem'
            }}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {step === 'login' && (
              <>
                {/* Email */}
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <div className="search-bar">
                    <Mail size={15} />
                    <input
                      id="email"
                      type="email"
                      className="input"
                      placeholder="you@dotads.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <label className="form-label">Password</label>
                    <button type="button" onClick={() => { setStep('forgot-email'); setError(''); setMessage(''); }} style={{ background: 'none', border: 'none', color: 'var(--brand-500)', fontSize: '0.75rem', padding: 0, textDecoration: 'underline', cursor: 'pointer' }}>
                      Forgot Password?
                    </button>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="password"
                      type={showPw ? 'text' : 'password'}
                      className="input"
                      placeholder="••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(v => !v)}
                      style={{
                        position: 'absolute', right: '0.75rem', top: '50%',
                        transform: 'translateY(-50%)', background: 'none',
                        border: 'none', color: 'var(--text-muted)',
                        display: 'flex', alignItems: 'center'
                      }}
                    >
                      {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
              </>
            )}

            {step === 'forgot-email' && (
              <div className="form-group">
                <label className="form-label">Registered Email</label>
                <div className="search-bar">
                  <Mail size={15} />
                  <input
                    type="email"
                    className="input"
                    placeholder="you@dotads.com"
                    value={resetEmail}
                    onChange={e => setResetEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            {step === 'forgot-otp' && (
              <div className="form-group">
                <label className="form-label">6-Digit OTP</label>
                <div className="search-bar">
                  <Lock size={15} />
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    className="input"
                    placeholder="123456"
                    value={otp}
                    onChange={e => setOtp(e.target.value)}
                    required
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.4rem', fontSize: '0.75rem' }}>
                  <span style={{ color: timeLeft > 0 ? 'var(--text-muted)' : 'var(--red)' }}>
                    {timeLeft > 0 ? `Code expires in ${timeLeft}s` : 'Code expired'}
                  </span>
                  {timeLeft === 0 && (
                    <button 
                      type="button" 
                      onClick={handleResendOtp} 
                      style={{ background: 'none', border: 'none', color: 'var(--brand-500)', padding: 0, textDecoration: 'underline', cursor: 'pointer' }}
                      disabled={loading}
                    >
                      Resend OTP
                    </button>
                  )}
                </div>
              </div>
            )}

            {step === 'forgot-new-password' && (
              <div className="form-group">
                <label className="form-label">New Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPw ? 'text' : 'password'}
                    className="input"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(v => !v)}
                    style={{
                      position: 'absolute', right: '0.75rem', top: '50%',
                      transform: 'translateY(-50%)', background: 'none',
                      border: 'none', color: 'var(--text-muted)',
                      display: 'flex', alignItems: 'center', cursor: 'pointer'
                    }}
                  >
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div style={{
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: 8, padding: '0.625rem 0.875rem',
                color: 'var(--red)', fontSize: '0.8rem',
              }}>
                {error}
              </div>
            )}

            <button type="submit" className="btn btn-primary btn-lg w-full" style={{ justifyContent: 'center', marginTop: 4 }} disabled={loading}>
              {loading ? <span className="spinner" style={{ width: 16, height: 16 }} /> : null}
              {loading ? 'Processing...' : (
                step === 'login' ? 'Sign In' :
                step === 'forgot-email' ? 'Send OTP' :
                step === 'forgot-otp' ? 'Verify OTP' :
                'Reset Password'
              )}
            </button>

            {step !== 'login' && (
              <button 
                type="button" 
                onClick={() => { setStep('login'); setError(''); }} 
                className="btn w-full" 
                style={{ justifyContent: 'center', marginTop: -8, background: 'transparent', color: 'var(--text-secondary)' }}
                disabled={loading}
              >
                Back to Login
              </button>
            )}
          </form>

        </div>
      </div>
    </div>
  );
}
