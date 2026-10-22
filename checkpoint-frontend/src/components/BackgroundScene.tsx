import { useEffect, useRef } from "react";

/**
 * The sky behind the app: gradient, drifting colour blobs, a moon, soft hills
 * and a little floating dust. Dust stops for reduced motion and when the tab
 * is hidden, so it stays cheap.
 */
export function BackgroundScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    const dust = Array.from({ length: 26 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: 1 + Math.random() * 2.2,
      s: 0.02 + Math.random() * 0.05,
      a: 0.25 + Math.random() * 0.45,
    }));

    const resize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(now - last, 64) / 1000;
      last = now;
      ctx.clearRect(0, 0, width, height);
      for (const d of dust) {
        d.y -= d.s * dt;
        if (d.y < -0.02) d.y = 1.02;
        ctx.beginPath();
        ctx.arc(d.x * width, d.y * height, d.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${d.a})`;
        ctx.fill();
      }
      frame = requestAnimationFrame(tick);
    };
    const onVisibility = () => {
      cancelAnimationFrame(frame);
      if (!document.hidden) {
        last = performance.now();
        frame = requestAnimationFrame(tick);
      }
    };
    frame = requestAnimationFrame(tick);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <div className="scene" aria-hidden="true">
      <i className="blob" style={{ width: 520, height: 520, left: -120, top: -100, background: "#8b6cf0" }} />
      <i className="blob" style={{ width: 460, height: 460, right: -100, top: "25%", background: "#ef7fa8", opacity: 0.35, animationDuration: "38s" }} />
      <i className="blob" style={{ width: 500, height: 500, left: "35%", bottom: -200, background: "#7fd8f0", opacity: 0.3, animationDuration: "34s" }} />
      <i className="moon" />
      <canvas ref={canvasRef} />
      <svg viewBox="0 0 1200 300" preserveAspectRatio="none">
        <path d="M0 140C200 60 350 120 560 80S980 40 1200 110V300H0Z" fill="#8b6cf0" opacity=".14" />
        <path d="M0 190C220 130 420 200 640 160S1000 120 1200 180V300H0Z" fill="#7a58d8" opacity=".16" />
        <path d="M0 240C250 200 450 250 700 215S1020 190 1200 235V300H0Z" fill="#5b3fc0" opacity=".18" />
      </svg>
      <div className="grain" />
    </div>
  );
}
