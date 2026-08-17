import { useEffect, useRef, useState } from 'react';
import { Target as TargetType, PunchType } from '../types';

interface TargetProps {
  target: TargetType;
  onHit?: (targetId: string) => void;
  onExpire?: (targetId: string) => void;
  size?: number;
  className?: string;
}

const Target = ({ target, onHit, onExpire, size = 80, className }: TargetProps) => {
  const [hit, setHit] = useState(target.hit);
  const [expired, setExpired] = useState(false);
  const [scale, setScale] = useState(1);
  const [opacity, setOpacity] = useState(1);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const expiryTime = target.expiryTime;
    const now = Date.now();

    if (target.hit) {
      setHit(true);
      onHit?.(target.id);
      const hitTimer = setTimeout(() => {
        setScale(0);
        setOpacity(0);
      }, 200);
      return () => clearTimeout(hitTimer);
    }

    if (now >= expiryTime) {
      setExpired(true);
      onExpire?.(target.id);
      const expireTimer = setTimeout(() => {
        setScale(0);
        setOpacity(0);
      }, 200);
      return () => clearTimeout(expireTimer);
    }

    const animate = () => {
      const now = Date.now();
      const remaining = expiryTime - now;

      if (remaining <= 0) {
        setExpired(true);
        onExpire?.(target.id);
        setScale(0);
        setOpacity(0);
        return;
      }

      const pulseScale = 1 + Math.sin(now / 200) * 0.05;
      setScale(pulseScale);

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [target, onHit, onExpire]);

  const getColor = (type: PunchType): string => {
    switch (type) {
      case 'jab': return 'bg-blue-500';
      case 'cross': return 'bg-red-500';
      case 'hook': return 'bg-green-500';
      case 'uppercut': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getHandIndicator = (hand: string): string => (hand === 'left' ? 'L' : 'R');

  const x = target.position.x * 100;
  const y = target.position.y * 100;

  return (
    <div
      className={`absolute ${className || ''}`}
      style={{
        left: `${x}%`,
        top: `${y}%`,
        transform: `translate(-50%, -50%) scale(${scale})`,
        opacity,
        transition: 'transform 0.2s ease, opacity 0.2s ease',
        zIndex: 10,
      }}
    >
      <div
        className={`relative rounded-full ${getColor(target.type)} shadow-lg`}
        style={{
          width: size,
          height: size,
          boxShadow: hit
            ? '0 0 30px 10px rgba(255, 255, 255, 0.7)'
            : '0 0 20px 5px rgba(0, 0, 0, 0.5)',
          transition: 'box-shadow 0.2s ease',
        }}
      >
        <div className="absolute inset-2 rounded-full bg-white/20"></div>
        <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-xl">
          {getHandIndicator(target.hand)}
        </div>
        {hit && <div className="absolute inset-0 rounded-full bg-white/30 animate-ping"></div>}
        {expired && <div className="absolute inset-0 rounded-full border-4 border-white/50 animate-pulse"></div>}
      </div>

      <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-white text-sm font-semibold bg-black/50 px-2 py-1 rounded">
        {target.type.toUpperCase()}
      </div>
    </div>
  );
};

export default Target;
