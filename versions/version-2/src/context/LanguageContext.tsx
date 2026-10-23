import React, { createContext, useContext, useState, useEffect } from 'react';

export type LanguageCode = 'en' | 'hi' | 'ta' | 'te' | 'mr' | 'bn' | 'kn' | 'ml' | 'gu' | 'pa';

export interface LanguageInfo {
  code: LanguageCode;
  name: string;
  nativeName: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', flag: '🇮🇳' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', flag: '🇮🇳' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', flag: '🇮🇳' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', flag: '🇮🇳' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', flag: '🇮🇳' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
];

export const TRANSLATIONS: Record<LanguageCode, Record<string, string>> = {
  en: {
    imageToVideo: 'Image to Video',
    textToVideo: 'Text to Video',
    studio: 'Studio',
    livePreview: 'LIVE PREVIEW',
    export: 'Export 9:16',
    credits: 'cr',
    generateVideo: 'Generate Video',
    promptPlaceholder: 'Enter custom instructions or prompt for cinematic video generation...',
    promptEnhancer: 'Prompt Enhancer',
    selectLanguage: 'Select Language',
    compareModels: 'Compare Models',
    history: 'History',
    privacy: 'Privacy Policy',
    terms: 'Terms of Service',
    contact: 'Contact Support',
    cropRatio: 'Crop Ratio',
    duration: 'Duration',
    maxImages: 'Up to 10 Images',
  },
  hi: {
    imageToVideo: 'इमेज टू वीडियो',
    textToVideo: 'टेक्स्ट टू वीडियो',
    studio: 'स्टूडियो',
    livePreview: 'लाइव पूर्वावलोकन',
    export: 'एक्सपोर्ट 9:16',
    credits: 'क्रेडिट',
    generateVideo: 'वीडियो बनाएं',
    promptPlaceholder: 'सिनेमैटिक वीडियो जनरेशन के लिए निर्देश या प्रॉम्प्ट दर्ज करें...',
    promptEnhancer: 'प्रॉम्प्ट एन्हान्सर',
    selectLanguage: 'भाषा चुनें',
    compareModels: 'मॉडल तुलना',
    history: 'इतिहास',
    privacy: 'गोपनीयता नीति',
    terms: 'सेवा की शर्तें',
    contact: 'सहायता संपर्क',
    cropRatio: 'क्रॉप अनुपात',
    duration: 'अवधि',
    maxImages: 'अधिकतम 10 इमेज',
  },
  ta: {
    imageToVideo: 'படத்திலிருந்து வீடியோ',
    textToVideo: 'உரையிலிருந்து வீடியோ',
    studio: 'ஸ்டுடியோ',
    livePreview: 'நேரலை முன்னோட்டம்',
    export: 'ஏற்றுமதி 9:16',
    credits: 'கிரெடிட்',
    generateVideo: 'வீடியோவை உருவாக்குங்கள்',
    promptPlaceholder: 'சினிமா வீடியோ உருவாக்கத்திற்கான வழிகாட்டலை உள்ளிடவும்...',
    promptEnhancer: 'ப்ராம்ப்ட் மேன்மைப்படுத்துபவர்',
    selectLanguage: 'மொழியைத் தேர்ந்தெடுக்கவும்',
    compareModels: 'மாடல்களை ஒப்பிடுங்கள்',
    history: 'வரலாறு',
    privacy: 'தனியுரிமைக் கொள்கை',
    terms: 'சேவை விதிமுறைகள்',
    contact: 'ஆதரவு தொடர்பு',
    cropRatio: 'விகிதம்',
    duration: 'காலஅளவு',
    maxImages: '10 படங்கள் வரை',
  },
  te: {
    imageToVideo: 'ఇమేజ్ నుండి వీడియో',
    textToVideo: 'టెక్స్ట్ నుండి వీడియో',
    studio: 'స్టూడియో',
    livePreview: 'లైవ్ ప్రివ్యూ',
    export: 'ఎగుమతి 9:16',
    credits: 'క్రెడిట్స్',
    generateVideo: 'వీడియోను రూపొందించండి',
    promptPlaceholder: 'సినమాటిక్ వీడియో రూపకల్పన కోసం ప్రాంప్ట్ ఎంటర్ చేయండి...',
    promptEnhancer: 'ప్రాంప్ట్ ఎన్‌హ్యాన్సర్',
    selectLanguage: 'భాషను ఎంచుకోండి',
    compareModels: 'మోడల్స్‌ను పోల్చండి',
    history: 'చరిత్ర',
    privacy: 'గోప్యతా విధానం',
    terms: 'సేవా నిబంధనలు',
    contact: 'సపోర్ట్ సంప్రదించండి',
    cropRatio: 'క్రాప్ నిష్పత్తి',
    duration: 'వ్యవధి',
    maxImages: 'గరిష్టంగా 10 ఇమేజ్‌లు',
  },
  mr: {
    imageToVideo: 'इमेज टू व्हिडिओ',
    textToVideo: 'टेक्स्ट टू व्हिडिओ',
    studio: 'स्टुडिओ',
    livePreview: 'थेट पूर्वावलोकन',
    export: 'एक्सपोर्ट 9:16',
    credits: 'क्रेडिट',
    generateVideo: 'व्हिडिओ तयार करा',
    promptPlaceholder: 'सिनेमॅटिक व्हिडिओ निर्मितीसाठी सूचना किंवा प्रॉम्प्ट प्रविष्ट करा...',
    promptEnhancer: 'प्रॉम्प्ट सुधारक',
    selectLanguage: 'भाषा निवडा',
    compareModels: 'मॉडेल्सची तुलना करा',
    history: 'इतिहास',
    privacy: 'गोपनीयता धोरण',
    terms: 'सेवा अटी',
    contact: 'सहाय्य संपर्क',
    cropRatio: 'क्रॉप गुणोत्तर',
    duration: 'कालावधी',
    maxImages: '१० इमेज पर्यंत',
  },
  bn: {
    imageToVideo: 'ছবি থেকে ভিডিও',
    textToVideo: 'টেক্সট থেকে ভিডিও',
    studio: 'স্টুডিও',
    livePreview: 'লাইভ প্রিভিউ',
    export: 'এক্সপোর্ট 9:16',
    credits: 'ক্রেডিট',
    generateVideo: 'ভিডিও তৈরি করুন',
    promptPlaceholder: 'সিনেমেটিক ভিডিও তৈরির নির্দেশনা বা প্রম্পট লিখুন...',
    promptEnhancer: 'প্রম্পট এনহ্যান্সার',
    selectLanguage: 'ভাষা নির্বাচন করুন',
    compareModels: 'মডেল তুলনা করুন',
    history: 'ইতিহাস',
    privacy: 'গোপনীয়তা নীতি',
    terms: 'ব্যবহারের শর্তাবলী',
    contact: 'সহায়তা সংযোগ',
    cropRatio: 'ক্রপ অনুপাত',
    duration: 'সময়কাল',
    maxImages: 'সর্বোচ্চ ১০টি ছবি',
  },
  kn: {
    imageToVideo: 'ಇಮೇಜ್ ನಿಂದ ವೀಡಿಯೊ',
    textToVideo: 'ಪಠ್ಯದಿಂದ ವೀಡಿಯೊ',
    studio: 'ಸ್ಟುಡಿಯೋ',
    livePreview: 'ಲೈವ್ ಮುನ್ನೋಟ',
    export: 'ರಫ್ತು 9:16',
    credits: 'ಕ್ರೆಡಿಟ್‌ಗಳು',
    generateVideo: 'ವೀಡಿಯೊ ರಚಿಸಿ',
    promptPlaceholder: 'ಸಿನೆಮ್ಯಾಟಿಕ್ ವೀಡಿಯೊ ರಚನೆಗಾಗಿ ಪ್ರಾಂಪ್ಟ್ ನಮೂದಿಸಿ...',
    promptEnhancer: 'ಪ್ರಾಪ್ಟ್ ವೃದ್ಧಕ',
    selectLanguage: 'ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ',
    compareModels: 'ಮಾಡೆಲ್‌ಗಳನ್ನು ಹೋಲಿಸಿ',
    history: 'ಇತಿಹಾಸ',
    privacy: 'ಗೌಪ್ಯತಾ ನೀತಿ',
    terms: 'ಸೇವಾ ನಿಯಮಗಳು',
    contact: 'ಬೆಂಬಲ ಸಂಪರ್ಕ',
    cropRatio: 'ಕ್ರಾಪ್ ಅನುಪಾತ',
    duration: 'ಅವಧಿ',
    maxImages: 'ಗರಿಷ್ಠ 10 ಚಿತ್ರಗಳು',
  },
  ml: {
    imageToVideo: 'ഇമേജിൽ നിന്ന് വീഡിയോ',
    textToVideo: 'ടെക്സ്റ്റിൽ നിന്ന് വീഡിയോ',
    studio: 'സ്റ്റുഡിയോ',
    livePreview: 'ലൈവ് പ്രിവ്യൂ',
    export: 'എക്സ്പോർട്ട് 9:16',
    credits: 'ക്രഡിറ്റുകൾ',
    generateVideo: 'വീഡിയോ ഉണ്ടാക്കുക',
    promptPlaceholder: 'സിനിമാറ്റിക് വീഡിയോ നിർമ്മാണത്തിനുള്ള നിർദ്ദേശം നൽകുക...',
    promptEnhancer: 'പ്രോംപ്റ്റ് എൻഹാൻസർ',
    selectLanguage: 'ഭാഷ തിരഞ്ഞെടുക്കുക',
    compareModels: 'മോഡലുകൾ താരതമ്യം ചെയ്യുക',
    history: 'ചരിത്രം',
    privacy: 'സ്വകാര്യതാ നയം',
    terms: 'സേവന വ്യവസ്ഥകൾ',
    contact: 'പിന്തുണ കോൺടാക്റ്റ്',
    cropRatio: 'ക്രോപ്പ് അനുപാതം',
    duration: 'ദൈർഘ്യം',
    maxImages: 'പരമാവധി 10 ഇമേജുകൾ',
  },
  gu: {
    imageToVideo: 'ઈમેજ ટુ વિડીયો',
    textToVideo: 'ટેક્સ્ટ ટુ વિડીયો',
    studio: 'સ્ટુડિયો',
    livePreview: 'લાઇવ પ્રિવ્યૂ',
    export: 'એક્સપોર્ટ 9:16',
    credits: 'ક્રેડિટ',
    generateVideo: 'વિડીયો બનાવો',
    promptPlaceholder: 'સિનેમેટિક વિડીયો બનાવવા માટેની સૂચનાઓ લખો...',
    promptEnhancer: 'પ્રૉમ્પ્ટ એનહાન્સર્સ',
    selectLanguage: 'ભાષા પસંદ કરો',
    compareModels: 'મોડેલ્સની સરખામણી કરો',
    history: 'ઇતિહાસ',
    privacy: 'ગોપનીયતા નીતિ',
    terms: 'સેવાની શરતો',
    contact: 'સપોર્ટ સંપર્ક',
    cropRatio: 'ક્રોપ રેશિયો',
    duration: 'સમયગાળો',
    maxImages: 'મહત્તમ 10 ઈમેજો',
  },
  pa: {
    imageToVideo: 'ਇਮੇਜ ਤੋਂ ਵੀਡੀਓ',
    textToVideo: 'ਟੈਕਸਟ ਤੋਂ ਵੀਡੀਓ',
    studio: 'ਸਟੂਡੀਓ',
    livePreview: 'ਲਾਈਵ ਪ੍ਰੀਵਿਊ',
    export: 'ਐਕਸਪੋਰਟ 9:16',
    credits: 'ਕ੍ਰੈਡਿਟ',
    generateVideo: 'ਵੀਡੀਓ ਬਣਾਓ',
    promptPlaceholder: 'ਸਿਨੇਮੈਟਿਕ ਵੀਡੀਓ ਬਣਾਉਣ ਲਈ ਹਦਾਇਤਾਂ ਦਰਜ ਕਰੋ...',
    promptEnhancer: 'ਪ੍ਰੌਮਪਟ ਐਨਹਾਂਸਰ',
    selectLanguage: 'ਭਾਸ਼ਾ ਚੁਣੋ',
    compareModels: 'ਮਾਡਲਾਂ ਦੀ ਤੁਲਨਾ ਕਰੋ',
    history: 'ਇਤਿਹਾਸ',
    privacy: 'ਗੋਪਨੀਯਤਾ ਨੀਤੀ',
    terms: 'ਸੇਵਾ ਦੀਆਂ ਸ਼ਰਤਾਂ',
    contact: 'ਸਹਾਇਤਾ ਸੰਪਰਕ',
    cropRatio: 'ਕਰੋਪ ਅਨੁਪਾਤ',
    duration: 'ਮਿਆਦ',
    maxImages: 'ਵੱਧ ਤੋਂ ਵੱਧ 10 ਤਸਵੀਰਾਂ',
  },
};

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string) => string;
  currentLangInfo: LanguageInfo;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nexverze_lang') as LanguageCode;
      if (saved && TRANSLATIONS[saved]) return saved;
    }
    return 'en';
  });

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('nexverze_lang', lang);
    }
  };

  const t = (key: string): string => {
    return TRANSLATIONS[language]?.[key] || TRANSLATIONS['en']?.[key] || key;
  };

  const currentLangInfo = SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, currentLangInfo }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
