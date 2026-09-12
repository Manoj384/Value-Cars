'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Loader2, ShieldCheck, Mail, Lock, User as UserIcon, Phone, MapPin } from 'lucide-react';
import { apiClient } from '../services/api';
import { useAuth } from '../context/auth';

type Stage =
  | 'email'
  | 'login'
  | 'new'
  | 'pending'
  | 'approved-wait'
  | 'disabled'
  | 'rejected'
  | 'forgot'
  | 'forgot-sent'
  | 'create-password'
  | 'reset-password'
  | 'sent'
  | 'done';

function isStrongPassword(pw: string): string | null {
  if (pw.length < 8) return 'Password must be at least 8 characters.';
  if (!/[A-Z]/.test(pw)) return 'Password needs at least one uppercase letter.';
  if (!/[a-z]/.test(pw)) return 'Password needs at least one lowercase letter.';
  if (!/[0-9]/.test(pw)) return 'Password needs at least one number.';
  return null;
}

export default function AuthModal() {
  const { authOpen, authIntent, closeAuth, setUser } = useAuth();
  const router = useRouter();

  const [stage, setStage] = useState<Stage>('email');
  const [heading, setHeading] = useState('Login / Sign Up');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('Bangalore');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // When the modal opens, honour an incoming create/reset-password token intent.
  useEffect(() => {
    if (!authOpen) return;
    setError('');
    setMessage('');
    setPassword('');
    setConfirmPassword('');
    if (authIntent.action === 'create-password') {
      setHeading('Create your password');
      setStage('create-password');
    } else if (authIntent.action === 'reset-password') {
      setHeading('Reset your password');
      setStage('reset-password');
    } else {
      setHeading('Login / Sign Up');
      setStage('email');
    }
  }, [authOpen, authIntent]);

  if (!authOpen) return null;

  async function handleCheckEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await apiClient.checkEmail(email.trim().toLowerCase());
      setEmail(res.email);
      switch (res.status) {
        case 'ACTIVE':
          setHeading('Welcome back');
          setStage('login');
          break;
        case 'NEW':
          setHeading('Verify your email');
          setStage('new');
          break;
        case 'PENDING':
          setHeading('Verification pending');
          setMessage(res.message);
          setStage('pending');
          break;
        case 'APPROVED_PENDING_PASSWORD':
          setHeading('Approved — almost there');
          setMessage(res.message);
          setStage('approved-wait');
          break;
        case 'DISABLED':
          setHeading('Account disabled');
          setMessage(res.message);
          setStage('disabled');
          break;
        case 'REJECTED':
          setHeading('Account not approved');
          setMessage(res.message);
          setStage('rejected');
          break;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!password) {
      setError('Please enter your password.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await apiClient.customerLogin(email, password);
      setUser(data.user);
      closeAuth();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed.');
    } finally {
      setLoading(false);
    }
  }

  async function handleRequestVerification(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await apiClient.requestVerification({
        email,
        full_name: fullName || undefined,
        phone_number: phone || undefined,
        city: city || undefined,
      });
      setHeading('Request submitted');
      setStage('sent');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to request verification.');
    } finally {
      setLoading(false);
    }
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await apiClient.forgotPassword(email);
      setHeading('Check your email');
      setStage('forgot-sent');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send reset link.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSetPassword(e: React.FormEvent, via: 'create-password' | 'reset-password') {
    e.preventDefault();
    const err = isStrongPassword(password);
    if (err) {
      setError(err);
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!authIntent.token) {
      setError('Missing security token. Please use the link from your email again.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data =
        via === 'create-password'
          ? await apiClient.createPassword(authIntent.token, password)
          : await apiClient.resetPassword(authIntent.token, password);
      setUser(data.user);
      setHeading('Done');
      setStage('done');
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update password.');
    } finally {
      setLoading(false);
    }
  }

  const inputCls =
    'w-full bg-slate-100 border border-transparent focus:border-rose-500 focus:bg-white pl-11 pr-4 py-3 rounded-xl text-sm outline-none transition';
  const labelCls = 'block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide';
  const btnPrimary =
    'w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 transition disabled:opacity-60';

  const iconWrap = (Icon: React.ComponentType<{ className?: string }>) => (
    <Icon className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
  );

  return (
    <div className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="relative bg-slate-950 text-white px-6 py-5">
          <button
            onClick={closeAuth}
            aria-label="Close login"
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-black tracking-tight">{heading}</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">Value Cars · Secure account access</p>
        </div>

        <div className="p-6">
          {/* STEP 1 — email / login / new / forgot */}
          {(stage === 'email' || stage === 'forgot' || stage === 'login' || stage === 'new') && (
            <form
              onSubmit={
                stage === 'login'
                  ? handleLogin
                  : stage === 'new'
                  ? handleRequestVerification
                  : stage === 'forgot'
                  ? handleForgot
                  : handleCheckEmail
              }
              className="space-y-4"
            >
              <div>
                <label className={labelCls}>Email address</label>
                <div className="relative">
                  {iconWrap(Mail)}
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    className={inputCls}
                    required
                  />
                </div>
              </div>

              {stage === 'login' && (
                <div>
                  <label className={labelCls}>Password</label>
                  <div className="relative">
                    {iconWrap(Lock)}
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className={inputCls}
                      required
                    />
                  </div>
                  <div className="mt-2 text-right">
                    <button type="button" onClick={() => { setStage('forgot'); setHeading('Forgot password'); setError(''); }} className="text-xs font-bold text-rose-600 hover:text-rose-700">
                      Forgot password?
                    </button>
                  </div>
                </div>
              )}

              {stage === 'new' && (
                <>
                  <div>
                    <label className={labelCls}>Your name</label>
                    <div className="relative">
                      {iconWrap(UserIcon)}
                      <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. Manoj" className={inputCls} required />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Phone (optional)</label>
                    <div className="relative">
                      {iconWrap(Phone)}
                      <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="9876543210" className={inputCls} />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>City</label>
                    <div className="relative">
                      {iconWrap(MapPin)}
                      <input value={city} onChange={(e) => setCity(e.target.value)} className={inputCls} />
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    Your verification request will be sent to our team for approval before you can sign in.
                  </p>
                </>
              )}

              {(error && (stage === 'email' || stage === 'login' || stage === 'new' || stage === 'forgot')) && (
                <p className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{error}</p>
              )}

              <button type="submit" disabled={loading} className={btnPrimary}>
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {stage === 'login' ? 'Login' : stage === 'new' ? 'Request Verification' : stage === 'forgot' ? 'Send Reset Link' : 'Continue'}
              </button>

              {stage === 'login' && (
                <p className="text-center text-xs text-slate-500">
                  Don&apos;t have an account?{' '}
                  <button type="button" onClick={() => { setStage('new'); setHeading('Verify your email'); setError(''); }} className="font-bold text-rose-600 hover:text-rose-700">
                    Request verification
                  </button>
                </p>
              )}
            </form>
          )}

          {/* STEP — info screens */}
          {(stage === 'pending' || stage === 'approved-wait' || stage === 'disabled' || stage === 'rejected' || stage === 'sent' || stage === 'forgot-sent') && (
            <div className="text-center space-y-3">
              <div className="w-14 h-14 mx-auto bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">{message}</p>
              {stage === 'sent' && (
                <p className="text-xs text-slate-500">We&apos;ve received your request. We&apos;ll notify you by email once it&apos;s approved.</p>
              )}
              {stage === 'forgot-sent' && (
                <p className="text-xs text-slate-500">If an account exists for this email, a reset link is on its way.</p>
              )}
              <button onClick={closeAuth} className={btnPrimary}>Close</button>
            </div>
          )}

          {/* STEP — create / reset password via email token */}
          {(stage === 'create-password' || stage === 'reset-password') && (
            <form onSubmit={(e) => handleSetPassword(e, stage)} className="space-y-4">
              <p className="text-xs text-slate-500">
                {stage === 'create-password' ? 'Set a secure password to activate your account.' : 'Choose a new password.'}
              </p>
              <div>
                <label className={labelCls}>New password</label>
                <div className="relative">
                  {iconWrap(Lock)}
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimum 8 chars, A-Z, a-z, 0-9" className={inputCls} required />
                </div>
              </div>
              <div>
                <label className={labelCls}>Confirm password</label>
                <div className="relative">
                  {iconWrap(Lock)}
                  <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter password" className={inputCls} required />
                </div>
              </div>
              <p className="text-[11px] text-slate-400">At least 8 characters with an uppercase letter, a lowercase letter, and a number.</p>
              {error && <p className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{error}</p>}
              <button type="submit" disabled={loading} className={btnPrimary}>
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {stage === 'create-password' ? 'Create Password' : 'Reset Password'}
              </button>
            </form>
          )}

          {/* STEP — done */}
          {stage === 'done' && (
            <div className="text-center space-y-3">
              <div className="w-14 h-14 mx-auto bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <p className="font-extrabold text-slate-900">Your account is ready!</p>
              <p className="text-sm text-slate-500">You are now signed in. Welcome to Value Cars.</p>
              <button onClick={closeAuth} className={btnPrimary}>Continue</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}