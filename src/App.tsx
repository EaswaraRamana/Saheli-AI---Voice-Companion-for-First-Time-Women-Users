/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { LanguageCode, Scheme, RecentConversation } from './types';
import { SCHEMES_DATA } from './data/schemes';
import { UI_TRANSLATIONS } from './data/languages';
import { getLocalizedSchemeField } from './data/schemeTranslations';
import { Header } from './components/Header';
import { VoiceAssistantHero } from './components/VoiceAssistantHero';
import { SchemeDetailView } from './components/SchemeDetailView';
import { DocumentReaderModal } from './components/DocumentReaderModal';
import { SafePracticeModal } from './components/SafePracticeModal';
import { HackathonKitModal } from './components/HackathonKitModal';
import { playAudioOrSpeak, stopCurrentAudio } from './utils/speech';
import { Award, FileSearch, Sparkles, Heart } from 'lucide-react';

const getInitialConversation = (lang: LanguageCode): RecentConversation => {
  const scheme = SCHEMES_DATA[0];
  const queryMap: Record<LanguageCode, string> = {
    hi: 'मुफ्त सिलाई मशीन चाहिए',
    ta: 'இலவச தையல் இயந்திரம் வேண்டும்',
    te: 'ఉచిత కుట్టు మిషన్ కావాలి',
    bn: 'বিনামূল্যে সেলাই মেশিন চাই',
    mr: 'मोफत शिलाई मशीन हवी आहे',
    gu: 'મફત સિલાઈ મશીન જોઈએ',
    kn: 'ಉಚಿತ ಹೊಲಿಗೆ ಯಂತ್ರ ಬೇಕು',
    ml: 'സൗജന്യ തയ്യൽ മെഷീൻ വേണം',
    pa: 'ਮੁਫਤ ਸਿਲਾਈ ਮਸ਼ੀਨ ਚਾਹੀਦੀ ਹੈ',
    en: 'Need Free Sewing Machine',
  };
  const timeMap: Record<LanguageCode, string> = {
    hi: 'सत्र शुरू',
    ta: 'அமர்வு தொடங்கியது',
    te: 'సెషన్ ప్రారంభం',
    bn: 'সেশন শুরু',
    mr: 'सत्र सुरू',
    gu: 'સત્ર શરૂ',
    kn: 'ಅಧಿವೇಶನ ಪ್ರಾರಂಭ',
    ml: 'സെഷൻ ആരംഭിച്ചു',
    pa: 'ਸੈਸ਼ਨ ਸ਼ੁਰੂ',
    en: 'Session start',
  };

  return {
    id: 'init-1',
    schemeId: scheme.id,
    userQuery: queryMap[lang] || queryMap.hi,
    aiResponse: getLocalizedSchemeField(scheme.id, 'benefits', lang, scheme.benefits[lang] || scheme.benefits.hi || scheme.benefits.en),
    timestamp: timeMap[lang] || timeMap.hi,
  };
};

