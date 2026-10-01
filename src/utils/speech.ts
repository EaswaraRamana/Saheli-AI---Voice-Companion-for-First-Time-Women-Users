import { SUPPORTED_LANGUAGES } from '../data/languages';
import { LanguageCode } from '../types';

let currentAudio: HTMLAudioElement | null = null;

// Eagerly initialize voices so they are ready when the user triggers voice
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  window.speechSynthesis.getVoices();
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.getVoices();
    };
  }
}

export function stopCurrentAudio() {
  if (currentAudio) {
    try {
      currentAudio.pause();
    } catch (e) {}
    currentAudio = null;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch (e) {}
    (window as any).__saheli_active_utterance = null;
  }
}

/**
 * Finds the most suitable SpeechSynthesisVoice for the requested language.
 * Prioritizes locale-matched voices and a friendly female-leaning voice when available.
 */
export function getBestVoiceForLanguage(langCode: LanguageCode): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;

  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  const langInfo = SUPPORTED_LANGUAGES.find((l) => l.code === langCode);
  const targetCode = (langInfo ? langInfo.speechCode : 'hi-IN').toLowerCase();
  const langPrefix = targetCode.split('-')[0]; // e.g. 'ta', 'te', 'hi', 'bn'
  const langName = (langInfo ? langInfo.name : '').toLowerCase();

  const normalizeLang = (value: string) => value.toLowerCase().replace(/_/g, '-');
  const isTamilVoice = (voice: SpeechSynthesisVoice) => {
    const text = `${voice.name} ${voice.lang}`.toLowerCase();
    return text.includes('tamil') || text.includes('ta-in') || text.includes('ta_') || text.includes('tam');
  };
  const isFemaleVoice = (voice: SpeechSynthesisVoice) => {
    const text = `${voice.name} ${voice.lang}`.toLowerCase();
    return (
      text.includes('female') ||
      text.includes('woman') ||
      text.includes('girl') ||
      text.includes('zira') ||
      text.includes('samantha') ||
      text.includes('karen') ||
      text.includes('susan') ||
      text.includes('safiya') ||
      text.includes('neerja') ||
      text.includes('vani') ||
      text.includes('ananya')
    );
  };

  const candidates = voices.filter((v) => {
    const l = normalizeLang(v.lang);
    const name = v.name.toLowerCase();
    return (
      l === targetCode ||
      l.startsWith(langPrefix + '-') ||
      l === langPrefix ||
      name.includes(langName) ||
      name.includes(langPrefix) ||
      (langCode === 'ta' && isTamilVoice(v))
    );
  });

  const femaleCandidate = candidates.find(isFemaleVoice) || candidates.find(isTamilVoice);
  if (femaleCandidate) return femaleCandidate;

  // 1. Exact speech code match (e.g. 'ta-in' or 'ta_in')
  const exact = voices.find((v) => normalizeLang(v.lang) === targetCode);
  if (exact) return exact;

  // 2. Starts with language code prefix (e.g. 'ta-', 'ta_')
  const prefixMatch = voices.find((v) => {
    const l = normalizeLang(v.lang);
    return l.startsWith(langPrefix + '-') || l === langPrefix;
  });
  if (prefixMatch) return prefixMatch;

  // 3. Name match for the language name (e.g. contains 'tamil', 'telugu', 'hindi')
  const nameMatch = voices.find(
    (v) =>
      v.name.toLowerCase().includes(langName) ||
      v.name.toLowerCase().includes(langPrefix)
  );
  if (nameMatch) return nameMatch;

  // 4. Prefer a female-leaning voice even when locale match is slightly imperfect.
  const femaleFallback = voices.find(isFemaleVoice) || voices.find(isTamilVoice);
  if (femaleFallback) return femaleFallback;

  // 5. Any Indian region voice if an Indian language is selected
  if (langCode !== 'en') {
    const inVoice = voices.find((v) =>
      normalizeLang(v.lang).includes('-in') || normalizeLang(v.lang).includes('_in')
    );
    if (inVoice) return inVoice;
  }

  // 6. Default browser voice
  return voices.find((v) => v.default) || voices[0] || null;
}

export function playAudioOrSpeak(
  text: string,
  langCode: LanguageCode,
  onStart?: () => void,
  onEnd?: () => void,
  customAudioUrl?: string
) {
  stopCurrentAudio();

  // If a server-generated audio URL is provided
  if (customAudioUrl) {
    const audio = new Audio(customAudioUrl);
    currentAudio = audio;
    if (onStart) audio.onplay = onStart;
    audio.onended = () => {
      currentAudio = null;
      if (onEnd) onEnd();
    };
    audio.onerror = () => {
      currentAudio = null;
      speakWithBrowserSynthesis(text, langCode, onStart, onEnd);
    };
    audio.play().catch(() => {
      speakWithBrowserSynthesis(text, langCode, onStart, onEnd);
    });
    return;
  }

  // Standard high-speed browser Web Speech in the selected language
  speakWithBrowserSynthesis(text, langCode, onStart, onEnd);
}

