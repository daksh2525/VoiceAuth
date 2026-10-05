import React from 'react';
import { Activity, BarChart3, Radio } from 'lucide-react';

export default function AudioVisualizer({
  canvasRef,
  isActive = false,
  volume = 0,
  visualizerType = 'bars',
  onToggleType,
  label = 'Acoustic Visualizer'
}) {
  return (
    <div className="relative rounded-xl overflow-hidden bg-[#070913]/90 border border-cyan-500/25 p-3 shadow-inner">
      {/* Visualizer header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-cyan-400 animate-ping' : 'bg-slate-600'}`} />
          <span className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold flex items-center gap-1.5">
            {isActive ? (
              <span className="text-cyan-400 flex items-center gap-1">
                <Radio className="w-3 h-3 animate-pulse" /> Live Mic Feed
              </span>
            ) : (
              <span>{label}</span>
            )}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {/* Volume meter */}
          <div className="flex items-center space-x-1.5 text-[11px] font-mono text-slate-400">
            <span>Level:</span>
            <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden p-[1px]">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-rose-500 transition-all duration-75 rounded-full"
                style={{ width: `${Math.min(100, volume * 1.8)}%` }}
              />
            </div>
            <span className="text-cyan-300 w-6 text-right">{volume}%</span>
          </div>

          {/* Toggle Type button */}
          {onToggleType && (
            <button
              type="button"
              onClick={onToggleType}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-cyan-400 transition-colors"
              title={`Switch to ${visualizerType === 'bars' ? 'Waveform' : 'Spectrum Bars'}`}
            >
              {visualizerType === 'bars' ? (
                <Activity className="w-3.5 h-3.5" />
              ) : (
                <BarChart3 className="w-3.5 h-3.5" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Canvas Element */}
      <div className="relative w-full h-24 bg-gradient-to-b from-[#0a0e20] to-[#060814] rounded-lg overflow-hidden flex items-center justify-center border border-slate-800/80">
        <canvas
          ref={canvasRef}
          width={480}
          height={96}
          className="w-full h-full block"
        />

        {/* Ambient grid overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle, #00f2fe 1px, transparent 1px)`,
            backgroundSize: '16px 16px'
          }}
        />

        {/* Idle state animation if microphone is not active */}
        {!isActive && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex items-center space-x-1.5">
              {[4, 8, 14, 20, 14, 8, 4].map((h, i) => (
                <span
                  key={i}
                  className="w-1 bg-slate-700/60 rounded-full animate-soundwave"
                  style={{
                    height: `${h * 1.5}px`,
                    animationDelay: `${i * 120}ms`
                  }}
                />
              ))}
            </div>
            <span className="ml-3 text-xs font-mono text-slate-500">Awaiting audio input...</span>
          </div>
        )}
      </div>
    </div>
  );
}