export default function App() {
  const [currentLang, setCurrentLang] = useState<LanguageCode>('hi');
  const [selectedScheme, setSelectedScheme] = useState<Scheme>(SCHEMES_DATA[0]);
  const [isAudioPlaying, setIsAudioPlaying] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [activeQuery, setActiveQuery] = useState<string>('');
  const [aiExplanation, setAiExplanation] = useState<string>('');
  const [confidenceMessage, setConfidenceMessage] = useState<string>('');
  const [actionSteps, setActionSteps] = useState<string[]>([]);
  const [recentConversations, setRecentConversations] = useState<RecentConversation[]>(() => {
    try {
      const saved = sessionStorage.getItem('saheli_recent_conversations');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [getInitialConversation('hi')];
  });

  // Modals
  const [isDocReaderOpen, setIsDocReaderOpen] = useState<boolean>(false);
  const [isPracticeOpen, setIsPracticeOpen] = useState<boolean>(false);
  const [isHackathonKitOpen, setIsHackathonKitOpen] = useState<boolean>(false);

  const t = UI_TRANSLATIONS[currentLang] || UI_TRANSLATIONS.hi;

  const handleSelectLanguage = (lang: LanguageCode) => {
    stopCurrentAudio();
    setCurrentLang(lang);
    setIsAudioPlaying(false);
    setAiExplanation('');
    setActiveQuery('');

    // Update initial conversation to the selected language
    setRecentConversations((prev) => {
      return prev.map((c) => {
        if (c.id === 'init-1') {
          return getInitialConversation(lang);
        }
        return c;
      });
    });

    // Warm greeting in new language
    const rawGreeting = selectedScheme.audioGreeting[lang] || selectedScheme.audioGreeting.hi;
    const greeting = getLocalizedSchemeField(selectedScheme.id, 'audioGreeting', lang, rawGreeting);
    if (greeting) {
      playAudioOrSpeak(
        greeting,
        lang,
        () => setIsAudioPlaying(true),
        () => setIsAudioPlaying(false)
      );
    }
  };

  const handleVoiceSearch = async (query: string, targetSchemeId?: string) => {
    setIsProcessing(true);
    setActiveQuery(query);
    stopCurrentAudio();

    try {
      const response = await fetch('/api/saheli/voice-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          language: currentLang,
          selectedSchemeId: targetSchemeId,
        }),
      });

      const resData = await response.json();
      if (resData.success && resData.data) {
        const { spokenResponse, confidenceMessage: confMsg, actionSteps: steps, scheme } = resData.data;

        setAiExplanation(spokenResponse);
        setConfidenceMessage(confMsg);
        if (steps) setActionSteps(steps);

        const matched = scheme
          ? SCHEMES_DATA.find((s) => s.id === scheme.id) || SCHEMES_DATA[0]
          : SCHEMES_DATA[0];
        setSelectedScheme(matched);

        // Record in Recent Conversations
        const newRecord: RecentConversation = {
          id: Date.now().toString(),
          schemeId: matched.id,
          userQuery: query,
          aiResponse: spokenResponse,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setRecentConversations((prev) => {
          const filtered = prev.filter((c) => c.userQuery !== query);
          const updated = [newRecord, ...filtered].slice(0, 8);
          try {
            sessionStorage.setItem('saheli_recent_conversations', JSON.stringify(updated));
          } catch (e) {}
          return updated;
        });

        // Speak the AI response out loud warmly to the user
        playAudioOrSpeak(
          spokenResponse,
          currentLang,
          () => setIsAudioPlaying(true),
          () => setIsAudioPlaying(false)
        );
      } else {
        throw new Error(resData.error || 'Failed to process voice query');
      }
    } catch (err: any) {
      console.warn('Voice search fallback:', err);
      // Seamless graceful fallback
      let target = SCHEMES_DATA[0];
      if (targetSchemeId) {
        target = SCHEMES_DATA.find((s) => s.id === targetSchemeId) || SCHEMES_DATA[0];
      } else {
        const q = (query || '').toLowerCase();
        if (
          q.includes('தையல்') || q.includes('இயந்திரம்') || q.includes('కుట్టు') || q.includes('మిషన్') ||
          q.includes('सिलाई') || q.includes('दर्जी') || q.includes('sewing') || q.includes('tailor') || q.includes('machine')
        ) {
          target = SCHEMES_DATA.find((s) => s.id === 'pm-vishwakarma-tailor') || SCHEMES_DATA[0];
        } else if (
          q.includes('கேஸ்') || q.includes('சிலிண்டர்') || q.includes('గ్యాస్') || q.includes('गैस') ||
          q.includes('gas') || q.includes('cylinder') || q.includes('ujjwala')
        ) {
          target = SCHEMES_DATA.find((s) => s.id === 'pm-ujjwala-gas') || SCHEMES_DATA[0];
        } else if (
          q.includes('மகள்') || q.includes('பெண்') || q.includes('కుమార్తె') || q.includes('बेटी') ||
          q.includes('sukanya') || q.includes('daughter')
        ) {
          target = SCHEMES_DATA.find((s) => s.id === 'sukanya-samriddhi') || SCHEMES_DATA[0];
        } else if (
          q.includes('கடன்') || q.includes('రుణం') || q.includes('ऋण') || q.includes('कर्ज') ||
          q.includes('lakhpati') || q.includes('loan') || q.includes('shg')
        ) {
          target = SCHEMES_DATA.find((s) => s.id === 'lakhpati-didi-shg') || SCHEMES_DATA[0];
        } else if (
          q.includes('கர்ப்பிணி') || q.includes('గర్భిణీ') || q.includes('गर्भवती') ||
          q.includes('matru') || q.includes('maternity') || q.includes('pregnant')
        ) {
          target = SCHEMES_DATA.find((s) => s.id === 'pm-matru-vandana') || SCHEMES_DATA[0];
        } else if (
          q.includes('மருத்துவம்') || q.includes('வைద్యం') || q.includes('इलाज') ||
          q.includes('ayushman') || q.includes('hospital') || q.includes('health')
        ) {
          target = SCHEMES_DATA.find((s) => s.id === 'ayushman-bharat') || SCHEMES_DATA[0];
        }
      }
      setSelectedScheme(target);

      const rawVoice = target.audioGreeting[currentLang] || target.audioGreeting.hi;
      const fallbackVoice = getLocalizedSchemeField(target.id, 'audioGreeting', currentLang, rawVoice);
      setAiExplanation(fallbackVoice);

      const newRecord: RecentConversation = {
        id: Date.now().toString(),
        schemeId: target.id,
        userQuery: query,
        aiResponse: fallbackVoice,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setRecentConversations((prev) => {
        const filtered = prev.filter((c) => c.userQuery !== query);
        const updated = [newRecord, ...filtered].slice(0, 8);
        try {
          sessionStorage.setItem('saheli_recent_conversations', JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });

      playAudioOrSpeak(
        fallbackVoice,
        currentLang,
        () => setIsAudioPlaying(true),
        () => setIsAudioPlaying(false)
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSelectRecentConversation = (conv: RecentConversation) => {
    stopCurrentAudio();
    const matched = SCHEMES_DATA.find((s) => s.id === conv.schemeId) || SCHEMES_DATA[0];
    setSelectedScheme(matched);
    setAiExplanation(conv.aiResponse);
    setActiveQuery(conv.userQuery);

    playAudioOrSpeak(
      conv.aiResponse,
      currentLang,
      () => setIsAudioPlaying(true),
      () => setIsAudioPlaying(false)
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#faf7f2] text-stone-900 selection:bg-rose-500 selection:text-white">
      
      {/* Header with Language selector & quick tool triggers */}
      <Header
        currentLang={currentLang}
        onSelectLang={handleSelectLanguage}
        isAudioPlaying={isAudioPlaying}
        onOpenDocReader={() => setIsDocReaderOpen(true)}
        onOpenHackathonKit={() => setIsHackathonKitOpen(true)}
        onOpenPractice={() => setIsPracticeOpen(true)}
      />

      {/* Hero with Giant Voice Mic and 1-tap visual need buttons */}
      <VoiceAssistantHero
        currentLang={currentLang}
        onVoiceSearch={handleVoiceSearch}
        isProcessing={isProcessing}
        activeQuery={activeQuery}
      />

      {/* Main Scheme View with Visual Document Matcher & Officer Voice Token */}
      <main className="flex-1">
        <SchemeDetailView
          scheme={selectedScheme}
          currentLang={currentLang}
          aiExplanation={aiExplanation}
          confidenceMessage={confidenceMessage}
          actionSteps={actionSteps}
          isAudioPlaying={isAudioPlaying}
          onAudioStateChange={setIsAudioPlaying}
          onOpenDocReader={() => setIsDocReaderOpen(true)}
          recentConversations={recentConversations}
          onSelectRecentConversation={handleSelectRecentConversation}
        />
      </main>

      {/* Floating Mobile Quick Action Bar */}
      <div className="fixed bottom-4 left-4 right-4 z-30 flex items-center justify-center gap-2 max-w-md mx-auto sm:hidden">
        <button
          onClick={() => setIsDocReaderOpen(true)}
          className="flex-1 py-3 px-4 rounded-2xl bg-stone-900 text-white font-extrabold text-xs shadow-lg flex items-center justify-center gap-2 border border-stone-800"
        >
          <FileSearch className="w-4 h-4 text-amber-400" />
          <span>{t.readMyPaper}</span>
        </button>

        <button
          onClick={() => setIsHackathonKitOpen(true)}
          className="py-3 px-4 rounded-2xl bg-gradient-to-r from-rose-600 to-amber-600 text-white font-extrabold text-xs shadow-lg flex items-center justify-center gap-1.5"
        >
          <Award className="w-4 h-4 text-amber-200" />
          <span>Hackathon Kit</span>
        </button>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-stone-200/80 py-8 px-4 text-center text-xs text-stone-500 space-y-2">
        <div className="flex items-center justify-center gap-2 font-bold text-stone-700">
          <span>{t.appTitle}</span>
          <span>•</span>
          <span>PromptWars * HackArena Hackathon Edition</span>
        </div>
        <p className="max-w-xl mx-auto text-stone-500 leading-relaxed">
          Designed with deep empathy for first-time women users with no English, no tech background, and zero digital knowledge. 100% Free Government Awareness Initiative.
        </p>
        <div className="pt-2 text-[11px] text-stone-600 flex items-center justify-center gap-1">
          <span>Crafted with</span>
          <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
          <span>using Google Gemini 3.8 Flash & Web Speech API</span>
        </div>
      </footer>

      {/* Modals */}
      <DocumentReaderModal
        isOpen={isDocReaderOpen}
        onClose={() => setIsDocReaderOpen(false)}
        currentLang={currentLang}
        onAudioStateChange={setIsAudioPlaying}
      />

      <SafePracticeModal
        isOpen={isPracticeOpen}
        onClose={() => setIsPracticeOpen(false)}
        currentLang={currentLang}
        onAudioStateChange={setIsAudioPlaying}
      />

      <HackathonKitModal
        isOpen={isHackathonKitOpen}
        onClose={() => setIsHackathonKitOpen(false)}
      />

    </div>
  );
}
