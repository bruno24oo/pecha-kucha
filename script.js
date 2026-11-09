/* TRIVIUM — apresentação temporizada 20 × 20 s */
(() => {
  "use strict";
  const slides = window.TRIVIUM_SLIDES || [];
  const DURATION = 20;
  const $ = (id) => document.getElementById(id);
  const ui = {
    intro:$("intro"), start:$("start"), visual:$("visual"),
    title:$("slide-title"), phrase:$("phrase"), chapter:$("chapter"),
    index:$("index"), timer:$("timer"), progress:$("progress"),
    prev:$("prev"), next:$("next"), play:$("play"),
    restart:$("restart"), fullscreen:$("fullscreen")
  };
  let current = 0, remaining = DURATION, running = false, started = false;
  let lastTick = 0, raf = null;

  const pad = n => String(n).padStart(2,"0");
  const timeText = n => `00:${pad(Math.max(0,Math.ceil(n)))}`;

  function render(animate = true) {
    const s = slides[current];
    if (!s) return;
    if (animate) ui.visual.classList.add("changing");
    window.setTimeout(() => {
      ui.visual.style.backgroundImage = `url("${s.image}")`;
      ui.title.textContent = s.title;
      ui.phrase.textContent = s.phrase;
      ui.chapter.textContent = s.chapter;
      ui.index.innerHTML = `${pad(current+1)} <em>/</em> ${pad(slides.length)}`;
      ui.visual.classList.remove("changing");
    }, animate ? 220 : 0);
    updateClock();
  }

  function updateClock() {
    ui.timer.textContent = timeText(remaining);
    const elapsed = (DURATION - remaining) / DURATION;
    const total = ((current + elapsed) / slides.length) * 100;
    ui.progress.style.width = `${Math.min(100,total)}%`;
    ui.play.textContent = running ? "Ⅱ" : "▶";
    ui.play.setAttribute("aria-label", running ? "Pausar apresentação" : "Continuar apresentação");
  }

  function stopLoop() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = null;
    updateClock();
  }
  function tick(now) {
    if (!running) return;
    if (!lastTick) lastTick = now;
    const delta = (now - lastTick) / 1000;
    lastTick = now;
    remaining -= delta;
    if (remaining <= 0) {
      if (current < slides.length - 1) {
        current++;
        remaining = DURATION;
        render();
      } else {
        remaining = 0;
        stopLoop();
      }
    }
    updateClock();
    if (running) raf = requestAnimationFrame(tick);
  }
  function play() {
    if (!started) {
      started = true;
      ui.intro.classList.add("hidden");
    }
    if (current === slides.length - 1 && remaining <= 0) {
      current = 0; remaining = DURATION; render(false);
    }
    if (running) { stopLoop(); return; }
    running = true; lastTick = 0; updateClock();
    raf = requestAnimationFrame(tick);
  }
  function goTo(index) {
    current = Math.max(0, Math.min(slides.length - 1, index));
    remaining = DURATION;
    render();
    if (running) { lastTick = 0; }
  }
  function restart() {
    stopLoop(); current = 0; remaining = DURATION; started = true;
    ui.intro.classList.add("hidden"); render(false);
  }
  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else document.exitFullscreen?.();
  }

  ui.start.addEventListener("click", play);
  ui.play.addEventListener("click", play);
  ui.prev.addEventListener("click", () => goTo(current - 1));
  ui.next.addEventListener("click", () => goTo(current + 1));
  ui.restart.addEventListener("click", restart);
  ui.fullscreen.addEventListener("click", toggleFullscreen);

  document.addEventListener("keydown", e => {
    if (["ArrowLeft","ArrowRight"," ","KeyR","KeyF"].includes(e.code)) e.preventDefault();
    if (e.code === "ArrowLeft") goTo(current - 1);
    if (e.code === "ArrowRight") goTo(current + 1);
    if (e.code === "Space") play();
    if (e.code === "KeyR") restart();
    if (e.code === "KeyF") toggleFullscreen();
    if (e.code === "Escape" && document.fullscreenElement) document.exitFullscreen?.();
  });

  // Swipe navigation for touch screens.
  let touchX = null;
  $("stage").addEventListener("touchstart", e => touchX = e.changedTouches[0].clientX, {passive:true});
  $("stage").addEventListener("touchend", e => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 55) goTo(current + (dx < 0 ? 1 : -1));
    touchX = null;
  }, {passive:true});

  render(false);
})();
