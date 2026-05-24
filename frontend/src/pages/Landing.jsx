import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './Landing.css';

const PHRASES = ['Stability', 'Trust', 'Identity', 'Authenticity', 'Legitimacy', 'Protection'];

export function Landing() {
  const navigate = useNavigate();
  const containerRef = useRef(null);

  // Lock scroll for the full-viewport landing experience
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Cycling word animation
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let current = 0;
    let activeEl = null;
    let intervalId = null;

    function showNext() {
      if (activeEl) {
        activeEl.classList.remove('visible');
        activeEl.classList.add('leaving');
        const leaving = activeEl;
        setTimeout(() => leaving.remove(), 700);
      }
      const el = document.createElement('span');
      el.className = 'landing-tagline-word';
      el.textContent = PHRASES[current];
      container.appendChild(el);
      requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('visible')));
      activeEl = el;
      current = (current + 1) % PHRASES.length;
    }

    const timeoutId = setTimeout(() => {
      showNext();
      intervalId = setInterval(showNext, 3400);
    }, 2800);

    return () => {
      clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  return (
    <>
      <div className="landing-bg" />
      <div className="landing-vignette" />
      <div className="landing-crown-line" />
      <div className="landing-base-line" />

      <div className="landing-side landing-side-left" aria-hidden="true">
        <div className="landing-side-tick" />
        <div className="landing-side-dot" />
        <div className="landing-side-tick" />
        <div className="landing-side-dot" />
        <div className="landing-side-tick" />
      </div>

      <div className="landing-side landing-side-right" aria-hidden="true">
        <div className="landing-side-tick" />
        <div className="landing-side-dot" />
        <div className="landing-side-tick" />
        <div className="landing-side-dot" />
        <div className="landing-side-tick" />
      </div>

      <main className="landing-stage">
        <div className="landing-ornament" aria-hidden="true">
          <div className="landing-orn-line" />
          <div className="landing-orn-dot" />
          <div className="landing-orn-diamond" />
          <div className="landing-orn-dot" />
          <div className="landing-orn-line right" />
        </div>

        <h1 className="landing-wordmark">Covenant</h1>

        <div className="landing-rule" aria-hidden="true" />

        <div className="landing-tagline-wrap">
          <span className="landing-tagline-static">The next generation of</span>
          <div className="landing-tagline-dynamic-wrap" ref={containerRef} aria-live="polite" />
        </div>

        <div className="landing-demo-btn-wrap">
          <button className="landing-demo-btn" onClick={() => navigate('/demo')}>Launch Demo</button>
        </div>
      </main>

      <div className="landing-seal-mark" aria-hidden="true">
        <svg viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="14" cy="14" r="12.5" stroke="#d4af5a" strokeWidth="0.6" strokeDasharray="2 3" />
          <circle cx="14" cy="14" r="9"    stroke="#d4af5a" strokeWidth="0.5" opacity="0.5" />
          <polygon
            points="14,6 20.06,9.75 20.06,17.25 14,21 7.94,17.25 7.94,9.75"
            fill="none" stroke="#d4af5a" strokeWidth="0.5" opacity="0.6"
          />
          <circle cx="14" cy="14" r="2" fill="#d4af5a" opacity="0.7" />
        </svg>
        <span className="landing-seal-label">MMXXVI</span>
      </div>
    </>
  );
}
