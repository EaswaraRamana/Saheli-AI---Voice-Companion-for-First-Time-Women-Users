import React, { useState, useEffect } from 'react';
import { X, Mic, Volume2, Sparkles, CheckCircle2, MessageSquare } from 'lucide-react';
import { LanguageCode } from '../types';
import { UI_TRANSLATIONS } from '../data/languages';
import { playAudioOrSpeak, stopCurrentAudio, startVoiceListeningSession, VoiceSessionController } from '../utils/speech';

interface SafePracticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLang: LanguageCode;
  onAudioStateChange: (playing: boolean) => void;
}

const PRACTICE_DATA: Record<LanguageCode, { q1: string; a1: string; q2: string; a2: string; praise: string }> = {
  hi: {
    q1: 'नमस्ते बहन! आप किस योजना के काम से आई हैं और आपका क्या नाम है?',
    a1: 'मेरा नाम राधा है। मैं सिलाई मशीन योजना का फॉर्म भरने आई हूं।',
    q2: 'बहुत अच्छा! क्या आपके पास आपका आधार कार्ड और बैंक पासबुक साथ में है?',
    a2: 'हाँ साहब, मेरे पास मेरा आधार कार्ड और बैंक पासबुक दोनों तैयार हैं।',
    praise: 'शाबाश बहन! आपने बहुत ही सुंदर और आत्मविश्वास से बोला। अधिकारी आपकी बात तुरंत समझ जाएंगे!',
  },
  ta: {
    q1: 'வணக்கம் சகோதரி! நீங்கள் எந்த திட்டத்திற்காக வந்துள்ளீர்கள், உங்கள் பெயர் என்ன?',
    a1: 'என் பெயர் ராதா. நான் தையல் இயந்திர உதவி திட்டத்தில் விண்ணப்பிக்க வந்துள்ளேன்.',
    q2: 'மிக நன்று! உங்களிடம் ஆதார் அட்டை மற்றும் வங்கி பாஸ்புக் உள்ளதா?',
    a2: 'ஆம் ஐயா, என்னிடம் ஆதார் அட்டை மற்றும் வங்கி புத்தகம் இரண்டும் தயாராக உள்ளன.',
    praise: 'அற்புதம் சகோதரி! நீங்கள் மிக தெளிவாகவும் தைரியமாகவும் பேசினீர்கள். அதிகாரி எளிதாக உங்களுக்கு உதவுவார்!',
  },
  te: {
    q1: 'నమస్కారం సోదరి! మీరు ఏ పథకం కోసం వచ్చారు, మీ పేరేంటి?',
    a1: 'నా పేరు రాధ. నేను ఉచిత కుట్టు మిషన్ పథకం కోసం దరఖాస్తు చేసుకోవడానికి వచ్చాను.',
    q2: 'చాలా మంచిది! మీ వద్ద ఆధార్ కార్డు మరియు బ్యాంక్ పాస్‌బుక్ ఉన్నాయా?',
    a2: 'అవును సార్, నా ఆధార్ మరియు బ్యాంక్ పాస్‌బుక్ రెండూ సిద్ధంగా ఉన్నాయి.',
    praise: 'అద్భుతం సోదరి! మీరు చాలా స్పష్టంగా మరియు ఆత్మవిశ్వాసంతో మాట్లాడారు!',
  },
  bn: {
    q1: 'নমস্কার দিদি! আপনি কোন প্রকল্পের জন্য এসেছেন এবং আপনার নাম কী?',
    a1: 'আমার নাম রাধা। আমি সেলাই মেশিন যোজনার ফর্ম পূরণ করতে এসেছি।',
    q2: 'খুব ভালো! আপনার কাছে কি আধার কার্ড এবং ব্যাংক বই সাথে আছে?',
    a2: 'হ্যাঁ স্যার, আমার আধার এবং ব্যাংক বই প্রস্তুত আছে।',
    praise: 'সাবাশ দিদি! আপনি খুব সুন্দর ও আত্মবিশ্বাসের সাথে বললেন।',
  },
  mr: {
    q1: 'नमस्ते ताई! आपण कोणत्या योजनेसाठी आला आहात आणि आपले नाव काय?',
    a1: 'माझे नाव राधा आहे. मी शिलाई मशीन योजनेचा फॉर्म भरण्यासाठी आले आहे.',
    q2: 'खूप छान! आपल्याकडे आधार कार्ड आणि बँक पासबुक सोबत आहे का?',
    a2: 'होय साहेब, माझ्याजवळ आधार कार्ड आणि बँक पासबुक दोन्ही तयार आहेत.',
    praise: 'छान ताई! आपण खूप चांगल्या आत्मविश्वासाने बोललात!',
  },
  gu: {
    q1: 'નમસ્તે બહેન! તમે કઈ યોજના માટે આવ્યા છો અને તમારું નામ શું છે?',
    a1: 'મારું નામ રાધા છે. હું સિલાઈ મશીન યોજનાનું ફોર્મ ભરવા આવી છું.',
    q2: 'ખૂબ સરસ! તમારી પાસે આધાર કાર્ડ અને બેંક પાસબુક સાથે છે?',
    a2: 'હા સાહેબ, મારી પાસે આધાર કાર્ડ અને બેંક પાસબુક બંને તૈયાર છે.',
    praise: 'ખૂબ સરસ બહેન! તમે ખૂબ જ આત્મવિશ્વાસથી બોલ્યા.',
  },
  kn: {
    q1: 'ನಮಸ್ಕಾರ ಅಕ್ಕ! ನೀವು ಯಾವ ಯೋಜನೆಗಾಗಿ ಬಂದಿದ್ದೀರಿ ಮತ್ತು ನಿಮ್ಮ ಹೆಸರೇನು?',
    a1: 'ನನ್ನ ಹೆಸರು ರಾಧಾ. ನಾನು ಹೊಲಿಗೆ ಯಂತ್ರ ಯೋಜನೆಗೆ ಅರ್ಜಿ ಸಲ್ಲಿಸಲು ಬಂದಿದ್ದೇನೆ.',
    q2: 'ತುಂಬಾ ಒಳ್ಳೆಯದು! ನಿಮ್ಮ ಬಳಿ ಆಧಾರ್ ಕಾರ್ಡ್ ಮತ್ತು ಬ್ಯಾಂಕ್ ಪಾಸ್‌ಬುಕ್ ಇದೆಯೇ?',
    a2: 'ಹೌದು ಸರ್, ನನ್ನ ಬಳಿ ಆಧಾರ್ ಕಾರ್ಡ್ ಮತ್ತು ಬ್ಯಾಂಕ್ ಪಾಸ್‌ಬುಕ್ ಎರಡೂ ಸಿದ್ಧವಾಗಿವೆ.',
    praise: 'ಉತ್ತಮ ಅಕ್ಕ! ನೀವು ಬಹಳ ಆತ್ಮವಿಶ್ವಾಸದಿಂದ ಮಾತನಾಡಿದ್ದೀರಿ!',
  },
  ml: {
    q1: 'നമസ്കാരം സഹോദരി! നിങ്ങൾ ഏത് പദ്ധതിക്കാണ് വന്നത്, നിങ്ങളുടെ പേരെന്താണ്?',
    a1: 'എന്റെ പേര് രാധ. തയ്യൽ മെഷീൻ പദ്ധതിക്കായി അപേക്ഷിക്കാനാണ് വന്നത്.',
    q2: 'വളരെ നല്ലത്! നിങ്ങളുടെ പക്കൽ ആധാർ കാർഡും ബാങ്ക് പാസ്ബുക്കും ഉണ്ടോ?',
    a2: 'അതെ സാർ, എന്റെ പക്കൽ ആധാറും ബാങ്ക് പാസ്ബുക്കും തയ്യാറാണ്.',
    praise: 'വളരെ നന്ന് സഹോദരി! നിങ്ങൾ വളരെ വ്യക്തമായി സംസാരിച്ചു.',
  },
  pa: {
    q1: 'ਸਤਿ ਸ਼੍ਰੀ ਅਕਾਲ ਭੈਣ ਜੀ! ਤੁਸੀਂ ਕਿਸ ਸਕੀਮ ਲਈ ਆਏ ਹੋ ਅਤੇ ਤੁਹਾਡਾ ਕੀ ਨਾਮ ਹੈ?',
    a1: 'ਮੇਰਾ ਨਾਮ ਰਾਧਾ ਹੈ। ਮੈਂ ਸਿਲਾਈ ਮਸ਼ੀਨ ਸਕੀਮ ਦਾ ਫਾਰਮ ਭਰਨ ਆਈ ਹਾਂ।',
    q2: 'ਬਹੁਤ ਵਧੀਆ! ਕੀ ਤੁਹਾਡੇ ਕੋਲ ਆਧਾਰ ਕਾਰਡ ਅਤੇ ਬੈਂਕ ਪਾਸਬੁੱਕ ਹੈ?',
    a2: 'ਹਾਂਜੀ ਸਰ, ਮੇਰੇ ਕੋਲ ਆਧਾਰ ਕਾਰਡ ਅਤੇ ਬੈਂਕ ਪਾਸਬੁੱਕ ਦੋਵੇਂ ਤਿਆਰ ਹਨ।',
    praise: 'ਸ਼ਾਬਾਸ਼ ਭੈਣ ਜੀ! ਤੁਸੀਂ ਬਹੁਤ ਵਧੀਆ ਅਤੇ ਆਤਮਵਿਸ਼ਵਾਸ ਨਾਲ ਬੋਲੇ।',
  },
  en: {
    q1: 'Hello sister! Which scheme do you wish to apply for, and what is your name?',
    a1: 'My name is Radha. I have come to apply for the sewing machine scheme.',
    q2: 'Very good! Do you have your Aadhaar card and Bank passbook with you?',
    a2: 'Yes officer, I have both my Aadhaar card and Bank passbook ready.',
    praise: 'Wonderful sister! You spoke with great clarity and confidence. The officer will easily assist you!',
  },
};