function speakWithBrowserSynthesis(
  text: string,
  langCode: LanguageCode,
  onStart?: () => void,
  onEnd?: () => void
) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    if (onEnd) onEnd();
    return;
  }

  const speakNow = () => {
    window.speechSynthesis.cancel();

    const clean = text.replace(/[*#_~`]/g, '').trim();
    if (!clean) {
      if (onEnd) onEnd();
      return;
    }

    const langInfo = SUPPORTED_LANGUAGES.find((l) => l.code === langCode);
    const targetSpeechCode = langInfo ? langInfo.speechCode : 'hi-IN';

    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang = targetSpeechCode;
    utterance.rate = 0.92;
    utterance.pitch = 1.0;
    utterance.volume = 1;

    const matchedVoice = getBestVoiceForLanguage(langCode);
    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    try {
      window.speechSynthesis.resume();
    } catch (e) {}

    // Retain utterance reference on window to prevent Chrome's GC bug from silencing mid-speech
    (window as any).__saheli_active_utterance = utterance;

    utterance.onstart = () => {
      if (onStart) onStart();
    };

    utterance.onend = () => {
      (window as any).__saheli_active_utterance = null;
      if (onEnd) onEnd();
    };

    utterance.onerror = (e) => {
      console.warn('SpeechSynthesis error:', e);
      (window as any).__saheli_active_utterance = null;
      if (onEnd) onEnd();
    };

    window.speechSynthesis.speak(utterance);
  };

  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) {
    const retrySpeech = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      if (availableVoices && availableVoices.length > 0) {
        speakNow();
        return;
      }
      setTimeout(retrySpeech, 250);
    };
    retrySpeech();
    return;
  }

  speakNow();
}

export interface VoiceSessionController {
  stop: () => void;
}

/**
 * Full-sentence speech recognition session:
 * 1. Dynamically sets Web Speech API lang to the currently selected language
 * 2. Captures the complete spoken sentence without extracting only numbers, keywords, or partial phrases
 * 3. Preserves the user's complete speech as the input text
 * 4. Provides smooth real-time interim results
 * 5. Uses continuous mode with silence detection so natural speech pauses do not prematurely cut off the user
 * 6. Fallback to MediaRecorder + Gemini multimodal audio transcription if browser has no Web Speech API
 */
