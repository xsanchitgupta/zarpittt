'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import ToastContainer, { toast } from '@/components/Toast';
import { Briefcase, ChevronRight, ShieldCheck, Users, Star, CheckCircle2 } from 'lucide-react';
import supabase from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { updateProfile } from '@/app/actions/profile';

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M23.766 12.2764C23.766 11.4607 23.6999 10.6406 23.5588 9.83807H12.24V14.4591H18.7217C18.4528 15.9105 17.5885 17.1581 16.3414 17.9729V20.9639H20.178C22.4314 18.9044 23.766 15.8719 23.766 12.2764Z" fill="#4285F4" />
    <path d="M12.24 24C15.5035 24 18.2619 22.932 20.1824 20.9639L16.3458 17.9729C15.2811 18.6937 13.8821 19.1111 12.2444 19.1111C9.10546 19.1111 6.44641 17.0084 5.49419 14.1898H1.54883V17.2212C3.55395 21.2115 7.6713 24 12.24 24Z" fill="#34A853" />
    <path d="M5.49419 14.1898C5.2444 13.4594 5.11132 12.6843 5.11132 11.8889C5.11132 11.0935 5.2444 10.3184 5.49419 9.58801V6.55652H1.54883C0.70258 8.24479 0.222168 10.126 0.222168 12.1111C0.222168 14.0962 0.70258 15.9774 1.54883 17.6657L5.49419 14.1898Z" fill="#FBBC05" />
    <path d="M12.24 4.88889C14.0156 4.88889 15.6044 5.49438 16.8584 6.67111L20.2595 3.27C18.2575 1.41444 15.4991 0.222222 12.24 0.222222C7.6713 0.222222 3.55395 3.01071 1.54883 7.00109L5.49419 10.0326C6.44641 7.21404 9.10546 5.11111 12.24 5.11111V4.88889Z" fill="#EA4335" />
  </svg>
);

