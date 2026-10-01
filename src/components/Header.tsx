import React from 'react';
import { SUPPORTED_LANGUAGES, UI_TRANSLATIONS } from '../data/languages';
import { LanguageCode } from '../types';
import { Volume2, VolumeX, FileSearch, Sparkles, Award } from 'lucide-react';
import { stopCurrentAudio } from '../utils/speech';

interface HeaderProps {
  currentLang: LanguageCode;
  onSelectLang: (lang: LanguageCode) => void;
  isAudioPlaying: boolean;
  onOpenDocReader: () => void;
  onOpenHackathonKit: () => void;
  onOpenPractice: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentLang,
  onSelectLang,
  isAudioPlaying,
  onOpenDocReader,
  onOpenHackathonKit,
  onOpenPractice,
}) => {
  const t = UI_TRANSLATIONS[currentLang] || UI_TRANSLATIONS.hi;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-amber-100 shadow-xs">
      <div className="max-w-6xl mx-auto px-4 py-2.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          
          {/* Logo & Identity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-600 via-rose-500 to-amber-500 flex items-center justify-center text-white shadow-md shadow-rose-500/20 font-bold text-xl">
              {currentLang === 'ta' ? 'ச' : currentLang === 'te' ? 'స' : currentLang === 'bn' ? 'স' : currentLang === 'gu' ? 'સ' : currentLang === 'kn' ? 'ಸ' : currentLang === 'ml' ? 'സ' : currentLang === 'pa' ? 'ਸ' : currentLang === 'en' ? 'S' : 'स'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-stone-900">
                  {t.appTitle}
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                  <Sparkles className="w-3 h-3 mr-1 text-rose-500" />
                  {t.voiceCompanionBadge}
                </span>
              </div>
              <p className="text-[11px] text-stone-500 hidden md:block max-w-sm truncate">
                {t.appSubtitle}
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Scan Paper button */}
            <button
              onClick={onOpenDocReader}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100 font-semibold text-xs transition shadow-xs cursor-pointer active:scale-95"
              title="Upload or scan any government document"
            >
              <FileSearch className="w-4 h-4 text-amber-700" />
              <span>{t.readMyPaper}</span>
            </button>

            {/* Practice Button */}
            <button
              onClick={onOpenPractice}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200 hover:bg-emerald-100 font-semibold text-xs transition shadow-xs cursor-pointer active:scale-95"
              title="Practice talking to government officer"
            >
              <span>{t.practiceMode}</span>
            </button>

            {/* Hackathon & GitHub Kit button */}
            <button
              onClick={onOpenHackathonKit}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 text-white font-bold text-xs hover:opacity-95 shadow-sm shadow-rose-500/30 transition cursor-pointer active:scale-95"
              title="GitHub README, LinkedIn Post & Pitch Kit for PromptWars Hackathon"
            >
              <Award className="w-4 h-4 text-amber-200" />
              <span>Hackathon Kit</span>
            </button>

            {/* Audio playing indicator / stop button */}
            {isAudioPlaying && (
              <button
                onClick={stopCurrentAudio}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-600 text-white font-bold text-xs animate-pulse cursor-pointer"
                title="Stop audio playback"
              >
                <VolumeX className="w-4 h-4" />
                <span className="hidden sm:inline">{t.stopBtn}</span>
              </button>
            )}
          </div>
        </div>

        {/* Multilingual Selector Strip */}
        <div className="mt-2.5 pt-2 border-t border-amber-50 flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          <span className="text-[11px] font-bold text-stone-600 uppercase tracking-wider shrink-0 mr-1">
            {t.languageLabel || 'Language:'}
          </span>
          {SUPPORTED_LANGUAGES.map((lang) => {
            const isSelected = currentLang === lang.code;
            return (
              <button
                key={lang.code}
                onClick={() => onSelectLang(lang.code)}
                className={`shrink-0 px-2.5 py-1 rounded-lg font-medium transition cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-stone-900 text-white shadow-xs font-bold scale-105'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                <span>{lang.nativeName}</span>
                <span className="text-[10px] opacity-75">({lang.name})</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
