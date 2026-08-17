import { useNavigate } from 'react-router-dom';
import { useLocale } from '../hooks/useLocale';
import { useStore } from '../store/useStore';

const HomePage = () => {
  const navigate = useNavigate();
  const { t } = useLocale();
  const { user, levels } = useStore();
  const startWorkout = useStore(state => state.startWorkout);

  const tip = useLocale().getRandomTip();

  const completedLevels = user?.levelsCompleted.size || 0;
  const totalLevels = levels.length;
  const progressPercent = (completedLevels / totalLevels) * 100;

  const handleStartWorkout = () => {
    startWorkout(1);
    navigate('/workout');
  };

  const handleLevels = () => {
    navigate('/levels');
  };

  const handleSettings = () => {
    navigate('/settings');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-red-900/50 to-black flex flex-col">
      <header className="p-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center">
              <span className="text-white font-bold">🥊</span>
            </div>
            <span className="text-white font-bold text-lg">{t('app.title')}</span>
          </div>
          <button onClick={handleSettings} className="text-white/70 hover:text-white transition-colors">
            ⚙️
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 -mt-16">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">{t('app.title')}</h1>
          <p className="text-white/60 text-lg">{t('app.subtitle')}</p>
        </div>

        <div className="w-full max-w-md mb-8">
          <div className="flex justify-between text-sm text-white/70 mb-2">
            <span>{t('levels.level', { level: completedLevels })}</span>
            <span>{progressPercent.toFixed(0)}%</span>
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-red-500 transition-all duration-500" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>

        <button
          onClick={handleStartWorkout}
          className="w-full max-w-md bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-8 rounded-lg text-lg transition-all duration-200 shadow-lg hover:shadow-xl mb-6"
        >
          {t('app.start')}
        </button>

        <div className="flex gap-4 w-full max-w-md">
          <button
            onClick={handleLevels}
            className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            {t('app.levels')}
          </button>
        </div>

        {user && (
          <div className="mt-8 w-full max-w-md grid grid-cols-3 gap-4 text-center">
            <div className="bg-gray-800/50 p-3 rounded-lg">
              <div className="text-2xl font-bold text-white">{user.totalWorkouts}</div>
              <div className="text-xs text-white/60">Workouts</div>
            </div>
            <div className="bg-gray-800/50 p-3 rounded-lg">
              <div className="text-2xl font-bold text-white">{user.totalPunches.toLocaleString()}</div>
              <div className="text-xs text-white/60">Punches</div>
            </div>
            <div className="bg-gray-800/50 p-3 rounded-lg">
              <div className="text-2xl font-bold text-white">{user.currentStreak}</div>
              <div className="text-xs text-white/60">Day Streak</div>
            </div>
          </div>
        )}
      </main>

      <div className="p-6 pb-12">
        <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
          <div className="text-xs text-green-400 font-semibold mb-1">💡 Tip</div>
          <p className="text-sm text-white/80">{tip}</p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
