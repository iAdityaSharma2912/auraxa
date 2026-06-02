"use client";

import { useEffect, useRef, useCallback } from "react";

interface Particle {
  angle: number;
  distance: number;
  speed: number;
  size: number;
  opacity: number;
  color: string;
  trail: { x: number; y: number }[];
}

const COLORS = [
  "196,181,253", // violet
  "212,175,55",  // gold
  "45,212,191",  // teal
  "232,121,249", // pink
  "255,255,255", // white
];

export default function CosmicOrb({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef  = useRef({ x: 0, y: 0, active: false });
  const timeRef   = useRef(0);
  const rafRef    = useRef(0);

  const particles = useRef<Particle[]>([]);

  const init = useCallback((w: number, h: number) => {
    particles.current = Array.from({ length: 80 }, (_, i) => ({
      angle:    (i / 80) * Math.PI * 2 + Math.random() * 0.5,
      distance: 90 + Math.random() * 60,
      speed:    (0.003 + Math.random() * 0.006) * (Math.random() > 0.5 ? 1 : -1),
      size:     0.8 + Math.random() * 2,
      opacity:  0.2 + Math.random() * 0.7,
      color:    COLORS[Math.floor(Math.random() * COLORS.length)],
      trail:    [],
    }));
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const setSize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width  = rect.width  * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      init(rect.width, rect.height);
    };

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x:      e.clientX - rect.left,
        y:      e.clientY - rect.top,
        active: true,
      };
    };
    const onLeave = () => { mouseRef.current.active = false; };

    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      const W = rect.width;
      const H = rect.height;
      const cx = W / 2;
      const cy = H / 2;
      timeRef.current += 0.008;
      const t = timeRef.current;

      ctx.clearRect(0, 0, W, H);

      const mx = mouseRef.current.active ? mouseRef.current.x : cx;
      const my = mouseRef.current.active ? mouseRef.current.y : cy;
      const mdx = (mx - cx) / W;
      const mdy = (my - cy) / H;

      // ── Outermost glow aura ───────────────
      const outerR = 150 + Math.sin(t * 0.7) * 15;
      const aura = ctx.createRadialGradient(cx, cy, outerR * 0.3, cx, cy, outerR * 1.6);
      aura.addColorStop(0,   "rgba(124,58,237,0.06)");
      aura.addColorStop(0.5, "rgba(124,58,237,0.02)");
      aura.addColorStop(1,   "transparent");
      ctx.fillStyle = aura;
      ctx.fillRect(0, 0, W, H);

      // ── Orbital rings ─────────────────────
      [130, 105, 85].forEach((r, i) => {
        const ringR = r + Math.sin(t + i) * 4;
        ctx.beginPath();
        ctx.arc(cx + mdx * 8, cy + mdy * 8, ringR, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(196,181,253,${0.06 - i * 0.015})`;
        ctx.lineWidth = 0.8;
        ctx.setLineDash([4, 8]);
        ctx.stroke();
        ctx.setLineDash([]);
      });

      // ── Particles ─────────────────────────
      particles.current.forEach((p) => {
        p.angle += p.speed;

        // Mouse attraction/repulsion
        const targetDist = p.distance + (mouseRef.current.active ? mdx * 20 : 0);
        p.distance += (targetDist - p.distance) * 0.02;

        const px = cx + mdx * 12 + Math.cos(p.angle) * p.distance;
        const py = cy + mdy * 12 + Math.sin(p.angle) * p.distance;

        // Trail
        p.trail.push({ x: px, y: py });
        if (p.trail.length > 8) p.trail.shift();

        // Draw trail
        if (p.trail.length > 1) {
          for (let i = 1; i < p.trail.length; i++) {
            const alpha = (i / p.trail.length) * p.opacity * 0.3;
            ctx.beginPath();
            ctx.moveTo(p.trail[i - 1].x, p.trail[i - 1].y);
            ctx.lineTo(p.trail[i].x, p.trail[i].y);
            ctx.strokeStyle = `rgba(${p.color},${alpha})`;
            ctx.lineWidth = p.size * 0.5;
            ctx.stroke();
          }
        }

        // Draw particle
        const twinkle = (Math.sin(t * 2 + p.angle * 3) * 0.3) + 0.7;
        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color},${p.opacity * twinkle})`;
        ctx.fill();

        // Larger particles get glow
        if (p.size > 1.5) {
          ctx.beginPath();
          ctx.arc(px, py, p.size * 3, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${p.color},${p.opacity * 0.08})`;
          ctx.fill();
        }
      });

      // ── Main orb body ─────────────────────
      const orbR = 68 + Math.sin(t * 0.8) * 4;
      const orbX = cx + mdx * 16;
      const orbY = cy + mdy * 16;

      // Outer glow
      const glowG = ctx.createRadialGradient(orbX, orbY, 0, orbX, orbY, orbR * 1.8);
      glowG.addColorStop(0,   "rgba(124,58,237,0.35)");
      glowG.addColorStop(0.4, "rgba(109,40,217,0.12)");
      glowG.addColorStop(1,   "transparent");
      ctx.fillStyle = glowG;
      ctx.beginPath();
      ctx.arc(orbX, orbY, orbR * 1.8, 0, Math.PI * 2);
      ctx.fill();

      // Left half — AURA (light)
      ctx.save();
      ctx.beginPath();
      ctx.arc(orbX, orbY, orbR, Math.PI / 2, -Math.PI / 2);
      ctx.closePath();
      const leftG = ctx.createRadialGradient(
        orbX - orbR * 0.3, orbY - orbR * 0.3, 0,
        orbX, orbY, orbR
      );
      leftG.addColorStop(0,   "rgba(237,233,254,0.95)");
      leftG.addColorStop(0.4, "rgba(196,181,253,0.85)");
      leftG.addColorStop(1,   "rgba(124,58,237,0.7)");
      ctx.fillStyle = leftG;
      ctx.fill();
      ctx.restore();

      // Right half — XA (dark)
      ctx.save();
      ctx.beginPath();
      ctx.arc(orbX, orbY, orbR, -Math.PI / 2, Math.PI / 2);
      ctx.closePath();
      const rightG = ctx.createRadialGradient(orbX + orbR * 0.2, orbY, 0, orbX, orbY, orbR);
      rightG.addColorStop(0,   "rgba(76,29,149,0.9)");
      rightG.addColorStop(0.5, "rgba(30,27,75,0.95)");
      rightG.addColorStop(1,   "rgba(10,10,34,0.98)");
      ctx.fillStyle = rightG;
      ctx.fill();
      ctx.restore();

      // Seam glow
      ctx.beginPath();
      ctx.moveTo(orbX, orbY - orbR);
      ctx.lineTo(orbX, orbY + orbR);
      const seamG = ctx.createLinearGradient(orbX, orbY - orbR, orbX, orbY + orbR);
      seamG.addColorStop(0,   "rgba(255,255,255,0.0)");
      seamG.addColorStop(0.3, "rgba(255,255,255,0.6)");
      seamG.addColorStop(0.7, "rgba(196,181,253,0.6)");
      seamG.addColorStop(1,   "rgba(255,255,255,0.0)");
      ctx.strokeStyle = seamG;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Surface sheen
      const sheenG = ctx.createRadialGradient(
        orbX - orbR * 0.35, orbY - orbR * 0.4, 0,
        orbX, orbY, orbR * 0.9
      );
      sheenG.addColorStop(0,   "rgba(255,255,255,0.25)");
      sheenG.addColorStop(0.4, "rgba(255,255,255,0.06)");
      sheenG.addColorStop(1,   "transparent");
      ctx.beginPath();
      ctx.arc(orbX, orbY, orbR, 0, Math.PI * 2);
      ctx.fillStyle = sheenG;
      ctx.fill();

      // Inner ring
      ctx.beginPath();
      ctx.arc(orbX, orbY, orbR * 0.55, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255,255,255,0.12)";
      ctx.lineWidth = 0.8;
      ctx.stroke();

      // Center point
      ctx.beginPath();
      ctx.arc(orbX, orbY, 4, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.fill();

      // Pulse rings
      const pR1 = orbR * 1.15 + Math.sin(t * 1.2) * 6;
      const pA1 = (Math.sin(t * 1.2) * 0.5 + 0.5) * 0.08;
      ctx.beginPath();
      ctx.arc(orbX, orbY, pR1, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(196,181,253,${pA1})`;
      ctx.lineWidth = 1;
      ctx.stroke();

      const pR2 = orbR * 1.35 + Math.sin(t * 0.9 + 1) * 8;
      const pA2 = (Math.sin(t * 0.9 + 1) * 0.5 + 0.5) * 0.05;
      ctx.beginPath();
      ctx.arc(orbX, orbY, pR2, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(212,175,55,${pA2})`;
      ctx.lineWidth = 0.8;
      ctx.stroke();

      // Energy lines from center
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2 + t * 0.3;
        const len   = orbR * 0.4 + Math.sin(t * 2 + i) * 8;
        const ex    = orbX + Math.cos(angle) * len;
        const ey    = orbY + Math.sin(angle) * len;
        ctx.beginPath();
        ctx.moveTo(orbX, orbY);
        ctx.lineTo(ex, ey);
        const lineG = ctx.createLinearGradient(orbX, orbY, ex, ey);
        lineG.addColorStop(0, "rgba(255,255,255,0.4)");
        lineG.addColorStop(1, "rgba(255,255,255,0)");
        ctx.strokeStyle = lineG;
        ctx.lineWidth = 0.7;
        ctx.stroke();
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    setSize();
    canvas.addEventListener("mousemove", onMove, { passive: true });
    canvas.addEventListener("mouseleave", onLeave);
    window.addEventListener("resize", setSize, { passive: true });
    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("resize", setSize);
    };
  }, [init]);

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-full cursor-none ${className}`}
      style={{ touchAction: "none" }}
    />
  );
}
