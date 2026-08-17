import { useEffect, useState, useRef } from 'react';
import { PunchType } from '../types';

interface HitEffectProps {
  punchType: PunchType;
  score: number;
  combo?: number;
  onAnimationEnd?: () => void;
  className?: string;
}

const HitEffect = ({ punchType, score, combo, onAnimationEnd, className }: HitEffectProps) => {
  const [visible, setVisible] = useState(true);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(0);
  const [opacity, setOpacity] = useState(1);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const randomX = 40 + Math.random() * 20;
    const randomY = 40 + Math.random() * 20;
    setPosition({ x: randomX, y: randomY });

    setScale(1);
    setOpacity(1);

    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / 1000;

      if (progress >= 1) {
        setVisible(false);
        onAnimationEnd?.();
        return;
      }

      setOpacity(1 - progress);
      setPosition(prev => ({ x: prev.x, y: prev.y - (progress * 50) }));

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [onAnimationEnd]);

  if (!visible) return null;

  const getColor = (): string => {
    switch (punchType) {
      case 'jab': return 'text-blue-400';
      case 'cross': return 'text-red-400';
      case 'hook': return 'text-green-400';
      case 'uppercut': return 'text-yellow-400';
      default: return 'text-white';
    }
  };

  const getLabel = (): string => {
    if (score >= 90) return 'PERFECT!';
    if (score >= 70) return 'GREAT!';
    if (score >= 50) return 'GOOD!';
    return 'HIT!';
  };

  return (
    <div
      className={`absolute z-50 pointer-events-none ${className || ''}`}
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: `translate(-50%, -50%) scale(${scale})`,
        opacity,
        transition: 'transform 0.2s ease, opacity 0.2s ease',
      }}
    >
      <div className="text-center">
        <div className={`text-4xl font-bold ${getColor()} drop-shadow-lg`}>+{score}</div>
        <div className="text-white text-sm font-semibold">{getLabel()}</div>
        {combo && combo > 1 && (
          <div className="text-yellow-400 text-xs mt-1">Combo x{combo}</div>
        )}
        <div className={`text-xs ${getColor()}`}>{punchType.toUpperCase()}</div>
      </div>
    </div>
  );
};

export default HitEffect;
