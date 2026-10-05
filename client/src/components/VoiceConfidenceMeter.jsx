import React from 'react';
import { CheckCircle2, XCircle, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function VoiceConfidenceMeter({
  score = 0,
  threshold = 70,
  textScore,
  biometricScore,
  feedback,
  showBreakdown = true
}) {
  const isMatch = score >= threshold;
  const isClose = !isMatch && score >= threshold - 15;

  const getStatusColor = () => {
    if (isMatch) return 'text-emerald-400';
    if (isClose) return 'text-amber-400';
    return 'text-rose-400';
  };

  const getBarColor = () => {
    if (isMatch) return 'from-cyan-500 to-emerald-400';
    if (isClose) return 'from-amber-500 to-orange-400';
    return 'from-rose-600 to-rose-400';
  };

  return (
    <div className="rounded-xl bg-[#0c1021]/80 border border-slate-800 p-4 space-y-3">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {isMatch ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          ) : isClose ? (
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          ) : (
            <XCircle className="w-5 h-5 text-rose-400" />
          )}
          <span className="text-sm font-semibold text-slate-200">
            {isMatch ? 'Biometric Authentication Passed' : isClose ? 'Match Under Threshold' : 'Authentication Mismatch'}
          </span>
        </div>

        <div className={`font-mono text-lg font-bold ${getStatusColor()}`}>
          {score}% <span className="text-xs font-normal text-slate-400">/ {threshold}% min</span>
        </div>
      </div>

      {/* Progress Bar with Threshold Marker */}
      <div className="relative w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-700/60 p-[1px]">
        {/* Fill */}
        <div
          className={`h-full rounded-full bg-gradient-to-r ${getBarColor()} transition-all duration-500 ease-out`}
          style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
        />
        {/* Required Threshold Pin */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-cyan-300 shadow-sm shadow-cyan-300 z-10"
          style={{ left: `${threshold}%` }}
          title={`Required Threshold: ${threshold}%`}
        />
      </div>

      {/* Spoken Feedback Message */}
      {feedback && (
        <p className="text-xs text-slate-300 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80 font-mono">
          {feedback}
        </p>
      )}

      {/* Metric Breakdown */}
      {showBreakdown && (textScore !== undefined || biometricScore !== undefined) && (
        <div className="grid grid-cols-2 gap-2 pt-1 text-xs font-mono">
          <div className="bg-slate-900/40 p-2 rounded border border-slate-800 flex justify-between items-center">
            <span className="text-slate-400">Phrase Alignment:</span>
            <span className={textScore >= threshold ? 'text-emerald-400 font-bold' : 'text-slate-300'}>
              {textScore !== undefined ? `${textScore}%` : 'N/A'}
            </span>
          </div>
          <div className="bg-slate-900/40 p-2 rounded border border-slate-800 flex justify-between items-center">
            <span className="text-slate-400">Acoustic Resonance:</span>
            <span className={biometricScore >= threshold ? 'text-emerald-400 font-bold' : 'text-slate-300'}>
              {biometricScore !== undefined ? `${biometricScore}%` : 'N/A'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
