import React, { useState } from 'react';
import { Scheme, LanguageCode, RecentConversation } from '../types';
import { UI_TRANSLATIONS } from '../data/languages';
import { SCHEMES_DATA, COMMON_DOCS } from '../data/schemes';
import { getLocalizedStepTitle, getLocalizedStepDesc, getLocalizedSchemeField } from '../data/schemeTranslations';
import { 
  Volume2, 
  VolumeX, 
  CheckCircle, 
  CheckCircle2, 
  MapPin, 
  ShieldCheck, 
  FileCheck2, 
  Sparkles, 
  UserCheck,
  CreditCard,
  Camera,
  FileText,
  Phone,
  HelpCircle,
  Share2,
  History,
  MessageSquare,
  Clock,
  ArrowRight
} from 'lucide-react';
import { playAudioOrSpeak, stopCurrentAudio } from '../utils/speech';
import confetti from 'canvas-confetti';

interface SchemeDetailViewProps {
  scheme: Scheme;
  currentLang: LanguageCode;
  aiExplanation?: string;
  confidenceMessage?: string;
  actionSteps?: string[];
  isAudioPlaying: boolean;
  onAudioStateChange: (playing: boolean) => void;
  onOpenDocReader: () => void;
  recentConversations?: RecentConversation[];
  onSelectRecentConversation?: (conversation: RecentConversation) => void;
}