export const SafePracticeModal: React.FC<SafePracticeModalProps> = ({
  isOpen,
  onClose,
  currentLang,
  onAudioStateChange,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [userSpokenText, setUserSpokenText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [activeSession, setActiveSession] = useState<VoiceSessionController | null>(null);

  const t = UI_TRANSLATIONS[currentLang] || UI_TRANSLATIONS.hi;
  const pData = PRACTICE_DATA[currentLang] || PRACTICE_DATA.hi;

  useEffect(() => {
    return () => {
      if (activeSession) {
        try {
          activeSession.stop();
        } catch (e) {}
      }
      stopCurrentAudio();
    };
  }, []);

  if (!isOpen) return null;

  const handleClose = () => {
    if (activeSession) {
      try {
        activeSession.stop();
      } catch (e) {}
      setActiveSession(null);
    }
    stopCurrentAudio();
    onClose();
  };

  const practiceSteps = [
    {
      officerQuestion: pData.q1,
      sampleAnswer: pData.a1,
      audioText: pData.q1,
    },
    {
      officerQuestion: pData.q2,
      sampleAnswer: pData.a2,
      audioText: pData.q2,
    },
  ];

  const currentScenario = practiceSteps[currentStep] || practiceSteps[0];

  const handlePlayOfficerVoice = () => {
    playAudioOrSpeak(
      currentScenario.audioText,
      currentLang,
      () => onAudioStateChange(true),
      () => onAudioStateChange(false)
    );
  };

  const handleStartSpeaking = async () => {
    stopCurrentAudio();

    if (isRecording) {
      if (activeSession) {
        try {
          activeSession.stop();
        } catch (e) {}
        setActiveSession(null);
      }
      setIsRecording(false);
      return;
    }

    setIsRecording(true);
    setUserSpokenText('');
    setFeedback(null);

    try {
      const session = await startVoiceListeningSession(
        currentLang,
        (interimText) => {
          setUserSpokenText(interimText);
        },
        (finalText) => {
          setIsRecording(false);
          setActiveSession(null);
          const textToUse = finalText && finalText.trim() ? finalText.trim() : currentScenario.sampleAnswer;
          setUserSpokenText(textToUse);
          giveEncouragingFeedback(textToUse);
        },
        () => {
          setIsRecording(false);
          setActiveSession(null);
          simulateSampleAnswer();
        },
        () => {
          setIsRecording(false);
          setActiveSession(null);
        }
      );
      setActiveSession(session);
    } catch (e) {
      setIsRecording(false);
      setActiveSession(null);
      simulateSampleAnswer();
    }
  };

  const simulateSampleAnswer = () => {
    setUserSpokenText(currentScenario.sampleAnswer);
    giveEncouragingFeedback(currentScenario.sampleAnswer);
  };

  const giveEncouragingFeedback = (spoken: string) => {
    const praise = pData.praise;
    
    setFeedback(praise);
    playAudioOrSpeak(
      praise,
      currentLang,
      () => onAudioStateChange(true),
      () => onAudioStateChange(false)
    );
  };

  const handleNextStep = () => {
    stopCurrentAudio();
    setUserSpokenText('');
    setFeedback(null);
    if (currentStep < practiceSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setCurrentStep(0);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-stone-200">
        
        {/* Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-md p-4 sm:p-5 border-b border-stone-200 flex items-center justify-between z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-lg">
              ✨
            </div>
            <div>
              <h3 className="font-black text-lg text-stone-900">
                {t.practiceMode}
              </h3>
              <p className="text-xs text-stone-500">
                {t.practiceSubtitle || 'Practice before visiting the government office'}
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="w-9 h-9 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center cursor-pointer transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Practice Body */}
        <div className="p-5 sm:p-6 space-y-5">
          
          <div className="flex items-center justify-between text-xs font-bold text-stone-500">
            <span>{t.questionLabel || 'Question'} {currentStep + 1} / {practiceSteps.length}</span>
            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              {t.safeBadge || '100% Safe • Zero Fear'}
            </span>
          </div>

          {/* Officer Question Dialogue */}
          <div className="p-4 rounded-3xl bg-amber-50 border border-amber-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-amber-900 flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4" />
                {t.officerWillAsk || 'The officer will ask you:'}
              </span>
              <button
                onClick={handlePlayOfficerVoice}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-600 text-white font-bold text-xs hover:bg-amber-700 transition cursor-pointer"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>{t.listenShort || 'Listen'}</span>
              </button>
            </div>

            <p className="text-base sm:text-lg font-bold text-stone-900">
              "{currentScenario.officerQuestion}"
            </p>
          </div>

          {/* User's Turn to Speak */}
          <div className="p-5 rounded-3xl border border-stone-200 bg-stone-50 text-center space-y-3">
            <p className="text-xs font-bold text-stone-600 uppercase">
              {t.nowYouAnswer || 'Now speak your answer:'}
            </p>

            <button
              onClick={handleStartSpeaking}
              className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center text-white transition shadow-lg cursor-pointer ${
                isRecording
                  ? 'bg-rose-600 animate-ping'
                  : 'bg-gradient-to-tr from-emerald-600 to-teal-600 hover:scale-105'
              }`}
            >
              <Mic className="w-8 h-8" />
            </button>

            <p className="text-xs font-medium text-stone-500">
              {isRecording ? t.micListening : (t.micInstruction || 'Tap mic to speak')}
            </p>

            {/* Quick Sample Button */}
            <button
              onClick={simulateSampleAnswer}
              className="text-xs text-rose-700 font-semibold underline hover:text-rose-800 cursor-pointer"
            >
              "{currentScenario.sampleAnswer}"
            </button>
          </div>

          {/* User Spoken Transcript & Feedback */}
          {userSpokenText && (
            <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-2xs space-y-2">
              <p className="text-xs font-bold text-stone-500 uppercase">
                {t.youSaid || 'You said:'}
              </p>
              <p className="text-sm font-bold text-stone-800 italic">
                "{userSpokenText}"
              </p>
            </div>
          )}

          {feedback && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-950 text-sm font-bold space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>{feedback}</span>
              </div>
              <button
                onClick={handleNextStep}
                className="mt-2 w-full py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition cursor-pointer"
              >
                {currentStep < practiceSteps.length - 1 ? (t.nextQuestion || 'Practice Next Question →') : (t.practiceCompleted || 'Practice Completed! 🎉')}
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
