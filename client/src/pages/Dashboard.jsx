import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mic,
  MicOff,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Terminal,
  Activity,
  Cpu,
  Clock,
  Volume2,
  VolumeX,
  Sliders,
  RefreshCw,
  SlidersHorizontal,
  Lock,
  Radio,
  Sparkles,
  Database,
  CheckCircle2,
  AlertTriangle,
  History,
  Layers,
  Zap,
  Info
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { useVoiceRecognition } from '../hooks/useVoiceRecognition';
import { useAudioVisualizer } from '../hooks/useAudioVisualizer';
import AudioVisualizer from '../components/AudioVisualizer';
import VoiceMicButton from '../components/VoiceMicButton';

const COMMAND_SHORTCUTS = [
  { label: 'System status', cmd: 'system status', icon: Cpu, desc: 'Query operational status' },
  { label: 'Activate firewall', cmd: 'activate shield', icon: ShieldCheck, desc: 'Engage security perimeter' },
  { label: 'Deactivate firewall', cmd: 'deactivate shield', icon: ShieldAlert, desc: 'Disengage perimeter' },
  { label: 'Toggle stealth mode', cmd: 'stealth mode', icon: Layers, desc: 'Engage stealth protocol' },
  { label: 'Emergency lockdown', cmd: 'emergency lockdown', icon: AlertTriangle, desc: 'Heighten clearance' },
  { label: 'Purge telemetry cache', cmd: 'purge telemetry', icon: Zap, desc: 'Clean session logs' },
  { label: 'Lock workstation', cmd: 'lock system', icon: Lock, desc: 'Instantly lock session' },
];

