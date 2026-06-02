"use client";

import { useEffect, useRef } from "react";

interface ScoreRingProps {
  score: number;       // 0-100
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
  sublabel?: string;
  animate?: boolean;
}

export default function ScoreRing({
  score,
  size = 120,
  strokeWidth = 8,
  color = "#a78bfa",
  label,
  sublabel,
  animate = true,
}: ScoreRingProps) {
  const progressRef = useRef<SVGCircleElement>(null);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const targetOffset = circumference - (score / 100) * circumference;

  useEffect(() => {
    if (!animate || !progressRef.current) return;
    const el = progressRef.current;
    el.style.strokeDashoffset = String(circumference);
    const timeout = setTimeout(() => {
      el.style.transition = "stroke-dashoffset 1.4s cubic-bezier(0.4, 0, 0.2, 1) 0.3s";
      el.style.strokeDashoffset = String(targetOffset);
    }, 50);
    return () => clearTimeout(timeout);
  }, [animate, circumference, targetOffset]);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative inline-flex items-center justify-center">
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={strokeWidth}
          />
          {/* Progress arc */}
          <circle
            ref={progressRef}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={animate ? circumference : targetOffset}
          />
        </svg>

        {/* Center content */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center"
          style={{ transform: "rotate(0deg)" }}
        >
          <span
            className="font-syne font-black leading-none"
            style={{ fontSize: size * 0.22, color }}
          >
            {score}
          </span>
          {label && (
            <span
              className="text-white/30 font-mono text-center leading-tight"
              style={{ fontSize: size * 0.09 }}
            >
              {label}
            </span>
          )}
        </div>
      </div>

      {sublabel && (
        <p className="text-xs text-white/40 text-center">{sublabel}</p>
      )}
    </div>
  );
}
