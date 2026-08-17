import { useState, useRef, useCallback, useEffect } from 'react';
import { Hands, Results } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';
import { PunchType, HandSide, Point } from '../types';

export interface PunchDetectionResult {
  type: PunchType;
  hand: HandSide;
  speed: number;
  direction: Point;
  power: number;
  timestamp: number;
}

interface HandPosition {
  x: number;
  y: number;
  timestamp: number;
}

const PUNCH_CONFIG = {
  straightMinSpeed: 0.9,
  hookMinSpeed: 0.7,
  uppercutMinSpeed: 0.7,
  straightMaxAngle: 35,
  hookMinAngle: 40,
  hookMaxAngle: 140,
};

const COOLDOWN_MS = 350;

export const usePunchDetection = (
  videoRef: React.RefObject<HTMLVideoElement>,
  canvasRef: React.RefObject<HTMLCanvasElement>,
  onPunch?: (punch: PunchDetectionResult) => void,
  cameraMirror: boolean = true
) => {
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handsRef = useRef<Hands | null>(null);
  const cameraRef = useRef<Camera | null>(null);
  const prevPositions = useRef<Record<HandSide, HandPosition | null>>({ left: null, right: null });
  const cooldownUntil = useRef<Record<HandSide, number>>({ left: 0, right: 0 });
  const onPunchRef = useRef(onPunch);
  onPunchRef.current = onPunch;

  const classifyPunch = (speed: number, direction: Point, hand: HandSide): PunchType | null => {
    const angle = Math.abs(Math.atan2(direction.y, direction.x) * (180 / Math.PI));
    const isStraight = angle <= PUNCH_CONFIG.straightMaxAngle || angle >= 180 - PUNCH_CONFIG.straightMaxAngle;
    const isHook = angle >= PUNCH_CONFIG.hookMinAngle && angle <= PUNCH_CONFIG.hookMaxAngle;
    const isUpward = direction.y < -0.5;

    if (isUpward && speed >= PUNCH_CONFIG.uppercutMinSpeed) return 'uppercut';
    if (isStraight && speed >= PUNCH_CONFIG.straightMinSpeed) return hand === 'left' ? 'jab' : 'cross';
    if (isHook && speed >= PUNCH_CONFIG.hookMinSpeed) return 'hook';
    return null;
  };

  const onResults = useCallback((results: Results) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
    }

    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(results.image as any, 0, 0, canvas.width, canvas.height);

    const now = Date.now();
    const seenHands = new Set<HandSide>();

    if (results.multiHandLandmarks && results.multiHandedness) {
      results.multiHandLandmarks.forEach((landmarks, i) => {
        const label = results.multiHandedness![i]?.label;
        const hand: HandSide = label === 'Left' ? 'left' : 'right';
        seenHands.add(hand);

        const wrist = landmarks[0];
        const x = wrist.x;
        const y = wrist.y;

        ctx.beginPath();
        ctx.arc(x * canvas.width, y * canvas.height, 10, 0, Math.PI * 2);
        ctx.fillStyle = hand === 'left' ? '#3b82f6' : '#ef4444';
        ctx.fill();

        const prev = prevPositions.current[hand];
        if (prev) {
          const dt = (now - prev.timestamp) / 1000;
          if (dt > 0 && dt < 0.5) {
            const dx = x - prev.x;
            const dy = y - prev.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const speed = distance / dt;

            if (distance > 0.02 && now >= cooldownUntil.current[hand]) {
              const direction = { x: dx / distance, y: dy / distance };
              const punchType = classifyPunch(speed, direction, hand);
              if (punchType) {
                cooldownUntil.current[hand] = now + COOLDOWN_MS;
                onPunchRef.current?.({
                  type: punchType,
                  hand,
                  speed,
                  direction,
                  power: Math.min(100, Math.round(speed * 60)),
                  timestamp: now,
                });
              }
            }
          }
        }

        prevPositions.current[hand] = { x, y, timestamp: now };
      });
    }

    (['left', 'right'] as HandSide[]).forEach((h) => {
      if (!seenHands.has(h)) prevPositions.current[h] = null;
    });

    ctx.restore();
  }, [canvasRef, videoRef]);

  const startCamera = useCallback(async () => {
    if (!videoRef.current) return;
    try {
      setError(null);

      const hands = new Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
      });
      hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.6,
        minTrackingConfidence: 0.5,
      });
      hands.onResults(onResults);
      handsRef.current = hands;

      const camera = new Camera(videoRef.current, {
        onFrame: async () => {
          if (videoRef.current) {
            await hands.send({ image: videoRef.current });
          }
        },
        width: 640,
        height: 480,
      });
      cameraRef.current = camera;
      await camera.start();
      setIsTracking(true);
    } catch (err) {
      console.error('Camera error:', err);
      setError('Cannot access camera. Please enable camera permissions.');
      setIsTracking(false);
    }
  }, [videoRef, onResults]);

  const stopCamera = useCallback(() => {
    cameraRef.current?.stop();
    cameraRef.current = null;
    handsRef.current?.close();
    handsRef.current = null;
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    prevPositions.current = { left: null, right: null };
    setIsTracking(false);
  }, [videoRef]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { isTracking, error, startCamera, stopCamera };
};

export default usePunchDetection;
