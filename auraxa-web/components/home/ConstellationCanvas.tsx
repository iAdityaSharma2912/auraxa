"use client";

import { useEffect, useRef, useCallback } from "react";

interface Star {
  x: number; y: number;
  vx: number; vy: number;
  size: number;
  opacity: number;
  twinkle: number;
  twinkleSpeed: number;
  color: string;
}

interface ConstellationLine {
  a: number; b: number;
  opacity: number;
}

const STAR_COLORS = [
  "255,255,255",
  "196,181,253",
  "212,175,55",
  "45,212,191",
  "232,121,249",
];

export default function ConstellationCanvas() {
  const canvasRef     = useRef<HTMLCanvasElement>(null);
  const starsRef      = useRef<Star[]>([]);
  const linesRef      = useRef<ConstellationLine[]>([]);
  const mouseRef      = useRef({ x: -1000, y: -1000 });
  const rafRef        = useRef<number>(0);
  const frameRef      = useRef(0);

  const initStars = useCallback((w: number, h: number) => {
    const count = Math.min(180, Math.floor((w * h) / 8000));
    starsRef.current = Array.from({ length: count }, () => ({
      x:           Math.random() * w,
      y:           Math.random() * h,
      vx:          (Math.random() - 0.5) * 0.12,
      vy:          (Math.random() - 0.5) * 0.12,
      size:        Math.random() * 1.8 + 0.3,
      opacity:     Math.random() * 0.6 + 0.2,
      twinkle:     Math.random() * Math.PI * 2,
      twinkleSpeed:Math.random() * 0.02 + 0.005,
      color:       STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
    }));

    // Build constellation connections
    const newLines: ConstellationLine[] = [];
    const maxDist = Math.min(w, h) * 0.18;
    for (let i = 0; i < starsRef.current.length; i++) {
      for (let j = i + 1; j < starsRef.current.length; j++) {
        const dx = starsRef.current[i].x - starsRef.current[j].x;
        const dy = starsRef.current[i].y - starsRef.current[j].y;
        if (Math.sqrt(dx*dx + dy*dy) < maxDist) {
          newLines.push({ a: i, b: j, opacity: Math.random() * 0.12 + 0.03 });
        }
      }
    }
    // Limit to reasonable line count
    linesRef.current = newLines.slice(0, 200);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
      initStars(canvas.width, canvas.height);
    };

    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) {
        mouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      frameRef.current++;

      ctx.clearRect(0, 0, w, h);

      const stars = starsRef.current;
      const lines = linesRef.current;
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const MOUSE_RADIUS = 120;
      const MOUSE_FORCE  = 0.3;

      // Update & draw stars
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];

        // Mouse repulsion
        const dx = s.x - mx;
        const dy = s.y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MOUSE_RADIUS && dist > 0) {
          const force = (1 - dist / MOUSE_RADIUS) * MOUSE_FORCE;
          s.vx += (dx / dist) * force;
          s.vy += (dy / dist) * force;
        }

        // Velocity damping
        s.vx *= 0.98;
        s.vy *= 0.98;
        s.x  += s.vx;
        s.y  += s.vy;

        // Wrap edges
        if (s.x < 0)  s.x = w;
        if (s.x > w)  s.x = 0;
        if (s.y < 0)  s.y = h;
        if (s.y > h)  s.y = 0;

        // Twinkle
        s.twinkle += s.twinkleSpeed;
        const tw = (Math.sin(s.twinkle) * 0.3) + 0.7;

        // Draw star
        const alpha = s.opacity * tw;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${s.color},${alpha})`;
        ctx.fill();

        // Larger stars get a glow
        if (s.size > 1.4) {
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.size * 2.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${s.color},${alpha * 0.12})`;
          ctx.fill();
        }
      }

      // Draw constellation lines
      for (let i = 0; i < lines.length; i++) {
        const l = lines[i];
        const a = stars[l.a];
        const b = stars[l.b];
        if (!a || !b) continue;

        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const d  = Math.sqrt(dx*dx + dy*dy);
        const maxD = Math.min(w, h) * 0.18;
        if (d > maxD) continue;

        const lineAlpha = l.opacity * (1 - d / maxD);

        // Mouse proximity brightens lines
        const midX = (a.x + b.x) / 2;
        const midY = (a.y + b.y) / 2;
        const mdx  = midX - mx;
        const mdy  = midY - my;
        const md   = Math.sqrt(mdx * mdx + mdy * mdy);
        const boost = md < 200 ? (1 - md / 200) * 3 : 1;

        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = `rgba(196,181,253,${lineAlpha * boost})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize",    resize,      { passive: true });
    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize",    resize);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("touchmove", onTouchMove);
    };
  }, [initStars]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: 0.7 }}
    />
  );
}
