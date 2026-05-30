// src/components/AdminLogin.jsx
import React, { useState } from 'react';
import { Lock, User, Eye, EyeOff, ShieldAlert } from 'lucide-react';
import logoImg from '../assets/logo.png';

export default function AdminLogin({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Simulate authentication
    setTimeout(() => {
      if (username === 'admin' && password === 'janganana') {
        onLoginSuccess();
      } else {
        setError('Invalid credentials. (Use admin / janganana for demo)');
      }
      setIsLoading(false);
    }, 800);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gov-900 via-slate-950 to-slate-950 px-4">
      <div className="w-full max-w-md animate-slide-up">
        {/* Logo/Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-tr from-gov-600 to-gold-500 p-0.5 shadow-lg shadow-gov-950">
            <div className="flex h-full w-full items-center justify-center rounded-[22px] bg-slate-950">
              <img src={logoImg} alt="Janganana Logo" className="h-16 w-16 object-contain" />
            </div>
          </div>
          <h1 className="mt-4 font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Janganana Analytics
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Census Performance & Admin Management Portal
          </p>
        </div>

        {/* Card */}
        <div className="glass-card overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 p-8 shadow-2xl backdrop-blur-xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="flex items-center gap-3 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
                <ShieldAlert className="h-5 w-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Username
              </label>
              <div className="relative mt-2">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <User className="h-5 w-5" />
                </span>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/60 py-3 pl-10 pr-4 text-white placeholder-slate-600 outline-none ring-offset-slate-900 transition focus:border-gov-500 focus:ring-2 focus:ring-gov-500/20"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Password
                </label>
                <span className="text-xs text-gov-400">Hint: janganana</span>
              </div>
              <div className="relative mt-2">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <Lock className="h-5 w-5" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/60 py-3 pl-10 pr-12 text-white placeholder-slate-600 outline-none ring-offset-slate-900 transition focus:border-gov-500 focus:ring-2 focus:ring-gov-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="relative flex w-full justify-center rounded-xl bg-gradient-to-r from-gov-600 to-gov-700 py-3 text-sm font-semibold text-white shadow-lg transition hover:from-gov-500 hover:to-gov-650 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gov-500 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>

        <div className="mt-8 text-center text-xs text-slate-500">
          Government of India • Ministry of Home Affairs • Census Bureau
        </div>
      </div>
    </div>
  );
}
