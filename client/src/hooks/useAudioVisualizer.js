import { useState, useEffect, useRef, useCallback } from 'react';

export function useAudioVisualizer({ visualizerType = 'bars' } = {}) {
  const [isActive, setIsActive] = useState(false);
  const [volume, setVolume] = useState(0);
  const [audioError, setAudioError] = useState(null);

  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const streamRef = useRef(null);
  const animationFrameRef = useRef(null);
  const canvasRef = useRef(null);

  const stopAudio = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch (e) {
        // ignore
      }
      audioContextRef.current = null;
    }

    analyserRef.current = null;
    setIsActive(false);
    setVolume(0);

    // Clear canvas
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
  }, []);

  const startAudio = useCallback(async () => {
    stopAudio();
    setAudioError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      streamRef.current = stream;

      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioContext();
      audioContextRef.current = ctx;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;

      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);

      setIsActive(true);

      // Render loop
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const draw = () => {
        animationFrameRef.current = requestAnimationFrame(draw);

        if (!analyserRef.current || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const canvasCtx = canvas.getContext('2d');
        if (!canvasCtx) return;

        const width = canvas.width;
        const height = canvas.height;

        analyser.getByteFrequencyData(dataArray);

        // Calculate average volume (0-100)
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = Math.round((sum / bufferLength / 255) * 100);
        setVolume(avg);

        canvasCtx.clearRect(0, 0, width, height);

        if (visualizerType === 'wave') {
          // Time domain oscilloscope
          const timeData = new Uint8Array(analyser.fftSize);
          analyser.getByteTimeDomainData(timeData);

          canvasCtx.lineWidth = 2.5;
          const gradient = canvasCtx.createLinearGradient(0, 0, width, 0);
          gradient.addColorStop(0, '#00f2fe');
          gradient.addColorStop(0.5, '#4facfe');
          gradient.addColorStop(1, '#a855f7');
          canvasCtx.strokeStyle = gradient;
          canvasCtx.shadowBlur = 12;
          canvasCtx.shadowColor = '#00f2fe';

          canvasCtx.beginPath();
          const sliceWidth = width / analyser.fftSize;
          let x = 0;

          for (let i = 0; i < analyser.fftSize; i++) {
            const v = timeData[i] / 128.0;
            const y = (v * height) / 2;

            if (i === 0) {
              canvasCtx.moveTo(x, y);
            } else {
              canvasCtx.lineTo(x, y);
            }
            x += sliceWidth;
          }

          canvasCtx.lineTo(width, height / 2);
          canvasCtx.stroke();
        } else {
          // Neon frequency bars
          const barCount = 28;
          const barWidth = (width / barCount) * 0.75;
          const spacing = (width / barCount) * 0.25;
          let x = spacing / 2;

          for (let i = 0; i < barCount; i++) {
            // Map index to frequency bin
            const binIndex = Math.floor((i / barCount) * (bufferLength * 0.8));
            const barHeight = Math.max(4, (dataArray[binIndex] / 255) * height * 0.9);

            const gradient = canvasCtx.createLinearGradient(0, height - barHeight, 0, height);
            gradient.addColorStop(0, '#00f2fe');
            gradient.addColorStop(0.5, '#4facfe');
            gradient.addColorStop(1, '#1c2447');

            canvasCtx.fillStyle = gradient;
            canvasCtx.shadowBlur = barHeight > 15 ? 10 : 0;
            canvasCtx.shadowColor = '#00f2fe';

            // Rounded bar
            const radius = 3;
            const y = height - barHeight;
            canvasCtx.beginPath();
            canvasCtx.moveTo(x + radius, y);
            canvasCtx.lineTo(x + barWidth - radius, y);
            canvasCtx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + radius);
            canvasCtx.lineTo(x + barWidth, height);
            canvasCtx.lineTo(x, height);
            canvasCtx.lineTo(x, y + radius);
            canvasCtx.quadraticCurveTo(x, y, x + radius, y);
            canvasCtx.closePath();
            canvasCtx.fill();

            x += barWidth + spacing;
          }
        }
      };

      draw();
    } catch (err) {
      console.warn('Microphone access error:', err);
      setAudioError('Microphone permission required for audio visualizer');
      setIsActive(false);
    }
  }, [stopAudio, visualizerType]);

  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, [stopAudio]);

  return {
    canvasRef,
    isActive,
    volume,
    audioError,
    startAudio,
    stopAudio,
    analyser: analyserRef.current
  };
}
