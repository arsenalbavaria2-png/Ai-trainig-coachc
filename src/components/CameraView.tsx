import { forwardRef, useImperativeHandle, useRef } from 'react';
import { usePunchDetection } from '../hooks/usePunchDetection';
import { PunchType, HandSide, Point } from '../types';

interface CameraViewProps {
  onPunch?: (punch: { type: PunchType; hand: HandSide; speed: number; direction: Point; power: number }) => void;
  cameraMirror?: boolean;
  className?: string;
}

export interface CameraViewHandle {
  start: () => Promise<void>;
  stop: () => void;
}

const CameraView = forwardRef<CameraViewHandle, CameraViewProps>(
  ({ onPunch, cameraMirror = true, className }, ref) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const { isTracking, error, startCamera, stopCamera } =
      usePunchDetection(videoRef as any, canvasRef as any, onPunch, cameraMirror);

    useImperativeHandle(ref, () => ({
      start: async () => {
        await startCamera();
      },
      stop: () => {
        stopCamera();
      },
    }));

    return (
      <div className={`relative w-full h-full overflow-hidden ${className || ''}`}>
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          playsInline
          muted
          style={{ display: 'none' }}
        />

        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          style={{
            transform: cameraMirror ? 'scaleX(-1)' : 'none',
            transformOrigin: 'center',
          }}
        />

        {error && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center text-white text-center p-4">
            <div>
              <p className="text-lg font-bold mb-2">Camera Error</p>
              <p>{error}</p>
            </div>
          </div>
        )}

        {!isTracking && !error && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="text-white text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p>Starting camera...</p>
            </div>
          </div>
        )}
      </div>
    );
  }
);

CameraView.displayName = 'CameraView';

export default CameraView;
