import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useLocale } from '../hooks/useLocale';

const LevelsPage = () => {
  const navigate = useNavigate();
  const { t } = useLocale();
  const { levels, startWorkout } = useStore();

  const handleSelect = (levelId: number, unlocked: boolean) => {
    if (!unlocked) return;
    startWorkout(levelId);
    navigate('/workout');
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 pb-16">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/')} className="text-white/70 text-2xl">←</button>
        <h1 className="text-2xl font-bold">{t('levels.title')}</h1>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {levels.map((lvl) => (
          <button
            key={lvl.id}
            onClick={() => handleSelect(lvl.id, lvl.unlocked)}
            disabled={!lvl.unlocked}
            className={`aspect-square rounded-lg flex flex-col items-center justify-center font-bold text-lg transition-colors ${
              lvl.unlocked
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-gray-800 text-gray-600 cursor-not-allowed'
            }`}
          >
            {lvl.unlocked ? (
              <>
                <span>{lvl.id}</span>
                <span className="text-xs mt-1">{'⭐'.repeat(lvl.stars) || '—'}</span>
              </>
            ) : (
              <span>🔒</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default LevelsPage;
