// components/LottieAnimation.tsx
"use client";
import { useEffect, useRef, useState } from "react";
import lottie, { AnimationItem } from "lottie-web";

interface LottieAnimationProps {
  animationData?: object;
  width?: number;
  height?: number;
  loop?: boolean;
  autoplay?: boolean;
}

const LottieAnimation: React.FC<LottieAnimationProps> = ({
  animationData,
  width = 200,
  height = 200,
  loop = true,
  autoplay = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<AnimationItem | null>(null);
  const [isPlaying, setIsPlaying] = useState(autoplay);
  const [speed, setSpeed] = useState(1);
  const [isLoop, setIsLoop] = useState(loop);

  // Sample animation data - Loading dots
  const defaultAnimationData = {
    v: "5.7.4",
    fr: 60,
    ip: 0,
    op: 120,
    w: 200,
    h: 200,
    nm: "Loading Dots",
    ddd: 0,
    assets: [],
    layers: [
      {
        ddd: 0,
        ind: 1,
        ty: 4,
        nm: "Dot 1",
        sr: 1,
        ks: {
          o: { a: 0, k: 100, ix: 11 },
          r: { a: 0, k: 0, ix: 10 },
          p: {
            a: 1,
            k: [
              {
                i: { x: 0.833, y: 0.833 },
                o: { x: 0.167, y: 0.167 },
                t: 0,
                s: [60, 100, 0],
              },
              {
                i: { x: 0.833, y: 0.833 },
                o: { x: 0.167, y: 0.167 },
                t: 20,
                s: [60, 70, 0],
              },
              {
                i: { x: 0.833, y: 0.833 },
                o: { x: 0.167, y: 0.167 },
                t: 40,
                s: [60, 100, 0],
              },
              { t: 120, s: [60, 100, 0] },
            ],
            ix: 2,
          },
          a: { a: 0, k: [0, 0, 0], ix: 1 },
          s: { a: 0, k: [100, 100, 100], ix: 6 },
        },
        ao: 0,
        shapes: [
          {
            ty: "gr",
            it: [
              {
                d: 1,
                ty: "el",
                s: { a: 0, k: [20, 20], ix: 2 },
                p: { a: 0, k: [0, 0], ix: 3 },
                nm: "Ellipse Path 1",
              },
              {
                ty: "fl",
                c: { a: 0, k: [0.294, 0.533, 0.918, 1], ix: 4 },
                o: { a: 0, k: 100, ix: 5 },
                r: 1,
                bm: 0,
                nm: "Fill 1",
              },
              {
                ty: "tr",
                p: { a: 0, k: [0, 0], ix: 2 },
                a: { a: 0, k: [0, 0], ix: 1 },
                s: { a: 0, k: [100, 100], ix: 3 },
                r: { a: 0, k: 0, ix: 6 },
                o: { a: 0, k: 100, ix: 7 },
                nm: "Transform",
              },
            ],
            nm: "Ellipse 1",
          },
        ],
        ip: 0,
        op: 120,
        st: 0,
        bm: 0,
      },
      {
        ddd: 0,
        ind: 2,
        ty: 4,
        nm: "Dot 2",
        sr: 1,
        ks: {
          o: { a: 0, k: 100, ix: 11 },
          r: { a: 0, k: 0, ix: 10 },
          p: {
            a: 1,
            k: [
              {
                i: { x: 0.833, y: 0.833 },
                o: { x: 0.167, y: 0.167 },
                t: 10,
                s: [100, 100, 0],
              },
              {
                i: { x: 0.833, y: 0.833 },
                o: { x: 0.167, y: 0.167 },
                t: 30,
                s: [100, 70, 0],
              },
              {
                i: { x: 0.833, y: 0.833 },
                o: { x: 0.167, y: 0.167 },
                t: 50,
                s: [100, 100, 0],
              },
              { t: 120, s: [100, 100, 0] },
            ],
            ix: 2,
          },
          a: { a: 0, k: [0, 0, 0], ix: 1 },
          s: { a: 0, k: [100, 100, 100], ix: 6 },
        },
        ao: 0,
        shapes: [
          {
            ty: "gr",
            it: [
              {
                d: 1,
                ty: "el",
                s: { a: 0, k: [20, 20], ix: 2 },
                p: { a: 0, k: [0, 0], ix: 3 },
              },
              {
                ty: "fl",
                c: { a: 0, k: [0.462, 0.295, 0.635, 1], ix: 4 },
                o: { a: 0, k: 100, ix: 5 },
                r: 1,
                bm: 0,
              },
              {
                ty: "tr",
                p: { a: 0, k: [0, 0], ix: 2 },
                a: { a: 0, k: [0, 0], ix: 1 },
                s: { a: 0, k: [100, 100], ix: 3 },
                r: { a: 0, k: 0, ix: 6 },
                o: { a: 0, k: 100, ix: 7 },
              },
            ],
          },
        ],
        ip: 0,
        op: 120,
        st: 0,
        bm: 0,
      },
      {
        ddd: 0,
        ind: 3,
        ty: 4,
        nm: "Dot 3",
        sr: 1,
        ks: {
          o: { a: 0, k: 100, ix: 11 },
          r: { a: 0, k: 0, ix: 10 },
          p: {
            a: 1,
            k: [
              {
                i: { x: 0.833, y: 0.833 },
                o: { x: 0.167, y: 0.167 },
                t: 20,
                s: [140, 100, 0],
              },
              {
                i: { x: 0.833, y: 0.833 },
                o: { x: 0.167, y: 0.167 },
                t: 40,
                s: [140, 70, 0],
              },
              {
                i: { x: 0.833, y: 0.833 },
                o: { x: 0.167, y: 0.167 },
                t: 60,
                s: [140, 100, 0],
              },
              { t: 120, s: [140, 100, 0] },
            ],
            ix: 2,
          },
          a: { a: 0, k: [0, 0, 0], ix: 1 },
          s: { a: 0, k: [100, 100, 100], ix: 6 },
        },
        ao: 0,
        shapes: [
          {
            ty: "gr",
            it: [
              {
                d: 1,
                ty: "el",
                s: { a: 0, k: [20, 20], ix: 2 },
                p: { a: 0, k: [0, 0], ix: 3 },
              },
              {
                ty: "fl",
                c: { a: 0, k: [0.918, 0.294, 0.533, 1], ix: 4 },
                o: { a: 0, k: 100, ix: 5 },
                r: 1,
                bm: 0,
              },
              {
                ty: "tr",
                p: { a: 0, k: [0, 0], ix: 2 },
                a: { a: 0, k: [0, 0], ix: 1 },
                s: { a: 0, k: [100, 100], ix: 3 },
                r: { a: 0, k: 0, ix: 6 },
                o: { a: 0, k: 100, ix: 7 },
              },
            ],
          },
        ],
        ip: 0,
        op: 120,
        st: 0,
        bm: 0,
      },
    ],
  };

  useEffect(() => {
    if (containerRef.current) {
      // Destroy previous animation
      if (animationRef.current) {
        animationRef.current.destroy();
      }

      // Create new animation
      animationRef.current = lottie.loadAnimation({
        container: containerRef.current,
        renderer: "svg",
        loop: isLoop,
        autoplay: autoplay,
        animationData: animationData || defaultAnimationData,
      });

      return () => {
        if (animationRef.current) {
          animationRef.current.destroy();
        }
      };
    }
  }, [animationData, isLoop]);

  const handlePlay = () => {
    if (animationRef.current) {
      animationRef.current.play();
      setIsPlaying(true);
    }
  };

  const handlePause = () => {
    if (animationRef.current) {
      animationRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleStop = () => {
    if (animationRef.current) {
      animationRef.current.stop();
      setIsPlaying(false);
    }
  };

  const handleSpeedChange = (newSpeed: number) => {
    if (animationRef.current) {
      animationRef.current.setSpeed(newSpeed);
      setSpeed(newSpeed);
    }
  };

  const toggleLoop = () => {
    setIsLoop(!isLoop);
    if (animationRef.current) {
      animationRef.current.loop = !isLoop;
    }
  };

  return (
    <div className="flex flex-col items-center p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">
        🎬 Lottie Animation với Next.js
      </h2>

      {/* Animation Container */}
      <div
        ref={containerRef}
        style={{ width, height }}
        className="border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 mb-6"
      />

      {/* Controls */}
      <div className="flex gap-3 mb-4 flex-wrap justify-center">
        <button
          onClick={handlePlay}
          disabled={isPlaying}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          ▶️ Play
        </button>
        <button
          onClick={handlePause}
          disabled={!isPlaying}
          className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          ⏸️ Pause
        </button>
        <button
          onClick={handleStop}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          ⏹️ Stop
        </button>
        <button
          onClick={toggleLoop}
          className={`px-4 py-2 rounded-lg transition-colors ${
            isLoop
              ? "bg-green-500 hover:bg-green-600 text-white"
              : "bg-gray-300 hover:bg-gray-400 text-gray-700"
          }`}
        >
          🔄 Loop {isLoop ? "ON" : "OFF"}
        </button>
      </div>

      {/* Speed Control */}
      <div className="mb-4 text-center">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tốc độ: <span className="text-blue-600 font-bold">{speed}x</span>
        </label>
        <input
          type="range"
          min="0.1"
          max="3"
          step="0.1"
          value={speed}
          onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
          className="w-48 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
      </div>

      {/* Info */}
      <div className="bg-blue-50 p-4 rounded-lg text-sm text-gray-700 max-w-md">
        <h3 className="font-semibold text-blue-800 mb-2">
          💡 Lottie trong Next.js:
        </h3>
        <ul className="space-y-1 text-xs">
          <li>
            • <strong>SSR Safe:</strong> Dùng 'use client' directive
          </li>
          <li>
            • <strong>TypeScript:</strong> Type-safe với interfaces
          </li>
          <li>
            • <strong>Performance:</strong> useRef để tránh re-render
          </li>
          <li>
            • <strong>Cleanup:</strong> Destroy animation khi unmount
          </li>
        </ul>
      </div>
    </div>
  );
};

export default LottieAnimation;

// Usage example trong page component:
// pages/animation-demo.tsx hoặc app/animation-demo/page.tsx
/*
import LottieAnimation from '@/components/LottieAnimation'

export default function AnimationDemo() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center p-4">
      <LottieAnimation 
        width={250}
        height={250}
        loop={true}
        autoplay={true}
      />
    </div>
  )
}
*/

// package.json dependencies cần thêm:
/*
{
  "dependencies": {
    "lottie-web": "^5.12.2"
  },
  "devDependencies": {
    "@types/lottie-web": "^5.7.1"
  }
}
*/
