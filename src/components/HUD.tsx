import { useLocale } from '../hooks/useLocale';

interface HUDProps {
  score: number;
  combo: number;
  timeRemaining: number;
  level: number;
  className?: string;
}

const HUD = ({ score, combo, timeRemaining, level, className }: HUDProps) => {
  const { t } = useLocale();

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatScore = (score: number): string => {
    return score.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  return (
    <div className={`absolute top-0 left-0 right-0 z-20 p-4 ${className || ''}`}>
      <div className="flex justify-between items-start">
        <div className="text-left">
          <div className="text-red-500 font-bold text-lg">{t('levels.level', { level })}</div>
          <div className="text-white text-2xl font-mono">{formatTime(timeRemaining)}</div>
        </div>

        <div className="text-center">
          <div className="text-white/70 text-xs uppercase tracking-wider">{t('workout.score')}</div>
          <div className="text-white text-3xl font-bold">{formatScore(score)}</div>
        </div>

        <div className="text-right">
          <div className="text-white/70 text-xs uppercase tracking-wider">{t('workout.combo')}</div>
          <div className={`text-2xl font-bold ${combo > 0 ? 'text-yellow-400' : 'text-white/50'}`}>
            {combo > 0 ? `x${combo}` : '-'}
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50">
        <div
          className="h-full bg-red-500 transition-all duration-300"
          style={{ width: `${(timeRemaining / 60) * 100}%` }}
        />
      </div>
    </div>
  );
};

export default HUD;
