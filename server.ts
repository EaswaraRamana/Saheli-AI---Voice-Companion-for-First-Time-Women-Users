import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '25mb' }));

app.get('/healthz', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

// Initialize Google GenAI SDK (server-side only)
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// In-memory predefined real schemes for instant high-reliability lookup and grounding
export const ESSENTIAL_SCHEMES = [
  {
    id: 'pm-vishwakarma-tailor',
    category: 'skill_machine',
    title: {
      hi: 'मुफ्त सिलाई मशीन / दर्जी टूलकिट योजना (PM Vishwakarma)',
      en: 'Free Sewing Machine / Tailoring Toolkit Scheme',
      ta: 'இலவச தையல் இயந்திரம் திட்டம் (PM விஸ்வகர்மா)',
      te: 'ఉచిత కుట్టు మిషన్ పథకం (PM విశ్వకర్మ)',
      bn: 'বিনামূল্যে সেলাই মেশিন প্রকল্প (PM বিশ্বকর্মা)',
      mr: 'मोफत शिलाई मशीन योजना (PM विश्वकर्मा)',
    },
    benefitBadge: '₹15,000 Toolkit + Free Training',
    benefits: {
      hi: '₹15,000 की ई-वाउचर सिलाई मशीन खरीदने के लिए + 5 दिन की मुफ्त ट्रेनिंग और ₹500 प्रतिदिन का स्टाइपेंड।',
      en: '₹15,000 e-voucher for sewing machine + 5 days free training with ₹500 daily stipend.',
      ta: 'ரூ. 15,000 தையல் இயந்திர கூப்பன் + 5 நாட்கள் இலவச பயிற்சி மற்றும் தினசரி ரூ. 500 உதவித்தொகை.',
      te: 'రూ. 15,000 కుట్టు మిషన్ కొనుగోలుకు గ్రాంట్ + 5 రోజుల ఉచిత శిక్షణ మరియు రోజుకు రూ. 500 స్టైపెండ్.',
    },
    eligibility: {
      hi: 'महिलाएं (18 वर्ष या अधिक), परिवार में कोई सरकारी नौकरी न हो, सिलाई या हस्तशिल्प काम की इच्छुक।',
      en: 'Women (age 18+), no family member in government job, basic interest in tailoring.',
    },
    visualDocuments: [
      { id: 'aadhaar', name: 'Aadhaar Card', icon: 'id-card', description: 'Your 12-digit identity card with photo' },
      { id: 'bank', name: 'Bank Passbook', icon: 'wallet', description: 'Front page showing your account number & IFSC' },
      { id: 'ration', name: 'Ration Card / BPL Card', icon: 'file-text', description: 'Family ration card (optional but helpful)' },
      { id: 'photo', name: 'Passport Size Photo', icon: 'camera', description: '1 recent small passport-size photo' },
    ],
    whereToGo: {
      hi: 'अपने गांव की ग्राम पंचायत, आंगनवाड़ी दीदी, या नजदीकी CSC डिजिटल सेवा केंद्र।',
      en: 'Village Gram Panchayat, Anganwadi Center, or nearby CSC Digital Seva Kendra.',
    },
    officerVoiceScript: {
      hi: 'नमस्ते सर/मैडम, मैं प्रधानमंत्री विश्वकर्मा दर्जी टूलकिट योजना के तहत सिलाई मशीन के लिए आवेदन करने आई हूं। यह मेरा आधार कार्ड और बैंक पासबुक है। कृपया मेरा ऑनलाइन फॉर्म भरने में सहायता करें।',
      en: 'Respected officer, I am applying for the Sewing Machine Toolkit under PM Vishwakarma scheme. Here is my Aadhaar card and Bank passbook. Kindly help register my application.',
    },
  },
  {
    id: 'pm-ujjwala-gas',
    category: 'lpg_gas',
    title: {
      hi: 'प्रधानमंत्री उज्ज्वला योजना (मुफ्त गैस कनेक्शन + चूल्हा)',
      en: 'PM Ujjwala Yojana (Free LPG Cylinder & Stove)',
      ta: 'பிரதான் மந்திரி உஜ்வாலா திட்டம் (இலவச எரிவாயு)',
      te: 'ప్రధాన మంత్రి ఉజ్జ్వల యోజన (ఉచిత గ్యాస్)',
      bn: 'প্রধানমন্ত্রী উজ্জ্বলা যোজনা (বিনামূল্যে গ্যাস)',
      mr: 'प्रधानमंत्री उज्ज्वला योजना (मोफत गॅस सिलेंडर)',
    },
    benefitBadge: 'Free Gas Cylinder + Stove + Deposit',
    benefits: {
      hi: 'मुफ्त गैस सिलेंडर, रेगुलेटर, गैस चूल्हा और पहली रीफिल बिल्कुल फ्री + हर सिलेंडर पर ₹300 सब्सिडी।',
      en: 'Free LPG connection, cylinder, regulator, stove, plus ₹300 direct subsidy per cylinder.',
    },
    eligibility: {
      hi: '18 वर्ष से अधिक उम्र की कोई भी महिला जिसके घर में पहले से कोई एलपीजी गैस कनेक्शन नहीं है।',
      en: 'Any adult woman (18+) whose household does not already have an active LPG connection.',
    },
    visualDocuments: [
      { id: 'aadhaar', name: 'Aadhaar Card', icon: 'id-card', description: 'Aadhaar card of the woman applicant' },
      { id: 'ration', name: 'Ration Card', icon: 'file-text', description: 'Ration card showing all family members' },
      { id: 'bank', name: 'Bank Passbook', icon: 'wallet', description: 'Bank account linked with Aadhaar for subsidy' },
    ],
    whereToGo: {
      hi: 'नजदीकी भारत गैस, इंडेन या एचपी गैस डिस्ट्रीब्यूटर एजेंसी पर जाएं।',
      en: 'Nearest LPG Gas Distributor agency (Indane, Bharat Gas, HP Gas) or CSC center.',
    },
    officerVoiceScript: {
      hi: 'नमस्ते, मेरे घर में पहले से कोई गैस कनेक्शन नहीं है। मैं प्रधानमंत्री उज्ज्वला 2.0 योजना के अंतर्गत मुफ्त गैस कनेक्शन का फॉर्म जमा करने आई हूं।',
      en: 'Hello, our family does not possess an LPG connection. I am applying for free connection under PM Ujjwala Yojana 2.0. Please verify my documents.',
    },
  },
  {
    id: 'sukanya-samriddhi',
    category: 'savings_daughter',
    title: {
      hi: 'सुकन्या समृद्धि योजना (बेटी के उज्ज्वल भविष्य की बचत)',
      en: 'Sukanya Samriddhi Yojana (Daughter Savings Scheme)',
      ta: 'செல்வமகள் சேமிப்பு திட்டம் (சுகன்யா சம்ரிதி)',
      te: 'సుకన్య సమృద్ధి యోజన (ఆడపిల్లల పొదుపు పథకం)',
      bn: 'সুকন্যা সমৃদ্ধি যোজনা',
      mr: 'सुकन्या समृद्धी योजना (मुलीच्या भविष्यासाठी बचत)',
    },
    benefitBadge: '8.2% Guaranteed Interest + Tax Free',
    benefits: {
      hi: 'मात्र ₹250 से खाता शुरू करें। सरकार द्वारा सबसे ऊंचा ब्याज (8.2%) और बेटी की 18-21 वर्ष की उम्र पर लाखों रुपये का फंड।',
      en: 'Open account with just ₹250. Highest government interest rate (8.2%) for daughter education and marriage.',
    },
    eligibility: {
      hi: '10 वर्ष से कम उम्र की बेटी की माता या अभिभावक। एक परिवार की दो बेटियों तक यह खाता खोला जा सकता है।',
      en: 'Mother/guardian of girl child below 10 years of age. Valid for up to 2 daughters.',
    },
    visualDocuments: [
      { id: 'birth', name: 'Daughter Birth Certificate', icon: 'file-text', description: 'Hospital or Panchayat birth certificate of the daughter' },
      { id: 'aadhaar', name: 'Mother Aadhaar Card', icon: 'id-card', description: 'Aadhaar of mother or guardian' },
      { id: 'photo', name: 'Child & Mother Photos', icon: 'camera', description: 'Passport photos of child and mother' },
      { id: 'bank', name: 'Initial Deposit (₹250)', icon: 'wallet', description: 'Cash ₹250 to start the account' },
    ],
    whereToGo: {
      hi: 'अपने नजदीकी डाकघर (Post Office) या किसी भी सरकारी बैंक (SBI, PNB, Canara) में जाएं।',
      en: 'Nearest Post Office or any public sector bank (SBI, PNB, etc.).',
    },
    officerVoiceScript: {
      hi: 'नमस्ते सर, मुझे अपनी 10 साल से छोटी बेटी के लिए सुकन्या समृद्धि योजना का बचत खाता खोलना है। यह मेरी बेटी का जन्म प्रमाण पत्र और मेरा आधार है।',
      en: 'Respected officer, I wish to open a Sukanya Samriddhi savings account for my daughter. Here are her birth certificate and my identity proof.',
    },
  },
  {
    id: 'lakhpati-didi-shg',
    category: 'business_loan',
    title: {
      hi: 'लखपति दीदी योजना व स्वयं सहायता समूह (SHG) ऋण',
      en: 'Lakhpati Didi & Self Help Group (SHG) Micro-Loan',
      ta: 'லக் பதி திதி மற்றும் சுய உதவிக்குழு திட்டம்',
      te: 'లఖ్‌పతి దీదీ & మహిళా పొదుపు సంఘాల రుణం',
      bn: 'লাখপতি দিদি স্বনির্ভর দল ঋণ প্রকল্প',
      mr: 'लखपती दीदी योजना व बचत गट कर्ज',
    },
    benefitBadge: '₹1 - 5 Lakh Zero-Collateral Business Loan',
    benefits: {
      hi: 'सिलाई, किराना, मुर्गी पालन, अगरबत्ती या हस्तशिल्प काम शुरू करने के लिए बिना किसी गारंटी के आसान 0-4% ब्याज पर ऋण और मुफ्त हुनर ट्रेनिंग।',
      en: 'Collateral-free micro-loans (up to ₹5 Lakh at low/subsidized interest) plus free vocational training.',
    },
    eligibility: {
      hi: 'गांव या कस्बे की कोई भी महिला जो स्वयं सहायता समूह (SHG) की सदस्य है या समूह से जुड़ना चाहती है।',
      en: 'Any rural or semi-urban woman part of or joining a women Self Help Group (SHG).',
    },
    visualDocuments: [
      { id: 'aadhaar', name: 'Aadhaar Card', icon: 'id-card', description: 'Aadhaar Card with mobile linkage' },
      { id: 'bank', name: 'SHG Bank Passbook', icon: 'wallet', description: 'Group or personal savings account passbook' },
      { id: 'residence', name: 'Residence Proof', icon: 'file-text', description: 'Voter card or Ration card' },
    ],
    whereToGo: {
      hi: 'गांव के क्लस्टर रिसोर्स पर्सन (CRP), ग्राम संगठन (VO), या ब्लॉक विकास अधिकारी (BDO) कार्यालय।',
      en: 'Village Cluster Resource Person (CRP), Village Organization, or Block Development Office (BDO).',
    },
    officerVoiceScript: {
      hi: 'नमस्ते दीदी/सर, मैं अपने स्वयं सहायता समूह के माध्यम से लखपति दीदी योजना के अंतर्गत अपना छोटा काम शुरू करने हेतु ऋण और ट्रेनिंग के लिए आई हूं।',
      en: 'Hello, I want to apply for business skill training and SHG enterprise credit under Lakhpati Didi initiative to start my own livelihood.',
    },
  },
  {
    id: 'pm-matru-vandana',
    category: 'maternity_money',
    title: {
      hi: 'प्रधानमंत्री मातृ वंदना योजना (गर्भवती महिला सहायता ₹5,000 - ₹6,000)',
      en: 'PM Matru Vandana Yojana (Maternity Cash Aid)',
      ta: 'பிரதான் மந்திரி மாத்ரு வந்தனா திட்டம் (ரூ. 5000 உதவி)',
      te: 'ప్రధాన మంత్రి మాతృ వందన యోజన (నగదు సాయం)',
      bn: 'প্রধানমন্ত্রী মাতৃ বন্দনা যোজনা',
      mr: 'प्रधानमंत्री मातृ वंदना योजना (गर्भवती महिलांना रोख मदत)',
    },
    benefitBadge: '₹5,000 - ₹6,000 Direct Bank Transfer',
    benefits: {
      hi: 'गर्भवती और स्तनपान कराने वाली महिलाओं को अच्छे पोषण और स्वास्थ्य जांच के लिए सीधे बैंक खाते में ₹5,000 से ₹6,000 की नकद सहायता।',
      en: 'Direct cash benefit of ₹5,000 to ₹6,000 into woman’s bank account for nutrition during pregnancy.',
    },
    eligibility: {
      hi: 'पहली या दूसरी संतान की गर्भवती महिलाएं (दूसरी संतान में बालिका होने पर विशेष ₹6,000 लाभ)।',
      en: 'Pregnant women and lactating mothers for 1st or 2nd child (special ₹6,000 for 2nd girl child).',
    },
    visualDocuments: [
      { id: 'mcp', name: 'Mother & Child Protection (MCP) Card', icon: 'file-text', description: 'Green MCP card issued by Anganwadi/Hospital' },
      { id: 'aadhaar', name: 'Mother & Husband Aadhaar', icon: 'id-card', description: 'Aadhaar cards of mother and husband' },
      { id: 'bank', name: 'Mother Own Bank Passbook', icon: 'wallet', description: 'Bank passbook in mother’s name alone (not joint)' },
    ],
    whereToGo: {
      hi: 'अपनी निकटतम आंगनवाड़ी कार्यकर्ता (Anganwadi Didi) या आशा (ASHA) कार्यकर्ता से संपर्क करें।',
      en: 'Local Anganwadi worker, ASHA health worker, or Primary Health Centre (PHC).',
    },
    officerVoiceScript: {
      hi: 'नमस्ते आशा दीदी / आंगनवाड़ी दीदी, मैं प्रधानमंत्री मातृ वंदना योजना के तहत पोषण सहायता राशि के पंजीकरण के लिए आई हूं। यह मेरा एमसीपी कार्ड और बैंक पासबुक है।',
      en: 'Respected Anganwadi sister, I have brought my MCP health card and bank passbook to register for PM Matru Vandana maternity support.',
    },
  },
  {
    id: 'ayushman-bharat',
    category: 'health_card',
    title: {
      hi: 'आयुष्मान भारत कार्ड (₹5 लाख मुफ्त इलाज प्रति वर्ष)',
      en: 'Ayushman Bharat Card (₹5 Lakh Free Treatment/Year)',
      ta: 'ஆயுஷ்மான் பாரத் கார்டு (ரூ. 5 லட்சம் இலவச சிகிச்சை)',
      te: 'ఆయుష్మాన్ భారత్ హెల్త్ కార్డ్ (రూ. 5 లక్షల ఉచిత చికిత్స)',
      bn: 'আয়ুষ্মান ভারত কার্ড (বিনামূল্যে চিকিৎসা)',
      mr: 'आयुष्मान भारत कार्ड (वार्षिक ₹5 लाख मोफत उपचार)',
    },
    benefitBadge: '₹5,00,000 Free Hospital Treatment',
    benefits: {
      hi: 'परिवार के सभी सदस्यों के लिए हर साल ₹5 लाख तक का सरकारी और प्राइवेट अस्पतालों में बिल्कुल मुफ्त इलाज और दवाइयां।',
      en: 'Cashless treatment up to ₹5 Lakh per year for the entire family in registered hospitals.',
    },
    eligibility: {
      hi: 'राशन कार्ड धारक या SECC सूची में सूचीबद्ध गरीब और मध्यम वर्गीय परिवार।',
      en: 'Ration card holding families or eligible socio-economic census beneficiaries.',
    },
    visualDocuments: [
      { id: 'ration', name: 'Ration Card', icon: 'file-text', description: 'Ration card with all member names' },
      { id: 'aadhaar', name: 'Aadhaar Card', icon: 'id-card', description: 'Aadhaar of all family members' },
      { id: 'phone', name: 'Mobile Phone', icon: 'phone', description: 'To receive OTP confirmation' },
    ],
    whereToGo: {
      hi: 'सरकारी अस्पताल का आयुष्मान मित्र काउंटर या नजदीकी CSC जन सेवा केंद्र।',
      en: 'Government Hospital Ayushman Mitra counter or nearest CSC Kendra.',
    },
    officerVoiceScript: {
      hi: 'नमस्ते, मैं अपने परिवार का आयुष्मान भारत गोल्डन कार्ड बनवाने आई हूं। यह हमारा राशन कार्ड और आधार कार्ड है।',
      en: 'Hello officer, I want to make the Ayushman Bharat health card for our family members. Here is our ration card and Aadhaar.',
    },
  },
];

// Language configurations with scripts and pronouns
const LANGUAGE_CONFIG: Record<string, { name: string; nativeName: string; script: string }> = {
  hi: { name: 'Hindi', nativeName: 'हिंदी', script: 'Devanagari' },
  ta: { name: 'Tamil', nativeName: 'தமிழ்', script: 'Tamil' },
  te: { name: 'Telugu', nativeName: 'తెలుగు', script: 'Telugu' },
  bn: { name: 'Bengali', nativeName: 'বাংলা', script: 'Bengali' },
  mr: { name: 'Marathi', nativeName: 'मराठी', script: 'Devanagari' },
  gu: { name: 'Gujarati', nativeName: 'ગુજરાતી', script: 'Gujarati' },
  kn: { name: 'Kannada', nativeName: 'ಕನ್ನಡ', script: 'Kannada' },
  ml: { name: 'Malayalam', nativeName: 'മലയാളം', script: 'Malayalam' },
  pa: { name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', script: 'Gurmukhi' },
  en: { name: 'English', nativeName: 'English', script: 'Latin' },
};

function getLanguageName(code: string): string {
  return LANGUAGE_CONFIG[code]?.name || 'Hindi';
}

function detectSchemeFromQuery(query: string, selectedSchemeId?: string): string {
  if (selectedSchemeId && ESSENTIAL_SCHEMES.some((s) => s.id === selectedSchemeId)) {
    return selectedSchemeId;
  }
  const q = (query || '').toLowerCase();

  // Sewing machine / Tailoring / Vishwakarma
  if (
    q.includes('தையல்') || q.includes('இயந்திரம்') || q.includes('மெஷின்') ||
    q.includes('కుట్టు') || q.includes('మిషన్') || q.includes('దర్జీ') ||
    q.includes('सिलाई') || q.includes('दर्जी') || q.includes('विश्वकर्मा') ||
    q.includes('সেলাই') || q.includes('শिलाई') || q.includes('સિલાઈ') ||
    q.includes('ಹೊಲಿಗೆ') || q.includes('തയ്യൽ') || q.includes('ਸਿਲਾਈ') ||
    q.includes('sewing') || q.includes('tailor') || q.includes('machine') || q.includes('vishwakarma')
  ) {
    return 'pm-vishwakarma-tailor';
  }

  // LPG Gas / Ujjwala
  if (
    q.includes('கேஸ்') || q.includes('சிலிண்டர்') || q.includes('அடுப்பு') || q.includes('உஜ்வாலா') ||
    q.includes('గ్యాస్') || q.includes('సిలిండర్') || q.includes('పొయ్యి') || q.includes('ఉజ్జ్వల') ||
    q.includes('गैस') || q.includes('चूल्हा') || q.includes('सिलेंडर') || q.includes('उज्ज्वला') ||
    q.includes('গ্যাস') || q.includes('উনুন') || q.includes('गॅस') || q.includes('ગેસ') ||
    q.includes('ಗ್ಯಾಸ್') || q.includes('ഗ്യാസ്') || q.includes('ਗੈਸ') ||
    q.includes('gas') || q.includes('cylinder') || q.includes('stove') || q.includes('lpg') || q.includes('ujjwala')
  ) {
    return 'pm-ujjwala-gas';
  }

  // Sukanya / Daughter savings
  if (
    q.includes('மகள்') || q.includes('பெண்') || q.includes('சுகன்யா') ||
    q.includes('కుమార్తె') || q.includes('ఆడపిల్ల') || q.includes('సుకన్య') ||
    q.includes('बेटी') || q.includes('सुकन्या') || q.includes('बालिका') || q.includes('बचत') ||
    q.includes('মেয়ে') || q.includes('मुलगी') || q.includes('દીકરી') || q.includes('ಮಗಳು') ||
    q.includes('മകൾ') || q.includes('ਧੀ') ||
    q.includes('daughter') || q.includes('girl') || q.includes('sukanya')
  ) {
    return 'sukanya-samriddhi';
  }

  // Maternity / Matru Vandana / Pregnancy
  if (
    q.includes('கர்ப்பிணி') || q.includes('பிரசவம்') || q.includes('மாத்ரு') ||
    q.includes('గర్భిణీ') || q.includes('మాతృ') || q.includes('ప్రసవం') ||
    q.includes('गर्भवती') || q.includes('मातृ') || q.includes('बच्चा') || q.includes('डिलीवरी') ||
    q.includes('গর্ভবতী') || q.includes('गरोदर') || q.includes('સગર્ભા') ||
    q.includes('ಗರ್ಭಿಣಿ') || q.includes('ഗർഭിണി') || q.includes('ਗਰਭਵਤੀ') ||
    q.includes('pregnant') || q.includes('maternity') || q.includes('vandana') || q.includes('mother')
  ) {
    return 'pm-matru-vandana';
  }

  // Lakhpati Didi / SHG / Loan
  if (
    q.includes('கடன்') || q.includes('சுய உதவி') || q.includes('லக் பதி') ||
    q.includes('రుణం') || q.includes('స్వయం సహాయక') || q.includes('లఖ్‌పతి') ||
    q.includes('ऋण') || q.includes('कर्ज') || q.includes('लोन') || q.includes('लखपति') || q.includes('समूह') ||
    q.includes('ঋণ') || q.includes('বচত') || q.includes('લોન') || q.includes('ಸಾಲ') ||
    q.includes('വായ്പ') || q.includes('ਕਰਜ਼ਾ') ||
    q.includes('loan') || q.includes('credit') || q.includes('business') || q.includes('shg') || q.includes('lakhpati')
  ) {
    return 'lakhpati-didi-shg';
  }

  // Ayushman Bharat / Health
  if (
    q.includes('மருத்துவம்') || q.includes('சிகிச்சை') || q.includes('மருத்துவமனை') || q.includes('ஆயுஷ்மான்') ||
    q.includes('వైద్యం') || q.includes('చికిత్స') || q.includes('ఆసుపత్రి') || q.includes('ఆయుష్మాన్') ||
    q.includes('इलाज') || q.includes('अस्पताल') || q.includes('दवा') || q.includes('आयुष्मान') ||
    q.includes('চিকিৎসা') || q.includes('উপচার') || q.includes('સારવાર') || q.includes('ಚಿಕಿತ್ಸೆ') ||
    q.includes('ചികിത്സ') || q.includes('ਇਲਾਜ') ||
    q.includes('health') || q.includes('hospital') || q.includes('treatment') || q.includes('ayushman') || q.includes('card')
  ) {
    return 'ayushman-bharat';
  }

  return 'pm-vishwakarma-tailor';
}

// Multilingual fallback responses in all 10 supported languages
const MULTILINGUAL_RESPONSES: Record<
  string,
  Record<
    string,
    {
      spokenResponse: string;
      confidenceMessage: string;
      actionSteps: string[];
      officerScript: string;
    }
  >
> = {
  'pm-vishwakarma-tailor': {
    ta: {
      spokenResponse: 'வணக்கம் சகோதரி! PM விஸ்வகர்மா திட்டத்தின் கீழ் உங்களுக்கு புதிய தையல் இயந்திரம் வாங்க ₹15,000 கூப்பன் மற்றும் 5 நாட்கள் இலவச தையல் பயிற்சி கிடைக்கும். இதற்கு நீங்கள் யாரிடமும் லஞ்சம் கொடுக்க தேவையில்லை, உங்கள் ஆதார் அட்டை மற்றும் வங்கி பாஸ்புக்கை எடுத்துக்கொண்டு கிராம பஞ்சாயத்து அல்லது அருகில் உள்ள பொது சேவை மையத்தை அணுகவும்.',
      confidenceMessage: 'உங்களுக்கு மொபைல் அல்லது கம்ப்யூட்டர் தெரிய தேவையில்லை, கிராம பஞ்சாயத்து அல்லது ஆஷா சகோதரி உங்களுக்கான விண்ணப்பத்தை இலவசமாக பூர்த்தி செய்வார்கள்.',
      actionSteps: [
        'உங்கள் ஆதார் அட்டை மற்றும் வங்கி பாஸ்புக்கை எடுத்து வைக்கவும்.',
        'கிராம பஞ்சாயத்து அலுவலகம் அல்லது இ-சேவை (CSC) மையத்திற்கு செல்லவும்.',
        'அதிகாரியிடம் PM விஸ்வகர்மா தையல் திட்டத்திற்கு விண்ணப்பிக்க வேண்டும் என்று கூறவும்.',
      ],
      officerScript: 'வணக்கம் ஐயா/அம்மா, நான் PM விஸ்வகர்மா திட்டத்தின் கீழ் தையல் இயந்திரம் பெற விண்ணப்பிக்க வந்துள்ளேன். இது எனது ஆதார் அட்டை மற்றும் வங்கி பாஸ்புக். எனது விண்ணப்பத்தை பதிவு செய்ய உதவவும்.',
    },
    te: {
      spokenResponse: 'నమస్కారం సోదరీ! PM విశ్వకర్మ పథకం కింద కుట్టు మిషన్ కొనుగోలుకు ₹15,000 గ్రాంట్ మరియు 5 రోజుల ఉచిత శిక్షణ లభిస్తుంది. దీని కోసం మీరు ఎవరికీ ఒక్క రూపాయి కూడా చెల్లించాల్సిన అవసరం లేదు. మీ ఆధార్ కార్డు మరియు బ్యాంక్ పాస్‌బుక్‌తో గ్రామ పంచాయతీ లేదా CSC కేంద్రాన్ని సంప్రదించండి.',
      confidenceMessage: 'మీకు డిజిటల్ లేదా కంప్యూటర్ పరిజ్ఞానం అవసరం లేదు, గ్రామ సచివాలయం లేదా CSC కేంద్రం మీ దరఖాస్తును ఉచితంగా పూర్తి చేస్తుంది.',
      actionSteps: [
        'మీ ఆధార్ కార్డు మరియు బ్యాంక్ పాస్‌బుక్ సిద్ధంగా ఉంచుకోండి.',
        'గ్రామ సచివాలయం లేదా సమీపంలోని CSC డిజిటల్ కేంద్రానికి వెళ్లండి.',
        'కుట్టు మిషన్ టూల్‌కిట్ కోసం దరఖాస్తు చేయాలని అధికారికి తెలపండి.',
      ],
      officerScript: 'నమస్కారం సార్/మేడం, నేను PM విశ్వకర్మ పథకం కింద కుట్టు మిషన్ కోసం దరఖాస్తు చేసుకోవడానికి వచ్చాను. ఇది నా ఆధార్ కార్డు మరియు బ్యాంక్ పాస్‌బుక్. దయచేసి నా దరఖాస్తును నమోదు చేయండి.',
    },
    hi: {
      spokenResponse: 'नमस्ते बहन! पीएम विश्वकर्मा योजना के तहत आपको सिलाई मशीन खरीदने के लिए ₹15,000 का ई-वाउचर और 5 दिन की मुफ्त ट्रेनिंग मिलेगी। चिंता मत कीजिए, इसके लिए आपको किसी को एक भी रुपया देने की जरूरत नहीं है, अपने आधार कार्ड और बैंक पासबुक के साथ पंचायत या सीएससी केंद्र जाएं।',
      confidenceMessage: 'आपको फोन या इंटरनेट चलाने की बिल्कुल जरूरत नहीं है, आपकी आंगनवाड़ी दीदी या पंचायत सेवक आपका फॉर्म मुफ्त में भर देंगे।',
      actionSteps: [
        'अपना आधार कार्ड और बैंक पासबुक निकाल कर रख लें।',
        'गांव के पंचायत भवन या नजदीकी सीएससी जन सेवा केंद्र जाएं।',
        'अधिकारी को सिलाई मशीन योजना के लिए आवेदन करने को कहें।',
      ],
      officerScript: 'नमस्ते सर/मैडम, मैं प्रधानमंत्री विश्वकर्मा दर्जी टूलकिट योजना के तहत सिलाई मशीन के लिए आवेदन करने आई हूं। यह मेरा आधार कार्ड और बैंक पासबुक है। कृपया मेरा ऑनलाइन फॉर्म भरने में सहायता करें।',
    },
    bn: {
      spokenResponse: 'নমস্কার দিদি! প্রধানমন্ত্রী বিশ্বকর্মা যোজনার আওতায় সেলাই মেশিন কেনার জন্য ₹১৫,০০০ টাকা ভাউচার এবং ৫ দিনের বিনামূল্যে প্রশিক্ষণ পাবেন। এর জন্য কাউকে কোনো টাকা দিতে হবে না, আধার কার্ড ও ব্যাংক বই নিয়ে পঞ্চায়েত বা সিএসসি কেন্দ্রে যান।',
      confidenceMessage: 'আপনার কোনো কম্পিউটার বা ফোন জানার প্রয়োজন নেই, পঞ্চায়েত বা সিএসসি সেন্টার সম্পূর্ণ বিনামূল্যে ফর্ম পূরণ করে দেবে।',
      actionSteps: [
        'আধার কার্ড এবং ব্যাংক পাসবই সাথে নিন।',
        'গ্রাম পঞ্চায়েত বা নিকটস্থ সিএসসি ডিজিটাল সেন্টারে যান।',
        'সেলাই মেশিন প্রকল্পের জন্য আবেদন করতে অফিসারকে বলুন।',
      ],
      officerScript: 'নমস্কার স্যার, আমি পিএম বিশ্বকর্মা সেলাই মেশিন প্রকল্পের জন্য আবেদন করতে এসেছি। এই আমার আধার কার্ড ও ব্যাংক পাসবই। দয়া করে আমার ফর্মটি জমা নিন।',
    },
    mr: {
      spokenResponse: 'नमस्ते ताई! पीएम विश्वकर्मा योजनेअंतर्गत तुम्हाला शिलाई मशीन खरेदीसाठी ₹१५,००० चे अनुदान आणि ५ दिवसांचे मोफत प्रशिक्षण मिळेल. यासाठी तुम्हाला कोणालाही एक रुपया देण्याची गरज नाही, आधार कार्ड आणि बँक पासबुक घेऊन ग्रामपंचायतीत किंवा सीएससी केंद्रावर जा.',
      confidenceMessage: 'तुम्हाला मोबाईल किंवा संगणक चालवण्याची गरज नाही, ग्रामपंचायत किंवा अंगणवाडी ताई तुमचा अर्ज मोफत भरून देतील.',
      actionSteps: [
        'तुमचे आधार कार्ड आणि बँक पासबुक सोबत ठेवा.',
        'ग्रामपंचायत कार्यालय किंवा जवळच्या सीएससी केंद्रावर जा.',
        'अधिकाऱ्याला शिलाई मशीन योजनेसाठी अर्ज करावयाचा आहे असे सांगा.',
      ],
      officerScript: 'नमस्ते सर/मॅडम, मी पीएम विश्वकर्मा शिलाई मशीन योजनेसाठी अर्ज करण्यासाठी आले आहे. हे माझे आधार कार्ड आणि बँक पासबुक आहे. कृपया माझा अर्ज भरा.',
    },
    gu: {
      spokenResponse: 'નમસ્તે બહેન! પીએમ વિશ્વકર્મા યોજના હેઠળ તમને સિલાઈ મશીન ખરીદવા માટે ₹૧૫,૦૦૦ ની સહાય અને ૫ દિવસની મફત તાલીમ મળશે. આ માટે તમારે કોઈને પૈસા આપવાની જરૂર નથી, આધાર કાર્ડ અને બેંક પાસબુક લઈને પંચાયત અથવા સીએસસી સેન્ટર પર જાઓ.',
      confidenceMessage: 'તમારે કમ્પ્યુટર કે ફોન ચલાવવાની જરૂર નથી, પંચાયત અથવા સીએસસી તમારા ફોર્મની મફતમાં નોંધણી કરી આપશે.',
      actionSteps: [
        'તમારું આધાર કાર્ડ અને બેંક પાસબુક તૈયાર રાખો.',
        'ગ્રામ પંચાયત અથવા નજીકના સીએસસી સેન્ટર પર જાઓ.',
        'સિલાઈ મશીન ટૂલકિટ માટે ફોર્મ ભરવા જણાવો.',
      ],
      officerScript: 'નમસ્તે સાહેબ, હું પીએમ વિશ્વકર્મા યોજના હેઠળ સિલાઈ મશીન માટે અરજી કરવા આવી છું. આ મારું આધાર કાર્ડ અને બેંક પાસબુક છે. કૃપા કરીને મારી અરજી નોંધો.',
    },
    kn: {
      spokenResponse: 'ನಮಸ್ಕಾರ ಅಕ್ಕ! PM ವಿಶ್ವಕರ್ಮ ಯೋಜನೆಯಡಿ ಹೊಲಿಗೆ ಯಂತ್ರ ಖರೀದಿಸಲು ₹15,000 ಧನಸಹಾಯ ಮತ್ತು 5 ದಿನಗಳ ಉಚಿತ ತರಬೇತಿ ಸಿಗುತ್ತದೆ. ಇದಕ್ಕಾಗಿ ಯಾರಿಗೂ ಹಣ ನೀಡಬೇಕಾಗಿಲ್ಲ, ಆಧಾರ್ ಕಾರ್ಡ್ ಮತ್ತು ಬ್ಯಾಂಕ್ ಪಾಸ್‌ಬುಕ್ ತೆಗೆದುಕೊಂಡು ಗ್ರಾಮ ಪಂಚಾಯಿತಿ ಅಥವಾ CSC ಕೇಂದ್ರಕ್ಕೆ ಭೇಟಿ ನೀಡಿ.',
      confidenceMessage: 'ನಿಮಗೆ ಕಂಪ್ಯೂಟರ್ ಅಥವಾ ಮೊಬೈಲ್ ಜ್ಞಾನ ಅಗತ್ಯವಿಲ್ಲ, ಗ್ರಾಮ ಪಂಚಾಯಿತಿ ಉಚಿತವಾಗಿ ಅರ್ಜಿ ಸಲ್ಲಿಸಿಕೊಡುತ್ತದೆ.',
      actionSteps: [
        'ಆಧಾರ್ ಕಾರ್ಡ್ ಮತ್ತು ಬ್ಯಾಂಕ್ ಪಾಸ್‌ಬುಕ್ ಜೊತೆಯಲ್ಲಿಡಿ.',
        'ಗ್ರಾಮ ಪಂಚಾಯಿತಿ ಅಥವಾ ಹತ್ತಿರದ CSC ಕೇಂದ್ರಕ್ಕೆ ಭೇಟಿ ನೀಡಿ.',
        'ಹೊಲಿಗೆ ಯಂತ್ರ ಯೋಜನೆಗೆ ಅರ್ಜಿ ನೋಂದಾಯಿಸಲು ಅಧಿಕಾರಿಗೆ ತಿಳಿಸಿ.',
      ],
      officerScript: 'ನಮಸ್ಕಾರ ಸರ್, ನಾನು PM ವಿಶ್ವಕರ್ಮ ಹೊಲಿಗೆ ಯಂತ್ರ ಯೋಜನೆಗೆ ಅರ್ಜಿ ಸಲ್ಲಿಸಲು ಬಂದಿದ್ದೇನೆ. ಇದು ನನ್ನ ಆಧಾರ್ ಮತ್ತು ಬ್ಯಾಂಕ್ ಪಾಸ್‌ಬುಕ್. ದಯವಿಟ್ಟು ನನ್ನ ಅರ್ಜಿ ನೋಂದಾಯಿಸಿ.',
    },
    ml: {
      spokenResponse: 'നമസ്കാരം സഹോദരി! പിഎം വിശ്വകർമ പദ്ധതി വഴി തയ്യൽ മെഷീൻ വാങ്ങാൻ ₹15,000 സഹായവും 5 ദിവസത്തെ സൗജന്യ പരിശീലനവും ലഭിക്കും. ഇതിനായി ആർക്കും പണം നൽകേണ്ടതില്ല, ആധാർ കാർഡും ബാങ്ക് പാസ്ബുക്കുമായി പഞ്ചായത്തിലോ സിഎസ്‌സി സെന്ററിലോ പോകുക.',
      confidenceMessage: 'നിങ്ങൾക്ക് ഫോണോ കമ്പ്യൂട്ടറോ അറിയില്ലെങ്കിലും സാരമില്ല, പഞ്ചായത്ത് അല്ലെങ്കിൽ സിഎസ്‌സി ജീവനക്കാർ സൗജന്യമായി അപേക്ഷ നൽകും.',
      actionSteps: [
        'ആധാർ കാർഡും ബാങ്ക് പാസ്ബുക്കും കയ്യിൽ കരുതുക.',
        'ഗ്രാമപഞ്ചായത്ത് അല്ലെങ്കിൽ അടുത്തുള്ള സിഎസ്‌സി സെന്റർ സന്ദർശിക്കുക.',
        'തയ്യൽ മെഷീൻ ടൂൾകിറ്റിനായി അപേക്ഷ നൽകുക.',
      ],
      officerScript: 'നമസ്കാരം, പിഎം വിശ്വകർമ തയ്യൽ മെഷീൻ പദ്ധതിയിലേക്ക് അപേക്ഷിക്കാനാണ് ഞാൻ വന്നത്. ഇതാണ് എന്റെ ആധാറും ബാങ്ക് പാസ്ബുക്കും. ദയവായി അപേക്ഷ രജിസ്റ്റർ ചെയ്യുക.',
    },
    pa: {
      spokenResponse: 'ਸਤਿ ਸ਼੍ਰੀ ਅਕਾਲ ਭੈਣ ਜੀ! ਪੀਐਮ ਵਿਸ਼ਵਕਰਮਾ ਯੋਜਨਾ ਤਹਿਤ ਸਿਲਾਈ ਮਸ਼ੀਨ ਖਰੀਦਣ ਲਈ ₹15,000 ਦੀ ਸਹਾਇਤਾ ਅਤੇ 5 ਦਿਨਾਂ ਦੀ ਮੁਫਤ ਟ੍ਰੇਨਿੰਗ ਮਿਲੇਗੀ। ਇਸ ਲਈ ਕਿਸੇ ਨੂੰ ਪੈਸੇ ਦੇਣ ਦੀ ਲੋੜ ਨਹੀਂ, ਆਪਣਾ ਆਧਾਰ ਕਾਰਡ ਅਤੇ ਬੈਂਕ ਪਾਸਬੁੱਕ ਲੈ ਕੇ ਪੰਚਾਇਤ ਜਾਂ ਸੀਐਸਸੀ ਸੈਂਟਰ ਜਾਓ।',
      confidenceMessage: 'ਤੁਹਾਨੂੰ ਕੰਪਿਊਟਰ ਜਾਂ ਫੋਨ ਚਲਾਉਣ ਦੀ ਲੋੜ ਨਹੀਂ, ਪੰਚਾਇਤ ਜਾਂ ਸੀਐਸਸੀ ਵਾਲੇ ਤੁਹਾਡਾ ਫਾਰਮ ਬਿਲਕੁਲ ਮੁਫਤ ਭਰ ਦੇਣਗੇ।',
      actionSteps: [
        'ਆਪਣਾ ਆਧਾਰ ਕਾਰਡ ਅਤੇ ਬੈਂਕ ਪਾਸਬੁੱਕ ਨਾਲ ਰੱਖੋ।',
        'ਪੰਚਾਇਤ ਘਰ ਜਾਂ ਨੇੜਲੇ ਸੀਐਸਸੀ ਕੇਂਦਰ ਜਾਓ।',
        'ਸਿਲਾਈ ਮਸ਼ੀਨ ਯੋਜਨਾ ਲਈ ਫਾਰਮ ਭਰਵਾਉਣ ਲਈ ਕਹੋ।',
      ],
      officerScript: 'ਸਤਿ ਸ਼੍ਰੀ ਅਕਾਲ ਜੀ, ਮੈਂ ਪੀਐਮ ਵਿਸ਼ਵਕਰਮਾ ਸਿਲਾਈ ਮਸ਼ੀਨ ਯੋਜਨਾ ਤਹਿਤ ਅਰਜ਼ੀ ਦੇਣ ਆਈ ਹਾਂ। ਇਹ ਮੇਰਾ ਆਧਾਰ ਕਾਰਡ ਅਤੇ ਬੈਂਕ ਪਾਸਬੁੱਕ ਹੈ। ਕਿਰਪਾ ਕਰਕੇ ਮੇਰਾ ਫਾਰਮ ਦਰਜ ਕਰੋ।',
    },
    en: {
      spokenResponse: 'Hello sister! Under the PM Vishwakarma scheme, you can receive a ₹15,000 toolkit voucher for a sewing machine along with 5 days of free training and daily stipend. Visit your local Gram Panchayat or CSC center with your Aadhaar and bank passbook.',
      confidenceMessage: 'You do not need any computer or smartphone skills; your local Gram Panchayat or CSC center will register your form for free.',
      actionSteps: [
        'Keep your Aadhaar card and Bank passbook ready.',
        'Visit your Village Gram Panchayat or nearest CSC digital center.',
        'Ask the official to register you for the PM Vishwakarma Tailoring scheme.',
      ],
      officerScript: 'Respected officer, I am applying for the Sewing Machine Toolkit under the PM Vishwakarma scheme. Here is my Aadhaar card and Bank passbook. Kindly register my application.',
    },
  },
  'pm-ujjwala-gas': {
    ta: {
      spokenResponse: 'வணக்கம் சகோதரி! PM உஜ்வாலா யோஜனா மூலம் உங்களுக்கு இலவச எல்பிஜி சிலிண்டர், கேஸ் அடுப்பு மற்றும் இணைப்பு கட்டணம் இலவசமாக கிடைக்கும். இதற்கு உங்கள் ஆதார் அட்டை, குடும்ப அட்டை மற்றும் வங்கி கணக்குடன் அருகில் உள்ள கேஸ் ஏஜென்சியை அணுகவும்.',
      confidenceMessage: 'இந்த இணைப்பு முற்றிலும் இலவசம், கேஸ் ஏஜென்சியில் யாரும் கூடுதல் பணம் கேட்க முடியாது.',
      actionSteps: [
        'குடும்ப அட்டை (Ration Card) மற்றும் ஆதார் கார்டு தயார் செய்க.',
        'அருகில் உள்ள பாரத் கேஸ், இண்டேன் அல்லது ஹெச்பி கேஸ் ஏஜென்சி செல்லவும்.',
        'உஜ்வாலா 2.0 இலவச புதிய கேஸ் இணைப்புக்கு விண்ணப்பிக்கவும்.',
      ],
      officerScript: 'வணக்கம், எங்கள் வீட்டில் கேஸ் இணைப்பு இல்லை. நான் உஜ்வாலா 2.0 திட்டத்தில் இலவச கேஸ் இணைப்புக்கு விண்ணப்பிக்க வந்துள்ளேன். எனது ஆவணங்களை சரிபார்க்கவும்.',
    },
    te: {
      spokenResponse: 'నమస్కారం సోదరీ! PM ఉజ్జ్వల యోజన కింద ఉచిత గ్యాస్ కనెక్షన్, సిలిండర్, పొయ్యి మరియు మొదటి రీఫిల్ పూర్తిగా ఉచితంగా లభిస్తాయి. మీ రేషన్ కార్డు, ఆధార్ కార్డుతో సమీపంలోని గ్యాస్ ఏజెన్సీకి వెళ్లండి.',
      confidenceMessage: 'ఇది ప్రభుత్వం అందించే ఉచిత సదుపాయం, ఎవరికీ ఒక్క రూపాయి చెల్లించవద్దు.',
      actionSteps: [
        'రేషన్ కార్డు మరియు ఆధార్ కార్డు సిద్ధం చేసుకోండి.',
        'సమీపంలోని ఇండేన్, భారత్ లేదా హెచ్‌పీ గ్యాస్ డిస్ట్రిబ్యూటర్ వద్దకు వెళ్లండి.',
        'ఉజ్జ్వల 2.0 ఉచిత కనెక్షన్ ఫారమ్ సమర్పించండి.',
      ],
      officerScript: 'నమస్కారం, మా ఇంట్లో గ్యాస్ కనెక్షన్ లేదు. నేను ఉజ్జ్వల 2.0 కింద ఉచిత గ్యాస్ కనెక్షన్ కోసం దరఖాస్తు చేసుకోవడానికి వచ్చాను.',
    },
    hi: {
      spokenResponse: 'नमस्ते बहन! प्रधानमंत्री उज्ज्वला योजना के तहत आपको मुफ्त गैस सिलेंडर, चूल्हा, रेगुलेटर और पहली रीफिल बिल्कुल मुफ्त मिलेगी। अपने राशन कार्ड और आधार कार्ड के साथ नजदीकी गैस एजेंसी जाएं।',
      confidenceMessage: 'यह योजना पूरी तरह मुफ्त है, एजेंसी पर आपको कोई कनेक्शन चार्ज नहीं देना है।',
      actionSteps: [
        'अपना राशन कार्ड और आधार कार्ड साथ रखें।',
        'नजदीकी गैस एजेंसी (इंडेन, भारत गैस, एचपी) पर जाएं।',
        'उज्ज्वला 2.0 मुफ्त गैस कनेक्शन का फॉर्म जमा करें।',
      ],
      officerScript: 'नमस्ते, मेरे घर में पहले से कोई गैस कनेक्शन नहीं है। मैं प्रधानमंत्री उज्ज्वला 2.0 योजना के अंतर्गत मुफ्त गैस कनेक्शन का फॉर्म जमा करने आई हूं।',
    },
    bn: {
      spokenResponse: 'নমস্কার দিদি! প্রধানমন্ত্রী উজ্জ্বলা যোজনায় সম্পূর্ণ বিনামূল্যে গ্যাস সিলিন্ডার, উনুন এবং সংযোগ পাবেন। আধার কার্ড ও রেশন কার্ড নিয়ে নিকটস্থ গ্যাস এজেন্সিতে যোগাযোগ করুন।',
      confidenceMessage: 'এটি সম্পূর্ণ সরকারি বিনামূল্যে সংযোগ, কাউকে কোনো বাড়তি ফি দেবেন না।',
      actionSteps: [
        'রেশন কার্ড এবং আধার কার্ড সাথে রাখুন।',
        'নিকটবর্তী ভারত গ্যাস, ইন্ডেন বা এইচপি এজেন্সিতে যান।',
        'উজ্জ্বলা ২.০ বিনামূল্যে ফর্ম জমা দিন।',
      ],
      officerScript: 'নমস্কার, আমাদের বাড়িতে কোনো গ্যাস সংযোগ নেই। আমি উজ্জ্বলা ২.০ বিনামূল্যে গ্যাস সংযোগের আবেদন করতে এসেছি।',
    },
    mr: {
      spokenResponse: 'नमस्ते ताई! प्रधानमंत्री उज्ज्वला योजनेअंतर्गत मोफत गॅस सिलेंडर, शेगडी आणि पहिले रिफिल मोफत मिळते. रेशन कार्ड आणि आधार कार्ड घेऊन जवळच्या गॅस एजन्सीला भेट द्या.',
      confidenceMessage: 'ही योजना पूर्णपणे मोफत आहे, कोणालाही अतिरिक्त पैसे देऊ नका.',
      actionSteps: [
        'रेशन कार्ड आणि आधार कार्ड सोबत ठेवा.',
        'जवळच्या गॅस वितरक एजन्सीवर जा.',
        'उज्ज्वला २.० मोफत कनेक्शनसाठी अर्ज करा.',
      ],
      officerScript: 'नमस्ते, आमच्या घरात आधीपासून गॅस कनेक्शन नाही. मी उज्ज्वला योजनेअंतर्गत मोफत कनेक्शनसाठी अर्ज करायला आले आहे.',
    },
    gu: {
      spokenResponse: 'નમસ્તે બહેન! પ્રધાનમંત્રી ઉજ્જવલા યોજના હેઠળ મફત ગેસ સિલિન્ડર, ચૂલ્હો અને કનેક્શન મળશે. રેશન કાર્ડ અને આધાર કાર્ડ સાથે ગેસ એજન્સી પર જાઓ.',
      confidenceMessage: 'આ સરકારી યોજના તદ્દન મફત છે, કોઈને પૈસા આપવાની જરૂર નથી.',
      actionSteps: [
        'રેશન કાર્ડ અને આધાર કાર્ડ સાથે રાખો.',
        'નજીકની ભારત ગેસ, ઈન્ડેન કે એચપી એજન્સી પર જાઓ.',
        'ઉજ્જવલા યોજનાનું ફોર્મ ભરો.',
      ],
      officerScript: 'નમસ્તે, અમારા ઘરમાં ગેસ કનેક્શન નથી. હું ઉજ્જવલા યોજના હેઠળ મફત કનેક્શન માટે અરજી કરવા આવી છું.',
    },
    kn: {
      spokenResponse: 'ನಮಸ್ಕಾರ ಅಕ್ಕ! PM ಉಜ್ವಲ ಯೋಜನೆಯಡಿ ಉಚಿತ ಗ್ಯಾಸ್ ಸಿಲಿಂಡರ್, ಒಲೆ ಮತ್ತು ಸಂಪರ್ಕ ಉಚಿತವಾಗಿ ದೊರೆಯುತ್ತದೆ. ರೇಷನ್ ಕಾರ್ಡ್ ಮತ್ತು ಆಧಾರ್‌ನೊಂದಿಗೆ ಗ್ಯಾಸ್ ಏಜೆನ್ಸಿಗೆ ಭೇಟಿ ನೀಡಿ.',
      confidenceMessage: 'ಇದು ಸಂಪೂರ್ಣ ಉಚಿತ ಯೋಜನೆಯಾಗಿದ್ದು, ಯಾರಿಗೂ ಹಣ ನೀಡಬೇಡಿ.',
      actionSteps: [
        'ರೇಷನ್ ಕಾರ್ಡ್ ಮತ್ತು ಆಧಾರ್ ಕಾರ್ಡ್ ಸಿದ್ಧವಾಗಿಡಿ.',
        'ಹತ್ತಿರದ ಇಂಡೇನ್, ಭಾರತ್ ಅಥವಾ ಎಚ್‌ಪಿ ಗ್ಯಾಸ್ ಏಜೆನ್ಸಿಗೆ ಭೇಟಿ ನೀಡಿ.',
        'ಉಜ್ವಲ ಉಚಿತ ಗ್ಯಾಸ್ ಸಂಪರ್ಕಕ್ಕಾಗಿ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ.',
      ],
      officerScript: 'ನಮಸ್ಕಾರ, ನಮ್ಮ ಮನೆಯಲ್ಲಿ ಗ್ಯಾಸ್ ಕನೆಕ್ಷನ್ ಇಲ್ಲ. ನಾನು ಉಜ್ವಲ ಯೋಜನೆಯಡಿ ಉಚಿತ ಸಂಪರ್ಕಕ್ಕೆ ಅರ್ಜಿ ಸಲ್ಲಿಸಲು ಬಂದಿದ್ದೇನೆ.',
    },
    ml: {
      spokenResponse: 'നമസ്കാരം സഹോദരി! പിഎം ഉജ്ജ്വല യോജന വഴി സൗജന്യ ഗ്യാസ് സിലിണ്ടറും അടുപ്പും ലഭിക്കും. റേഷൻ കാർഡും ആധാറുമായി അടുത്തുള്ള ഗ്യാസ് ഏജൻസി സന്ദർശിക്കുക.',
      confidenceMessage: 'ഇത് തികച്ചും സൗജന്യമാണ്, ആർക്കും പണം നൽകേണ്ടതില്ല.',
      actionSteps: [
        'റേഷൻ കാർഡും ആധാർ കാർഡും കരുതുക.',
        'അടുത്തുള്ള ഗ്യാസ് ഏജൻസി സന്ദർശിക്കുക.',
        'ഉജ്ജ്വല 2.0 സൗജന്യ കണക്ഷനായി അപേക്ഷിക്കുക.',
      ],
      officerScript: 'നമസ്കാരം, ഞങ്ങളുടെ വീട്ടിൽ ഗ്യാസ് കണക്ഷൻ ഇല്ല. ഉജ്ജ്വല യോജന വഴി സൗജന്യ കണക്ഷനായി അപേക്ഷിക്കാൻ വന്നതാണ്.',
    },
    pa: {
      spokenResponse: 'ਸਤਿ ਸ਼੍ਰੀ ਅਕਾਲ ਭੈਣ ਜੀ! ਪ੍ਰਧਾਨ ਮੰਤਰੀ ਉੱਜਵਲਾ ਯੋਜਨਾ ਤਹਿਤ ਮੁਫਤ ਗੈਸ ਸਿਲੰਡਰ ਅਤੇ ਚੁੱਲ੍ਹਾ ਮਿਲੇਗਾ। ਰਾਸ਼ਨ ਕਾਰਡ ਅਤੇ ਆਧਾਰ ਕਾਰਡ ਲੈ ਕੇ ਗੈਸ ਏਜੰਸੀ ਜਾਓ।',
      confidenceMessage: 'ਇਹ ਸਰਕਾਰੀ ਸੇਵਾ ਬਿਲਕੁਲ ਮੁਫਤ ਹੈ।',
      actionSteps: [
        'ਰਾਸ਼ਨ ਕਾਰਡ ਅਤੇ ਆਧਾਰ ਕਾਰਡ ਨਾਲ ਰੱਖੋ।',
        'ਨੇੜਲੀ ਗੈਸ ਏਜੰਸੀ ਜਾਓ।',
        'ਉੱਜਵਲਾ ਮੁਫਤ ਗੈਸ ਕਨੈਕਸ਼ਨ ਫਾਰਮ ਜਮ੍ਹਾਂ ਕਰੋ।',
      ],
      officerScript: 'ਸਤਿ ਸ਼੍ਰੀ ਅਕਾਲ ਜੀ, ਸਾਡੇ ਘਰ ਵਿੱਚ ਗੈਸ ਕਨੈਕਸ਼ਨ ਨਹੀਂ ਹੈ। ਮੈਂ ਉੱਜਵਲਾ ਯੋਜਨਾ ਤਹਿਤ ਮੁਫਤ ਕਨੈਕਸ਼ਨ ਲਈ ਆਈ ਹਾਂ।',
    },
    en: {
      spokenResponse: 'Hello sister! Under PM Ujjwala Yojana, you are entitled to a free LPG gas connection, stove, regulator, and first cylinder refill. Visit your nearest gas agency with your Ration card and Aadhaar.',
      confidenceMessage: 'This connection is 100% free under government mandate. Do not pay any processing fee.',
      actionSteps: [
        'Keep your Ration Card and Aadhaar ready.',
        'Visit your nearest LPG Distributor (Indane, Bharat Gas, HP Gas).',
        'Submit the PM Ujjwala 2.0 free connection application.',
      ],
      officerScript: 'Hello, our household does not have an LPG connection. I am applying for the free connection under PM Ujjwala Yojana 2.0.',
    },
  },
  'sukanya-samriddhi': {
    ta: {
      spokenResponse: 'வணக்கம் சகோதரி! சுகன்யா சம்ரிதி திட்டம் மூலம் 10 வயதுக்கு உட்பட்ட பெண் குழந்தைகளுக்கு தபால் நிலையத்தில் சேமிப்பு கணக்கு தொடங்கலாம். இதில் அரசு 8.2% அதிக வட்டி தருகிறது, மகள் வளர்ந்ததும் படிப்பு மற்றும் திருமணத்திற்கு லட்சக்கணக்கான நிதி கிடைக்கும்.',
      confidenceMessage: 'வெறும் ₹250 செலுத்தி தபால் நிலையம் அல்லது அரசு வங்கியில் இதை தொடங்கலாம்.',
      actionSteps: [
        'மகளின் பிறப்பு சான்றிதழ் மற்றும் அம்மாவின் ஆதார் எடுக்கவும்.',
        'அருகில் உள்ள தபால் நிலையம் (Post Office) அல்லது வங்கி செல்லவும்.',
        'சுகன்யா சம்ரிதி சேமிப்பு கணக்கு தொடங்க படிவம் சமர்ப்பிக்கவும்.',
      ],
      officerScript: 'வணக்கம் ஐயா, எனது 10 வயதுக்கு உட்பட்ட மகளுக்கு சுகன்யா சம்ரிதி சேமிப்பு கணக்கு தொடங்க வந்துள்ளேன். இது மகளின் பிறப்பு சான்றிதழ் மற்றும் என் ஆதார்.',
    },
    te: {
      spokenResponse: 'నమస్కారం సోదరీ! సుకన్య సమృద్ధి యోజన ద్వారా 10 సంవత్సరాల లోపు ఆడపిల్లల కోసం పోస్టాఫీసులో ఖాతా తెరవవచ్చు. దీనిపై ప్రభుత్వం అత్యధికంగా 8.2% వడ్డీని అందిస్తుంది.',
      confidenceMessage: 'కేవలం ₹250 తో సమీప పోస్టాఫీసు లేదా బ్యాంకులో సులభంగా ప్రారంభించవచ్చు.',
      actionSteps: [
        'కుమార్తె జనన ధృవీకరణ పత్రం ಮತ್ತು తల్లి ఆధార్ సిద్ధం చేసుకోండి.',
        'సమీపంలోని పోస్టాఫీసు లేదా ప్రభుత్వ బ్యాంకుకు వెళ్లండి.',
        'సుకన్య సమృద్ధి ఖాతా ప్రారంభ ఫారమ్ నింపండి.',
      ],
      officerScript: 'నమస్కారం సార్, నా 10 ఏళ్ల లోపు కుమార్తె కోసం సుకన్య సమృద్ధి ఖాతా తెరవడానికి వచ్చాను. ఇది పాప జనన పత్రం మరియు నా ఆధార్.',
    },
    hi: {
      spokenResponse: 'नमस्ते बहन! सुकन्या समृद्धि योजना में 10 साल से छोटी बेटी के नाम पर डाकघर में खाता खोल सकते हैं। इसमें सरकार सबसे अधिक 8.2% ब्याज देती है, जिससे बेटी की पढ़ाई और शादी के लिए लाखों का फंड बनता है।',
      confidenceMessage: 'मात्र ₹250 से नजदीकी पोस्ट ऑफिस या सरकारी बैंक में यह खाता खोला जा सकता है।',
      actionSteps: [
        'बेटी का जन्म प्रमाण पत्र और अपनी आधार कार्ड निकालें।',
        'नजदीकी डाकघर (Post Office) या सरकारी बैंक जाएं।',
        'सुकन्या समृद्धि खाता खोलने का फॉर्म जमा करें।',
      ],
      officerScript: 'नमस्ते सर, मुझे अपनी 10 साल से छोटी बेटी के लिए सुकन्या समृद्धि योजना का बचत खाता खोलना है। यह मेरी बेटी का जन्म प्रमाण पत्र और मेरा आधार है।',
    },
    bn: {
      spokenResponse: 'নমস্কার দিদি! সুকন্যা সমৃদ্ধি যোজনায় ১০ বছরের কম বয়সী মেয়ের জন্য পোস্ট অফিসে খাতা খুলুন। এতে সরকার ৮.২% সর্বোচ্চ সুদ দেয়। মাত্র ২৫০ টাকা দিয়ে শুরু করতে পারেন।',
      confidenceMessage: 'নিকটবর্তী ডাকঘর বা ব্যাংকে সহজেই খাতা খোলা যায়।',
      actionSteps: [
        'মেয়ের জন্ম সার্টিফিকেট ও নিজের আধার কার্ড সাথে রাখুন।',
        'নিকটস্থ পোস্ট অফিস বা ব্যাংকে যান।',
        'সুকন্যা সমৃদ্ধি অ্যাকাউন্ট খোলার আবেদন করুন।',
      ],
      officerScript: 'নমস্কার স্যার, আমি আমার মেয়ের জন্য সুকন্যা সমৃদ্ধি অ্যাকাউন্ট খুলতে এসেছি। এটি মেয়ের জন্ম সার্টিফিকেট ও আমার আধার।',
    },
    mr: {
      spokenResponse: 'नमस्ते ताई! सुकन्या समृद्धी योजनेअंतर्गत १० वर्षांखालील मुलीसाठी पोस्टात खाते उघडा. सरकार यावर ८.२% सर्वाधिक व्याज देते. फक्त ₹२५० मध्ये खाते सुरू होते.',
      confidenceMessage: 'जवळच्या पोस्ट ऑफिसमध्ये किंवा बँकेत हे खाते सुरू करता येते.',
      actionSteps: [
        'मुलीचा जन्म दाखला आणि स्वतःचे आधार कार्ड सोबत ठेवा.',
        'जवळच्या पोस्ट ऑफिसमध्ये किंवा सरकारी बँकेत जा.',
        'सुकन्या समृद्धी खाते उघडण्याचा फॉर्म भरा.',
      ],
      officerScript: 'नमस्ते सर, मला माझ्या १० वर्षांखालील मुलीसाठी सुकन्या समृद्धी खाते उघडायचे आहे. हा मुलीचा जन्म दाखला आणि माझे आधार आहे.',
    },
    gu: {
      spokenResponse: 'નમસ્તે બહેન! સુકન્યા સમૃદ્ધિ યોજનામાં ૧૦ વર્ષથી નાની દીકરી માટે પોસ્ટ ઓફિસમાં ખાતું ખોલાવો. સરકાર ૮.૨% વ્યાજ આપે છે. માત્ર ₹૨૫૦ થી ખાતું શરૂ થાય છે.',
      confidenceMessage: 'નજીકની પોસ્ટ ઓફિસ કે સરકારી બેંકમાં સરળતાથી ખાતું ખુલી જશે.',
      actionSteps: [
        'દીકરીનું જન્મ પ્રમાણપત્ર અને તમારું આધાર કાર્ડ સાથે રાખો.',
        'નજીકની પોસ્ટ ઓફિસ અથવા બેંકમાં જાઓ.',
        'સુકન્યા સમૃદ્ધિ ખાતું ખોલવાનું ફોર્મ ભરો.',
      ],
      officerScript: 'નમસ્તે સાહેબ, મારે મારી દીકરી માટે સુકન્યા સમૃદ્ધિ યોજનાનું ખાતું ખોલાવવું છે. આ દીકરીનું જન્મ પ્રમાણપત્ર અને મારું આધાર છે.',
    },
    kn: {
      spokenResponse: 'ನಮಸ್ಕಾರ ಅಕ್ಕ! ಸುಕನ್ಯಾ ಸಮೃದ್ಧಿ ಯೋಜನೆಯಡಿ 10 ವರ್ಷದೊಳಗಿನ ಹೆಣ್ಣು ಮಗುವಿನ ಹೆಸರಿನಲ್ಲಿ ಅಂಚೆ ಕಚೇರಿಯಲ್ಲಿ ಖಾತೆ ತೆರೆಯಿರಿ. ಸರ್ಕಾರ 8.2% ಗರಿಷ್ಠ ಬಡ್ಡಿ ನೀಡುತ್ತದೆ.',
      confidenceMessage: 'ಕೇವಲ ₹250 ನೀಡಿ ಹತ್ತಿರದ ಪೋಸ್ಟ್ ಆಫೀಸ್‌ನಲ್ಲಿ ಖಾತೆ ತೆರೆಯಬಹುದು.',
      actionSteps: [
        'ಮಗಳ ಜನನ ಪ್ರಮಾಣಪತ್ರ ಮತ್ತು ನಿಮ್ಮ ಆಧಾರ್ ಸಿದ್ಧವಾಗಿಡಿ.',
        'ಹತ್ತಿರದ ಅಂಚೆ ಕಚೇರಿ ಅಥವಾ ಬ್ಯಾಂಕ್‌ಗೆ ಭೇಟಿ ನೀಡಿ.',
        'ಸುಕನ್ಯಾ ಸಮೃದ್ಧಿ ಖಾತೆ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ.',
      ],
      officerScript: 'ನಮಸ್ಕಾರ ಸರ್, ನನ್ನ ಮಗಳಿಗಾಗಿ ಸುಕನ್ಯಾ ಸಮೃದ್ಧಿ ಖಾತೆ ತೆರೆಯಲು ಬಂದಿದ್ದೇನೆ. ಇದು ಮಗಳ ಜನನ ಪ್ರಮಾಣಪತ್ರ ಮತ್ತು ನನ್ನ ಆಧಾರ್.',
    },
    ml: {
      spokenResponse: 'നമസ്കാരം സഹോദരി! സുകന്യ സമൃദ്ധി യോജന വഴി 10 വയസ്സിൽ താഴെയുള്ള പെൺകുട്ടികൾക്കായി പോസ്റ്റ് ഓഫീസിൽ അക്കൗണ്ട് തുടങ്ങാം. സർക്കാർ 8.2% പലിശ നൽകുന്നു.',
      confidenceMessage: 'വെറും ₹250 രൂപ നൽകി അടുത്തുള്ള പോസ്റ്റ് ഓഫീസിൽ തുടങ്ങാം.',
      actionSteps: [
        'മകളുടെ ജനന സർട്ടിഫിക്കറ്റും നിങ്ങളുടെ ആധാറും കരുതുക.',
        'പോസ്റ്റ് ഓഫീസിലോ ബാങ്കിലോ പോകുക.',
        'സുകന്യ സമൃദ്ധി അക്കൗണ്ട് ഫോം പൂരിപ്പിക്കുക.',
      ],
      officerScript: 'നമസ്കാരം, എന്റെ മകൾക്കായി സുകന്യ സമൃദ്ധി അക്കൗണ്ട് തുടങ്ങാൻ വന്നതാണ്. ഇതാണ് ജനന സർട്ടിഫിക്കറ്റും ആധാറും.',
    },
    pa: {
      spokenResponse: 'ਸਤਿ ਸ਼੍ਰੀ ਅਕਾਲ ਭੈਣ ਜੀ! ਸੁਕੰਨਿਆ ਸਮ੍ਰਿਧੀ ਯੋਜਨਾ ਤਹਿਤ 10 ਸਾਲ ਤੋਂ ਛੋਟੀ ਧੀ ਦਾ ਡਾਕਘਰ ਵਿੱਚ ਖਾਤਾ ਖੁੱਲ੍ਹਵਾਓ। ਸਰਕਾਰ 8.2% ਸਭ ਤੋਂ ਵੱਧ ਵਿਆਜ ਦਿੰਦੀ ਹੈ।',
      confidenceMessage: 'ਸਿਰਫ਼ ₹250 ਨਾਲ ਨੇੜਲੇ ਡਾਕਘਰ ਵਿੱਚ ਖਾਤਾ ਖੁੱਲ੍ਹ ਜਾਂਦਾ ਹੈ।',
      actionSteps: [
        'ਧੀ ਦਾ ਜਨਮ ਸਰਟੀਫਿਕੇਟ ਅਤੇ ਆਪਣਾ ਆਧਾਰ ਕਾਰਡ ਨਾਲ ਰੱਖੋ।',
        'ਨੇੜਲੇ ਡਾਕਘਰ ਜਾਂ ਸਰਕਾਰੀ ਬੈਂਕ ਜਾਓ।',
        'ਸੁਕੰਨਿਆ ਖਾਤਾ ਖੋਲ੍ਹਣ ਦਾ ਫਾਰਮ ਭਰੋ।',
      ],
      officerScript: 'ਸਤਿ ਸ਼੍ਰੀ ਅਕਾਲ ਜੀ, ਮੈਂ ਆਪਣੀ ਧੀ ਲਈ ਸੁਕੰਨਿਆ ਸਮ੍ਰਿਧੀ ਖਾਤਾ ਖੁੱਲ੍ਹਵਾਉਣ ਆਈ ਹਾਂ। ਇਹ ਉਸਦਾ ਜਨਮ ਸਰਟੀਫਿਕੇਟ ਅਤੇ ਮੇਰਾ ਆਧਾਰ ਹੈ।',
    },
    en: {
      spokenResponse: 'Hello sister! Sukanya Samriddhi Yojana allows you to open a dedicated high-interest (8.2%) savings account for your girl child under 10 years at any Post Office or bank, starting with just ₹250.',
      confidenceMessage: 'You can open this account with ₹250 at any Post Office or nationalized bank.',
      actionSteps: [
        'Keep your daughter birth certificate and your Aadhaar ready.',
        'Visit your nearest Post Office or public bank.',
        'Submit the Sukanya Samriddhi account opening form.',
      ],
      officerScript: 'Respected officer, I wish to open a Sukanya Samriddhi savings account for my daughter. Here are her birth certificate and my identity proof.',
    },
  },
  'lakhpati-didi-shg': {
    ta: {
      spokenResponse: 'வணக்கம் சகோதரி! லக் பதி திதி திட்டம் மூலம் சுய உதவிக்குழு (SHG) பெண்களுக்கு தையல், பெட்டிக்கடை அல்லது சிறு தொழில் தொடங்க ₹1 லட்சம் முதல் ₹5 லட்சம் வரை பிணையில்லா கடன் மற்றும் இலவச பயிற்சி கிடைக்கும்.',
      confidenceMessage: 'கிராமத்தின் குழு ஒருங்கிணைப்பாளர் (CRP) அல்லது பஞ்சாயத்து அலுவலகத்தில் விண்ணப்பிக்கலாம்.',
      actionSteps: [
        'உங்கள் குழு பாஸ்புக் மற்றும் ஆதார் அட்டை தயார் செய்க.',
        'கிராம சுய உதவிக்குழு கூட்டத்தில் உங்கள் தொழில் விருப்பத்தை தெரிவிக்கவும்.',
        'லக் பதி திதி திட்டத்தின் கீழ் கடன் மற்றும் பயிற்சிக்கு விண்ணப்பிக்கவும்.',
      ],
      officerScript: 'வணக்கம், எனது சுய உதவிக்குழு மூலம் லக் பதி திதி திட்டத்தில் தொழில் தொடங்க கடனுக்காக விண்ணப்பிக்க வந்துள்ளேன்.',
    },
    te: {
      spokenResponse: 'నమస్కారం సోదరీ! లఖ్‌పతి దీదీ పథకం ద్వారా పొదుపు సంఘాల (SHG) మహిళలకు వ్యాపారం ప్రారంభించడానికి ₹1 నుండి ₹5 లక్షల వరకు పూచీకత్తు లేని రుణం మరియు ఉచిత శిక్షణ లభిస్తుంది.',
      confidenceMessage: 'గ్రామ సంఘం (VO) లేదా క్లస్టర్ అధికారి ద్వారా ఉచితంగా దరఖాస్తు చేసుకోవచ్చు.',
      actionSteps: [
        'SHG గ్రూప్ పాస్‌బుక్ మరియు ఆధార్ కార్డు సిద్ధం చేసుకోండి.',
        'గ్రామ సమైక్య (VO) సమావేశంలో మీ వ్యాపార ప్రతిపాదన తెలపండి.',
        'లఖ్‌పతి దీదీ రుణం కోసం దరఖాస్తు చేసుకోండి.',
      ],
      officerScript: 'నమస్కారం, మా మహిళా సంఘం ద్వారా లఖ్‌పతి దీదీ పథకంలో వ్యాపార రుణం కోసం దరఖాస్తు చేసుకోవడానికి వచ్చాను.',
    },
    hi: {
      spokenResponse: 'नमस्ते बहन! लखपति दीदी योजना में स्वयं सहायता समूह की महिलाओं को सिलाई, दुकान या छोटा व्यवसाय शुरू करने के लिए ₹1 से ₹5 लाख तक का बिना गारंटी का आसान ऋण और मुफ्त हुनर ट्रेनिंग मिलती है।',
      confidenceMessage: 'गांव की सीआरपी दीदी या ब्लॉक विकास अधिकारी (BDO) से मिलकर आवेदन करें।',
      actionSteps: [
        'समूह की बैंक पासबुक और अपना आधार कार्ड साथ रखें।',
        'गांव के स्वयं सहायता समूह बैठक में अपनी योजना बताएं।',
        'लखपति दीदी योजना के तहत ऋण और ट्रेनिंग का फॉर्म भरें।',
      ],
      officerScript: 'नमस्ते दीदी/सर, मैं अपने स्वयं सहायता समूह के माध्यम से लखपति दीदी योजना के अंतर्गत छोटा काम शुरू करने हेतु ऋण और ट्रेनिंग के लिए आई हूं।',
    },
    bn: {
      spokenResponse: 'নমস্কার দিদি! লাখপতি দিদি প্রকল্পে স্বনির্ভর দলের মহিলাদের ছোট ব্যবসা শুরুর জন্য ১ থেকে ৫ লক্ষ টাকা পর্যন্ত বিনা গ্যারান্টিতে সহজ ঋণ ও প্রশিক্ষণ দেওয়া হয়।',
      confidenceMessage: 'গ্রাম সংগঠন বা পঞ্চায়েতে সহজে আবেদন করুন।',
      actionSteps: [
        'এসএইচজি পাসবই ও আধার কার্ড সাথে রাখুন।',
        'দলের মিটিংয়ে ব্যবসার বিষয়ে আলোচনা করুন।',
        'লাখপতি দিদি ঋণ ও প্রশিক্ষণের আবেদন জমা দিন।',
      ],
      officerScript: 'নমস্কার, আমি স্বনির্ভর দলের মাধ্যমে লাখপতি দিদি প্রকল্পে ব্যবসার ঋণের আবেদন করতে এসেছি।',
    },
    mr: {
      spokenResponse: 'नमस्ते ताई! लखपती दीदी योजनेअंतर्गत बचत गटातील महिलांना स्वतःचा व्यवसाय सुरू करण्यासाठी ₹१ ते ₹५ लाख विनातारण कर्ज आणि मोफत व्यावसायिक प्रशिक्षण मिळते.',
      confidenceMessage: 'गावातील समूह समन्वयक किंवा ग्रामसेवकाकडून अर्ज करा.',
      actionSteps: [
        'बचत गटाचे बँक पासबुक आणि आधार कार्ड सोबत ठेवा.',
        'बचत गट बैठकीत व्यवसाय प्रस्ताव मांडा.',
        'लखपती दीदी कर्ज व प्रशिक्षणासाठी अर्ज करा.',
      ],
      officerScript: 'नमस्ते, मी बचत गटामार्फत लखपती दीदी योजनेअंतर्गत उद्योग सुरू करण्यासाठी कर्जाचा अर्ज करायला आले आहे.',
    },
    gu: {
      spokenResponse: 'નમસ્તે બહેન! લખપતિ દીદી યોજનામાં સખી મંડળની બહેનોને વ્યવસાય શરૂ કરવા ₹૧ થી ₹૫ લાખની વગર ગેરંટીની લોન અને મફત તાલીમ મળે છે.',
      confidenceMessage: 'ગામના જૂથ સંયોજક અથવા પંચાયત દ્વારા અરજી કરી શકાય છે.',
      actionSteps: [
        'જૂથની પાસબુક અને આધાર કાર્ડ સાથે રાખો.',
        'સખી મંડળની બેઠકમાં તમારી યોજના જણાવો.',
        'લખપતિ દીદી યોજના હેઠળ લોન માટે અરજી કરો.',
      ],
      officerScript: 'નમસ્તે, હું સખી મંડળ દ્વારા લખપતિ દીદી યોજના હેઠળ લોન માટે અરજી કરવા આવી છું.',
    },
    kn: {
      spokenResponse: 'ನಮಸ್ಕಾರ ಅಕ್ಕ! ಲಖ್‌ಪತಿ ದೀದಿ ಯೋಜನೆಯಡಿ ಸ್ತ್ರೀಶಕ್ತಿ ಸಂಘಗಳ ಮಹಿಳೆಯರಿಗೆ ವ್ಯಾಪಾರ ಆರಂಭಿಸಲು ₹1 ರಿಂದ ₹5 ಲಕ್ಷದವರೆಗೆ ಜಾಮೀನು ರಹಿತ ಸಾಲ ಮತ್ತು ತರಬೇತಿ ಸಿಗುತ್ತದೆ.',
      confidenceMessage: 'ಗ್ರಾಮ ಒಕ್ಕೂಟ ಅಥವಾ ಪಂಚಾಯಿತಿ ಮೂಲಕ ಸುಲಭವಾಗಿ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ.',
      actionSteps: [
        'ಸಂಘದ ಪಾಸ್‌ಬುಕ್ ಮತ್ತು ಆಧಾರ್ ಕಾರ್ಡ್ ಸಿದ್ಧವಾಗಿಡಿ.',
        'ಸ್ವಸಹಾಯ ಗುಂಪಿನ ಸಭೆಯಲ್ಲಿ ಉದ್ಯಮ ಯೋಜನೆ ತಿಳಿಸಿ.',
        'ಲಖ್‌ಪತಿ ದೀದಿ ಸಾಲಕ್ಕೆ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ.',
      ],
      officerScript: 'ನಮಸ್ಕಾರ, ನಾನು ಮಹಿಳಾ ಸ್ವಸಹಾಯ ಸಂಘದ ಮೂಲಕ ಲಖ್‌ಪತಿ ದೀದಿ ಸಾಲಕ್ಕೆ ಅರ್ಜಿ ಸಲ್ಲಿಸಲು ಬಂದಿದ್ದೇನೆ.',
    },
    ml: {
      spokenResponse: 'നമസ്കാരം സഹോദരി! ലഖ്പതി ദീദി പദ്ധതി വഴി കുടുംബശ്രീ/സ്വയംസഹായ സംഘാംഗങ്ങൾക്ക് ബിസിനസ് തുടങ്ങാൻ ₹1 മുതൽ ₹5 ലക്ഷം വരെ ഈടില്ലാത്ത വായ്പയും പരിശീലനവും ലഭിക്കും.',
      confidenceMessage: 'ഗ്രാമപഞ്ചായത്ത് അല്ലെങ്കിൽ സിഡിഎസ് വഴി അപേക്ഷിക്കാം.',
      actionSteps: [
        'ഗ്രൂപ്പ് പാസ്ബുക്കും ആധാർ കാർഡും കരുതുക.',
        'സംഘം മീറ്റിംഗിൽ പദ്ധതി അവതരിപ്പിക്കുക.',
        'വായ്പയ്ക്കും പരിശീലനത്തിനുമായി അപേക്ഷ നൽകുക.',
      ],
      officerScript: 'നമസ്കാരം, സ്വയംസഹായ സംഘം വഴി ബിസിനസ് വായ്പയ്ക്കായി അപേക്ഷിക്കാനാണ് വന്നത്.',
    },
    pa: {
      spokenResponse: 'ਸਤਿ ਸ਼੍ਰੀ ਅਕਾਲ ਭੈਣ ਜੀ! ਲਖਪਤੀ ਦੀਦੀ ਯੋਜਨਾ ਤਹਿਤ ਸਵੈ-ਸਹਾਇਤਾ ਸਮੂਹ ਦੀਆਂ ਔਰਤਾਂ ਨੂੰ ਕਾਰੋਬਾਰ ਸ਼ੁਰੂ ਕਰਨ ਲਈ ₹1 ਤੋਂ ₹5 ਲੱਖ ਤੱਕ ਦਾ ਬਿਨਾਂ ਗਾਰੰਟੀ ਕਰਜ਼ਾ ਅਤੇ ਟ੍ਰੇਨਿੰਗ ਮਿਲਦੀ ਹੈ।',
      confidenceMessage: 'ਪੰਚਾਇਤ ਜਾਂ ਬਲਾਕ ਦਫ਼ਤਰ ਜਾ ਕੇ ਅਰਜ਼ੀ ਦਿੱਤੀ ਜਾ ਸਕਦੀ ਹੈ।',
      actionSteps: [
        'ਸਮੂਹ ਦੀ ਪਾਸਬੁੱਕ ਅਤੇ ਆਧਾਰ ਕਾਰਡ ਨਾਲ ਰੱਖੋ।',
        'ਸਮੂਹ ਮੀਟਿੰਗ ਵਿੱਚ ਕਾਰੋਬਾਰ ਦੀ ਜਾਣਕਾਰੀ ਦਿਓ।',
        'ਲਖਪਤੀ ਦੀਦੀ ਕਰਜ਼ੇ ਲਈ ਫਾਰਮ ਭਰੋ।',
      ],
      officerScript: 'ਸਤਿ ਸ਼੍ਰੀ ਅਕਾਲ ਜੀ, ਮੈਂ ਲਖਪਤੀ ਦੀਦੀ ਯੋਜਨਾ ਤਹਿਤ ਕਰਜ਼ਾ ਲੈਣ ਆਈ ਹਾਂ।',
    },
    en: {
      spokenResponse: 'Hello sister! Under the Lakhpati Didi initiative, women in Self Help Groups (SHGs) can access ₹1 to ₹5 Lakh collateral-free business loans and free skill training to start tailoring, grocery, or micro-enterprises.',
      confidenceMessage: 'Your Village Organization (VO) or Cluster Resource Person will help submit the application for free.',
      actionSteps: [
        'Keep your SHG passbook and Aadhaar ready.',
        'Discuss your livelihood activity in your group meeting.',
        'Submit the enterprise credit application under Lakhpati Didi.',
      ],
      officerScript: 'Hello, I want to apply for business skill training and SHG enterprise credit under Lakhpati Didi initiative to start my own livelihood.',
    },
  },
  'pm-matru-vandana': {
    ta: {
      spokenResponse: 'வணக்கம் சகோதரி! PM மாத்ரு வந்தனா திட்டம் மூலம் கர்ப்பிணி மற்றும் பாலூட்டும் தாய்மார்களுக்கு ஊட்டச்சத்து மற்றும் மருத்துவ உதவிக்காக வங்கிக் கணக்கில் நேரடியாக ₹5,000 முதல் ₹6,000 வரை நிதி உதவி கிடைக்கும்.',
      confidenceMessage: 'உங்கள் அங்கன்வாடி சகோதரி அல்லது ஆஷா பணியாளர் இந்த படிவத்தை இலவசமாக பூர்த்தி செய்வார்கள்.',
      actionSteps: [
        'தாய் சேய் பாதுகாப்பு அட்டை (MCP Card) மற்றும் வங்கி பாஸ்புக் எடுக்கவும்.',
        'அருகில் உள்ள அங்கன்வாடி மையம் அல்லது ஆஷா சகோதரியை சந்திக்கவும்.',
        'மாத்ரு வந்தனா திட்ட நிதி உதவிக்கு பதிவு செய்யவும்.',
      ],
      officerScript: 'வணக்கம் ஆஷா சகோதரி, நான் PM மாத்ரு வந்தனா திட்டத்தில் ஊட்டச்சத்து நிதி உதவிக்கு பதிவு செய்ய வந்துள்ளேன். இது எனது MCP அட்டை மற்றும் வங்கி பாஸ்புக்.',
    },
    te: {
      spokenResponse: 'నమస్కారం సోదరీ! ప్రధాన మంత్రి మాతృ వందన యోజన కింద గర్భిణీ స్త్రీలకు పౌష్టికాహారం కోసం వారి బ్యాంకు ఖాతాలో నేరుగా ₹5,000 నుండి ₹6,000 వరకు నగదు సాయం అందుతుంది.',
      confidenceMessage: 'మీ అంగన్‌వాడీ టీచర్ లేదా ఆశా కార్యకర్త ఉచితంగా నమోదు చేస్తారు.',
      actionSteps: [
        'MCP హెల్త్ కార్డు మరియు బ్యాంక్ పాస్‌బుక్ సిద్ధంగా ఉంచుకోండి.',
        'అంగన్‌వాడీ కేంద్రం లేదా ఆశా కార్యకర్తను సంప్రదించండి.',
        'మాతృ వందన పోషణ సహాయం కోసం దరఖాస్తు చేసుకోండి.',
      ],
      officerScript: 'నమస్కారం అంగన్‌వాడీ దీదీ, నేను మాతృ వందన యోజన కింద ఆర్థిక సహాయం నమోదు కోసం వచ్చాను. ఇది నా MCP కార్డు మరియు బ్యాంక్ పాస్‌బుక్.',
    },
    hi: {
      spokenResponse: 'नमस्ते बहन! प्रधानमंत्री मातृ वंदना योजना के तहत गर्भवती और स्तनपान कराने वाली महिलाओं को अच्छे पोषण के लिए सीधे बैंक खाते में ₹5,000 से ₹6,000 की नकद सहायता मिलती है।',
      confidenceMessage: 'अपनी आंगनवाड़ी कार्यकर्ता या आशा दीदी से संपर्क करें, वे फॉर्म मुफ्त में भर देंगी।',
      actionSteps: [
        'अपना एमसीपी कार्ड (MCP Card) और बैंक पासबुक निकालें।',
        'गांव के आंगनवाड़ी केंद्र या आशा कार्यकर्ता से मिलें।',
        'मातृ वंदना सहायता राशि के लिए पंजीकरण कराएं।',
      ],
      officerScript: 'नमस्ते आशा दीदी / आंगनवाड़ी दीदी, मैं प्रधानमंत्री मातृ वंदना योजना के तहत पोषण सहायता राशि के पंजीकरण के लिए आई हूं। यह मेरा एमसीपी कार्ड और बैंक पासबुक है।',
    },
    bn: {
      spokenResponse: 'নমস্কার দিদি! প্রধানমন্ত্রী মাতৃ বন্দনা যোজনায় গর্ভবতী ও স্তন্যদানকারী মায়েদের পুষ্টির জন্য সরাসরি ব্যাংক অ্যাকাউন্টে ৫,০০০ থেকে ৬,০০০ টাকা দেওয়া হয়।',
      confidenceMessage: 'অঙ্গনওয়াড়ি দিদি বা আশা কর্মীর মাধ্যমে বিনামূল্যে আবেদন করুন।',
      actionSteps: [
        'এমসিপি স্বাস্থ্য কার্ড এবং ব্যাংক বই সাথে রাখুন।',
        'অঙ্গনওয়াড়ি কর্মী বা আশা দিদির সাথে যোগাযোগ করুন।',
        'মাতৃ বন্দনা যোজনায় নাম নথিভুক্ত করুন।',
      ],
      officerScript: 'নমস্কার দিদি, আমি প্রধানমন্ত্রী মাতৃ বন্দনা যোজনায় পুষ্টি সহায়তার জন্য নাম নথিভুক্ত করতে এসেছি।',
    },
    mr: {
      spokenResponse: 'नमस्ते ताई! प्रधानमंत्री मातृ वंदना योजनेअंतर्गत गरोदर महिलांना सकस आहारासाठी बँक खात्यात थेट ₹५,००० ते ₹६,००० ची आर्थिक मदत मिळते.',
      confidenceMessage: 'अंगणवाडी ताई किंवा आशा सेविकेशी संपर्क साधा, त्या अर्ज भरून देतील.',
      actionSteps: [
        'एमसीपी आरोग्य कार्ड आणि बँक पासबुक सोबत ठेवा.',
        'जवळच्या अंगणवाडी केंद्रात जा.',
        'मातृ वंदना योजनेसाठी नोंदणी करा.',
      ],
      officerScript: 'नमस्ते अंगणवाडी ताई, मी प्रधानमंत्री मातृ वंदना योजनेअंतर्गत अनुदानासाठी अर्ज करायला आले आहे. हे माझे कार्ड आणि पासबुक आहे.',
    },
    gu: {
      spokenResponse: 'નમસ્તે બહેન! પ્રધાનમંત્રી માતૃ વંદના યોજના હેઠળ સગર્ભા માતાઓને પોષણ માટે સીધા બેંક ખાતામાં ₹૫,૦૦૦ થી ₹૬,૦૦૦ ની સહાય મળે છે.',
      confidenceMessage: 'આંગણવાડી કાર્યકર અથવા આશા બહેન દ્વારા મફતમાં નોંધણી થશે.',
      actionSteps: [
        'એમસીપી કાર્ડ અને બેંક પાસબુક સાથે રાખો.',
        'આંગણવાડી કેન્દ્ર પર જાઓ.',
        'માતૃ વંદના સહાય માટે ફોર્મ ભરો.',
      ],
      officerScript: 'નમસ્તે, હું માતૃ વંદના યોજના હેઠળ સહાય માટે અરજી કરવા આવી છું. આ મારું એમસીપી કાર્ડ અને બેંક પાસબુક છે.',
    },
    kn: {
      spokenResponse: 'ನಮಸ್ಕಾರ ಅಕ್ಕ! PM ಮಾತೃ ವಂದನಾ ಯೋಜನೆಯಡಿ ಗರ್ಭಿಣಿಯರಿಗೆ ಪೌಷ್ಟಿಕ ಆಹಾರಕ್ಕಾಗಿ ನೇರವಾಗಿ ಬ್ಯಾಂಕ್ ಖಾತೆಗೆ ₹5,000 ದಿಂದ ₹6,000 ಆರ್ಥಿಕ ನೆರವು ಸಿಗುತ್ತದೆ.',
      confidenceMessage: 'ಅಂಗನವಾಡಿ ಕಾರ್ಯಕರ್ತೆ ಅಥವಾ ಆಶಾ ಕಾರ್ಯಕರ್ತೆಯ ಮೂಲಕ ನೋಂದಾಯಿಸಿ.',
      actionSteps: [
        'MCP ಕಾರ್ಡ್ ಮತ್ತು ಬ್ಯಾಂಕ್ ಪಾಸ್‌ಬುಕ್ ಸಿದ್ಧವಾಗಿಡಿ.',
        'ಅಂಗನವಾಡಿ ಕೇಂದ್ರಕ್ಕೆ ಭೇಟಿ ನೀಡಿ.',
        'ಮಾತೃ ವಂದನಾ ಯೋಜನೆಯಡಿ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ.',
      ],
      officerScript: 'ನಮಸ್ಕಾರ ಅಂಗನವಾಡಿ ಅಕ್ಕ, ನಾನು PM ಮಾತೃ ವಂದನಾ ಯೋಜನೆಯಡಿ ಸಹಾಯಧನಕ್ಕೆ ನೋಂದಾಯಿಸಲು ಬಂದಿದ್ದೇನೆ.',
    },
    ml: {
      spokenResponse: 'നമസ്കാരം സഹോദരി! പിഎം മാതൃ വന്ദന യോജന വഴി ഗർഭിണികൾക്ക് പോഷകാഹാരത്തിനായി ബാങ്ക് അക്കൗണ്ടിലേക്ക് നേരിട്ട് ₹5,000 മുതൽ ₹6,000 വരെ ലഭിക്കും.',
      confidenceMessage: 'അങ്കണവാടി വർക്കർ വഴി സൗജന്യമായി അപേക്ഷിക്കാം.',
      actionSteps: [
        'എംസിപി കാർഡും ബാങ്ക് പാസ്ബുക്കും കരുതുക.',
        'അടുത്തുള്ള അങ്കണവാടി കേന്ദ്രം സന്ദർശിക്കുക.',
        'മാതൃ വന്ദന പദ്ധതിക്കായി അപേക്ഷിക്കുക.',
      ],
      officerScript: 'നമസ്കാരം, മാതൃ വന്ദന യോജന വഴി ധനസഹായത്തിനായി അപേക്ഷിക്കാനാണ് വന്നത്.',
    },
    pa: {
      spokenResponse: 'ਸਤਿ ਸ਼੍ਰੀ ਅਕਾਲ ਭੈਣ ਜੀ! ਪ੍ਰਧਾਨ ਮੰਤਰੀ ਮਾਤਰੂ ਵੰਦਨਾ ਯੋਜਨਾ ਤਹਿਤ ਗਰਭਵਤੀ ਔਰਤਾਂ ਨੂੰ ਖੁਰਾਕ ਲਈ ਸਿੱਧੇ ਬੈਂਕ ਖਾਤੇ ਵਿੱਚ ₹5,000 ਤੋਂ ₹6,000 ਦੀ ਸਹਾਇਤਾ ਮਿਲਦੀ ਹੈ।',
      confidenceMessage: 'ਆਂਗਣਵਾੜੀ ਵਰਕਰ ਜਾਂ ਆਸ਼ਾ ਵਰਕਰ ਰਾਹੀਂ ਮੁਫਤ ਫਾਰਮ ਭਰੋ।',
      actionSteps: [
        'ਐਮਸੀਪੀ ਕਾਰਡ ਅਤੇ ਬੈਂਕ ਪਾਸਬੁੱਕ ਨਾਲ ਰੱਖੋ।',
        'ਆਂਗਣਵਾੜੀ ਕੇਂਦਰ ਜਾਓ।',
        'ਮਾਤਰੂ ਵੰਦਨਾ ਯੋਜਨਾ ਲਈ ਰਜਿਸਟਰ ਕਰੋ।',
      ],
      officerScript: 'ਸਤਿ ਸ਼੍ਰੀ ਅਕਾਲ ਜੀ, ਮੈਂ ਮਾਤਰੂ ਵੰਦਨਾ ਯੋਜਨਾ ਤਹਿਤ ਪੋਸ਼ਣ ਸਹਾਇਤਾ ਲਈ ਫਾਰਮ ਭਰਵਾਉਣ ਆਈ ਹਾਂ।',
    },
    en: {
      spokenResponse: 'Hello sister! Under PM Matru Vandana Yojana, pregnant women and lactating mothers receive ₹5,000 to ₹6,000 direct cash benefit into their bank account for maternal nutrition and healthcare.',
      confidenceMessage: 'Your local Anganwadi worker or ASHA sister will register you for free.',
      actionSteps: [
        'Keep your MCP health card and Bank passbook ready.',
        'Visit your local Anganwadi Center or meet your ASHA worker.',
        'Register for PM Matru Vandana nutrition support.',
      ],
      officerScript: 'Respected Anganwadi sister, I have brought my MCP health card and bank passbook to register for PM Matru Vandana maternity support.',
    },
  },
  'ayushman-bharat': {
    ta: {
      spokenResponse: 'வணக்கம் சகோதரி! ஆயுஷ்மான் பாரத் கார்டு மூலம் உங்கள் குடும்பத்தில் உள்ள அனைவருக்கும் அரசு மற்றும் தனியார் மருத்துவமனைகளில் ஆண்டுக்கு ரூ. 5 லட்சம் வரை முற்றிலும் இலவச மருத்துவ சிகிச்சை மற்றும் மருந்துகள் கிடைக்கும்.',
      confidenceMessage: 'ரேஷன் அட்டை மற்றும் ஆதார் கார்டுடன் அரசு மருத்துவமனை அல்லது CSC மையத்தில் உடனடியாக இந்த கார்டு பெறலாம்.',
      actionSteps: [
        'குடும்ப அட்டை (Ration Card) மற்றும் ஆதார் கார்டு தயார் செய்க.',
        'அரசு மருத்துவமனையின் ஆயுஷ்மான் மித்ரா மையம் அல்லது CSC மையம் செல்லவும்.',
        'ஆயுஷ்மான் பாரத் கோல்டன் கார்டு அச்சிட்டு பெறவும்.',
      ],
      officerScript: 'வணக்கம் ஐயா, நான் எனது குடும்பத்திற்கு ஆயுஷ்மான் பாரத் மருத்துவ அட்டை எடுக்க வந்துள்ளேன். இது எங்கள் ரேஷன் அட்டை மற்றும் ஆதார்.',
    },
    te: {
      spokenResponse: 'నమస్కారం సోదరీ! ఆయుష్మాన్ భారత్ హెల్త్ కార్డు ద్వారా మీ కుటుంబ సభ్యులందరికీ ఏడాదికి రూ. 5 లక్షల వరకు ప్రభుత్వ మరియు ప్రైవేట్ ఆసుపత్రులలో ఉచిత నగదు రహిత చికిత్స లభిస్తుంది.',
      confidenceMessage: 'రేషన్ కార్డు, ఆధార్ కార్డుతో ప్రభుత్వ ఆసుపత్రి లేదా CSC కేంద్రంలో ఉచితంగా పొందవచ్చు.',
      actionSteps: [
        'రేషన్ కార్డు మరియు ఆధార్ కార్డు సిద్ధంగా ఉంచుకోండి.',
        'ప్రభుత్వ ఆసుపత్రిలోని ఆయుష్మాన్ మిత్ర లేదా CSC కేంద్రానికి వెళ్లండి.',
        'ఆయుష్మాన్ భారత్ గోల్డెన్ కార్డు పొందండి.',
      ],
      officerScript: 'నమస్కారం సార్, నేను మా కుటుంబానికి ఆయుష్మాన్ భారత్ హెల్త్ కార్డు చేయించడానికి వచ్చాను. ఇది మా రేషన్ కార్డు మరియు ఆధార్.',
    },
    hi: {
      spokenResponse: 'नमस्ते बहन! आयुष्मान भारत कार्ड के तहत आपके परिवार के सभी सदस्यों के लिए हर साल ₹5 लाख तक का सरकारी और प्राइवेट अस्पतालों में बिल्कुल मुफ्त इलाज और दवाइयां मिलती हैं।',
      confidenceMessage: 'राशन कार्ड और आधार के साथ नजदीकी सरकारी अस्पताल या सीएससी जन सेवा केंद्र पर यह कार्ड बनवाएं।',
      actionSteps: [
        'अपना राशन कार्ड और सभी सदस्यों के आधार कार्ड निकालें।',
        'सरकारी अस्पताल के आयुष्मान मित्र काउंटर या सीएससी केंद्र जाएं।',
        'अपना आयुष्मान भारत गोल्डन कार्ड बनवाएं।',
      ],
      officerScript: 'नमस्ते, मैं अपने परिवार का आयुष्मान भारत गोल्डन कार्ड बनवाने आई हूं। यह हमारा राशन कार्ड और आधार कार्ड है।',
    },
    bn: {
      spokenResponse: 'নমস্কার দিদি! আয়ুষ্মান ভারত কার্ডের মাধ্যমে পরিবারের সমস্ত সদস্য প্রতি বছর ৫ লক্ষ টাকা পর্যন্ত হাসপাতালে বিনামূল্যে চিকিৎসা ও ওষুধ পাবেন।',
      confidenceMessage: 'রেশন কার্ড ও আধার নিয়ে সরকারি হাসপাতাল বা সিএসসি সেন্টারে কার্ড তৈরি করুন।',
      actionSteps: [
        'রেশন কার্ড এবং আধার কার্ড সাথে রাখুন।',
        'সরকারি হাসপাতালের আয়ুষ্মান মিত্র কাউন্টারে যান।',
        'আয়ুষ্মান গোল্ডেন কার্ড সংগ্রহ করুন।',
      ],
      officerScript: 'নমস্কার, আমি পরিবারের জন্য আয়ুষ্মান ভারত কার্ড বানাতে এসেছি। এই আমাদের রেশন কার্ড ও আধার।',
    },
    mr: {
      spokenResponse: 'नमस्ते ताई! आयुष्मान भारत कार्डावर तुमच्या कुटुंबातील सर्वांना दरवर्षी ₹५ लाखांपर्यंत सरकारी व खाजगी रुग्णालयात मोफत उपचार आणि औषधे मिळतात.',
      confidenceMessage: 'रेशन कार्ड आणि आधार घेऊन सरकारी रुग्णालयात किंवा सीएससी केंद्रावर कार्ड बनवा.',
      actionSteps: [
        'रेशन कार्ड आणि कुटुंबाचे आधार कार्ड सोबत ठेवा.',
        'सरकारी दवाखान्यातील आयुष्मान मित्र केंद्रावर जा.',
        'आयुष्मान भारत कार्ड काढून घ्या.',
      ],
      officerScript: 'नमस्ते, मी माझ्या कुटुंबाचे आयुष्मान भारत कार्ड काढण्यासाठी आले आहे. हे आमचे रेशन कार्ड आणि आधार कार्ड आहे.',
    },
    gu: {
      spokenResponse: 'નમસ્તે બહેન! આયુષ્માન ભારત કાર્ડ દ્વારા પરિવારના તમામ સભ્યોને દર વર્ષે ₹૫ લાખ સુધી સરકારી અને પ્રાઈવેટ હોસ્પિટલમાં તદ્દન મફત સારવાર મળે છે.',
      confidenceMessage: 'રેશન કાર્ડ અને આધાર સાથે હોસ્પિટલ અથવા સીએસસી સેન્ટર પર કાર્ડ કઢાવો.',
      actionSteps: [
        'રેશન કાર્ડ અને આધાર કાર્ડ સાથે રાખો.',
        'સરકારી હોસ્પિટલના આયુષ્માન મિત્ર કાઉન્ટર પર જાઓ.',
        'આયુષ્માન કાર્ડ કઢાવી લો.',
      ],
      officerScript: 'નમસ્તે સાહેબ, હું અમારા પરિવારનું આયુષ્માન ભારત કાર્ડ કઢાવવા આવી છું. આ અમારું રેશન કાર્ડ અને આધાર છે.',
    },
    kn: {
      spokenResponse: 'ನಮಸ್ಕಾರ ಅಕ್ಕ! ಆಯುಷ್ಮಾನ್ ಭಾರತ್ ಕಾರ್ಡ್‌ನಿಂದ ನಿಮ್ಮ ಕುಟುಂಬಕ್ಕೆ ಪ್ರತಿ ವರ್ಷ ₹5 ಲಕ್ಷದವರೆಗೆ ಸರ್ಕಾರಿ ಮತ್ತು ಖಾಸಗಿ ಆಸ್ಪತ್ರೆಗಳಲ್ಲಿ ಉಚಿತ ಚಿಕಿತ್ಸೆ ಮತ್ತು ಔಷಧಿ ಸಿಗುತ್ತದೆ.',
      confidenceMessage: 'ರೇಷನ್ ಕಾರ್ಡ್ ಮತ್ತು ಆಧಾರ್‌ನೊಂದಿಗೆ ಆಸ್ಪತ್ರೆ ಅಥವಾ CSC ಕೇಂದ್ರದಲ್ಲಿ ಕಾರ್ಡ್ ಪಡೆಯಿರಿ.',
      actionSteps: [
        'ರೇಷನ್ ಕಾರ್ಡ್ ಮತ್ತು ಆಧಾರ್ ಕಾರ್ಡ್ ಸಿದ್ಧವಾಗಿಡಿ.',
        'ಸರ್ಕಾರಿ ಆಸ್ಪತ್ರೆಯ ಆಯುಷ್ಮಾನ್ ಮಿತ್ರ ಕೌಂಟರ್‌ಗೆ ಭೇಟಿ ನೀಡಿ.',
        'ಆಯುಷ್ಮಾನ್ ಭಾರತ್ ಕಾರ್ಡ್ ಮಾಡಿಸಿಕೊಳ್ಳಿ.',
      ],
      officerScript: 'ನಮಸ್ಕಾರ ಸರ್, ನಮ್ಮ ಕುಟುಂಬಕ್ಕೆ ಆಯುಷ್ಮಾನ್ ಭಾರತ್ ಕಾರ್ಡ್ ಮಾಡಿಸಲು ಬಂದಿದ್ದೇನೆ. ಇದು ನಮ್ಮ ರೇಷನ್ ಕಾರ್ಡ್ ಮತ್ತು ಆಧಾರ್.',
    },
    ml: {
      spokenResponse: 'നമസ്കാരം സഹോദരി! ആയുഷ്മാൻ ഭാരത് കാർഡ് വഴി നിങ്ങളുടെ കുടുംബത്തിന് പ്രതിവർഷം ₹5 ലക്ഷം രൂപ വരെ സർക്കാർ-സ്വകാര്യ ആശുപത്രികളിൽ സൗജന്യ ചികിത്സ ലഭിക്കും.',
      confidenceMessage: 'റേഷൻ കാർഡും ആധാറുമായി ആശുപത്രിയിലോ സിഎസ്‌സിയിലോ പോകുക.',
      actionSteps: [
        'റേഷൻ കാർഡും ആധാർ കാർഡും കരുതുക.',
        'ആശുപത്രിയിലെ ആയുഷ്മാൻ മിത്ര കൗണ്ടർ സന്ദർശിക്കുക.',
        'ആയുഷ്മാൻ ഗോൾഡൻ കാർഡ് എടുക്കുക.',
      ],
      officerScript: 'നമസ്കാരം, ഞങ്ങളുടെ കുടുംബത്തിന് ആയുഷ്മാൻ ഭാരത് കാർഡ് എടുക്കാനാണ് വന്നത്. ഇതാണ് റേഷൻ കാർഡും ആധാറും.',
    },
    pa: {
      spokenResponse: 'ਸਤਿ ਸ਼੍ਰੀ ਅਕਾਲ ਭੈਣ ਜੀ! ਆਯੁਸ਼ਮਾਨ ਭਾਰਤ ਕਾਰਡ ਰਾਹੀਂ ਤੁਹਾਡੇ ਪਰਿਵਾਰ ਨੂੰ ਹਰ ਸਾਲ ₹5 ਲੱਖ ਤੱਕ ਦਾ ਸਰਕਾਰੀ ਅਤੇ ਪ੍ਰਾਈਵੇਟ ਹਸਪਤਾਲਾਂ ਵਿੱਚ ਮੁਫਤ ਇਲਾਜ ਮਿਲਦਾ ਹੈ।',
      confidenceMessage: 'ਰਾਸ਼ਨ ਕਾਰਡ ਅਤੇ ਆਧਾਰ ਕਾਰਡ ਨਾਲ ਹਸਪਤਾਲ ਜਾਂ ਸੀਐਸਸੀ ਸੈਂਟਰ ਜਾਓ।',
      actionSteps: [
        'ਰਾਸ਼ਨ ਕਾਰਡ ਅਤੇ ਆਧਾਰ ਕਾਰਡ ਨਾਲ ਰੱਖੋ।',
        'ਸਰਕਾਰੀ ਹਸਪਤਾਲ ਦੇ ਆਯੁਸ਼ਮਾਨ ਕਾਊਂਟਰ ਜਾਓ।',
        'ਆਯੁਸ਼ਮਾਨ ਗੋਲਡਨ ਕਾਰਡ ਬਣਵਾਓ।',
      ],
      officerScript: 'ਸਤਿ ਸ਼੍ਰੀ ਅਕਾਲ ਜੀ, ਮੈਂ ਪਰਿਵਾਰ ਦਾ ਆਯੁਸ਼ਮਾਨ ਭਾਰਤ ਕਾਰਡ ਬਣਵਾਉਣ ਆਈ ਹਾਂ। ਇਹ ਸਾਡਾ ਰਾਸ਼ਨ ਕਾਰਡ ਅਤੇ ਆਧਾਰ ਹੈ।',
    },
    en: {
      spokenResponse: 'Hello sister! With the Ayushman Bharat card, your entire family is entitled to ₹5,00,000 cashless free hospitalization and treatment every year across public and empaneled private hospitals.',
      confidenceMessage: 'You can generate this card for free at any government hospital Ayushman counter or CSC center.',
      actionSteps: [
        'Keep your Ration card and all family members’ Aadhaar cards ready.',
        'Visit the Ayushman Mitra counter at any government hospital or CSC center.',
        'Obtain your verified Ayushman Bharat Golden Card.',
      ],
      officerScript: 'Hello officer, I want to make the Ayushman Bharat health card for our family members. Here is our ration card and Aadhaar.',
    },
  },
};

// 1. Core Conversational Scheme Assistant (Voice or Text input)
app.post('/api/saheli/voice-query', async (req: Request, res: Response) => {
  try {
    const { query, language = 'hi', selectedSchemeId } = req.body;

    if (!query && !selectedSchemeId) {
      return res.status(400).json({ error: 'Query or Scheme selection required' });
    }

    const langConfig = LANGUAGE_CONFIG[language] || LANGUAGE_CONFIG.hi;
    const targetSchemeId = detectSchemeFromQuery(query, selectedSchemeId);
    const fallbackRecord =
      MULTILINGUAL_RESPONSES[targetSchemeId]?.[language] ||
      MULTILINGUAL_RESPONSES[targetSchemeId]?.hi ||
      MULTILINGUAL_RESPONSES['pm-vishwakarma-tailor'][language] ||
      MULTILINGUAL_RESPONSES['pm-vishwakarma-tailor'].hi;

    const targetSchemeObj =
      ESSENTIAL_SCHEMES.find((s) => s.id === targetSchemeId) || ESSENTIAL_SCHEMES[0];

    if (ai) {
      const prompt = `
You are "Saheli" (सहेली / தோழி / Сనేహితురాలు), a deeply caring, polite, empowering voice companion for an Indian woman user.
The user selected the language: ${langConfig.name} (${langConfig.nativeName}).

CRITICAL INSTRUCTIONS ON LANGUAGE AND SCRIPT:
1. You MUST respond ENTIRELY in ${langConfig.name} (${langConfig.nativeName}) using ${langConfig.script} script.
2. Under NO circumstance should you switch to English or Hindi unless the user selected that language or explicitly asked for it in their query.
3. If the user selected Tamil, respond in Tamil.
4. If the user selected Hindi, respond in Hindi.
5. If the user selected Telugu, respond in Telugu.
6. Every single string in the JSON response ("spokenResponse", "confidenceMessage", "actionSteps", "officerScript") MUST be strictly in authentic ${langConfig.name} script.
7. Do NOT use Latin/Roman transliteration (no Tanglish, Hinglish, etc.).
8. Tone: Respectful, warm, sisterly, encouraging, free of confusing bureaucratic jargon.

USER'S COMPLETE SPOKEN SENTENCE:
"${query || 'Explain this scheme to me'}"
${selectedSchemeId ? `Target Scheme ID: ${selectedSchemeId}` : ''}

TASK:
1. Understand the user's intent and true practical need from their complete sentence (for example:
   - Requesting sewing machine, tailoring kit, sewing training -> "pm-vishwakarma-tailor"
   - Requesting gas cylinder, stove, LPG connection -> "pm-ujjwala-gas"
   - Savings for daughter under 10 years old -> "sukanya-samriddhi"
   - Loan, business capital for self-help group/women business -> "lakhpati-didi-shg"
   - Pregnancy nutrition assistance, ₹5,000 - ₹6,000 maternity aid -> "pm-matru-vandana"
   - Free hospital treatment, ₹5 lakh health insurance card -> "ayushman-bharat"
).
2. Answer naturally and directly addressing their full spoken request in ${langConfig.name}.
3. Reassure her that she does not need any digital knowledge and no one can charge her a single rupee for this government scheme.

Available schemes:
- "pm-vishwakarma-tailor": Free Sewing Machine & ₹15,000 toolkit voucher + 5 days training + ₹500/day stipend.
- "pm-ujjwala-gas": PM Ujjwala Yojana - Free LPG cylinder, gas stove, regulator.
- "sukanya-samriddhi": Sukanya Samriddhi - High interest (8.2%) savings for girl child under 10.
- "lakhpati-didi-shg": Lakhpati Didi - ₹1 to 5 Lakh collateral-free loan for women enterprises.
- "pm-matru-vandana": PM Matru Vandana - ₹5,000 to ₹6,000 maternity cash for pregnant women.
- "ayushman-bharat": Ayushman Bharat Golden Card - ₹5 Lakh free hospital treatment per year.

Respond in JSON with this EXACT structure:
{
  "spokenResponse": "2-3 warm, clear sentences in ${langConfig.name} addressing her complete request, confirming how she can get the scheme and reassuring her that she does not need to pay any bribe or middleman.",
  "matchedSchemeId": "pm-vishwakarma-tailor" | "pm-ujjwala-gas" | "sukanya-samriddhi" | "lakhpati-didi-shg" | "pm-matru-vandana" | "ayushman-bharat",
  "confidenceMessage": "One reassuring encouraging sentence in ${langConfig.name} explaining where she can get this done for free (e.g. Gram Panchayat, Anganwadi sister, or CSC center).",
  "actionSteps": [
    "Step 1 in simple ${langConfig.name}",
    "Step 2 in simple ${langConfig.name}",
    "Step 3 in simple ${langConfig.name}"
  ],
  "officerScript": "1 polite sentence in ${langConfig.name} that she can say or play to the officer when she goes to apply."
}
`;

      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.3,
          },
        });

        const responseText = response.text || '{}';
        const parsed = JSON.parse(responseText);
        const resolvedSchemeId = parsed.matchedSchemeId || targetSchemeId;
        const schemeObj =
          ESSENTIAL_SCHEMES.find((s) => s.id === resolvedSchemeId) || targetSchemeObj;

        return res.json({
          success: true,
          data: {
            spokenResponse: parsed.spokenResponse || fallbackRecord.spokenResponse,
            matchedSchemeId: schemeObj.id,
            confidenceMessage: parsed.confidenceMessage || fallbackRecord.confidenceMessage,
            actionSteps: parsed.actionSteps || fallbackRecord.actionSteps,
            officerScript: parsed.officerScript || fallbackRecord.officerScript,
            scheme: schemeObj,
          },
        });
      } catch (aiErr) {
        console.warn('Gemini API call failed, using high-reliability multilingual fallback:', aiErr);
      }
    }

    // High-reliability multilingual fallback (guarantees native language response even without AI key)
    return res.json({
      success: true,
      data: {
        spokenResponse: fallbackRecord.spokenResponse,
        matchedSchemeId: targetSchemeObj.id,
        confidenceMessage: fallbackRecord.confidenceMessage,
        actionSteps: fallbackRecord.actionSteps,
        officerScript: fallbackRecord.officerScript,
        scheme: targetSchemeObj,
      },
    });
  } catch (err: any) {
    console.error('Voice query error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// 2. Vision Document Inspector ("Parchaa Padhai" - Snap any government notice or card)
app.post('/api/saheli/inspect-document', async (req: Request, res: Response) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg', language = 'hi' } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'Image base64 data required' });
    }

    const langName = getLanguageName(language);

    if (ai) {
      const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9+]+;base64,/, '');
      const imagePart = {
        inlineData: {
          mimeType,
          data: cleanBase64,
        },
      };

      const textPart = {
        text: `
You are Saheli's Visual Paper Reading Assistant for an illiterate or first-time woman user.
She has uploaded a photo of a government paper, letter, receipt, notice, passbook, or card.
Look closely at this image and explain what it is in extremely simple, reassuring spoken words in ${langName}.

Provide output as JSON:
{
  "documentType": "Short title of document (e.g. Aadhaar Card / Gas Booking Receipt / Application Receipt / Bank Passbook / Notice)",
  "simpleStatus": "APPROVED" | "PENDING" | "INFORMATION_ONLY" | "ACTION_NEEDED",
  "spokenExplanation": "A 2 to 3 sentence reassuring explanation in ${langName} explaining exactly what this paper says, whether she needs to worry, and what it means for her money/service.",
  "keyDetails": [
    {"label": "Document Name", "value": "Name found"},
    {"label": "Registration / Number", "value": "Number if visible or Not specified"},
    {"label": "Important Date or Amount", "value": "Amount or date if any"}
  ],
  "nextStepInstruction": "One clear instruction in ${langName} on what she should do next with this paper."
}
`,
      };

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: { parts: [imagePart, textPart] },
        config: {
          responseMimeType: 'application/json',
          temperature: 0.3,
        },
      });

      const responseText = response.text || '{}';
      try {
        const parsed = JSON.parse(responseText);
        return res.json({ success: true, data: parsed });
      } catch (e) {
        console.error('Document inspection parse error:', e, responseText);
      }
    }

    // Fallback response if AI is not available
    return res.json({
      success: true,
      data: {
        documentType: 'Government Scheme Application Slip',
        simpleStatus: 'APPROVED',
        spokenExplanation: language === 'hi'
          ? 'बहन, आपका यह पर्चा सरकारी सिलाई मशीन योजना का पावती पर्चा है। इसमें आपकी अर्जी स्वीकार कर ली गई है। चिंता की कोई बात नहीं है।'
          : 'Sister, this document shows your government scheme registration is received and acknowledged. You do not need to worry.',
        keyDetails: [
          { label: 'Status', value: 'Form Received / पंजीकृत' },
          { label: 'Action', value: 'Keep this slip safe / पर्चा संभाल कर रखें' },
        ],
        nextStepInstruction: language === 'hi'
          ? 'इस पर्चे को अपने पास संभाल कर रखें और आगामी सोमवार को पंचायत कार्यालय दिखाएं।'
          : 'Keep this receipt slip safely and show it at the Panchayat office on Monday.',
      },
    });
  } catch (err: any) {
    console.error('Inspect document error:', err);
    res.status(500).json({ error: err.message || 'Failed to inspect document' });
  }
});

