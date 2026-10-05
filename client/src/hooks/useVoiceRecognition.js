import { useState, useEffect, useRef, useCallback } from 'react';

export function useVoiceRecognition({ onFinalTranscript, continuous = false, lang = 'en-US' } = {}) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [error, setError] = useState(null);
  const [isSupported, setIsSupported] = useState(true);

  const recognitionRef = useRef(null);
  const onFinalCallbackRef = useRef(onFinalTranscript);

  useEffect(() => {
    onFinalCallbackRef.current = onFinalTranscript;
  }, [onFinalTranscript]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      setError('Web Speech API is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = continuous;
    recognition.interimResults = true;
    recognition.lang = lang;

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (event) => {
      let currentInterim = '';
      let currentFinal = '';
      let topConfidence = 0;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const item = event.results[i];
        const text = item[0].transcript;
        if (item.isFinal) {
          currentFinal += text + ' ';
          topConfidence = Math.round(item[0].confidence * 100);
        } else {
          currentInterim += text;
        }
      }

      if (currentInterim) {
        setInterimTranscript(currentInterim);
      }

      if (currentFinal) {
        const cleaned = currentFinal.trim();
        setTranscript(prev => (continuous ? (prev ? prev + ' ' + cleaned : cleaned) : cleaned));
        setInterimTranscript('');
        if (topConfidence > 0) setConfidence(topConfidence);

        if (onFinalCallbackRef.current) {
          onFinalCallbackRef.current(cleaned, topConfidence);
        }
      }
    };

    recognition.onerror = (event) => {
      console.warn('[SpeechRecognition Error]:', event.error);
      if (event.error !== 'no-speech') {
        setError(`Speech recognition: ${event.error}`);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          // ignore
        }
      }
    };
  }, [continuous, lang]);

  const startListening = useCallback(() => {
    setError(null);
    setTranscript('');
    setInterimTranscript('');
    if (!recognitionRef.current) {
      setError('Speech recognition engine unavailable');
      return;
    }
    try {
      recognitionRef.current.start();
    } catch (e) {
      console.warn('SpeechRecognition start error:', e);
      try {
        recognitionRef.current.stop();
        setTimeout(() => recognitionRef.current?.start(), 150);
      } catch (err) {
        setError('Could not start microphone listener');
      }
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
    }
    setIsListening(false);
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    setConfidence(0);
    setError(null);
  }, []);

  // Text To Speech synthesis helper
  const speak = useCallback((text, { pitch = 1.05, rate = 1.0 } = {}) => {
    if (!('speechSynthesis' in window) || !text) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = rate;
      utterance.pitch = pitch;

      // Select preferred voice if available
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Samantha') || v.name.includes('Google') || v.name.includes('Natural')));
      if (preferred) utterance.voice = preferred;

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
    }
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    fullTranscript: (transcript + (interimTranscript ? ' ' + interimTranscript : '')).trim(),
    confidence,
    error,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
    speak,
    setTranscript
  };
}
