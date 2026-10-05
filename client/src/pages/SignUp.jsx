import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Mic,
  ShieldCheck,
  User,
  Mail,
  Lock,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Volume2,
  RefreshCw,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import { useVoiceRecognition } from '../hooks/useVoiceRecognition';
import { useAudioVisualizer } from '../hooks/useAudioVisualizer';
import { useVoiceBiometrics } from '../hooks/useVoiceBiometrics';
import AudioVisualizer from '../components/AudioVisualizer';
import VoiceMicButton from '../components/VoiceMicButton';

const DEFAULT_PASSPHRASE = 'My voice is my secure key for authentication';

export default function SignUp() {
  const navigate = useNavigate();
  const { register } = useAuth();

  // Wizard Step: 1 = Basic Info, 2 = Voice Passphrase Calibration
  const [step, setStep] = useState(1);

  // Form fields
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [passphrase, setPassphrase] = useState(DEFAULT_PASSPHRASE);
  const [customPassphraseMode, setCustomPassphraseMode] = useState(false);

  // Voice enrollment state
  const [enrollmentStatus, setEnrollmentStatus] = useState('idle'); // 'idle' | 'recording' | 'recorded' | 'saving'
  const [enrolledBiometrics, setEnrolledBiometrics] = useState(null);
  const [recordedTranscript, setRecordedTranscript] = useState('');
  const [errorMessage, setErrorMessage] = useState(null);
  const [visualizerType, setVisualizerType] = useState('bars');

  // Hooks
  const biometrics = useVoiceBiometrics();
  const visualizer = useAudioVisualizer({ visualizerType });
  const speech = useVoiceRecognition({
    onFinalTranscript: (text) => {
      setRecordedTranscript(text);
    }
  });

  // Keep sampling biometrics while visualizer is active
  useEffect(() => {
    let frameId;
    if (enrollmentStatus === 'recording' && visualizer.analyser) {
      const sample = () => {
        biometrics.recordFrame(visualizer.analyser);
        frameId = requestAnimationFrame(sample);
      };
      frameId = requestAnimationFrame(sample);
    }
    return () => {
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, [enrollmentStatus, visualizer.analyser, biometrics]);

  // Handle Form Change
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrorMessage(null);
  };

  // Step 1 Validation
  const handleProceedToVoice = (e) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!formData.name.trim()) {
      setErrorMessage('Please enter your full name');
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setErrorMessage('Please enter a valid email address');
      return;
    }
    if (formData.password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }

    setStep(2);
  };

  // Toggle Voice Recording
  const handleToggleRecord = async () => {
    setErrorMessage(null);

    if (enrollmentStatus === 'recording') {
      // Stop recording
      speech.stopListening();
      visualizer.stopAudio();

      const bioData = biometrics.finishCapture();
      setEnrolledBiometrics(bioData);
      setEnrollmentStatus('recorded');

      // If speech transcript didn't catch, use current transcript or fallback
      const finalRecorded = speech.transcript || speech.interimTranscript || passphrase;
      setRecordedTranscript(finalRecorded);
    } else {
      // Start recording
      setRecordedTranscript('');
      speech.resetTranscript();
      setEnrollmentStatus('recording');

      await visualizer.startAudio();
      biometrics.startCapture();
      speech.startListening();
    }
  };

  // Reset Voice Sample
  const handleResetSample = () => {
    visualizer.stopAudio();
    speech.stopListening();
    speech.resetTranscript();
    setRecordedTranscript('');
    setEnrolledBiometrics(null);
    setEnrollmentStatus('idle');
    setErrorMessage(null);
  };

  // Final Registration Submission
  const handleCompleteRegistration = async () => {
    setErrorMessage(null);
    setEnrollmentStatus('saving');

    try {
      // Use spoken transcript if it was captured, or the designated passphrase
      const finalPassphrase = passphrase.trim();
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        voicePassphrase: finalPassphrase,
        voiceBiometrics: enrolledBiometrics || {
          durationMs: 2500,
          spectralCentroid: 24.5,
          zeroCrossingRate: 0.08,
          energyRms: 0.15,
          enrolledAt: new Date()
        }
      };

      await register(payload);

      // Trigger Confetti Celebration
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#00f2fe', '#4facfe', '#a855f7']
      });

      speech.speak(`Welcome to VoiceAuth, ${formData.name}. Voice controller calibrated.`);
      navigate('/dashboard');
    } catch (err) {
      setErrorMessage(err.message || 'Registration failed');
      setEnrollmentStatus('recorded');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 py-8 relative">
      {/* Background ambient glowing orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-xl z-10">
        
        {/* Step Indicator Header */}
        <div className="mb-6 text-center">
          <div className="inline-flex items-center space-x-3 bg-[#0c1021] border border-cyan-500/25 px-4 py-1.5 rounded-full mb-3 text-xs font-mono text-cyan-300">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold ${step === 1 ? 'bg-cyan-500 text-black' : 'bg-slate-800 text-cyan-400'}`}>
              1
            </span>
            <span>Account Details</span>
            <span className="text-slate-600">→</span>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold ${step === 2 ? 'bg-cyan-500 text-black' : 'bg-slate-800 text-slate-500'}`}>
              2
            </span>
            <span className={step === 2 ? 'text-cyan-300' : 'text-slate-500'}>Voice Controller Enrollment</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            {step === 1 ? 'Create Secure Account' : 'Calibrate Voice Biometrics'}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {step === 1
              ? 'Configure your credentials to enable biometric voice authentication'
              : 'Train the voice controller with your unique vocal resonance and passphrase'}
          </p>
        </div>

        {/* Card Container */}
        <div className="glass-panel-glow rounded-2xl p-6 sm:p-8 relative overflow-hidden">
          
          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-5 flex items-start space-x-3 p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-sm">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* STEP 1: Basic Account Info */}
          {step === 1 && (
            <form onSubmit={handleProceedToVoice} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5 font-semibold">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="e.g. Alex Vance"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5 font-semibold">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="user@domain.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5 font-semibold">
                    Master Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5 font-semibold">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 hover:from-cyan-300 hover:to-indigo-400 text-slate-950 font-bold text-sm tracking-wide shadow-lg shadow-cyan-500/25 hover:shadow-cyan-400/40 transition-all flex items-center justify-center space-x-2"
                >
                  <span>Continue to Voice Controller Setup</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <div className="text-center pt-2">
                <p className="text-xs text-slate-400">
                  Already have an account?{' '}
                  <Link to="/login" className="text-cyan-400 hover:text-cyan-300 font-semibold underline underline-offset-4">
                    Log in here
                  </Link>
                </p>
              </div>
            </form>
          )}

          {/* STEP 2: Voice Controller Enrollment */}
          {step === 2 && (
            <div className="space-y-5">
              
              {/* Passphrase Prompt Banner */}
              <div className="bg-[#080d1e] p-4 rounded-xl border border-cyan-500/30 text-center relative">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-cyan-400 font-semibold flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> Enrolled Security Passphrase
                  </span>
                  <button
                    type="button"
                    onClick={() => setCustomPassphraseMode(!customPassphraseMode)}
                    className="text-[11px] text-slate-400 hover:text-cyan-300 underline font-mono"
                  >
                    {customPassphraseMode ? 'Use Recommended' : 'Customize Phrase'}
                  </button>
                </div>

                {customPassphraseMode ? (
                  <input
                    type="text"
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                    placeholder="Enter custom passphrase..."
                    className="w-full mt-2 p-2.5 rounded-lg glass-input text-center text-sm font-semibold text-cyan-300"
                  />
                ) : (
                  <div className="py-2 px-3 bg-cyan-950/40 rounded-lg border border-cyan-500/20 mt-1">
                    <p className="text-base sm:text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-200">
                      "{passphrase}"
                    </p>
                  </div>
                )}
                <p className="text-[11px] text-slate-400 mt-2 font-mono">
                  You will speak this phrase to authenticate and unlock your dashboard.
                </p>
              </div>

              {/* Live Audio Visualizer */}
              <AudioVisualizer
                canvasRef={visualizer.canvasRef}
                isActive={visualizer.isActive}
                volume={visualizer.volume}
                visualizerType={visualizerType}
                onToggleType={() => setVisualizerType(visualizerType === 'bars' ? 'wave' : 'bars')}
                label="Microphone Acoustic Profile"
              />

              {/* Pulsing Mic Button */}
              <VoiceMicButton
                isListening={enrollmentStatus === 'recording'}
                isLoading={enrollmentStatus === 'saving'}
                onClick={handleToggleRecord}
                volume={visualizer.volume}
                label={enrollmentStatus === 'recorded' ? 'Re-Record Voice Sample' : 'Click to Speak Passphrase'}
                sublabel={
                  enrollmentStatus === 'recording'
                    ? 'Press again when finished speaking'
                    : 'Speak clearly into your microphone'
                }
              />

              {/* Live speech transcription feedback */}
              {(speech.fullTranscript || recordedTranscript) && (
                <div className="bg-[#070913] p-3 rounded-xl border border-slate-800 text-center">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block mb-1">
                    Spoken Transcript Captured
                  </span>
                  <p className="text-sm font-mono text-cyan-300 font-medium">
                    "{speech.fullTranscript || recordedTranscript}"
                  </p>
                </div>
              )}

              {/* Acoustic Biometric Card if recorded */}
              {enrolledBiometrics && (
                <div className="p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-emerald-300 font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      Voice Sample Calibrated
                    </span>
                    <span className="font-mono text-slate-400">
                      Cadence: {Math.round(enrolledBiometrics.durationMs / 100) / 10}s
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[10px] font-mono text-slate-300">
                    <div className="bg-slate-900/60 p-1.5 rounded text-center">
                      <span className="text-slate-500 block">Centroid</span>
                      <span className="text-cyan-300">{enrolledBiometrics.spectralCentroid} Hz</span>
                    </div>
                    <div className="bg-slate-900/60 p-1.5 rounded text-center">
                      <span className="text-slate-500 block">ZCR Rate</span>
                      <span className="text-cyan-300">{enrolledBiometrics.zeroCrossingRate}</span>
                    </div>
                    <div className="bg-slate-900/60 p-1.5 rounded text-center">
                      <span className="text-slate-500 block">Energy RMS</span>
                      <span className="text-cyan-300">{enrolledBiometrics.energyRms}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-sm font-medium flex items-center space-x-1.5 transition-colors border border-slate-800"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  onClick={handleCompleteRegistration}
                  disabled={enrollmentStatus === 'recording' || enrollmentStatus === 'saving'}
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 hover:from-cyan-300 hover:to-indigo-400 text-slate-950 font-bold text-sm tracking-wide shadow-lg shadow-cyan-500/25 hover:shadow-cyan-400/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>
                    {enrolledBiometrics ? 'Complete Enrollment & Enter Dashboard' : 'Register with Recommended Profile'}
                  </span>
                </button>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
