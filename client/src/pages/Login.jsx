import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Mic,
  KeyRound,
  ShieldCheck,
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
  HelpCircle,
  Radio,
  Volume2,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { useVoiceRecognition } from '../hooks/useVoiceRecognition';
import { useAudioVisualizer } from '../hooks/useAudioVisualizer';
import { useVoiceBiometrics } from '../hooks/useVoiceBiometrics';
import AudioVisualizer from '../components/AudioVisualizer';
import VoiceMicButton from '../components/VoiceMicButton';
import VoiceConfidenceMeter from '../components/VoiceConfidenceMeter';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, voiceLogin, authError, setAuthError } = useAuth();

  // Mode: 'voice' | 'password'
  const [authMode, setAuthMode] = useState('voice');

  // Input states
  const [email, setEmail] = useState(() => localStorage.getItem('voiceauth_last_email') || '');
  const [password, setPassword] = useState('');

  // Voice controller state
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [phraseHint, setPhraseHint] = useState(null);
  const [verificationResult, setVerificationResult] = useState(null);
  const [visualizerType, setVisualizerType] = useState('wave');

  // Hooks
  const biometrics = useVoiceBiometrics();
  const visualizer = useAudioVisualizer({ visualizerType });
  const speech = useVoiceRecognition({
    onFinalTranscript: (text) => {
      // Auto verify when speech finishes if email is provided
      if (email.trim() && text.trim()) {
        triggerVoiceAuthentication(text);
      }
    }
  });

  // Track biometrics while recording
  useEffect(() => {
    let frameId;
    if (speech.isListening && visualizer.analyser) {
      const sample = () => {
        biometrics.recordFrame(visualizer.analyser);
        frameId = requestAnimationFrame(sample);
      };
      frameId = requestAnimationFrame(sample);
    }
    return () => {
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, [speech.isListening, visualizer.analyser, biometrics]);

  // Fetch phrase hint when email changes
  useEffect(() => {
    if (!email || !email.includes('@')) {
      setPhraseHint(null);
      return;
    }

    const timer = setTimeout(() => {
      api.getPhraseHint(email)
        .then(res => {
          if (res.success) {
            setPhraseHint(res);
          }
        })
        .catch(() => {
          setPhraseHint(null);
        });
    }, 400);

    return () => clearTimeout(timer);
  }, [email]);

  // Toggle Voice Authentication capture
  const handleToggleVoiceAuth = async () => {
    setAuthError(null);
    setVerificationResult(null);

    if (!email.trim()) {
      setAuthError('Please enter your registered email address first');
      return;
    }

    if (speech.isListening) {
      // Finished speaking
      speech.stopListening();
      visualizer.stopAudio();
      const spoken = speech.transcript || speech.interimTranscript;
      if (spoken) {
        await triggerVoiceAuthentication(spoken);
      }
    } else {
      // Start listening
      speech.resetTranscript();
      await visualizer.startAudio();
      biometrics.startCapture();
      speech.startListening();
    }
  };

  // Perform Voice Login API Request
  const triggerVoiceAuthentication = async (spokenText) => {
    if (!spokenText || !spokenText.trim()) return;

    speech.stopListening();
    visualizer.stopAudio();
    setIsAuthenticating(true);

    const bioData = biometrics.finishCapture();

    try {
      const res = await voiceLogin({
        email: email.trim().toLowerCase(),
        spokenTranscript: spokenText.trim(),
        biometrics: bioData
      });

      localStorage.setItem('voiceauth_last_email', email.trim().toLowerCase());
      setVerificationResult(res.verification);

      // Play success confetti
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#00f2fe', '#4facfe', '#10b981']
      });

      speech.speak(`Voice verified. Welcome back, ${res.user.name}.`);

      setTimeout(() => {
        const from = location.state?.from?.pathname || '/dashboard';
        navigate(from, { replace: true });
      }, 1200);

    } catch (err) {
      if (err.data?.verification) {
        setVerificationResult(err.data.verification);
        speech.speak('Voice verification failed. Please try again.');
      } else {
        setAuthError(err.message || 'Voice authentication failed');
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Password Login Handler
  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setAuthError(null);

    if (!email.trim() || !password) {
      setAuthError('Email and password are required');
      return;
    }

    setIsAuthenticating(true);
    try {
      await login({
        email: email.trim().toLowerCase(),
        password
      });

      localStorage.setItem('voiceauth_last_email', email.trim().toLowerCase());
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    } catch (err) {
      setAuthError(err.message || 'Login failed');
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Helper to test voice simulation (if microphone is not accessible)
  const handleQuickSimulation = (samplePhrase) => {
    if (!email) {
      setAuthError('Please enter your email address first');
      return;
    }
    triggerVoiceAuthentication(samplePhrase);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 py-8 relative">
      {/* Background ambient lighting */}
      <div className="absolute top-1/3 left-1/3 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/3 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md z-10">

        {/* Page Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center space-x-2 bg-[#0c1021] border border-cyan-500/25 px-3.5 py-1 rounded-full mb-3 text-xs font-mono text-cyan-300">
            <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
            <span>Biometric Gatekeeper</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Authenticate Session
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Access protected command center using your enrolled voice signature
          </p>
        </div>

        {/* Card Box */}
        <div className="glass-panel-glow rounded-2xl p-6 sm:p-7 relative overflow-hidden">
          
          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 p-1 bg-[#070913] rounded-xl border border-slate-800 mb-5">
            <button
              type="button"
              onClick={() => { setAuthMode('voice'); setAuthError(null); }}
              className={`py-2 px-3 rounded-lg text-xs font-mono font-semibold flex items-center justify-center space-x-2 transition-all ${
                authMode === 'voice'
                  ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Mic className="w-4 h-4 text-cyan-400" />
              <span>Voice Biometric</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAuthMode('password');
                speech.stopListening();
                visualizer.stopAudio();
                setAuthError(null);
              }}
              className={`py-2 px-3 rounded-lg text-xs font-mono font-semibold flex items-center justify-center space-x-2 transition-all ${
                authMode === 'password'
                  ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <KeyRound className="w-4 h-4 text-cyan-400" />
              <span>Password Mode</span>
            </button>
          </div>

          {/* Error Banner */}
          {authError && (
            <div className="mb-4 flex items-start space-x-2.5 p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          {/* Common Email Field */}
          <div className="mb-4">
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5 font-semibold">
              Account Identifier (Email)
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="user@domain.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm font-sans"
              />
            </div>
          </div>

          {/* VOICE BIOMETRIC AUTH MODE */}
          {authMode === 'voice' && (
            <div className="space-y-4">
              
              {/* Enrolled Passphrase Hint Banner */}
              {phraseHint && (
                <div className="p-3 bg-cyan-950/40 border border-cyan-500/25 rounded-xl text-center">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 block mb-1">
                    Enrolled Passphrase for {phraseHint.name || 'User'}:
                  </span>
                  <p className="text-sm font-bold text-cyan-200 font-mono">
                    "{phraseHint.voicePassphrase}"
                  </p>
                </div>
              )}

              {/* Audio Visualizer */}
              <AudioVisualizer
                canvasRef={visualizer.canvasRef}
                isActive={visualizer.isActive}
                volume={visualizer.volume}
                visualizerType={visualizerType}
                onToggleType={() => setVisualizerType(visualizerType === 'wave' ? 'bars' : 'wave')}
                label="Biometric Voiceprint Sensor"
              />

              {/* Voice Mic Trigger Button */}
              <VoiceMicButton
                isListening={speech.isListening}
                isLoading={isAuthenticating}
                onClick={handleToggleVoiceAuth}
                volume={visualizer.volume}
                label="Click to Speak Passphrase"
                sublabel={speech.isListening ? 'Speak your enrolled passphrase now' : 'Push-to-talk authentication'}
              />

              {/* Spoken transcript preview */}
              {speech.fullTranscript && (
                <div className="bg-[#070913] p-2.5 rounded-lg border border-slate-800 text-center">
                  <span className="text-[10px] font-mono text-slate-500 block">Heard:</span>
                  <p className="text-xs font-mono text-cyan-300 font-semibold">"{speech.fullTranscript}"</p>
                </div>
              )}

              {/* Confidence Meter Display */}
              {verificationResult && (
                <VoiceConfidenceMeter
                  score={verificationResult.finalScore}
                  threshold={verificationResult.threshold}
                  textScore={verificationResult.textScore}
                  biometricScore={verificationResult.biometricScore}
                  feedback={verificationResult.feedback}
                />
              )}

              {/* Quick simulation helper if user wants to test phrase directly */}
              {phraseHint && (
                <div className="pt-1 text-center">
                  <button
                    type="button"
                    onClick={() => handleQuickSimulation(phraseHint.voicePassphrase)}
                    disabled={isAuthenticating}
                    className="text-[11px] font-mono text-cyan-400/80 hover:text-cyan-300 underline underline-offset-2 transition-colors"
                  >
                    Simulate Voice Match: "{phraseHint.voicePassphrase}"
                  </button>
                </div>
              )}

            </div>
          )}

          {/* STANDARD PASSWORD MODE */}
          {authMode === 'password' && (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5 font-semibold">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isAuthenticating}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 hover:from-cyan-300 hover:to-indigo-400 text-slate-950 font-bold text-sm tracking-wide shadow-lg shadow-cyan-500/25 hover:shadow-cyan-400/40 transition-all flex items-center justify-center space-x-2"
              >
                <span>Authenticate with Password</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Footer Navigation */}
          <div className="mt-6 pt-4 border-t border-slate-800 text-center">
            <p className="text-xs text-slate-400">
              Need a voice-protected profile?{' '}
              <Link to="/signup" className="text-cyan-400 hover:text-cyan-300 font-semibold underline underline-offset-4">
                Register new account
              </Link>
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
