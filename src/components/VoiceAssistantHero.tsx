import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Sparkles, Volume2, ArrowRight } from 'lucide-react';
import { LanguageCode } from '../types';
import { UI_TRANSLATIONS } from '../data/languages';
import { QUICK_VOICE_QUERIES } from '../data/schemes';
import { startVoiceListeningSession, VoiceSessionController, stopCurrentAudio } from '../utils/speech';

interface VoiceAssistantHeroProps {
  currentLang: LanguageCode;
  onVoiceSearch: (query: string, targetSchemeId?: string) => void;
  isProcessing: boolean;
  activeQuery: string;
}

export const VoiceAssistantHero: React.FC<VoiceAssistantHeroProps> = ({
  currentLang,
  onVoiceSearch,
  isProcessing,
  activeQuery,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [micError, setMicError] = useState<string | null>(null);
  const [activeSession, setActiveSession] = useState<VoiceSessionController | null>(null);

  const t = UI_TRANSLATIONS[currentLang] || UI_TRANSLATIONS.hi;

  // Sync transcript when activeQuery changes from outside
  useEffect(() => {
    if (activeQuery) {
      setTranscript(activeQuery);
    }
  }, [activeQuery]);

  // Cleanup when unmounting or language changes
  useEffect(() => {
    return () => {
      if (activeSession) {
        try {
          activeSession.stop();
        } catch (e) {}
      }
      stopCurrentAudio();
    };
  }, [currentLang]);

  const handleToggleMic = async () => {
    setMicError(null);

    // If already listening, stop session gracefully
    if (isListening) {
      if (activeSession) {
        try {
          activeSession.stop();
        } catch (e) {}
        setActiveSession(null);
      }
      setIsListening(false);
      return;
    }

    stopCurrentAudio();
    setIsListening(true);
    setTranscript('');

    try {
      const session = await startVoiceListeningSession(
        currentLang,
        (interimText) => {
          setTranscript(interimText);
        },
        (finalText) => {
          setTranscript(finalText);
          setIsListening(false);
          setActiveSession(null);
          if (finalText && finalText.trim()) {
            onVoiceSearch(finalText.trim());
          }
        },
        (errCode) => {
          setIsListening(false);
          setActiveSession(null);
          if (errCode === 'PERMISSION_DENIED') {
            setMicError(t.micErrorPermission);
          } else {
            setMicError(t.micErrorNotClear);
          }
        },
        () => {
          setIsListening(false);
          setActiveSession(null);
        }
      );
      setActiveSession(session);
    } catch (e) {
      console.warn('Voice session start error:', e);
      setIsListening(false);
      setActiveSession(null);
      setMicError(t.micErrorPermission);
    }
  };

  const handleQuickTrigger = (item: typeof QUICK_VOICE_QUERIES[0]) => {
    stopCurrentAudio();
    const query = item.label[currentLang] || item.label.hi;
    setTranscript(query);
    onVoiceSearch(query, item.id);
  };

  return (
    <section className="relative overflow-hidden pt-6 pb-8 px-4 bg-gradient-to-b from-amber-50/70 via-stone-50/40 to-transparent">
      <div className="max-w-4xl mx-auto text-center">
        
        {/* Warm Trust Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-100/80 text-rose-900 border border-rose-200 text-xs font-bold mb-4 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
          <span>{t.freeGovService}</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-stone-900 tracking-tight leading-tight mb-3">
          {currentLang === 'hi' && (
            <>
              अपनी भाषा में बोलें, <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-600 via-amber-600 to-rose-700">सरकारी योजना</span> सीधे पाएं
            </>
          )}
          {currentLang === 'ta' && (
            <>
              உங்கள் மொழியில் பேசுங்கள், <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-amber-600">அரசு திட்டங்களை</span> எளிதாக பெறுங்கள்
            </>
          )}
          {currentLang === 'te' && (
            <>
              మీ భాషలో మాట్లాడండి, <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-amber-600">ప్రభుత్వ పథకాలను</span> సులభంగా పొందండి
            </>
          )}
          {currentLang === 'bn' && (
            <>
              নিজের ভাষায় কথা বলুন, <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-amber-600">সরকারি সুবিধা</span> সহজে বুঝে নিন
            </>
          )}
          {currentLang === 'mr' && (
            <>
              आपल्या भाषेत बोला, <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-amber-600">सरकारी योजना</span> घरबसल्या मिळवा
            </>
          )}
          {currentLang === 'gu' && (
            <>
              તમારા અવાજમાં બોલો, <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-amber-600">સરકારી લાભો</span> સીધા મેળવો
            </>
          )}
          {currentLang === 'kn' && (
            <>
              ನಿಮ್ಮ ಧ್ವನಿಯಲ್ಲಿ ಮಾತನಾಡಿ, <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-amber-600">ಸರ್ಕಾರಿ ಸೌಲಭ್ಯಗಳನ್ನು</span> ನೇರವಾಗಿ ಪಡೆಯಿರಿ
            </>
          )}
          {currentLang === 'ml' && (
            <>
              നിങ്ങളുടെ ശബ്ദത്തിൽ പറയൂ, <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-amber-600">സർക്കാർ ആനുകൂല്യങ്ങൾ</span> എളുപ്പത്തിൽ നേടൂ
            </>
          )}
          {currentLang === 'pa' && (
            <>
              ਆਪਣੀ ਆਵਾਜ਼ ਵਿੱਚ ਬੋਲੋ, <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-amber-600">ਸਰਕਾਰੀ ਲਾਭ</span> ਸਿੱਧੇ ਪ੍ਰਾਪਤ ਕਰੋ
            </>
          )}
          {currentLang === 'en' && (
            <>
              Speak in your voice, access <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-amber-600">Government Benefits</span> with zero tech skills
            </>
          )}
        </h1>

        <p className="text-sm sm:text-base text-stone-600 max-w-2xl mx-auto mb-6 leading-relaxed">
          {t.appSubtitle}
        </p>

        {/* Central Giant Voice Mic Button */}
        <div className="relative inline-flex flex-col items-center justify-center my-2">
          
          {/* Pulsing rings when listening */}
          {isListening && (
            <div className="absolute inset-0 -m-4 rounded-full bg-rose-400/30 animate-ping pointer-events-none" />
          )}

          <button
            onClick={handleToggleMic}
            className={`relative w-24 h-24 sm:w-28 sm:h-28 rounded-full flex flex-col items-center justify-center text-white transition-all duration-300 shadow-xl cursor-pointer active:scale-95 ${
              isListening
                ? 'bg-gradient-to-br from-rose-600 to-red-600 scale-105 shadow-rose-500/50'
                : isProcessing
                ? 'bg-amber-600 animate-pulse shadow-amber-500/30'
                : 'bg-gradient-to-tr from-rose-600 via-amber-600 to-rose-500 shadow-rose-600/30 hover:scale-105'
            }`}
            aria-label="Voice Input Microphone"
          >
            {isListening ? (
              <MicOff className="w-10 h-10 animate-bounce" />
            ) : (
              <Mic className="w-10 h-10" />
            )}
            <span className="text-[11px] font-extrabold uppercase mt-1 tracking-wider">
              {isListening 
                ? (currentLang === 'hi' ? 'सुन रहे हैं' : currentLang === 'ta' ? 'கேட்கிறேன்' : currentLang === 'te' ? 'వింటున్నాము' : currentLang === 'bn' ? 'শুনছি' : currentLang === 'mr' ? 'ऐकत आहे' : currentLang === 'gu' ? 'સાંભળું છું' : currentLang === 'kn' ? 'ಕೇಳುತ್ತಿದ್ದೇನೆ' : currentLang === 'ml' ? 'കേൾക്കുന്നു' : currentLang === 'pa' ? 'ਸੁਣ ਰਹੇ ਹਾਂ' : 'Listening')
                : isProcessing 
                ? (currentLang === 'en' ? 'Thinking...' : '...') 
                : (currentLang === 'en' ? 'MIC' : currentLang === 'ta' ? 'மைக்' : currentLang === 'te' ? 'మైక్' : currentLang === 'bn' ? 'মাইক' : currentLang === 'gu' ? 'માઇક' : currentLang === 'kn' ? 'ಮೈಕ್' : currentLang === 'ml' ? 'മൈക്ക്' : currentLang === 'pa' ? 'ਮਾਈਕ' : 'माइक')}
            </span>
          </button>

          {/* Voice Prompt Text */}
          <div className="mt-3">
            <p className="text-sm sm:text-base font-bold text-stone-900">
              {isListening ? t.micListening : isProcessing ? t.micProcessing : t.micPrompt}
            </p>
            <p className="text-xs text-stone-500 mt-0.5">
              {currentLang === 'hi' && '(कोई अंग्रेजी नहीं, कोई फॉर्म नहीं • बस बोलिए)'}
              {currentLang === 'ta' && '(ஆங்கிலம் தேவையில்லை, படிவம் இல்லை • பேசுங்கள்)'}
              {currentLang === 'te' && '(ఇంగ్లీష్ అక్కర్లేదు, ఫారాలు లేవు • మాట్లాడండి)'}
              {currentLang === 'bn' && '(কোনো ইংরেজি বা ফর্ম নেই • শুধু বলুন)'}
              {currentLang === 'mr' && '(कोणतेही इंग्रजी किंवा फॉर्म नाही • फक्त बोला)'}
              {currentLang === 'gu' && '(કોઈ અંગ્રેજી નહીં, કોઈ ફોર્મ નહીં • ફક્ત બોલો)'}
              {currentLang === 'kn' && '(ಯಾವುದೇ ಇಂಗ್ಲಿಷ್ ಇಲ್ಲ, ಫಾರ್ಮ್ ಇಲ್ಲ • ಕೇವಲ ಮಾತನಾಡಿ)'}
              {currentLang === 'ml' && '(ഇംഗ്ലീഷോ ഫോമുകളോ വേണ്ട • സംസാരിക്കൂ)'}
              {currentLang === 'pa' && '(ਕੋਈ ਅੰਗਰੇਜ਼ੀ ਨਹੀਂ, ਕੋਈ ਫਾਰਮ ਨਹੀਂ • ਬਸ ਬੋਲੋ)'}
              {currentLang === 'en' && '(No English, no forms • Just speak)'}
            </p>
          </div>
        </div>

        {/* Error or Live Transcript indicator */}
        {transcript && (
          <div className="mt-4 p-3 bg-white rounded-2xl border border-amber-200 shadow-xs max-w-xl mx-auto flex items-center justify-between gap-3 text-left">
            <div className="flex items-center gap-2">
              <span className="text-lg">🗣️</span>
              <div>
                <div className="text-[10px] uppercase font-bold text-stone-500">
                  {currentLang === 'hi' && 'आपकी आवाज:'}
                  {currentLang === 'ta' && 'உங்கள் குரல்:'}
                  {currentLang === 'te' && 'మీ స్వరం:'}
                  {currentLang === 'bn' && 'আপনার কণ্ঠ:'}
                  {currentLang === 'mr' && 'तुमचा आवाज:'}
                  {currentLang === 'gu' && 'તમારો અવાજ:'}
                  {currentLang === 'kn' && 'ನಿಮ್ಮ ಧ್ವನಿ:'}
                  {currentLang === 'ml' && 'നിങ്ങളുടെ ശബ്ദം:'}
                  {currentLang === 'pa' && 'ਤੁਹਾਡੀ ਆਵਾਜ਼:'}
                  {currentLang === 'en' && 'Your Voice:'}
                </div>
                <div className="text-sm font-semibold text-stone-800 italic">"{transcript}"</div>
              </div>
            </div>
            {isProcessing && (
              <span className="text-xs font-semibold text-amber-700 animate-pulse shrink-0">
                {t.processingBadge || '...'}
              </span>
            )}
          </div>
        )}

        {micError && (
          <div className="mt-3 p-2.5 bg-amber-50 rounded-xl border border-amber-300 text-xs font-medium text-amber-900 max-w-md mx-auto">
            {micError}
          </div>
        )}

        {/* Visual 1-Tap Quick Need Queries (Frictionless for zero-tech user) */}
        <div className="mt-8 pt-4 border-t border-stone-200/70">
          <p className="text-xs font-bold text-stone-700 uppercase tracking-wider mb-3">
            {t.quickPromptTitle}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {QUICK_VOICE_QUERIES.map((item) => {
              const label = item.label[currentLang] || item.label.hi;
              return (
                <button
                  key={item.id}
                  onClick={() => handleQuickTrigger(item)}
                  className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white border border-stone-200 hover:border-amber-400 hover:shadow-md hover:bg-amber-50/50 transition text-center cursor-pointer group active:scale-95"
                >
                  <span className="text-3xl mb-1 group-hover:scale-110 transition">
                    {item.emoji}
                  </span>
                  <span className="text-xs font-bold text-stone-800 line-clamp-2 leading-tight">
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
};