export default function AuthPage() {
  const { user, refreshSession } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot-password' | 'update-password'>('login');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasCheckoutPending, setHasCheckoutPending] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState('');
  const [verificationTime, setVerificationTime] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pMode = params.get('mode');
    const pEmail = params.get('email');
    const pName = params.get('name');
    const pPhone = params.get('phone');
    const pRedirect = params.get('redirect');

    // Check if there's pending checkout data
    const pending = localStorage.getItem('zarpit_pending_checkout');
    if (pending || pRedirect === '/checkout') {
      setHasCheckoutPending(true);
    }

    // Only auto-switch mode if checkout data exists (not on direct visit)
    if (pMode === 'login' || pMode === 'signup') {
      setMode(pMode);
    } else if (pending && pName) {
      setMode('signup');
    }

    if (pEmail) setEmail(decodeURIComponent(pEmail));
    if (pName) setName(decodeURIComponent(pName));
    if (pPhone) setPhone(decodeURIComponent(pPhone));

    // Handle password recovery flow
    const hash = window.location.hash;
    const isRecovery = hash.includes('type=recovery') || params.get('type') === 'recovery' || hash.includes('access_token');

    if (isRecovery || params.get('error') === 'callback_failed') {
      if (params.get('error') === 'callback_failed') {
        console.warn('[DEBUG] Callback error detected, attempting recovery via hash...');
        // Clear the error from URL without refreshing to prevent loop
        const newUrl = window.location.pathname + window.location.hash;
        window.history.replaceState({}, '', newUrl);
      }
      
      console.log('[DEBUG] Auth recovery flow initiated');
      setMode('update-password');
      // Aggressively check for session if in recovery mode to unblock UI
      refreshSession();
    }

    // Timer for "Verifying Session" hang
    const timer = setInterval(() => {
      setVerificationTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // If already logged in, redirect
  useEffect(() => {
    if (user && mode === 'update-password') {
      // Pre-fill name from Google if available
      const googleName = user.user_metadata?.full_name || user.user_metadata?.name;
      if (googleName && !name) {
        setName(googleName);
      }
      
      // If user is already logged in but we need a phone, update state
      if (user.phone && !phone) {
        setPhone(user.phone.replace('+91', ''));
      }
    }

    if (user && mode !== 'update-password') {
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get('redirect') || '/';
      window.location.href = redirect;
    }
  }, [user, mode, name, phone]);

  if (user && mode !== 'update-password') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div className="spinner" />
      </div>
    );
  }

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Missing Fields', 'Please enter email and password.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error('Login Failed', error.message);
    } else {
      toast.success('Welcome!', 'Logged in successfully.');
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get('redirect') || '/';
      setTimeout(() => (window.location.href = redirect), 800);
    }
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !name || !phone) {
      toast.error('Missing Fields', 'Please fill all fields.');
      return;
    }
    if (phone.length < 10) {
      toast.error('Invalid Phone', 'Please enter a valid 10-digit phone number.');
      return;
    }
    setLoading(true);

    try {
      // Check if email already exists in profiles (using maybeSingle to avoid 406 console logs)
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (existingProfile) {
        setLoading(false);
        toast.error('Email Exists', 'This email is already registered. Please log in instead.');
        setMode('login');
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name, phone, role: 'user' },
        },
      });

      setLoading(false);

      if (error) {
        toast.error('Signup Failed', error.message);
        return;
      }

      if (data?.user) {
        if (data.session) {
          // Email confirmation not required, logged in directly
          toast.success('Welcome!', 'Signup successful!');
          await completeSignup(data.user);
        } else {
          // Email confirmation required
          setShowOtp(true);
          toast.success('Verification Sent', 'Please check your email for the OTP.');
        }
      } else {
        toast.error('Signup Failed', 'Could not register user account. Please try again.');
      }
    } catch (err: any) {
      setLoading(false);
      console.error('Signup Error:', err);
      toast.error('Signup Error', err.message || 'An unexpected error occurred.');
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) {
      toast.error('OTP Required', 'Please enter the verification code.');
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'signup'
    });
    setLoading(false);

    if (error) {
      toast.error('Verification Failed', error.message);
    } else if (data.session && data.user) {
      toast.success('Account Verified!', 'Welcome to Zarpit.');
      await completeSignup(data.user);
    }
  };

  const completeSignup = async (newUser: any) => {
    if (newUser) {
      await updateProfile(newUser.id, {
        full_name: name,
        phone: phone,
        email: email,
      });

      // If there's pending checkout data, save the address
      try {
        const pending = localStorage.getItem('zarpit_pending_checkout');
        if (pending) {
          const d = JSON.parse(pending);
          if (d.address) {
            await fetch('/api/address', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: newUser.id,
                label: d.addressLabel || 'Home',
                full_address: d.address,
                latitude: d.lat || null,
                longitude: d.lng || null
              })
            });
          }
        }
      } catch { /* ignore */ }
    }

    // Check if we need to redirect immediately, or if the user is already authenticated
    // If completeSignup is called, the user has a valid session.
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get('redirect') || '/';
    setTimeout(() => (window.location.href = redirect), 800);
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) toast.error('Google Login Failed', error.message);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Email Required', 'Please enter your email address.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth?type=recovery`,
    });
    setLoading(false);
    if (error) {
      toast.error('Reset Failed', error.message);
    } else {
      toast.success('Check Email', 'Password reset link has been sent to your email.');
      setMode('login');
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error('Weak Password', 'Password must be at least 6 characters.');
      return;
    }
    setLoading(true);

    // 1. Update Password
    const { error: pwdErr } = await supabase.auth.updateUser({ password });
    if (pwdErr) {
      setLoading(false);
      toast.error('Update Failed', pwdErr.message);
      return;
    }

    // 2. Create/Update Profile (The "Sync" Step)
    if (user) {
      await updateProfile(user.id, {
        full_name: name,
        phone: phone,
        email: user.email,
      });
    }

    setLoading(false);
    toast.success('Account Ready!', 'Your password and profile have been updated.');
    setMode('login');
  };

  return (
    <>
      <Navbar />
      <ToastContainer />
      <div className="auth-wrapper">
        <div className="auth-container">
          <div className="auth-card">
            {/* Checkout Context Banner */}
            {hasCheckoutPending && (
              <div style={{ padding: '14px 18px', background: 'var(--accent-light)', border: '1px solid var(--accent-border)', borderRadius: 14, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
                <ShieldCheck size={16} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>
                  {mode === 'login' ? 'Log in to complete your booking' : 'Create an account to complete your booking'}
                </span>
              </div>
            )}

            {/* Header */}
            <div className="auth-header">
              <div className="auth-logo">
                <Image src="/images/logo.jpg" alt="Zarpit" width={52} height={52} style={{ borderRadius: 14 }} />
              </div>
              <h1>{showOtp ? 'Check Your Email' :
                mode === 'login' ? 'Welcome back' :
                  mode === 'signup' ? 'Join Zarpit' :
                    mode === 'forgot-password' ? 'Reset Password' :
                      'New Password'
              }</h1>
              <p>{showOtp
                ? `We've sent a verification code to ${email}`
                : mode === 'login' ? (hasCheckoutPending ? 'Sign in to continue with your booking.' : 'Continue to manage your home services.') :
                  mode === 'signup' ? (hasCheckoutPending ? 'Quick signup to finalize your booking.' : 'Book professional home services in 60 seconds.') :
                    mode === 'forgot-password' ? "Enter your email and we'll send you a link to reset your password." :
                      'Create a strong new password for your account.'
              }</p>
            </div>

            {!showOtp && (
              <>
                {/* Social Login */}
                <button onClick={handleGoogleLogin} className="google-auth-btn">
                  <GoogleIcon />
                  <span>Continue with Google</span>
                </button>

                <div className="auth-divider">
                  <span>or use email</span>
                </div>
              </>
            )}

            {/* Form */}
            <div className="auth-form-content">
              {showOtp ? (
                <form onSubmit={handleVerifyOtp} className="auth-form">
                  <div className="form-group">
                    <label>Verification Code</label>
                    <input
                      className="input"
                      type="text"
                      placeholder="Verification code"
                      value={otp}
                      onChange={e => setOtp(e.target.value)}
                      maxLength={6}
                      style={{ letterSpacing: '0.2em', textAlign: 'center', fontSize: 18 }}
                      required
                    />
                  </div>
                  <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
                    {loading ? 'Verifying...' : 'Verify Email'}
                  </button>
                  <button 
                    type="button" 
                    onClick={async () => {
                      setLoading(true);
                      await supabase.auth.resend({ type: 'signup', email });
                      setLoading(false);
                      toast.success('Code Resent', 'Please check your email again.');
                    }} 
                    style={{ background: 'none', border: 'none', color: 'var(--accent)', fontWeight: 700, fontSize: 13, marginTop: 12, cursor: 'pointer' }}
                    disabled={loading}
                  >
                    Resend Code
                  </button>
                  <button type="button" onClick={() => setShowOtp(false)} style={{ background: 'none', border: 'none', color: '#ff751f', fontWeight: 600, fontSize: 13, marginTop: 12, cursor: 'pointer' }}>
                    Cancel & Edit Email
                  </button>
                </form>
              ) : mode === 'login' ? (
                <form onSubmit={handleEmailLogin} className="auth-form">
                  <div className="form-group">
                    <label>Email Address</label>
                    <input className="input" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label>Password</label>
                    <input className="input" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
                    <div style={{ textAlign: 'right', marginTop: 8 }}>
                      <button type="button" onClick={() => setMode('forgot-password')} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                        Forgot Password?
                      </button>
                    </div>
                  </div>
                  <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
                    {loading ? 'Processing...' : 'Continue'}
                  </button>
                </form>
              ) : mode === 'signup' ? (
                <form onSubmit={handleEmailSignup} className="auth-form">
                  <div className="form-group">
                    <label>Full Name</label>
                    <input className="input" placeholder="Enter your name" value={name} onChange={e => setName(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label>Email Address</label>
                    <input className="input" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label>Phone Number</label>
                    <div className="phone-input-wrapper">
                      <span className="phone-prefix">+91</span>
                      <input className="input" type="tel" placeholder="98765 43210" maxLength={10} value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, ''))} required />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Create Password</label>
                    <input className="input" type="password" placeholder="At least 6 characters" value={password} onChange={e => setPassword(e.target.value)} minLength={6} required />
                  </div>
                  <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
                    {loading ? 'Creating Account...' : 'Get Started'}
                  </button>
                </form>
              ) : mode === 'forgot-password' ? (
                <form onSubmit={handleForgotPassword} className="auth-form">
                  <div className="form-group">
                    <label>Email Address</label>
                    <input className="input" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
                  </div>
                  <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
                    {loading ? 'Sending link...' : 'Send Reset Link'}
                  </button>
                  <button type="button" onClick={() => setMode('login')} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600, cursor: 'pointer', marginTop: 10 }}>
                    Back to Login
                  </button>
                </form>
              ) : (
                <form onSubmit={handleUpdatePassword} className="auth-form">
                  <div className="form-group">
                    <label>Confirm Name</label>
                    <input className="input" placeholder="Your full name" value={name} onChange={e => setName(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label>Phone Number</label>
                    <div className="phone-input-wrapper">
                      <span className="phone-prefix">+91</span>
                      <input className="input" type="tel" placeholder="98765 43210" maxLength={10} value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, ''))} required />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>New Password</label>
                    <input className="input" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} minLength={6} required />
                  </div>
                  <button type="submit" className="btn btn-primary auth-submit" disabled={loading || !user}>
                    {loading ? 'Finalizing...' : (!user ? 'Verifying Session...' : 'Complete Setup')}
                  </button>
                  {mode === 'update-password' && !user && verificationTime > 3 && (
                    <div style={{ textAlign: 'center', marginTop: 12 }}>
                      <button 
                        type="button" 
                        onClick={() => window.location.reload()} 
                        style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 12, fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
                      >
                        Still verifying? Click to refresh and try again.
                      </button>
                    </div>
                  )}
                  <button type="button" onClick={() => setMode('login')} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600, cursor: 'pointer', marginTop: 10 }}>
                    Cancel & Back to Login
                  </button>
                </form>
              )}
            </div>

            {!showOtp && (
              <>
                {/* Professional Link */}
                <div className="pro-signup-section">
                  <div className="pro-content">
                    <Briefcase size={16} className="pro-icon" />
                    <span>Are you a professional?</span>
                    <a href="https://partner.zarpit.com" target="_blank" rel="noopener noreferrer">Join as Partner</a>
                  </div>
                </div>

                {/* Footer Trust & Toggle */}
                <div className="auth-footer">
                  <div className="trust-badges">
                    <div className="badge"><ShieldCheck size={14} /> <span>100% Safe & Secure</span></div>
                    <div className="badge"><Users size={14} /> <span>10k+ Users</span></div>
                    <div className="badge"><Star size={14} /> <span>4.8/5 Rating</span></div>
                  </div>

                  <p className="mode-toggle">
                    {(mode === 'login' || mode === 'forgot-password') ? "Don't have an account? " : "Already have an account? "}
                    <button onClick={() => setMode(mode === 'signup' ? 'login' : 'signup')}>
                      {(mode === 'login' || mode === 'forgot-password') ? 'Sign up' : 'Log in'}
                    </button>
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .auth-wrapper {
          min-height: 100vh;
          background: var(--bg);
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding: 100px 20px 60px;
          position: relative;
          overflow: hidden;
        }

        .auth-wrapper::before {
          content: '';
          position: absolute;
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(255,117,31,0.05) 0%, transparent 70%);
          top: -200px;
          right: -200px;
        }

        .auth-container {
          width: 100%;
          max-width: 460px;
          position: relative;
          z-index: 1;
        }

        .auth-card {
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          border-radius: 32px;
          padding: 48px 40px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.2);
        }

        .auth-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .auth-logo {
          display: inline-flex;
          margin-bottom: 24px;
          box-shadow: 0 8px 20px rgba(0,0,0,0.2);
          border-radius: 14px;
        }

        .auth-header h1 {
          font-size: 28px;
          font-weight: 900;
          color: var(--text);
          margin-bottom: 10px;
          letter-spacing: -0.02em;
        }

        .auth-header p {
          color: var(--text-secondary);
          font-size: 15px;
          line-height: 1.5;
        }

        .google-auth-btn {
          width: 100%;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          background: var(--bg-input);
          border: 1.5px solid var(--border);
          border-radius: 16px;
          font-size: 15px;
          font-weight: 700;
          color: var(--text);
          cursor: pointer;
          transition: all 0.2s ease;
          margin-bottom: 24px;
        }

        .google-auth-btn:hover {
          background: var(--bg-card-hover);
          border-color: var(--border-hover);
          transform: translateY(-1px);
        }

        .auth-divider {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
        }

        .auth-divider::before,
        .auth-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: var(--border);
        }

        .auth-divider span {
          font-size: 12px;
          color: var(--text-muted);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .form-group label {
          display: block;
          font-size: 13px;
          font-weight: 700;
          color: var(--text-secondary);
          margin-bottom: 8px;
          margin-left: 2px;
        }

        .input {
          width: 100%;
          height: 52px;
          padding: 0 16px;
          background: var(--bg-input);
          border: 1.5px solid var(--border);
          border-radius: 14px;
          font-size: 15px;
          font-weight: 600;
          color: var(--text);
          transition: all 0.2s ease;
        }

        .input:focus {
          background: var(--bg-input);
          border-color: var(--accent);
          box-shadow: 0 0 0 4px rgba(255,117,31,0.1);
          outline: none;
        }

        .phone-input-wrapper {
          display: flex;
          gap: 10px;
        }

        .phone-prefix {
          height: 52px;
          padding: 0 14px;
          background: var(--bg-card);
          border: 1.5px solid var(--border);
          border-radius: 14px;
          display: flex;
          align-items: center;
          font-size: 14px;
          font-weight: 800;
          color: var(--text-secondary);
        }

        .auth-submit {
          height: 56px;
          width: 100%;
          background: var(--accent);
          color: var(--white);
          border: none;
          border-radius: 16px;
          font-size: 16px;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-top: 8px;
          box-shadow: 0 10px 20px rgba(255,117,31,0.15);
        }

        .auth-submit:hover:not(:disabled) {
          background: var(--accent-hover);
          transform: translateY(-2px);
          box-shadow: 0 12px 24px rgba(255,117,31,0.25);
        }

        .pro-signup-section {
          margin-top: 32px;
          padding-top: 24px;
          border-top: 1px solid var(--border);
        }

        .pro-content {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 13px;
          color: var(--text-secondary);
          font-weight: 600;
          flex-wrap: wrap;
          line-height: 1.4;
        }

        .pro-icon { color: var(--accent); flex-shrink: 0; }

        .pro-content a {
          color: var(--accent);
          text-decoration: none;
          font-weight: 800;
          white-space: nowrap;
          border-bottom: 2px solid rgba(255,117,31,0.1);
          transition: all 0.25s ease;
        }

        .pro-content a:hover {
          border-bottom-color: var(--accent);
        }

        .auth-footer {
          margin-top: 32px;
          text-align: center;
        }

        .trust-badges {
          display: flex;
          justify-content: center;
          gap: 16px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }

        .badge {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 10px;
          color: var(--text-muted);
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .mode-toggle {
          font-size: 14px;
          color: var(--text-secondary);
          font-weight: 600;
        }

        .mode-toggle button {
          background: none;
          border: none;
          color: var(--accent);
          font-weight: 800;
          cursor: pointer;
          padding: 0;
          margin-left: 4px;
          font-size: 14px;
          border-bottom: 2px solid rgba(255,117,31,0.1);
          transition: all 0.2s;
        }

        .mode-toggle button:hover {
          border-bottom-color: var(--accent);
        }

        @media (max-width: 480px) {
          .auth-card { 
            padding: 32px 20px; 
            border-radius: 24px;
          }
          .auth-wrapper {
            padding: 80px 16px 40px;
          }
          .auth-header h1 { font-size: 24px; }
          .google-auth-btn { font-size: 14px; }
          .trust-badges { gap: 10px; }
          .badge span { display: none; }
          .pro-content {
            flex-direction: column;
            gap: 4px;
          }
        }
      `}</style>
    </>
  );
}
