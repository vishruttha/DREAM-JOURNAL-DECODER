/**
 * ============================================================================
 * CELESTIAL STARFIELD & CONSTELLATION ANIMATION (CANVAS)
 * ============================================================================
 */

(function () {
  const canvas = document.getElementById("starfield");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const starCount = Math.min(100, Math.floor((width * height) / 12000));
  const stars = [];
  const colors = ["#ffffff", "#ddd6fe", "#c4b5fd", "#bae6fd", "#fef08a"];

  for (let i = 0; i < starCount; i++) {
    const baseAlpha = Math.random() * 0.6 + 0.2;
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.5 + 0.4,
      baseAlpha: baseAlpha,
      alpha: baseAlpha,
      speed: Math.random() * 0.008 + 0.003,
      phase: Math.random() * Math.PI * 2,
      color: colors[Math.floor(Math.random() * colors.length)],
    });
  }

  window.addEventListener("resize", () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  function draw() {
    ctx.clearRect(0, 0, width, height);

    // Deep space linear gradient
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, "#04060d");
    bgGrad.addColorStop(0.5, "#070a16");
    bgGrad.addColorStop(1, "#05070e");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Subtle violet nebula
    const nebula = ctx.createRadialGradient(width * 0.2, height * 0.25, 40, width * 0.2, height * 0.25, width * 0.5);
    nebula.addColorStop(0, "rgba(124, 58, 237, 0.07)");
    nebula.addColorStop(0.6, "rgba(99, 102, 241, 0.02)");
    nebula.addColorStop(1, "transparent");
    ctx.fillStyle = nebula;
    ctx.fillRect(0, 0, width, height);

    // Constellation lines between nearby stars
    ctx.lineWidth = 0.5;
    for (let i = 0; i < stars.length; i++) {
      for (let j = i + 1; j < stars.length; j++) {
        const dx = stars[i].x - stars[j].x;
        const dy = stars[i].y - stars[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 90) {
          const alpha = (1 - dist / 90) * 0.08;
          ctx.strokeStyle = `rgba(167, 139, 250, ${alpha})`;
          ctx.beginPath();
          ctx.moveTo(stars[i].x, stars[i].y);
          ctx.lineTo(stars[j].x, stars[j].y);
          ctx.stroke();
        }
      }
    }

    // Stars
    for (const star of stars) {
      if (!prefersReduced) {
        star.phase += star.speed;
        star.alpha = star.baseAlpha + Math.sin(star.phase) * 0.25;
        star.y -= 0.04;
        if (star.y < -10) star.y = height + 10;
      }

      ctx.save();
      ctx.globalAlpha = Math.max(0.1, Math.min(1, star.alpha));
      ctx.fillStyle = star.color;
      ctx.shadowColor = star.color;
      ctx.shadowBlur = star.r > 1.2 ? 5 : 2;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    if (!prefersReduced) {
      requestAnimationFrame(draw);
    }
  }

  draw();
})();
