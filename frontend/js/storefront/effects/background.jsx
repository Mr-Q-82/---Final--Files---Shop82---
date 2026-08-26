/* ============================================================
   3D BACKGROUND ENGINE (mouse + scroll, canvas particles)
   ============================================================ */
function useBg3D() {
  useEffect(() => {
    const blobs = [...document.querySelectorAll(".blob")];
    let mx = 0,
      my = 0,
      sy = 0;
    const onMove = (e) => {
      mx = e.clientX / window.innerWidth - 0.5;
      my = e.clientY / window.innerHeight - 0.5;
      blobs.forEach((b, i) => {
        const f = (i + 1) * 30;
        b.style.transform = `translate(${mx * f}px,${my * f + sy * 0.15}px)`;
      });
    };
    const onScroll = () => {
      sy = window.scrollY;
      blobs.forEach((b, i) => {
        const f = (i + 1) * 30;
        b.style.transform = `translate(${mx * f}px,${my * f + sy * 0.15}px)`;
      });
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("scroll", onScroll);

    // particles
    const cvs = document.getElementById("particles");
    const ctx = cvs.getContext("2d");
    let W,
      H,
      parts = [];
    const resize = () => {
      W = cvs.width = window.innerWidth;
      H = cvs.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);
    for (let i = 0; i < 60; i++)
      parts.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 2 + 0.5,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
      });
    let raf;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      const dark =
        document.documentElement.getAttribute("data-theme") === "dark";
      parts.forEach((p) => {
        p.x += p.vx + mx * 0.5;
        p.y += p.vy + my * 0.5;
        if (p.x < 0) p.x = W;
        if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H;
        if (p.y > H) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, 7);
        ctx.fillStyle = dark ? "rgba(139,92,246,.5)" : "rgba(109,40,217,.35)";
        ctx.fill();
      });
      // connect
      for (let i = 0; i < parts.length; i++)
        for (let j = i + 1; j < parts.length; j++) {
          const a = parts[i],
            b = parts[j],
            d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < 120) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(109,40,217,${0.12 * (1 - d / 120)})`;
            ctx.stroke();
          }
        }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", resize);
    };
  }, []);
}