export async function startVoiceListeningSession(
  langCode: LanguageCode,
  onInterim: (text: string) => void,
  onFinal: (text: string) => void,
  onError: (errMsg: string) => void,
  onEnd: () => void
): Promise<VoiceSessionController> {
  stopCurrentAudio();

  const langInfo = SUPPORTED_LANGUAGES.find((l) => l.code === langCode);
  const targetSpeechCode = langInfo ? langInfo.speechCode : 'hi-IN';

  let hasEnded = false;
  let finalDelivered = false;
  let latestCompleteText = '';
  let silenceTimeout: ReturnType<typeof setTimeout> | null = null;
  const SILENCE_TIMEOUT_MS = 2000; // 2 seconds of silence after speaking concludes the sentence

  const clearSilenceTimer = () => {
    if (silenceTimeout) {
      clearTimeout(silenceTimeout);
      silenceTimeout = null;
    }
  };

  const deliverFinalSentence = (text: string) => {
    clearSilenceTimer();
    if (finalDelivered) return;
    const clean = text.trim();
    if (clean) {
      finalDelivered = true;
      onFinal(clean);
    }
    safeEnd();
  };

  const safeEnd = () => {
    clearSilenceTimer();
    if (hasEnded) return;
    hasEnded = true;
    onEnd();
  };

  const SpeechRecognition =
    typeof window !== 'undefined'
      ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      : null;

  // Primary Path: Native Browser Web Speech API
  if (SpeechRecognition) {
    let recognition: any = null;
    try {
      recognition = new SpeechRecognition();
      recognition.lang = targetSpeechCode;
      recognition.continuous = true; // Essential: captures full sentences without truncating after first word
      recognition.interimResults = true; // Live streaming feedback
      recognition.maxAlternatives = 1;

      recognition.onresult = (event: any) => {
        let finalSegments = '';
        let interimSegment = '';

        for (let i = 0; i < event.results.length; ++i) {
          const res = event.results[i];
          if (res.isFinal) {
            finalSegments += res[0].transcript + ' ';
          } else {
            interimSegment += res[0].transcript;
          }
        }

        const fullSentence = (finalSegments + interimSegment).trim();
        if (fullSentence) {
          latestCompleteText = fullSentence;
          onInterim(fullSentence);

          // Reset silence timer on every spoken word
          clearSilenceTimer();
          silenceTimeout = setTimeout(() => {
            // User paused for 2.0s after speaking their full sentence
            try {
              recognition.stop();
            } catch (e) {}
            deliverFinalSentence(latestCompleteText);
          }, SILENCE_TIMEOUT_MS);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('SpeechRecognition event error:', event.error);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          if (!finalDelivered) {
            onError('PERMISSION_DENIED');
            safeEnd();
          }
          return;
        }
        if (event.error === 'no-speech') {
          // If we already have recognized speech, ignore no-speech!
          if (latestCompleteText.trim()) {
            return;
          }
        }
      };

      recognition.onend = () => {
        clearSilenceTimer();
        if (!finalDelivered) {
          if (latestCompleteText.trim()) {
            deliverFinalSentence(latestCompleteText);
          } else {
            safeEnd();
          }
        }
      };

      recognition.start();

      return {
        stop: () => {
          clearSilenceTimer();
          try {
            recognition.stop();
          } catch (e) {}
          if (latestCompleteText.trim()) {
            deliverFinalSentence(latestCompleteText);
          } else {
            safeEnd();
          }
        },
      };
    } catch (e) {
      console.warn('Web Speech Recognition failed to start, falling back to MediaRecorder:', e);
    }
  }

  // Secondary Path: MediaRecorder with Gemini Multimodal Audio Transcription fallback
  let mediaStream: MediaStream | null = null;
  let mediaRecorder: MediaRecorder | null = null;
  const audioChunks: Blob[] = [];

  const cleanupMediaStream = () => {
    if (mediaStream) {
      try {
        mediaStream.getTracks().forEach((track) => track.stop());
      } catch (e) {}
      mediaStream = null;
    }
  };

  try {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } else {
      onError('PERMISSION_DENIED');
      safeEnd();
      return { stop: safeEnd };
    }
  } catch (err) {
    console.warn('Microphone permission request error:', err);
    onError('PERMISSION_DENIED');
    safeEnd();
    return { stop: safeEnd };
  }

  if (mediaStream && typeof MediaRecorder !== 'undefined') {
    try {
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : '';
      mediaRecorder = mimeType
        ? new MediaRecorder(mediaStream, { mimeType })
        : new MediaRecorder(mediaStream);

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunks.push(e.data);
        }
      };
      mediaRecorder.start(200);
    } catch (e) {
      console.warn('MediaRecorder initialization error:', e);
    }
  }

  const sendAudioToGemini = async () => {
    if (finalDelivered || audioChunks.length === 0) {
      cleanupMediaStream();
      safeEnd();
      return;
    }

    try {
      const audioBlob = new Blob(audioChunks, { type: mediaRecorder?.mimeType || 'audio/webm' });
      if (audioBlob.size < 800) {
        cleanupMediaStream();
        safeEnd();
        return;
      }

      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Audio = reader.result as string;
          const res = await fetch('/api/saheli/transcribe-audio', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              audioBase64: base64Audio,
              mimeType: mediaRecorder?.mimeType || 'audio/webm',
              language: langCode,
            }),
          });
          const resJson = await res.json();
          if (resJson.success && resJson.transcript && resJson.transcript.trim()) {
            deliverFinalSentence(resJson.transcript.trim());
          }
        } catch (e) {
          console.warn('Audio transcription failed:', e);
        } finally {
          cleanupMediaStream();
          safeEnd();
        }
      };
      reader.readAsDataURL(audioBlob);
    } catch (e) {
      console.warn('Could not process audio blob:', e);
      cleanupMediaStream();
      safeEnd();
    }
  };

  return {
    stop: () => {
      clearSilenceTimer();
      if (mediaRecorder && mediaRecorder.state === 'recording') {
        try {
          mediaRecorder.stop();
        } catch (e) {}
      }
      setTimeout(() => {
        sendAudioToGemini();
      }, 350);
    },
  };
}

// Backwards-compatible legacy helper
export function createSpeechRecognizer(
  langCode: LanguageCode,
  onResult: (text: string) => void,
  onError: (err: any) => void,
  onEnd: () => void
) {
  const SpeechRecognition =
    typeof window !== 'undefined'
      ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      : null;

  if (!SpeechRecognition) {
    return null;
  }

  const recognition = new SpeechRecognition();
  const langInfo = SUPPORTED_LANGUAGES.find((l) => l.code === langCode);
  recognition.lang = langInfo ? langInfo.speechCode : 'hi-IN';
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;

  let latestSentence = '';

  recognition.onresult = (event: any) => {
    let full = '';
    let interim = '';
    for (let i = 0; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        full += event.results[i][0].transcript + ' ';
      } else {
        interim += event.results[i][0].transcript;
      }
    }
    const complete = (full + interim).trim();
    if (complete) {
      latestSentence = complete;
      onResult(complete);
    }
  };

  recognition.onerror = (event: any) => {
    onError(event);
  };

  recognition.onend = () => {
    if (latestSentence.trim()) {
      onResult(latestSentence.trim());
    }
    onEnd();
  };

  return recognition;
}
