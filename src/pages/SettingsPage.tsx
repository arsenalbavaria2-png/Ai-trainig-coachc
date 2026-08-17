import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useLocale } from '../hooks/useLocale';
import { Language } from '../types';

const SettingsPage = () => {
  const navigate = useNavigate();
  const { t, language, setLanguage: setLocaleLanguage } = useLocale();
  const { user, setUser, setLanguage, resetProgress } = useStore();

  const handleLanguageChange = (lang: Language) => {
    setLocaleLanguage(lang);
    setLanguage(lang);
  };

  const toggleSound = () => {
    if (!user) return;
    setUser({ ...user, settings: { ...user.settings, soundEnabled: !user.settings.soundEnabled } });
  };

  const toggleMirror = () => {
    if (!user) return;
    setUser({ ...user, settings: { ...user.settings, cameraMirror: !user.settings.cameraMirror } });
  };

  const handleReset = () => {
    if (window.confirm(t('settings.resetConfirm'))) {
      resetProgress();
    }
  };

  const languages: { code: Language; label: string }[] = [
    { code: 'en', label: 'English' },
    { code: 'ru', label: 'Русский' },
    { code: 'uz', label: "O'zbekcha" },
  ];

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate('/')} className="text-white/70 text-2xl">←</button>
        <h1 className="text-2xl font-bold">{t('settings.title')}</h1>
      </div>

      <div className="space-y-6 max-w-md">
        <div>
          <div className="text-sm text-white/60 mb-2">{t('settings.language')}</div>
          <div className="flex gap-2">
            {languages.map((l) => (
              <button
                key={l.code}
                onClick={() => handleLanguageChange(l.code)}
                className={`px-4 py-2 rounded-lg font-semibold ${
                  language === l.code ? 'bg-red-600 text-white' : 'bg-gray-800 text-white/70'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between bg-gray-800/50 p-4 rounded-lg">
          <span>{t('settings.sound')}</span>
          <button
            onClick={toggleSound}
            className={`w-12 h-7 rounded-full transition-colors ${user?.settings.soundEnabled ? 'bg-red-600' : 'bg-gray-600'}`}
          >
            <div
              className={`w-5 h-5 bg-white rounded-full transition-transform mx-1 ${
                user?.settings.soundEnabled ? 'translate-x-5' : ''
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between bg-gray-800/50 p-4 rounded-lg">
          <span>{t('settings.cameraMirror')}</span>
          <button
            onClick={toggleMirror}
            className={`w-12 h-7 rounded-full transition-colors ${user?.settings.cameraMirror ? 'bg-red-600' : 'bg-gray-600'}`}
          >
            <div
              className={`w-5 h-5 bg-white rounded-full transition-transform mx-1 ${
                user?.settings.cameraMirror ? 'translate-x-5' : ''
              }`}
            />
          </button>
        </div>

        <button
          onClick={handleReset}
          className="w-full bg-gray-800 hover:bg-red-900 text-white py-3 rounded-lg font-semibold"
        >
          {t('settings.reset')}
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;
