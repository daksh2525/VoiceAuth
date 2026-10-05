import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mic, ShieldCheck, ShieldAlert, LogOut, Radio, Terminal, Cpu, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [backendHealth, setBackendHealth] = useState({ online: true, db: 'checking' });

  useEffect(() => {
    let isMounted = true;
    api.getHealth()
      .then(res => {
        if (isMounted) {
          setBackendHealth({ online: true, db: res.database });
        }
      })
      .catch(() => {
        if (isMounted) {
          setBackendHealth({ online: false, db: 'offline' });
        }
      });
    return () => { isMounted = false; };
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-50 border-b border-cyan-500/20 bg-[#070913]/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center p-[2px] shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-400/40 transition-all duration-300">
            <div className="w-full h-full bg-[#0c1021] rounded-[10px] flex items-center justify-center">
              <Mic className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform duration-200" />
            </div>
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-lg tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-300 to-indigo-300">
                VOICE<span className="text-white">AUTH</span>
              </span>
              <span className="text-[10px] font-mono tracking-widest px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-500/30">
                v2.4
              </span>
            </div>
            <p className="text-[10px] text-slate-400 tracking-wide font-mono flex items-center gap-1">
              <Radio className="w-2.5 h-2.5 text-cyan-400 animate-pulse" />
              Biometric Controller
            </p>
          </div>
        </Link>

        {/* Backend & DB Status indicator */}
        <div className="hidden md:flex items-center space-x-3 text-xs font-mono text-slate-400 bg-[#0c1021]/80 px-3 py-1.5 rounded-full border border-slate-800">
          <div className="flex items-center space-x-1.5">
            <span className={`w-2 h-2 rounded-full ${backendHealth.online ? 'bg-emerald-400 shadow-sm shadow-emerald-400/80 animate-pulse' : 'bg-rose-500'}`} />
            <span>API: {backendHealth.online ? 'Online' : 'Unreachable'}</span>
          </div>
          <span className="text-slate-600">|</span>
          <div className="flex items-center space-x-1.5">
            <Cpu className="w-3 h-3 text-cyan-400" />
            <span>MongoDB: <span className={backendHealth.db === 'connected' ? 'text-emerald-400' : 'text-amber-400'}>{backendHealth.db}</span></span>
          </div>
        </div>

        {/* Navigation Action Buttons */}
        <nav className="flex items-center space-x-3">
          {isAuthenticated ? (
            <>
              <Link
                to="/dashboard"
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  location.pathname === '/dashboard'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Terminal className="w-4 h-4 text-cyan-400" />
                <span>Dashboard</span>
              </Link>

              {/* User badge */}
              <div className="hidden sm:flex items-center space-x-2 bg-slate-900/90 border border-slate-800 px-3 py-1 rounded-lg">
                <div className="w-6 h-6 rounded-full bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-300 text-xs font-bold">
                  {user?.name ? user.name[0].toUpperCase() : 'U'}
                </div>
                <div className="text-left">
                  <div className="text-xs font-medium text-slate-200">{user?.name}</div>
                  <div className="text-[10px] text-cyan-400 font-mono flex items-center gap-0.5">
                    <ShieldCheck className="w-3 h-3" /> Voice Verified
                  </div>
                </div>
              </div>

              {/* Logout button */}
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm text-slate-400 hover:text-rose-300 hover:bg-rose-950/30 border border-transparent hover:border-rose-900/40 transition-colors"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </>
          ) : (
            <div className="flex items-center space-x-2">
              <Link
                to="/login"
                className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === '/login'
                    ? 'text-cyan-300 bg-cyan-950/60 border border-cyan-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                Log In
              </Link>
              <Link
                to="/signup"
                className="relative inline-flex items-center justify-center px-4 py-1.5 text-sm font-medium text-slate-950 bg-gradient-to-r from-cyan-400 to-blue-400 hover:from-cyan-300 hover:to-blue-300 rounded-lg shadow-md shadow-cyan-500/20 hover:shadow-cyan-400/40 transition-all font-semibold"
              >
                Sign Up
              </Link>
            </div>
          )}
        </nav>

      </div>
    </header>
  );
}
