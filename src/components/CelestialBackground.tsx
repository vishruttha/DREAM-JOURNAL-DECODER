// ==========================================
// CELESTIAL CANVAS BACKGROUND
// Slowly drifting stars, constellation linkages & subtle nebula glow
// Supports prefers-reduced-motion accessibility
// ==========================================

import React, { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  radius: number;
  baseAlpha: number;
  alpha: number;
  speed: number;
  phase: number;
  color: string;
}

export const CelestialBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Respect user's motion preferences
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Generate celestial stars
    const starCount = Math.min(120, Math.floor((width * height) / 10000));
    const stars: Star[] = [];
    const starColors = ['#ffffff', '#ddd6fe', '#c4b5fd', '#bae6fd', '#fef08a'];

    for (let i = 0; i < starCount; i++) {
      const baseAlpha = Math.random() * 0.7 + 0.2;
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1.6 + 0.4,
        baseAlpha,
        alpha: baseAlpha,
        speed: Math.random() * 0.008 + 0.003,
        phase: Math.random() * Math.PI * 2,
        color: starColors[Math.floor(Math.random() * starColors.length)],
      });
    }

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Deep space base gradients
      const bgGradient = ctx.createLinearGradient(0, 0, width, height);
      bgGradient.addColorStop(0, '#04060d');
      bgGradient.addColorStop(0.5, '#070a16');
      bgGradient.addColorStop(1, '#05070e');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      // Subtle violet & cyan nebula clouds
      const nebula1 = ctx.createRadialGradient(width * 0.2, height * 0.25, 50, width * 0.2, height * 0.25, width * 0.5);
      nebula1.addColorStop(0, 'rgba(124, 58, 237, 0.08)');
      nebula1.addColorStop(0.6, 'rgba(99, 102, 241, 0.03)');
      nebula1.addColorStop(1, 'transparent');
      ctx.fillStyle = nebula1;
      ctx.fillRect(0, 0, width, height);

      const nebula2 = ctx.createRadialGradient(width * 0.8, height * 0.75, 50, width * 0.8, height * 0.75, width * 0.45);
      nebula2.addColorStop(0, 'rgba(56, 189, 248, 0.05)');
      nebula2.addColorStop(0.5, 'rgba(168, 85, 247, 0.02)');
      nebula2.addColorStop(1, 'transparent');
      ctx.fillStyle = nebula2;
      ctx.fillRect(0, 0, width, height);

      // Draw faint constellation lines between nearby stars
      ctx.lineWidth = 0.5;
      for (let i = 0; i < stars.length; i++) {
        for (let j = i + 1; j < stars.length; j++) {
          const dx = stars[i].x - stars[j].x;
          const dy = stars[i].y - stars[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            const lineAlpha = (1 - dist / 100) * 0.08;
            ctx.strokeStyle = `rgba(167, 139, 250, ${lineAlpha})`;
            ctx.beginPath();
            ctx.moveTo(stars[i].x, stars[i].y);
            ctx.lineTo(stars[j].x, stars[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw twinkling stars
      for (const star of stars) {
        if (!prefersReducedMotion) {
          star.phase += star.speed;
          star.alpha = star.baseAlpha + Math.sin(star.phase) * 0.25;
          // Very subtle upward drift
          star.y -= 0.04;
          if (star.y < -10) star.y = height + 10;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0.1, Math.min(1, star.alpha));
        ctx.fillStyle = star.color;
        ctx.shadowColor = star.color;
        ctx.shadowBlur = star.radius > 1.2 ? 6 : 2;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      if (!prefersReducedMotion) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.95 }}
    />
  );
};