export default function Dashboard() {
  const { user, logout, updateVoiceSettings } = useAuth();
  const navigate = useNavigate();

  // State
  const [controllerStatus, setControllerStatus] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [lastExecutedCommand, setLastExecutedCommand] = useState(null);
  const [isProcessingCommand, setIsProcessingCommand] = useState(false);
  const [continuousMode, setContinuousMode] = useState(false);
  const [threshold, setThreshold] = useState(user?.voiceConfidenceThreshold || 70);
  const [ttsEnabled, setTtsEnabled] = useState(user?.ttsVoiceFeedback ?? true);
  const [visualizerType, setVisualizerType] = useState('bars');
  const [isEditingPassphrase, setIsEditingPassphrase] = useState(false);
  const [newPassphrase, setNewPassphrase] = useState(user?.voicePassphrase || '');
  const [statusMessage, setStatusMessage] = useState(null);

  // Hooks
  const visualizer = useAudioVisualizer({ visualizerType });

  // Load Status and Logs
  const loadDashboardData = useCallback(async () => {
    try {
      const [statusRes, logsRes] = await Promise.all([
        api.getStatus().catch(() => ({})),
        api.getLogs().catch(() => ({ logs: [] }))
      ]);

      if (statusRes.success) setControllerStatus(statusRes.status);
      if (logsRes.success) setAuditLogs(logsRes.logs);
    } catch (err) {
      console.warn('Dashboard data fetch error:', err);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 8000);
    return () => clearInterval(interval);
  }, [loadDashboardData]);

  // Voice Command Dispatcher
  const handleExecuteVoiceCommand = async (commandText, confidence = 90) => {
    if (!commandText || !commandText.trim()) return;

    setIsProcessingCommand(true);
    setStatusMessage(null);

    try {
      const response = await api.executeCommand({
        commandText: commandText.trim(),
        spokenConfidence: confidence
      });

      setLastExecutedCommand({
        cmd: commandText,
        feedback: response.feedback,
        action: response.action,
        success: response.success,
        timestamp: new Date().toLocaleTimeString()
      });

      // TTS voice response feedback
      if (ttsEnabled && response.feedback) {
        speech.speak(response.feedback);
      }

      // If command was to lock session
      if (response.action === 'LOCK_SESSION') {
        setTimeout(() => {
          logout();
          navigate('/login');
        }, 1500);
        return;
      }

      // Refresh data
      loadDashboardData();
    } catch (err) {
      console.error('Command execution error:', err);
      setStatusMessage({ type: 'error', text: err.message || 'Failed to dispatch voice command' });
    } finally {
      setIsProcessingCommand(false);
    }
  };

  // Voice Recognition Hook for Dashboard Controller
  const speech = useVoiceRecognition({
    continuous: continuousMode,
    onFinalTranscript: (text, conf) => {
      handleExecuteVoiceCommand(text, conf);
      if (!continuousMode) {
        visualizer.stopAudio();
      }
    }
  });

  // Toggle Voice Listening in Dashboard
  const handleToggleListening = async () => {
    if (speech.isListening) {
      speech.stopListening();
      visualizer.stopAudio();
    } else {
      speech.resetTranscript();
      await visualizer.startAudio();
      speech.startListening();
    }
  };

  // Save Threshold Settings
  const handleSaveThreshold = async (newVal) => {
    setThreshold(newVal);
    try {
      await updateVoiceSettings({ voiceConfidenceThreshold: newVal });
      setStatusMessage({ type: 'success', text: `Confidence threshold updated to ${newVal}%` });
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Failed to update threshold' });
    }
  };

  // Toggle TTS
  const handleToggleTTS = async () => {
    const nextVal = !ttsEnabled;
    setTtsEnabled(nextVal);
    try {
      await updateVoiceSettings({ ttsVoiceFeedback: nextVal });
    } catch (err) {
      // ignore
    }
  };

  // Save New Passphrase
  const handleSavePassphrase = async () => {
    if (!newPassphrase.trim()) return;
    try {
      await updateVoiceSettings({ voicePassphrase: newPassphrase.trim() });
      setIsEditingPassphrase(false);
      setStatusMessage({ type: 'success', text: 'Security passphrase updated successfully' });
      loadDashboardData();
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Failed to update passphrase' });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Welcome & Session Banner */}
      <div className="glass-panel-glow rounded-2xl p-6 relative overflow-hidden border border-cyan-500/30">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-mono text-cyan-400 mb-1">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span>SECURE OPERATOR WORKSTATION</span>
              <span className="text-slate-600">•</span>
              <span className="text-emerald-400 font-semibold">JWT AUTHENTICATED</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">{user?.name}</span>
            </h1>
            <p className="text-sm text-slate-400 mt-1 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Passphrase: <span className="font-mono text-cyan-300">"{user?.voicePassphrase}"</span></span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Lock Session Button */}
            <button
              onClick={() => {
                speech.speak('Workstation locked.');
                logout();
                navigate('/login');
              }}
              className="px-4 py-2 rounded-xl bg-slate-900/90 hover:bg-rose-950/40 text-slate-300 hover:text-rose-300 border border-slate-800 hover:border-rose-900/50 text-xs font-mono font-semibold transition-all flex items-center space-x-2 shadow-sm"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Lock Session</span>
            </button>

            {/* Refresh Data */}
            <button
              onClick={loadDashboardData}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-cyan-400 border border-slate-800 transition-colors"
              title="Refresh Telemetry"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Status Toast */}
        {statusMessage && (
          <div className={`mt-4 p-2.5 rounded-lg text-xs font-mono flex items-center justify-between ${statusMessage.type === 'error' ? 'bg-rose-950/60 text-rose-200 border border-rose-800' : 'bg-emerald-950/60 text-emerald-200 border border-emerald-800'}`}>
            <span>{statusMessage.text}</span>
            <button onClick={() => setStatusMessage(null)} className="text-slate-400 hover:text-white ml-2">×</button>
          </div>
        )}
      </div>

      {/* Main Grid: Voice Command Hub + Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left 7 Columns: Interactive Voice Controller */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Voice Command Console */}
          <div className="glass-panel rounded-2xl p-6 border border-cyan-500/25 relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Terminal className="w-5 h-5 text-cyan-400" />
                <h2 className="text-base font-bold text-white font-mono uppercase tracking-wide">
                  Voice Command Terminal
                </h2>
              </div>

              {/* TTS and Continuous Mode Toggles */}
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleToggleTTS}
                  className={`p-1.5 rounded-lg border text-xs font-mono flex items-center gap-1.5 transition-colors ${
                    ttsEnabled
                      ? 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300'
                      : 'bg-slate-900 border-slate-800 text-slate-500'
                  }`}
                  title={ttsEnabled ? 'Spoken Voice Response: Enabled' : 'Spoken Voice Response: Muted'}
                >
                  {ttsEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline">TTS Audio</span>
                </button>

                <button
                  type="button"
                  onClick={() => setContinuousMode(!continuousMode)}
                  className={`p-1.5 rounded-lg border text-xs font-mono transition-colors ${
                    continuousMode
                      ? 'bg-blue-950/60 border-blue-500/40 text-blue-300 font-semibold'
                      : 'bg-slate-900 border-slate-800 text-slate-500'
                  }`}
                  title="Continuous hands-free voice listener"
                >
                  Continuous: {continuousMode ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>

            {/* Live Audio Visualizer */}
            <AudioVisualizer
              canvasRef={visualizer.canvasRef}
              isActive={visualizer.isActive}
              volume={visualizer.volume}
              visualizerType={visualizerType}
              onToggleType={() => setVisualizerType(visualizerType === 'bars' ? 'wave' : 'bars')}
              label="Live Command Audio Spectrum"
            />

            {/* Central Mic Button */}
            <VoiceMicButton
              isListening={speech.isListening}
              isLoading={isProcessingCommand}
              onClick={handleToggleListening}
              volume={visualizer.volume}
              label={speech.isListening ? 'Listening for Command...' : 'Click to Issue Voice Command'}
              sublabel={
                speech.isListening
                  ? 'Speak a command e.g. "System status" or "Activate firewall"'
                  : 'Microphone active on click'
              }
            />

            {/* Live Speech Recognition Transcript */}
            {(speech.fullTranscript || isProcessingCommand) && (
              <div className="mt-4 p-3 rounded-xl bg-[#070913] border border-cyan-500/30 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  <span className="text-xs font-mono text-slate-400">Heard:</span>
                  <span className="text-sm font-mono text-cyan-300 font-semibold">
                    "{speech.fullTranscript || 'Processing audio stream...'}"
                  </span>
                </div>
              </div>
            )}

            {/* Last Executed Command Feedback Card */}
            {lastExecutedCommand && (
              <div className="mt-4 p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Action Dispatched: <span className="text-white font-bold">{lastExecutedCommand.action}</span>
                  </span>
                  <span className="text-slate-500">{lastExecutedCommand.timestamp}</span>
                </div>
                <p className="text-xs font-mono text-cyan-300 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                  {lastExecutedCommand.feedback}
                </p>
              </div>
            )}

            {/* Quick Command Suggestion Chips */}
            <div className="mt-5 pt-4 border-t border-slate-800">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block mb-2 font-semibold">
                Voice Controller Command Palette (Click or Speak):
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {COMMAND_SHORTCUTS.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleExecuteVoiceCommand(item.cmd)}
                      disabled={isProcessingCommand}
                      className="p-2 rounded-lg bg-slate-900/60 hover:bg-cyan-950/40 border border-slate-800 hover:border-cyan-500/30 text-left transition-all group"
                    >
                      <div className="flex items-center space-x-1.5 text-xs text-slate-300 group-hover:text-cyan-300 font-semibold font-mono">
                        <Icon className="w-3 h-3 text-cyan-400 shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 truncate mt-0.5">{item.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Voice Security Profile & Threshold Settings Card */}
          <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <SlidersHorizontal className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white font-mono uppercase tracking-wide">
                  Biometric Controller Tuning
                </h3>
              </div>
              <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
                Security Profile
              </span>
            </div>

            {/* Passphrase Manager */}
            <div className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-mono text-slate-400">Security Passphrase</span>
                <button
                  type="button"
                  onClick={() => setIsEditingPassphrase(!isEditingPassphrase)}
                  className="text-xs font-mono text-cyan-400 hover:underline"
                >
                  {isEditingPassphrase ? 'Cancel' : 'Change Phrase'}
                </button>
              </div>

              {isEditingPassphrase ? (
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="text"
                    value={newPassphrase}
                    onChange={(e) => setNewPassphrase(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-lg glass-input text-xs font-mono"
                    placeholder="Enter new passphrase..."
                  />
                  <button
                    onClick={handleSavePassphrase}
                    className="px-3 py-1.5 rounded-lg bg-cyan-500 text-black font-bold text-xs font-mono hover:bg-cyan-400 transition-colors"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <p className="text-sm font-mono text-cyan-200 font-bold">
                  "{user?.voicePassphrase}"
                </p>
              )}
            </div>

            {/* Threshold Slider */}
            <div className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-300">Biometric Match Threshold:</span>
                <span className="text-cyan-400 font-bold text-sm">{threshold}%</span>
              </div>
              <input
                type="range"
                min="45"
                max="90"
                step="5"
                value={threshold}
                onChange={(e) => handleSaveThreshold(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                <span>45% (Permissive)</span>
                <span>70% (Standard)</span>
                <span>90% (Ultra High Security)</span>
              </div>
            </div>

          </div>

        </div>

        {/* Right 5 Columns: Telemetry Metrics & Audit Log Trail */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* System Telemetry Module */}
          <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-cyan-400" />
              <h3 className="text-base font-bold text-white font-mono uppercase tracking-wide">
                Controller Status & Telemetry
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-3 font-mono">
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block">Quantum Firewall</span>
                <span className={`text-sm font-bold flex items-center gap-1.5 mt-1 ${controllerStatus?.systemState?.firewallShield ? 'text-emerald-400' : 'text-rose-400'}`}>
                  <Shield className="w-3.5 h-3.5" />
                  {controllerStatus?.systemState?.firewallShield ? 'Active' : 'Disabled'}
                </span>
              </div>

              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block">Stealth Protocol</span>
                <span className={`text-sm font-bold flex items-center gap-1.5 mt-1 ${controllerStatus?.systemState?.stealthMode ? 'text-cyan-400' : 'text-slate-400'}`}>
                  <Layers className="w-3.5 h-3.5" />
                  {controllerStatus?.systemState?.stealthMode ? 'Engaged' : 'Standby'}
                </span>
              </div>

              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block">Lockdown State</span>
                <span className={`text-sm font-bold flex items-center gap-1.5 mt-1 ${controllerStatus?.systemState?.highSecurityLockdown ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`}>
                  <Lock className="w-3.5 h-3.5" />
                  {controllerStatus?.systemState?.highSecurityLockdown ? 'Heightened' : 'Standard'}
                </span>
              </div>

              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block">MongoDB Storage</span>
                <span className="text-sm font-bold text-emerald-400 flex items-center gap-1.5 mt-1">
                  <Database className="w-3.5 h-3.5" />
                  Online
                </span>
              </div>
            </div>

            {/* Total Voice Operations Stat */}
            <div className="p-3 bg-gradient-to-r from-cyan-950/40 to-blue-950/40 rounded-xl border border-cyan-500/20 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-300">Total Voice Verifications & Actions:</span>
              <span className="text-cyan-300 font-bold text-sm">
                {controllerStatus?.stats?.totalAuditEvents || auditLogs.length} events
              </span>
            </div>
          </div>

          {/* Audit Log Trail */}
          <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <History className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white font-mono uppercase tracking-wide">
                  Security Audit Trail
                </h3>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                {auditLogs.length} Records
              </span>
            </div>

            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
              {auditLogs.length === 0 ? (
                <div className="py-8 text-center text-xs font-mono text-slate-500">
                  No security events recorded yet.
                </div>
              ) : (
                auditLogs.map((log) => {
                  const isVoiceSuccess = log.eventType === 'VOICE_LOGIN_SUCCESS' || log.eventType === 'VOICE_COMMAND_EXECUTED';
                  const isFailed = log.eventType.includes('FAILED');

                  return (
                    <div
                      key={log._id}
                      className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/80 hover:border-slate-700 transition-colors text-xs font-mono space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className={`font-semibold flex items-center gap-1 ${
                          isFailed ? 'text-rose-400' : isVoiceSuccess ? 'text-cyan-300' : 'text-slate-300'
                        }`}>
                          {isFailed ? (
                            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                          ) : (
                            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                          )}
                          {log.eventType.replace(/_/g, ' ')}
                        </span>
                        {log.confidence > 0 && (
                          <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                            log.confidence >= 70 ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-rose-950 text-rose-300 border border-rose-800'
                          }`}>
                            {log.confidence}%
                          </span>
                        )}
                      </div>

                      {log.transcript && (
                        <p className="text-[11px] text-slate-400 truncate">
                          Spoken: <span className="text-slate-200">"{log.transcript}"</span>
                        </p>
                      )}

                      <p className="text-[10px] text-slate-500 truncate">
                        {log.details}
                      </p>

                      <div className="text-[9px] text-slate-600 text-right pt-0.5">
                        {new Date(log.timestamp).toLocaleString()}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
