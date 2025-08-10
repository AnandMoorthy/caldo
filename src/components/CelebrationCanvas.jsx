import React, { useEffect, useRef } from "react";

export default function CelebrationCanvas({ seed }) {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const startedAtRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animationFrame = 0;
    let width = (canvas.width = window.innerWidth * window.devicePixelRatio);
    let height = (canvas.height = window.innerHeight * window.devicePixelRatio);
    canvas.style.width = "100%";
    canvas.style.height = "100%";

    function onResize() {
      width = canvas.width = window.innerWidth * window.devicePixelRatio;
      height = canvas.height = window.innerHeight * window.devicePixelRatio;
      canvas.style.width = "100%";
      canvas.style.height = "100%";
    }
    window.addEventListener("resize", onResize);

    const colors = ["#22c55e", "#10b981", "#f59e0b", "#3b82f6", "#ef4444", "#a855f7"];
    const particleCount = Math.min(180, Math.floor((window.innerWidth * window.innerHeight) / 8000));

    function spawnParticles() {
      const particles = [];
      for (let i = 0; i < particleCount; i++) {
        const angle = Math.random() * Math.PI - Math.PI / 2;
        const speed = 4 + Math.random() * 6;
        particles.push({
          x: width / 2 + (Math.random() - 0.5) * (width * 0.3),
          y: height * 0.2 + Math.random() * (height * 0.15),
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          g: 0.18 + Math.random() * 0.12,
          w: 6 + Math.random() * 6,
          h: 8 + Math.random() * 10,
          r: Math.random() * Math.PI,
          vr: (Math.random() - 0.5) * 0.2,
          color: colors[i % colors.length],
          life: 0,
          maxLife: 120 + Math.random() * 60,
        });
      }
      particlesRef.current = particles;
    }

    function drawParticle(p) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.r);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }

    function step(ts) {
      if (!startedAtRef.current) startedAtRef.current = ts;
      ctx.clearRect(0, 0, width, height);
      for (const p of particlesRef.current) {
        p.vy += p.g;
        p.x += p.vx;
        p.y += p.vy;
        p.r += p.vr;
        p.life += 1;
        drawParticle(p);
      }
      particlesRef.current = particlesRef.current.filter((p) => p.life < p.maxLife && p.y < height + 40);
      animationFrame = requestAnimationFrame(step);
    }

    spawnParticles();
    animationFrame = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", onResize);
    };
  }, [seed]);

  return <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-[60]" aria-hidden="true" />;
}


