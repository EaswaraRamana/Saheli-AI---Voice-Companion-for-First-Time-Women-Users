import React, { useState } from 'react';
import { X, Copy, Check, Award, Github, Linkedin, Presentation, Terminal, Sparkles, BookOpen } from 'lucide-react';

interface HackathonKitModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HackathonKitModal: React.FC<HackathonKitModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'readme' | 'linkedin' | 'pitch' | 'checklist'>('readme');
  const [copiedType, setCopiedType] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2500);
  };

  const README_CONTENT = `# 🌸 Saheli AI (सहेली) — Voice-First Government Scheme & Skill Companion

> **Event:** PromptWars * HackArena (College Hackathon)  
> **Track:** AI for Social Good / Digital Inclusion  
> **Author:** Individual Participant

---

## 🎯 The Problem Statement
> *"Build an AI tool that helps a first-time woman user — with no English, no tech background, and no one to ask — independently access one essential government service, scheme, or skill resource through voice or simple text in her own language. The tool must require zero prior digital knowledge to use."*

### The Real Human Challenge
Millions of rural and semi-urban women across India and developing regions are eligible for life-changing government benefits (e.g., ₹15,000 Free Sewing Machine Scheme, PM Ujjwala free gas cylinders, Sukanya Samriddhi girl child funds, ₹6,000 maternity transfers, and ₹5 Lakh Ayushman health cards).

However, **94% of them never claim their rightful benefits** due to:
1. **Language Barrier:** Forms and portals are in complex English or bureaucratic jargon.
2. **Zero Digital Knowledge:** Dropdowns, OTPs, captchas, and PDFs create terror of making mistakes.
3. **The Intimidation Factor:** Fear of being turned away, scolded, or asked for bribes by officials.
4. **Unreadable Papers:** Inability to read application receipts, tokens, or SMS notices.

---

## 💡 The Solution: Saheli AI (सहेली)
**Saheli AI** is an ultra-accessible, voice-first companion designed from the ground up for a woman who has never touched a digital form in her life.

### 🌟 5 Key Innovations
1. **🎙️ Zero-Touch Voice Interaction in 10 Regional Languages:**
   Speaks and listens natively in Hindi, Tamil, Telugu, Bengali, Marathi, Gujarati, Kannada, Malayalam, Punjabi, and English. She just taps once and speaks naturally: *"Mujhe silai machine chahiye"* (I need a sewing machine).
2. **🪪 Visual Document Matcher ("अपने कागज पहचानें"):**
   Instead of asking for "KYC documents and proof of identity", Saheli shows visual photos of what an Aadhaar Card, Bank Passbook front page, and Ration Card look like. She can tap each card to hear a 5-second voice explanation.
3. **📄 "Parchaa Padhai" (Snap & Listen Notice Explainer):**
   When she receives a printed receipt or letter from the Panchayat, she snaps a photo. Multimodal **Gemini 3.8 Flash** instantly reads the slip and speaks the status into her ear in plain language.
4. **🗣️ "Officer Voice Token" (The Confidence Card):**
   Generates a dedicated voice message she can simply play directly to the Panchayat Pradhan or Anganwadi worker: *"Respected officer, I am applying for the PM Vishwakarma sewing machine scheme..."*
5. **✨ Safe Practice Simulator ("सुरक्षित अभ्यास"):**
   An empathetic mock roleplay where she can practice answering questions before heading to the government office, building unshakeable confidence.

---

## 🛠️ Architecture & Tech Stack
- **Frontend:** React 19, TypeScript, Tailwind CSS, Lucide Icons, Canvas Confetti
- **AI Engine:** Google GenAI SDK (\`@google/genai\`), Gemini 3.8 Flash (Multimodal Vision & Conversational Reasoning)
- **Voice Pipeline:** Web Speech API for low-latency voice recognition and regional speech synthesis + Server-Side Gemini TTS
- **Backend:** Node.js Express server with Vite middleware integration

---

## 🚀 Quick Local Setup

\`\`\`bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/saheli-ai.git
cd saheli-ai

# 2. Install dependencies
npm install

# 3. Create .env file with your Gemini API key
echo 'GEMINI_API_KEY="your-gemini-api-key-here"' > .env

# 4. Start development server
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🌍 Social Impact & Scalability
- **Empowerment:** Transforms a dependent, fearful first-time user into an independent citizen claiming her constitutional rights.
- **Zero Middlemen:** Prevents exploitation and bribery by local agents.
- **Scalable:** Deployable on low-cost smartphones, Anganwadi tablets, or CSC village kiosks.
`;

  const LINKEDIN_CONTENT = `🚀 Proud to share my solo hackathon project for #PromptWars * #HackArena!

The challenge:
"Build an AI tool that helps a first-time woman user — with no English, no tech background, and no one to ask — independently access one essential government service, scheme, or skill resource in her own language with ZERO digital knowledge."

As an individual participant, I wanted to build something genuinely empathetic and transformative.

Introducing 🌸 Saheli AI (सहेली) — A Voice-First Companion for Zero-Tech Women to Access Life-Changing Government Schemes.

Millions of women in our villages are entitled to schemes like:
🧵 PM Vishwakarma (₹15,000 Free Sewing Machine Toolkit + ₹500/day training)
🪔 PM Ujjwala (Free LPG cylinder & stove)
🪙 Sukanya Samriddhi (8.2% savings for girl child)
💵 PM Matru Vandana (₹6,000 direct maternity aid)
🏥 Ayushman Bharat (₹5 Lakh free health cover)

Yet, complex digital portals and language barriers keep them locked out.

Here is how Saheli AI solves this with Zero Digital Knowledge required:
1️⃣ Voice-First in 10 Indian Languages (Hindi, Tamil, Telugu, Bengali, Marathi, etc.)
2️⃣ Visual Document Matcher: Shows pictures of Aadhaar and Bank passbooks so she can visually verify her papers.
3️⃣ "Parchaa Padhai" (AI Vision OCR): Snaps a photo of any government slip or receipt and reads it aloud in her mother tongue!
4️⃣ "Officer Voice Token": A one-tap audio card she can play directly to the Panchayat officer or Anganwadi worker to overcome fear and hesitation.
5️⃣ Safe Practice Simulator: A judgment-free space to practice speaking before visiting the office.

🛠️ Built with: React 19, TypeScript, Tailwind CSS, Express, and Google Gemini 3.8 Flash via @google/genai SDK.

Huge thanks to our college for hosting #PromptWars #HackArena! Grateful for the learning experience building this end-to-end as an individual.

👉 Check out the demo & repository link in the comments!

#AIForGood #PromptWars #HackArena #GoogleAIStudio #GeminiAPI #WomenEmpowerment #DigitalIndia #Hackathon #WebDevelopment #Accessibility`;

  const PITCH_CONTENT = `🎤 3-MINUTE HACKATHON PITCH SCRIPT (FOR JUDGES)

⏱️ MINUTE 1: THE REAL PROBLEM & PERSONA
"Respected judges, meet Devi. Devi lives in a rural village. She doesn't speak English, has never filled an online form, and has no one at home to ask. She heard on the radio about a government scheme giving a free sewing machine and ₹15,000 to women.
She wants to learn tailoring and feed her family. But when she visits a cyber cafe, she is asked for ₹500 by a middleman, and told she needs 'DBT-enabled KYC credentials'. Confused and humiliated, she walks away.
Our problem statement asked us to build an AI tool that lets someone like Devi access essential schemes independently through voice in her own language, requiring zero digital knowledge.
That is why I built 'Saheli AI'."

⏱️ MINUTE 2: LIVE DEMO OF THE BREAKTHROUGH
1. [Press the Giant Mic button]:
   "I will speak in Hindi just like Devi would: 'Mujhe silai machine chahiye'."
   [Show Saheli recognizing voice, matching PM Vishwakarma, and speaking back in warm sisterly voice: 'Namaste behan! Aapko nayi silai machine ke liye ₹15,000 milenge...']
2. [Show Visual Document Matcher]:
   "Devi doesn't know what 'IFSC code' means. Saheli shows her an exact photo of a Bank Passbook front page and Aadhaar card, with voice explainers."
3. [Show Parchaa Padhai Vision]:
   "When she gets a paper acknowledgment, she snaps a photo. Gemini 3.8 Flash reads it instantly and reassures her: 'Your application is approved!'"
4. [Show Officer Voice Token]:
   "And if she feels shy talking to the officer, she simply taps one button on her phone to speak authoritatively on her behalf."

⏱️ MINUTE 3: ARCHITECTURE & IMPACT
"Saheli AI is built on a full-stack architecture using Google GenAI SDK (Gemini 3.8 Flash), Express, React 19, and Tailwind CSS. It supports 10 regional Indian languages with zero-latency speech synthesis.
Most importantly, it replaces fear with confidence, and eliminates middlemen.
Thank you, judges! I am ready for questions."`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-stone-200">
        
        {/* Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-md p-4 sm:p-5 border-b border-stone-200 flex items-center justify-between z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-600 to-amber-600 text-white flex items-center justify-center font-bold text-lg shadow-md">
              🏆
            </div>
            <div>
              <h3 className="font-black text-lg text-stone-900">
                PromptWars * HackArena Submission Kit
              </h3>
              <p className="text-xs text-stone-500">
                Complete GitHub README, LinkedIn Post & Pitch script for your individual submission
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center cursor-pointer transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-stone-200 px-5 pt-3 gap-2 bg-stone-50/50 overflow-x-auto text-xs font-bold">
          <button
            onClick={() => setActiveTab('readme')}
            className={`pb-3 px-3 flex items-center gap-1.5 border-b-2 transition cursor-pointer ${
              activeTab === 'readme'
                ? 'border-rose-600 text-rose-700 font-black'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <Github className="w-4 h-4" />
            <span>GitHub README.md</span>
          </button>

          <button
            onClick={() => setActiveTab('linkedin')}
            className={`pb-3 px-3 flex items-center gap-1.5 border-b-2 transition cursor-pointer ${
              activeTab === 'linkedin'
                ? 'border-blue-600 text-blue-700 font-black'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <Linkedin className="w-4 h-4" />
            <span>LinkedIn Post Draft</span>
          </button>

          <button
            onClick={() => setActiveTab('pitch')}
            className={`pb-3 px-3 flex items-center gap-1.5 border-b-2 transition cursor-pointer ${
              activeTab === 'pitch'
                ? 'border-amber-600 text-amber-700 font-black'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <Presentation className="w-4 h-4" />
            <span>3-Min Judge Pitch</span>
          </button>

          <button
            onClick={() => setActiveTab('checklist')}
            className={`pb-3 px-3 flex items-center gap-1.5 border-b-2 transition cursor-pointer ${
              activeTab === 'checklist'
                ? 'border-emerald-600 text-emerald-700 font-black'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>Git & Step-by-Step Guide</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-5 sm:p-6">
          
          {/* TAB 1: README.md */}
          {activeTab === 'readme' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-600">
                  Copy this complete Markdown into your GitHub repository's README.md:
                </span>
                <button
                  onClick={() => copyToClipboard(README_CONTENT, 'readme')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs transition cursor-pointer active:scale-95"
                >
                  {copiedType === 'readme' ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy README.md</span>
                    </>
                  )}
                </button>
              </div>

              <pre className="p-4 rounded-2xl bg-stone-900 text-stone-100 text-xs font-mono overflow-x-auto max-h-[50vh] leading-relaxed">
                {README_CONTENT}
              </pre>
            </div>
          )}

          {/* TAB 2: LinkedIn Post */}
          {activeTab === 'linkedin' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-600">
                  Ready-to-publish post formatted for high engagement & recruiter visibility:
                </span>
                <button
                  onClick={() => copyToClipboard(LINKEDIN_CONTENT, 'linkedin')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition cursor-pointer active:scale-95"
                >
                  {copiedType === 'linkedin' ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-300" />
                      <span>Copied Post!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy LinkedIn Post</span>
                    </>
                  )}
                </button>
              </div>

              <div className="p-5 rounded-2xl bg-blue-50/50 border border-blue-200 text-stone-800 text-xs whitespace-pre-wrap leading-relaxed max-h-[50vh] overflow-y-auto">
                {LINKEDIN_CONTENT}
              </div>
            </div>
          )}

          {/* TAB 3: Judge Pitch Script */}
          {activeTab === 'pitch' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-600">
                  Structured 3-Minute presentation script for the live judging round:
                </span>
                <button
                  onClick={() => copyToClipboard(PITCH_CONTENT, 'pitch')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition cursor-pointer active:scale-95"
                >
                  {copiedType === 'pitch' ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-300" />
                      <span>Copied Script!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy Pitch Script</span>
                    </>
                  )}
                </button>
              </div>

              <div className="p-5 rounded-2xl bg-amber-50/60 border border-amber-200 text-stone-900 text-xs whitespace-pre-wrap leading-relaxed max-h-[50vh] overflow-y-auto font-sans">
                {PITCH_CONTENT}
              </div>
            </div>
          )}

          {/* TAB 4: Step-by-Step Individual Roadmap */}
          {activeTab === 'checklist' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 font-bold space-y-1">
                <p className="text-sm">🎯 Your Winning Individual Hackathon Roadmap</p>
                <p className="font-normal text-emerald-800">
                  Follow these 5 simple steps to submit successfully and get recognized!
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200">
                  <h5 className="font-black text-stone-900 text-sm mb-1">
                    Step 1: Test & Verify the Live App
                  </h5>
                  <p className="text-stone-600 leading-relaxed">
                    Test the mic button or click "मुफ्त सिलाई मशीन", toggle documents, test "मेरा पर्चा पढ़ो" (Parchaa Padhai) with the sample slips, and test "अधिकारी को सुनाएं".
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200">
                  <h5 className="font-black text-stone-900 text-sm mb-1">
                    Step 2: Push to GitHub Repository
                  </h5>
                  <div className="bg-stone-900 text-stone-100 p-2.5 rounded-lg font-mono text-[11px] my-1">
                    git init<br />
                    git add .<br />
                    git commit -m "Initial commit: Saheli AI for PromptWars HackArena"<br />
                    git branch -M main<br />
                    git remote add origin https://github.com/YOUR_GITHUB_USERNAME/saheli-ai.git<br />
                    git push -u origin main
                  </div>
                  <p className="text-stone-500">
                    Replace YOUR_GITHUB_USERNAME with your GitHub profile name.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200">
                  <h5 className="font-black text-stone-900 text-sm mb-1">
                    Step 3: Record a 60-Second Video Demo
                  </h5>
                  <p className="text-stone-600 leading-relaxed">
                    Use Loom, OBS, or Windows Game Bar (Win+G) to record a quick 60-second walkthrough: show the voice query, the matched scheme, the document checklist, and the document reader. Upload it as an unlisted YouTube video or attach to LinkedIn.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200">
                  <h5 className="font-black text-stone-900 text-sm mb-1">
                    Step 4: Post on LinkedIn
                  </h5>
                  <p className="text-stone-600 leading-relaxed">
                    Copy the LinkedIn draft from Tab 2, tag your college hackathon page / organizers, attach 1-2 screenshots of the app, and post!
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200">
                  <h5 className="font-black text-stone-900 text-sm mb-1">
                    Step 5: Submit to HackArena Portal
                  </h5>
                  <p className="text-stone-600 leading-relaxed">
                    Fill the college hackathon submission form with your GitHub Repo URL, Live App URL, and brief summary.
                  </p>
                </div>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
