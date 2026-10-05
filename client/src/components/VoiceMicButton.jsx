import React from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';

export default function VoiceMicButton({
  isListening = false,
  isLoading = false,
  onClick,
  disabled = false,
  label = 'Tap to Speak',
  sublabel = 'Passphrase Voice Controller',
  volume = 0
}) {
  const dynamicScale = isListening ? 1 + Math.min(0.2, (volume / 100) * 0.25) : 1;

  return (
    <div className="flex flex-col items-center justify-center my-4 select-none">
      <div className="relative flex items-center justify-center">
        {/* Animated outer pulsing ripple rings when active */}
        {isListening && (
          <>
            <span
              className="absolute inline-flex rounded-full bg-cyan-500/20 animate-ping"
              style={{
                width: '120px',
                height: '120px',
                animationDuration: '1.8s'
              }}
            />
            <span
              className="absolute inline-flex rounded-full bg-blue-500/30"
              style={{
                width: `${100 + volume * 0.8}px`,
                height: `${100 + volume * 0.8}px`,
                transition: 'width 0.05s ease-out, height 0.05s ease-out',
                opacity: 0.4 + (volume / 100) * 0.4
              }}
            />
          </>
        )}

        {/* Main Circular Mic Trigger */}
        <button
          type="button"
          onClick={onClick}
          disabled={disabled || isLoading}
          style={{ transform: `scale(${dynamicScale})` }}
          className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center transition-all duration-200 outline-none focus:ring-4 focus:ring-cyan-400/40 ${
            disabled
              ? 'bg-slate-800 text-slate-600 border border-slate-700 cursor-not-allowed'
              : isListening
              ? 'bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 text-white shadow-2xl shadow-cyan-500/60 border-2 border-cyan-300'
              : 'bg-gradient-to-tr from-[#0f172a] to-[#1e293b] text-cyan-400 hover:text-white hover:border-cyan-400/80 border-2 border-cyan-500/30 shadow-lg shadow-cyan-950/40 hover:shadow-cyan-500/30 hover:scale-105'
          }`}
        >
          {isLoading ? (
            <Loader2 className="w-10 h-10 animate-spin text-cyan-300" />
          ) : isListening ? (
            <div className="flex flex-col items-center">
              <Mic className="w-9 h-9 animate-bounce text-white drop-shadow" />
              <span className="text-[10px] font-mono tracking-widest uppercase font-bold text-cyan-200 mt-0.5">
                LIVE
              </span>
            </div>
          ) : (
            <Mic className="w-10 h-10 transition-transform duration-200" />
          )}
        </button>
      </div>

      {/* Button Sub-Label */}
      <div className="mt-4 text-center">
        <p className={`text-sm font-semibold tracking-wide transition-colors ${isListening ? 'text-cyan-400 animate-pulse' : 'text-slate-200'}`}>
          {isListening ? 'Listening... Speak Now' : label}
        </p>
        <p className="text-xs text-slate-400 font-mono mt-0.5">
          {isListening ? 'Say your enrolled passphrase clearly' : sublabel}
        </p>
      </div>
    </div>
  );
}
