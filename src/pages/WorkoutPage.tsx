import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CameraView, { CameraViewHandle } from '../components/CameraView';
import HUD from '../components/HUD';
import Target from '../components/Target';
import HitEffect from '../components/HitEffect';
import { useStore } from '../store/useStore';
import { useLocale } from '../hooks/useLocale';
import { PunchType, HandSide, Target as TargetType } from '../types';

interface HitEffectInstance {
  id: string;
  punchType: PunchType;
  score: number;
  combo: number;
}

const WorkoutPage = () => {
  const navigate = useNavigate();
  const { t } = useLocale();
  const cameraRef = useRef<CameraViewHandle>(null);

  const {
    currentLevel,
    levels,
    score,
    comboCounter,
    timeRemaining,
    workoutInProgress,
    paused,
    showSummary,
    workoutStats,
    user,
    currentTargets,
    addTarget,
    removeTarget,
    updateTarget,
    clearTargets,
    incrementScore,
    incrementCombo,
    resetCombo,
    decrementTime,
    endWorkout,
    pauseWorkout,
    resumeWorkout,
    addPunch,
    setShowSummary,
  } = useStore();

  const [phase, setPhase] = useState<'ready' | 'active'>('ready');
  const [hitEffects, setHitEffects] = useState<HitEffectInstance[]>([]);

  const level = levels.find((l) => l.id === currentLevel) || levels[0];

  useEffect(() => {
    if (phase !== 'ready') return;
    const timer = setTimeout(() => setPhase('active'), 2500);
    return () => clearTimeout(timer);
  }, [phase]);

  useEffect(() => {
    cameraRef.current?.start();
    return () => {
      cameraRef.current?.stop();
    };
  }, []);

  useEffect(() => {
    if (phase !== 'active' || paused || !workoutInProgress) return;
    if (timeRemaining <= 0) {
      endWorkout();
      return;
    }
    const interval = setInterval(() => {
      decrementTime();
    }, 1000);
    return () => clearInterval(interval);
  }, [phase, paused, workoutInProgress, timeRemaining, decrementTime, endWorkout]);

  useEffect(() => {
    if (phase !== 'active' || paused || !workoutInProgress) return;

    const spawn = () => {
      const techniques = level.techniques.length ? level.techniques : ['jab'];
      const type = techniques[Math.floor(Math.random() * techniques.length)] as PunchType;
      const hand: HandSide = Math.random() > 0.5 ? 'left' : 'right';
      const now = Date.now();
      const duration = Math.max(900, level.mittSpeed);

      const target: TargetType = {
        id: `t-${now}-${Math.random().toString(36).slice(2, 8)}`,
        position: { x: 0.25 + Math.random() * 0.5, y: 0.25 + Math.random() * 0.4 },
        size: 80,
        type,
        hand,
        active: true,
        hit: false,
        spawnTime: now,
        expiryTime: now + duration,
      };
      addTarget(target);
    };

    spawn();
    const interval = setInterval(spawn, Math.max(900, level.mittSpeed));
    return () => clearInterval(interval);
  }, [phase, paused, workoutInProgress, level, addTarget]);

  useEffect(() => {
    if (phase !== 'active') return;
    const cleanup = setInterval(() => {
      const now = Date.now();
      currentTargets.forEach((tgt) => {
        if (!tgt.hit && now >= tgt.expiryTime) {
          removeTarget(tgt.id);
        }
      });
    }, 200);
    return () => clearInterval(cleanup);
  }, [phase, currentTargets, removeTarget]);

  const handlePunch = useCallback(
    (punch: { type: PunchType; hand: HandSide; speed: number; direction: any; power: number }) => {
      if (phase !== 'active' || paused || !workoutInProgress) return;

      const now = Date.now();
      const match = currentTargets.find(
        (tgt) => !tgt.hit && tgt.type === punch.type && now <= tgt.expiryTime
      );

      if (match) {
        updateTarget(match.id, { hit: true });
        incrementCombo();
        const newCombo = comboCounter + 1;
        const points = 10 + Math.min(40, newCombo * 2);
        incrementScore(points);

        addPunch({
          type: punch.type,
          hand: punch.hand,
          speed: punch.speed,
          direction: punch.direction,
          power: punch.power,
          accuracy: 100,
          timestamp: now,
          hitTarget: true,
          targetId: match.id,
        });

        setHitEffects((prev) => [
          ...prev,
          { id: `hit-${now}-${Math.random()}`, punchType: punch.type, score: points, combo: newCombo },
        ]);

        setTimeout(() => removeTarget(match.id), 250);
      } else {
        resetCombo();
        addPunch({
          type: punch.type,
          hand: punch.hand,
          speed: punch.speed,
          direction: punch.direction,
          power: punch.power,
          accuracy: 0,
          timestamp: now,
          hitTarget: false,
        });
      }
    },
    [phase, paused, workoutInProgress, currentTargets, comboCounter, updateTarget, incrementCombo, incrementScore, addPunch, resetCombo, removeTarget]
  );

  const handlePause = () => {
    if (paused) {
      resumeWorkout();
    } else {
      pauseWorkout();
    }
  };

  const handleExit = () => {
    cameraRef.current?.stop();
    clearTargets();
    navigate('/');
  };

  const handleSummaryClose = (again: boolean) => {
    setShowSummary(false);
    clearTargets();
    if (again) {
      useStore.getState().startWorkout(currentLevel);
      setPhase('ready');
    } else {
      navigate('/levels');
    }
  };

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden">
      <CameraView ref={cameraRef} onPunch={handlePunch} cameraMirror={user?.settings.cameraMirror ?? true} className="absolute inset-0" />

      {phase === 'active' && currentTargets.map((tgt) => (
        <Target key={tgt.id} target={tgt} />
      ))}

      {hitEffects.map((fx) => (
        <HitEffect
          key={fx.id}
          punchType={fx.punchType}
          score={fx.score}
          combo={fx.combo}
          onAnimationEnd={() => setHitEffects((prev) => prev.filter((h) => h.id !== fx.id))}
        />
      ))}

      {phase === 'active' && (
        <HUD score={score} combo={comboCounter} timeRemaining={timeRemaining} level={currentLevel} />
      )}

      <div className="absolute top-4 right-4 z-30 flex gap-2">
        <button onClick={handlePause} className="bg-black/60 text-white px-4 py-2 rounded-lg font-semibold">
          {paused ? t('app.resume') : t('app.pause')}
        </button>
        <button onClick={handleExit} className="bg-black/60 text-white px-4 py-2 rounded-lg font-semibold">
          ✕
        </button>
      </div>

      {phase === 'ready' && (
        <div className="absolute inset-0 z-40 bg-black/70 flex flex-col items-center justify-center text-white text-center p-6">
          <div className="text-red-500 font-bold text-xl mb-2">{t('levels.level', { level: currentLevel })}</div>
          <div className="text-4xl font-bold mb-4">{t('workout.ready')}</div>
          <div className="flex gap-3 flex-wrap justify-center mb-6">
            {level.techniques.map((tech) => (
              <span key={tech} className="bg-white/10 px-3 py-1 rounded-full text-sm">
                {t(`techniques.${tech}.name`)}
              </span>
            ))}
          </div>
          <p className="text-white/60 max-w-sm">{t('workout.instruction')}</p>
        </div>
      )}

      {paused && phase === 'active' && (
        <div className="absolute inset-0 z-40 bg-black/80 flex flex-col items-center justify-center text-white text-center p-6">
          <div className="text-3xl font-bold mb-6">{t('app.pause')}</div>
          <button onClick={handlePause} className="bg-red-600 px-8 py-3 rounded-lg font-bold mb-3">
            {t('app.resume')}
          </button>
          <button onClick={handleExit} className="text-white/70 underline">
            {t('app.end')}
          </button>
        </div>
      )}

      {showSummary && (
        <div className="absolute inset-0 z-50 bg-black/90 flex flex-col items-center justify-center text-white text-center p-6">
          <div className="text-3xl font-bold mb-6 text-red-500">{t('summary.title')}</div>
          <div className="grid grid-cols-2 gap-4 w-full max-w-sm mb-8">
            <div className="bg-gray-800/70 p-4 rounded-lg">
              <div className="text-2xl font-bold">{workoutStats.totalPunches}</div>
              <div className="text-xs text-white/60">{t('summary.totalPunches')}</div>
            </div>
            <div className="bg-gray-800/70 p-4 rounded-lg">
              <div className="text-2xl font-bold">{workoutStats.accuracy}%</div>
              <div className="text-xs text-white/60">{t('summary.accuracy')}</div>
            </div>
            <div className="bg-gray-800/70 p-4 rounded-lg">
              <div className="text-2xl font-bold">{workoutStats.calories}</div>
              <div className="text-xs text-white/60">{t('summary.calories')}</div>
            </div>
            <div className="bg-gray-800/70 p-4 rounded-lg">
              <div className="text-2xl font-bold">{score}</div>
              <div className="text-xs text-white/60">{t('workout.score')}</div>
            </div>
          </div>
          <div className="flex gap-4">
            <button onClick={() => handleSummaryClose(true)} className="bg-red-600 px-6 py-3 rounded-lg font-bold">
              {t('summary.again')}
            </button>
            <button onClick={() => handleSummaryClose(false)} className="bg-gray-700 px-6 py-3 rounded-lg font-bold">
              {t('app.levels')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkoutPage;