export const SchemeDetailView: React.FC<SchemeDetailViewProps> = ({
  scheme,
  currentLang,
  aiExplanation,
  confidenceMessage,
  actionSteps,
  isAudioPlaying,
  onAudioStateChange,
  onOpenDocReader,
  recentConversations = [],
  onSelectRecentConversation,
}) => {
  const [checkedDocs, setCheckedDocs] = useState<Record<string, boolean>>({});
  const [playingDocId, setPlayingDocId] = useState<string | null>(null);
  const [isOfficerVoicePlaying, setIsOfficerVoicePlaying] = useState(false);
  const [playingConvId, setPlayingConvId] = useState<string | null>(null);

  const t = UI_TRANSLATIONS[currentLang] || UI_TRANSLATIONS.hi;

  const title = scheme.title[currentLang] || scheme.title.hi || scheme.title.en;
  const benefitBadge = getLocalizedSchemeField(scheme.id, 'benefitBadge', currentLang, scheme.benefitBadge[currentLang] || scheme.benefitBadge.hi);
  const benefits = getLocalizedSchemeField(scheme.id, 'benefits', currentLang, scheme.benefits[currentLang] || scheme.benefits.hi);
  const eligibility = getLocalizedSchemeField(scheme.id, 'eligibility', currentLang, scheme.eligibility[currentLang] || scheme.eligibility.hi);
  const whereToGo = getLocalizedSchemeField(scheme.id, 'whereToGo', currentLang, scheme.whereToGo[currentLang] || scheme.whereToGo.hi);
  const officerScript = getLocalizedSchemeField(scheme.id, 'officerVoiceScript', currentLang, scheme.officerVoiceScript[currentLang] || scheme.officerVoiceScript.hi || scheme.officerVoiceScript.en);

  const totalDocs = scheme.visualDocuments.length;
  const completedDocs = Object.values(checkedDocs).filter(Boolean).length;
  const allDocsReady = totalDocs > 0 && completedDocs === totalDocs;

  const getDocTitle = (doc: typeof scheme.visualDocuments[0]) => {
    if (COMMON_DOCS[doc.id]?.name) {
      return COMMON_DOCS[doc.id].name[currentLang] || COMMON_DOCS[doc.id].name.hi || COMMON_DOCS[doc.id].name.en;
    }
    if (typeof doc.name === 'object' && doc.name !== null) {
      return (doc.name as any)[currentLang] || (doc.name as any).hi || (doc.name as any).en || '';
    }
    return doc.name as string;
  };

  const getDocDesc = (doc: typeof scheme.visualDocuments[0]) => {
    if (COMMON_DOCS[doc.id]?.description) {
      return COMMON_DOCS[doc.id].description[currentLang] || COMMON_DOCS[doc.id].description.hi || COMMON_DOCS[doc.id].description.en;
    }
    if (typeof doc.description === 'object' && doc.description !== null) {
      return (doc.description as any)[currentLang] || (doc.description as any).hi || (doc.description as any).en || '';
    }
    return doc.description as string;
  };

  const handleToggleDocCheck = (docId: string) => {
    const updated = { ...checkedDocs, [docId]: !checkedDocs[docId] };
    setCheckedDocs(updated);

    const count = Object.values(updated).filter(Boolean).length;
    if (count === totalDocs) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#e11d48', '#f59e0b', '#10b981'],
      });
      playAudioOrSpeak(
        t.allDocsReadyPraise,
        currentLang,
        () => onAudioStateChange(true),
        () => onAudioStateChange(false)
      );
    }
  };

  const handlePlayDocAudio = (doc: typeof scheme.visualDocuments[0]) => {
    const text = doc.audioExplanation[currentLang] || doc.audioExplanation.hi || getDocDesc(doc);
    setPlayingDocId(doc.id);
    playAudioOrSpeak(
      text,
      currentLang,
      () => {
        onAudioStateChange(true);
        setPlayingDocId(doc.id);
      },
      () => {
        onAudioStateChange(false);
        setPlayingDocId(null);
      }
    );
  };

  const handlePlayMainExplanation = () => {
    const speechText = aiExplanation || `${title}. ${benefits}. ${whereToGo}`;
    playAudioOrSpeak(
      speechText,
      currentLang,
      () => onAudioStateChange(true),
      () => onAudioStateChange(false)
    );
  };

  const handlePlayOfficerVoice = () => {
    setIsOfficerVoicePlaying(true);
    playAudioOrSpeak(
      officerScript,
      currentLang,
      () => {
        onAudioStateChange(true);
        setIsOfficerVoicePlaying(true);
      },
      () => {
        onAudioStateChange(false);
        setIsOfficerVoicePlaying(false);
      }
    );
  };

  const handlePlayConversationAudio = (conv: RecentConversation) => {
    stopCurrentAudio();
    setPlayingConvId(conv.id);
    playAudioOrSpeak(
      conv.aiResponse,
      currentLang,
      () => {
        onAudioStateChange(true);
        setPlayingConvId(conv.id);
      },
      () => {
        onAudioStateChange(false);
        setPlayingConvId(null);
      }
    );
  };

  const getDocIcon = (iconType: string) => {
    switch (iconType) {
      case 'id-card':
        return <CreditCard className="w-6 h-6 text-rose-600" />;
      case 'wallet':
        return <FileCheck2 className="w-6 h-6 text-emerald-600" />;
      case 'camera':
        return <Camera className="w-6 h-6 text-amber-600" />;
      case 'phone':
        return <Phone className="w-6 h-6 text-blue-600" />;
      default:
        return <FileText className="w-6 h-6 text-purple-600" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 pb-16 space-y-6">
      
      {/* Main Scheme Hero Banner */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-amber-200/80 shadow-md relative overflow-hidden">
        
        {/* Decorative corner accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-200/40 to-rose-200/20 rounded-bl-full pointer-events-none" />

        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <span className="inline-flex items-center px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-rose-600 text-white shadow-xs">
            {benefitBadge}
          </span>
          
          <button
            onClick={handlePlayMainExplanation}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl font-bold text-xs sm:text-sm transition shadow-sm cursor-pointer ${
              isAudioPlaying && !isOfficerVoicePlaying && !playingDocId
                ? 'bg-rose-700 text-white animate-pulse'
                : 'bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white'
            }`}
          >
            <Volume2 className="w-4 h-4" />
            <span>{isAudioPlaying && !isOfficerVoicePlaying && !playingDocId ? t.stopAudio : t.listenNow}</span>
          </button>
        </div>

        <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-stone-900 leading-snug">
          {title}
        </h2>

        {/* Personalized AI Empathetic Voice Message if present */}
        {aiExplanation && (
          <div className="mt-4 p-4 rounded-2xl bg-amber-50/90 border border-amber-200 flex items-start gap-3 text-stone-800 text-sm sm:text-base leading-relaxed">
            <span className="text-2xl shrink-0">🌸</span>
            <div>
              <p className="font-semibold text-rose-900 mb-1">
                {t.saheliAdvice}
              </p>
              <p className="font-medium text-stone-800">
                "{aiExplanation}"
              </p>
              {confidenceMessage && (
                <p className="text-xs font-bold text-emerald-800 mt-2 bg-emerald-100/70 inline-block px-2.5 py-1 rounded-lg">
                  ✨ {confidenceMessage}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Core Direct Benefits */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200">
            <h4 className="text-xs font-black uppercase tracking-wider text-rose-900 mb-1.5 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              {t.benefitsTitle}
            </h4>
            <p className="text-sm font-semibold text-stone-800 leading-relaxed">
              {benefits}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200">
            <h4 className="text-xs font-black uppercase tracking-wider text-amber-900 mb-1.5 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              {t.whoCanApply}
            </h4>
            <p className="text-sm font-medium text-stone-700 leading-relaxed">
              {eligibility}
            </p>
          </div>
        </div>

      </div>

      {/* Visual Document Checklist ("अपने कागज पहचानें") */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-stone-200 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-lg sm:text-xl font-black text-stone-900 flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-rose-600" />
              {t.documentsNeeded}
            </h3>
            <p className="text-xs text-stone-500">
              {t.docSubtitle}
            </p>
          </div>

          {/* Progress Pill */}
          <div className="px-3 py-1 rounded-xl bg-amber-100 text-amber-900 font-extrabold text-xs">
            {completedDocs} / {totalDocs} {t.readySuffix}
          </div>
        </div>

        {/* Document Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {scheme.visualDocuments.map((doc) => {
            const isChecked = !!checkedDocs[doc.id];
            const isPlayingThis = playingDocId === doc.id;

            return (
              <div
                key={doc.id}
                className={`p-4 rounded-2xl border transition relative flex flex-col justify-between ${
                  isChecked
                    ? 'bg-emerald-50/60 border-emerald-300 shadow-xs'
                    : 'bg-stone-50/70 border-stone-200 hover:border-amber-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white border border-stone-200 shadow-2xs flex items-center justify-center shrink-0">
                    {getDocIcon(doc.icon)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-extrabold text-sm text-stone-900 leading-snug">
                      {getDocTitle(doc)}
                    </h4>
                    <p className="text-xs text-stone-600 mt-0.5 line-clamp-2">
                      {getDocDesc(doc)}
                    </p>
                  </div>
                </div>

                {/* Document Action Buttons */}
                <div className="mt-3 pt-3 border-t border-stone-200/60 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handlePlayDocAudio(doc)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      isPlayingThis
                        ? 'bg-rose-600 text-white animate-pulse'
                        : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    <Volume2 className="w-3.5 h-3.5 text-rose-500" />
                    <span>{t.listenShort}</span>
                  </button>

                  <button
                    onClick={() => handleToggleDocCheck(doc.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer active:scale-95 ${
                      isChecked
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white text-stone-800 border border-stone-300 hover:border-emerald-500'
                    }`}
                  >
                    {isChecked ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{t.docReady}</span>
                      </>
                    ) : (
                      <>
                        <span className="w-3.5 h-3.5 rounded-full border-2 border-stone-400" />
                        <span>{t.iHaveThis}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {allDocsReady && (
          <div className="mt-4 p-3 bg-emerald-100/80 border border-emerald-300 rounded-2xl flex items-center gap-3 text-emerald-900 text-xs sm:text-sm font-bold">
            <span className="text-2xl">🎉</span>
            <span>{t.readyToVisit}</span>
          </div>
        )}
      </div>

      {/* Officer Voice Card ("अधिकारी को सुनाने वाला आवाज कार्ड") */}
      <div className="bg-gradient-to-br from-rose-900 via-stone-900 to-amber-950 text-white rounded-3xl p-5 sm:p-7 shadow-lg relative overflow-hidden">
        
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase bg-amber-400 text-stone-950">
            <ShieldCheck className="w-4 h-4" />
            {t.officerCardTitle}
          </span>
          <span className="text-xs text-amber-200/80 font-medium">
            {t.hesitationCard}
          </span>
        </div>

        <p className="text-xs sm:text-sm text-stone-300 mb-4 leading-relaxed">
          {t.officerInstruction}
        </p>

        {/* Script preview */}
        <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 mb-4 text-stone-100 text-sm italic font-medium">
          "{officerScript}"
        </div>

        {/* Big play button for officer */}
        <button
          onClick={handlePlayOfficerVoice}
          className={`w-full py-4 px-6 rounded-2xl font-black text-base sm:text-lg flex items-center justify-center gap-3 transition shadow-xl cursor-pointer active:scale-98 ${
            isOfficerVoicePlaying
              ? 'bg-amber-400 text-stone-950 animate-pulse'
              : 'bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950'
          }`}
        >
          <Volume2 className="w-6 h-6" />
          <span>{isOfficerVoicePlaying ? t.officerSpeaking : t.playToOfficer}</span>
        </button>

      </div>

      {/* Where to Go Map / Center Guidance */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-rose-900 mb-1">
              {t.whereToGoTitle}
            </h4>
            <p className="text-sm sm:text-base font-bold text-stone-900">
              {whereToGo}
            </p>
            <p className="text-xs text-stone-500 mt-0.5">
              {t.officeTimings}
            </p>
          </div>
        </div>

        {/* Scan Paper Trigger */}
        <button
          onClick={onOpenDocReader}
          className="shrink-0 w-full sm:w-auto px-4 py-2.5 rounded-2xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 font-bold text-xs transition cursor-pointer"
        >
          {t.readMyPaper} 📄
        </button>
      </div>

      {/* Step by Step 3-Step Simple Guide */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-stone-200 shadow-xs">
        <h3 className="text-base sm:text-lg font-black text-stone-900 mb-4 flex items-center gap-2">
          <span>{t.stepByStep}</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {scheme.stepByStepGuide.map((step) => {
            const rawTitle = step.title[currentLang] || step.title.hi;
            const stepTitle = getLocalizedStepTitle(scheme.id, step.step, currentLang, rawTitle);
            const rawDesc = step.desc[currentLang] || step.desc.hi;
            const stepDesc = getLocalizedStepDesc(scheme.id, step.step, currentLang, rawDesc);
            return (
              <div
                key={step.step}
                className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 relative"
              >
                <div className="w-7 h-7 rounded-full bg-rose-600 text-white font-black text-xs flex items-center justify-center mb-2 shadow-2xs">
                  {step.step}
                </div>
                <h4 className="font-extrabold text-sm text-stone-900 mb-1">
                  {stepTitle}
                </h4>
                <p className="text-xs text-stone-600 leading-relaxed">
                  {stepDesc}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Conversations Section */}
      {recentConversations && recentConversations.length > 0 && (
        <div className="bg-white rounded-3xl p-5 sm:p-7 border border-amber-200/90 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 text-white flex items-center justify-center font-bold shadow-xs">
                <History className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-stone-900 flex items-center gap-2">
                  <span>{t.recentConversations}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-extrabold">
                    {recentConversations.length}
                  </span>
                </h3>
                <p className="text-xs text-stone-500">
                  {t.recentSubtitle}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {recentConversations.map((conv) => {
              const matchedScheme = SCHEMES_DATA.find((s) => s.id === conv.schemeId) || scheme;
              const convTitle = matchedScheme.title[currentLang] || matchedScheme.title.hi;
              const isCurrentActive = scheme.id === conv.schemeId;
              const isPlayingThis = playingConvId === conv.id;

              return (
                <div
                  key={conv.id}
                  className={`p-4 rounded-2xl border transition relative flex flex-col justify-between ${
                    isCurrentActive
                      ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-400/20 shadow-xs'
                      : 'bg-stone-50/80 border-stone-200 hover:border-amber-300 hover:bg-white'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 max-w-[200px] truncate">
                        {convTitle}
                      </span>
                      <span className="text-[10px] text-stone-500 flex items-center gap-1 font-medium">
                        <Clock className="w-3 h-3" />
                        {conv.timestamp}
                      </span>
                    </div>

                    <div className="text-xs font-bold text-stone-900 mb-1 flex items-start gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <span className="italic line-clamp-1">"{conv.userQuery}"</span>
                    </div>

                    <p className="text-[11px] text-stone-600 line-clamp-2 leading-relaxed pl-5">
                      {conv.aiResponse}
                    </p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-stone-200/60 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handlePlayConversationAudio(conv)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                        isPlayingThis
                          ? 'bg-rose-600 text-white animate-pulse'
                          : 'bg-white text-stone-800 border border-stone-300 hover:bg-stone-100'
                      }`}
                      title={t.listenAgain}
                    >
                      <Volume2 className="w-3.5 h-3.5 text-rose-600" />
                      <span>{isPlayingThis ? t.playingNow : t.listenAgain}</span>
                    </button>

                    <button
                      onClick={() => onSelectRecentConversation && onSelectRecentConversation(conv)}
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer active:scale-95 ${
                        isCurrentActive
                          ? 'bg-amber-600 text-white font-black shadow-xs'
                          : 'bg-stone-900 hover:bg-stone-800 text-white'
                      }`}
                    >
                      <span>{isCurrentActive ? t.currentSchemeActive : t.viewScheme}</span>
                      {!isCurrentActive && <ArrowRight className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};
