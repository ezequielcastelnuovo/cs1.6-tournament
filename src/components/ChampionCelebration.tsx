"use client";

import { useEffect, useRef, useState } from "react";
import { Trophy, Crown, Sparkles, CheckCircle, X } from "lucide-react";

interface ChampionCelebrationProps {
  champion: string;
  onClose?: () => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  alpha: number;
  size: number;
  gravity: number;
  drag: number;
  decay: number;
  sparkle?: boolean;
}

export default function ChampionCelebration({
  champion,
  onClose,
}: ChampionCelebrationProps) {
  const [visible, setVisible] = useState(true);
  const [fadingOut, setFadingOut] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    const particles: Particle[] = [];
    const colors = ["#FF5500", "#FF7700", "#FFAA00", "#FFFFFF", "#FF3300", "#FFD700", "#FF9900"];

    // Function to create a firework burst
    const createBurst = (x: number, y: number, count = 50, speedMax = 8) => {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * speedMax + 2;
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color: colors[Math.floor(Math.random() * colors.length)],
          alpha: 1,
          size: Math.random() * 3.5 + 2,
          gravity: 0.12,
          drag: 0.965,
          decay: Math.random() * 0.012 + 0.008,
          sparkle: Math.random() > 0.4,
        });
      }
    };

    // Function for delicate ambient sparkle bursts (post-celebration loop)
    const createGentleSparkle = (x: number, y: number) => {
      const sparkleCount = Math.floor(Math.random() * 8 + 14);
      for (let i = 0; i < sparkleCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 3.2 + 1;
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color: colors[Math.floor(Math.random() * colors.length)],
          alpha: 1,
          size: Math.random() * 2.5 + 1.5,
          gravity: 0.04,
          drag: 0.96,
          decay: Math.random() * 0.012 + 0.01,
          sparkle: true,
        });
      }
    };

    // 1. Initial massive barrage at t = 0
    createBurst(width * 0.2, height * 0.3, 60, 9);
    createBurst(width * 0.8, height * 0.3, 60, 9);
    createBurst(width * 0.5, height * 0.2, 75, 10);
    createBurst(width * 0.35, height * 0.45, 50, 8);
    createBurst(width * 0.65, height * 0.45, 50, 8);
    createBurst(width * 0.15, height * 0.6, 45, 7);
    createBurst(width * 0.85, height * 0.6, 45, 7);

    // 2. High-intensity fireworks (0s - 4.5s): bursts every 260ms
    const highIntensityInterval = setInterval(() => {
      const rx = Math.random() * (width * 0.85) + width * 0.075;
      const ry = Math.random() * (height * 0.5) + height * 0.1;
      createBurst(rx, ry, Math.floor(Math.random() * 20 + 35), 8);
    }, 280);

    // 3. Gradual degradation (4.5s - 7.0s): fewer and smaller bursts
    let taperingInterval: NodeJS.Timeout | null = null;
    const taperTimer = setTimeout(() => {
      clearInterval(highIntensityInterval);

      taperingInterval = setInterval(() => {
        const rx = Math.random() * (width * 0.8) + width * 0.1;
        const ry = Math.random() * (height * 0.4) + height * 0.15;
        createBurst(rx, ry, 22, 6);
      }, 700);
    }, 4500);

    // 4. End major celebration at 7.0s, start ambient loop every 2.0s
    let ambientLoopInterval: NodeJS.Timeout | null = null;
    const majorEndTimer = setTimeout(() => {
      if (taperingInterval) clearInterval(taperingInterval);

      // Subtle ambient sparkle loop every 2 seconds while celebration card remains open
      ambientLoopInterval = setInterval(() => {
        // Fire gentle sparkles around the edges / screen
        const offsetSides = Math.random() > 0.4;
        const sx = offsetSides
          ? width * (Math.random() > 0.5 ? 0.18 : 0.82) + (Math.random() - 0.5) * 120
          : width * 0.5 + (Math.random() - 0.5) * 450;
        const sy = height * (Math.random() * 0.5 + 0.15);
        createGentleSparkle(sx, sy);
      }, 2000);
    }, 7000);

    // Render loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.vx *= p.drag;
        p.vy = p.vy * p.drag + p.gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;

        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        const currentAlpha = Math.max(p.alpha, 0);
        ctx.globalAlpha = p.sparkle && Math.random() > 0.3 ? currentAlpha * 0.8 : currentAlpha;
        ctx.fillStyle = p.color;
        ctx.shadowColor = "#FF5500";
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      clearInterval(highIntensityInterval);
      if (taperingInterval) clearInterval(taperingInterval);
      if (ambientLoopInterval) clearInterval(ambientLoopInterval);
      clearTimeout(taperTimer);
      clearTimeout(majorEndTimer);
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const handleDismiss = () => {
    setFadingOut(true);
    setTimeout(() => {
      setVisible(false);
      onClose?.();
    }, 350);
  };

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-500 ${
        fadingOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      style={{
        background:
          "radial-gradient(circle at center, rgba(255, 85, 0, 0.25) 0%, rgba(18, 19, 22, 0.95) 55%, rgba(10, 11, 13, 0.98) 100%)",
      }}
    >
      {/* Background canvas for fireworks & ambient sparks */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />

      {/* Decorative ambient flare */}
      <div className="absolute w-[460px] h-[460px] rounded-full border border-[#FF5500]/25 animate-ping pointer-events-none" />
      <div className="absolute w-[330px] h-[330px] rounded-full border-2 border-[#FF5500]/35 animate-pulse pointer-events-none" />

      {/* Wrapper to stack Champion Card + discrete dismiss button */}
      <div className="relative z-10 flex flex-col items-center max-w-2xl w-full">
        {/* Champion Card - PERSISTENT (Stays open until dismissed) */}
        <div className="relative w-full bg-[#141518]/95 border-2 border-[#FF5500] rounded-2xl p-8 sm:p-12 text-center shadow-faceit-orange backdrop-blur-2xl animate-fade-in-up">
          {/* Close X button */}
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 text-[#8d939e] hover:text-white p-2 rounded-lg bg-[#1a1b1f] border border-[#282a32] hover:border-[#FF5500] transition-colors"
            title="Cerrar ventana"
          >
            <X size={16} />
          </button>

          {/* Top badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#FF5500]/15 border border-[#FF5500]/40 text-[#FF5500] text-[10px] font-black uppercase tracking-widest mb-6 shadow-sm">
            <Sparkles size={13} />
            <span>UADE CS 1.6 · 1V1 LAN EDITION</span>
          </div>

          {/* Trophy emblem (pure vector SVG, no emojis) */}
          <div className="relative w-24 h-24 mx-auto mb-6 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-[#FF5500]/30 blur-2xl animate-pulse" />
            <div className="relative w-24 h-24 rounded-full bg-gradient-to-b from-[#22242c] to-[#141518] border-2 border-[#FF5500] flex items-center justify-center text-[#FF5500] shadow-xl">
              <Trophy size={46} className="filter drop-shadow-[0_0_15px_rgba(255,85,0,0.8)]" />
            </div>
            <div className="absolute -top-2 -right-1 text-white bg-[#FF5500] rounded-full p-1.5 shadow-md">
              <Crown size={14} />
            </div>
          </div>

          {/* Subtitle */}
          <p className="text-xs sm:text-sm uppercase tracking-[0.3em] font-extrabold text-[#FF5500] mb-2">
            CAMPEÓN DEL TORNEO
          </p>

          {/* Champion Name */}
          <h2 className="text-4xl sm:text-6xl font-black text-white uppercase tracking-wider mb-6 drop-shadow-[0_0_25px_rgba(255,85,0,0.8)]">
            {champion}
          </h2>

          {/* Stat badges */}
          <div className="flex items-center justify-center">
            <span className="px-3.5 py-1 rounded-full bg-[#1a1b1f] border border-[#282a32] text-xs font-bold text-slate-300 flex items-center gap-1.5 shadow-sm">
              <CheckCircle size={13} className="text-[#FF5500]" />
              1v1 LAN Champion
            </span>
          </div>
        </div>

        {/* Discrete button placed outside the champion card to not steal spotlight */}
        <div className="mt-4 text-center">
          <button
            onClick={handleDismiss}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg bg-[#141518]/90 hover:bg-[#1a1b1f] text-[#8d939e] hover:text-white border border-[#282a32] hover:border-[#FF5500]/40 text-[11px] font-medium transition-all shadow-md cursor-pointer"
          >
            <span>Continuar al cuadro del torneo</span>
          </button>
        </div>
      </div>
    </div>
  );
}