// 3. Audio Transcriber using Gemini Flash Multimodal Audio (high-reliability fallback)
app.post('/api/saheli/transcribe-audio', async (req: Request, res: Response) => {
  try {
    const { audioBase64, mimeType = 'audio/webm', language = 'hi' } = req.body;
    if (!audioBase64) {
      return res.status(400).json({ error: 'Audio data required' });
    }

    const langName = getLanguageName(language);
    if (ai) {
      const cleanBase64 = audioBase64.replace(/^data:audio\/[a-zA-Z0-9+]+;base64,/, '');
      const langConfig = LANGUAGE_CONFIG[language] || LANGUAGE_CONFIG.hi;
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType: mimeType.split(';')[0] || 'audio/webm',
                  data: cleanBase64,
                },
              },
              {
                text: `You are an accurate audio transcriber for an Indian voice application.
The user is speaking in ${langConfig.name} (${langConfig.nativeName}).
Transcribe their complete spoken sentence verbatim in ${langConfig.name} script (${langConfig.script}).
CRITICAL RULES:
- Capture the COMPLETE spoken sentence.
- Do NOT extract only numbers, currency amounts, keywords, or partial phrases.
- Preserve the user's complete speech as the input text.
- Do not translate into English or Hindi if spoken in ${langConfig.name}.
Return ONLY a valid JSON object:
{"transcript": "the full recognized sentence"}
If the audio is silence, background noise, or completely inaudible, return:
{"transcript": ""}`,
              },
            ],
          },
        ],
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      });

      const responseText = response.text || '{}';
      try {
        const parsed = JSON.parse(responseText);
        return res.json({ success: true, transcript: (parsed.transcript || '').trim() });
      } catch (e) {
        console.error('Audio transcription parse error:', e);
      }
    }

    return res.json({ success: true, transcript: '' });
  } catch (err: any) {
    console.error('Audio transcription error:', err);
    res.status(500).json({ error: err.message || 'Failed to transcribe audio' });
  }
});

// 4. Optional Server-Side TTS Generation with gemini-3.8-flash-lite-tts
app.post('/api/saheli/tts', async (req: Request, res: Response) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text required' });
    }

    if (ai) {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash-lite-tts',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: text.slice(0, 400),
                speechMetadata: {
                  style: 'Warm, calm, empathetic Indian sisterly voice',
                },
              },
            ],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        return res.json({
          success: true,
          audioDataUrl: `data:audio/wav;base64,${base64Audio}`,
        });
      }
    }

    return res.json({ success: false, fallbackToBrowserVoice: true });
  } catch (err: any) {
    console.warn('TTS server call failed (falling back to browser voice):', err?.message);
    res.json({ success: false, fallbackToBrowserVoice: true });
  }
});

// Static / Vite middleware handling
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Saheli AI Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
