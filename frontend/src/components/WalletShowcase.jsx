import { useState, useEffect, useCallback, useRef } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI, RPC_URL } from '../utils/contract';

const CARDS = [
  {
    tier: 1,
    name: 'Bronze',
    numeral: 'I',
    tagline: 'Verified Human',
    address: '0x1111111111111111111111111111111111111111',
    accent: '#c8922a',
    cardBg: 'linear-gradient(145deg, #1c0900 0%, #14000c 55%, #0a0006 100%)',
    textStyle: { color: '#c8922a' },
    sig: '0x3f1a9c···e84b2d',
    issuedAt: 'February 4, 2026',
    verified: true,
  },
  {
    tier: 2,
    name: 'Silver',
    numeral: 'II',
    tagline: 'Named Identity',
    address: '0x3333333333333333333333333333333333333333',
    accent: '#a09488',
    cardBg: 'linear-gradient(145deg, #151515 0%, #14000c 55%, #0a0006 100%)',
    textStyle: { color: '#c8bfb0' },
    sig: '0x7d2e4a···c19f83',
    issuedAt: 'January 18, 2026',
    verified: true,
  },
  {
    tier: 3,
    name: 'Gold',
    numeral: 'III',
    tagline: 'Enhanced Due Diligence',
    address: '0x5555555555555555555555555555555555555555',
    accent: '#d4af5a',
    cardBg: 'linear-gradient(145deg, #1a1300 0%, #14000c 55%, #0a0006 100%)',
    textStyle: { color: '#d4af5a' },
    sig: '0xa84f1c···5b37e9',
    issuedAt: 'March 2, 2026',
    verified: true,
  },
  {
    tier: 4,
    name: 'Platinum',
    numeral: 'IV',
    tagline: 'Sophisticated Investor',
    address: '0x8888888888888888888888888888888888888888',
    accent: '#93c5fd',
    cardBg: 'linear-gradient(145deg, #00091c 0%, #14000c 55%, #0a0006 100%)',
    textStyle: { color: '#93c5fd' },
    sig: '0x2c6b8e···f04a71',
    issuedAt: 'April 11, 2026',
    verified: true,
  },
  {
    tier: 5,
    name: 'Diamond',
    numeral: 'V',
    tagline: 'Institutional Entity',
    address: '0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
    accent: '#d8b4fe',
    cardBg: 'linear-gradient(145deg, #0e0018 0%, #14000c 55%, #0a0006 100%)',
    textStyle: { color: '#d8b4fe' },
    sig: '0x91d3c7···b28f4e',
    issuedAt: 'April 25, 2026',
    verified: true,
  },
];

const TIER_GLOW_SCALE = { 1: 0.2, 2: 0.4, 3: 0.6, 4: 0.8, 5: 1.0 };
const gh = (base, tier) => {
  const n = Math.round(parseInt(base, 16) * (TIER_GLOW_SCALE[tier] ?? 1.0));
  return n.toString(16).padStart(2, '0');
};

// Base dimensions (desktop)
const CARD_W       = 400;
const CARD_H       = 212;
const WALLET_W     = 430;
const WALLET_H     = 262;
const CARD_TOP_PAD = 20;
const WALLET_TOP   = 138 + CARD_TOP_PAD;
const CONTAINER_H  = WALLET_TOP + WALLET_H;
const CARD_PEEK    = 10;
const CARD_Y_IN    = WALLET_TOP - CARD_PEEK;
const CARD_Y_OUT   = CARD_TOP_PAD;
const GAP          = 28;

// Returns a 0–1 scale factor so the wallet fits within the viewport with padding
function useViewScale() {
  const compute = () => Math.min(1, (window.innerWidth - 32) / WALLET_W);
  const [vs, setVs] = useState(compute);
  useEffect(() => {
    const onResize = () => setVs(compute());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return vs;
}

// Renders the card face at any scale — used in both carousel and inspect overlay
function CardFace({ c, scale = 1, inspect = false, verifiedOverride = undefined }) {
  const s = (px) => `${Math.round(px * scale)}px`;
  const resolvedVerified = verifiedOverride !== undefined ? verifiedOverride : c.verified;
  const statusColor = resolvedVerified === null ? '#a09488' : resolvedVerified ? '#86efac' : '#fca5a5';

  return (
    <div
      style={{
        width: s(CARD_W),
        height: s(CARD_H),
        position: 'relative',
        background: c.cardBg,
        border: `1px solid ${c.accent}${gh('38', c.tier)}`,
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      {/* Top accent bar */}
      <div style={{ height: s(4), background: c.accent, opacity: 0.75 }} />

      {/* Diagonal stripe texture overlay */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 18px, rgba(255,255,255,0.013) 18px, rgba(255,255,255,0.013) 19px)`,
      }} />

      {/* Watermark numeral */}
      <div style={{
        position: 'absolute', top: '50%', left: '40%',
        transform: 'translate(-50%, -50%)',
        fontFamily: 'Cinzel, serif', fontWeight: 700,
        fontSize: s(160), lineHeight: 1,
        color: c.accent, opacity: 0.04,
        pointerEvents: 'none', userSelect: 'none',
      }}>
        {c.numeral}
      </div>

      {/* Card content */}
      <div style={{ padding: `${s(14)} ${s(20)}`, display: 'flex', flexDirection: 'column', height: `calc(100% - ${s(4)})` }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p style={{ fontFamily: 'Cinzel, serif', fontSize: s(8), letterSpacing: '0.36em', textTransform: 'uppercase', color: '#ffffff2a' }}>
              Covenant
            </p>
            <p style={{ fontFamily: 'Cinzel, serif', fontSize: s(6), letterSpacing: '0.44em', textTransform: 'uppercase', color: '#ffffff16', marginTop: s(2) }}>
              Protocol
            </p>
          </div>
          {/* Status dot — idle grey in showcase, colored glow in inspect */}
          <span style={{
            width: s(7), height: s(7), borderRadius: '50%',
            display: 'inline-block', flexShrink: 0, marginTop: s(2),
            background: inspect ? statusColor : 'rgba(148,132,122,0.22)',
            boxShadow: inspect ? `0 0 ${s(7)} ${statusColor}` : 'none',
            animation: inspect ? 'dotPulse 3.5s ease-in-out infinite' : 'none',
            transition: 'background 0.4s, box-shadow 0.4s',
          }} />
        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: `${c.accent}22`, margin: `${s(10)} 0` }} />

        {/* Tier hero */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: s(12), flex: 1 }}>
          <span style={{ fontFamily: 'Cinzel, serif', fontWeight: 700, fontSize: s(52), lineHeight: 1, ...c.textStyle }}>
            {c.numeral}
          </span>
          <div>
            <p style={{ fontFamily: 'Cinzel, serif', fontSize: s(14), letterSpacing: '0.2em', textTransform: 'uppercase', ...c.textStyle }}>
              {c.name}
            </p>
            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: s(12), color: '#ffffff32', marginTop: s(3) }}>
              {c.tagline}
            </p>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: `${c.accent}22`, margin: `${s(10)} 0` }} />

        {/* Footer — normal: address + verified dot  |  inspect: sig + date + status */}
        {inspect ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: s(6) }}>
            <div>
              <p style={{ fontFamily: 'Cinzel, serif', fontSize: s(6), letterSpacing: '0.3em', textTransform: 'uppercase', color: '#ffffff28', marginBottom: s(2) }}>
                Covenant Signature
              </p>
              <p style={{ fontFamily: 'monospace', fontSize: s(9), color: '#ffffff45', letterSpacing: '0.04em' }}>
                {c.sig}
              </p>
            </div>
            <div style={{ paddingBottom: s(4) }}>
              <p style={{ fontFamily: 'Cinzel, serif', fontSize: s(6), letterSpacing: '0.3em', textTransform: 'uppercase', color: '#ffffff28', marginBottom: s(2) }}>
                Issued
              </p>
              <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: s(11), color: '#ffffff60', fontStyle: 'italic' }}>
                {c.issuedAt}
              </p>
            </div>
          </div>
        ) : (
          <p style={{ fontFamily: 'monospace', fontSize: s(9), color: '#ffffff22' }}>
            {c.address.slice(0, 6)}···{c.address.slice(-4)}
          </p>
        )}

      </div>
    </div>
  );
}

const BREATHE_STYLE = (
  <style>{`
    @keyframes breathe { 0%,100%{opacity:.55;transform:scale(1)} 50%{opacity:1;transform:scale(1.45)} }
    @keyframes dotPulse { 0%,100%{opacity:.5} 50%{opacity:.95} }
    .showcase-scroll::-webkit-scrollbar { display: none; }
  `}</style>
);

// Full-screen inspect overlay
function InspectOverlay({ card, onClose, onVerify }) {
  const [visible, setVisible] = useState(false);
  const [liveVerified, setLiveVerified] = useState(null);
  // Fit card to viewport on mobile, allow up to 1.72× on desktop
  const inspectScale = Math.min(1.72, (window.innerWidth - 48) / CARD_W);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
    contract.getVerificationStatus(card.address)
      .then(([verified, , revoked]) => setLiveVerified(verified && !revoked))
      .catch(() => setLiveVerified(false));

    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, card.address]);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '28px',
        background: 'rgba(4, 0, 8, 0.88)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        transition: 'opacity 0.3s ease',
        opacity: visible ? 1 : 0,
      }}
    >
      {BREATHE_STYLE}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: 'relative',
          transition: 'transform 0.5s cubic-bezier(0.34, 1.4, 0.64, 1), opacity 0.35s ease',
          transform: visible ? 'scale(1) translateY(0)' : 'scale(0.75) translateY(40px)',
          opacity: visible ? 1 : 0,
          filter: `drop-shadow(0 24px 48px ${card.accent}${gh('30', card.tier)})`,
        }}
      >
        <CardFace c={card} scale={inspectScale} inspect verifiedOverride={liveVerified} />
        <img
          src={`/tiers/tier-${card.tier}.png`}
          alt=""
          style={{
            position: 'absolute',
            top: `${Math.round(-40 * inspectScale)}px`,
            right: `${Math.round(-50 * inspectScale)}px`,
            width: `${Math.round(300 * inspectScale)}px`,
            height: `${Math.round(300 * inspectScale)}px`,
            objectFit: 'contain',
            opacity: 0.92,
            pointerEvents: 'none',
          }}
        />
      </div>

      <div
        onClick={e => e.stopPropagation()}
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
          transition: 'opacity 0.4s ease 0.1s',
          opacity: visible ? 1 : 0,
        }}
      >
        <button
          onClick={onVerify}
          style={{
            fontFamily: 'Cinzel, serif', fontSize: '10px', letterSpacing: '0.28em',
            textTransform: 'uppercase', padding: '12px 32px',
            background: card.accent, color: '#0a0006',
            border: 'none', cursor: 'pointer', fontWeight: 600,
          }}
        >
          More Info
        </button>
      </div>
    </div>
  );
}

export function WalletShowcase({ onSearch }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [settled, setSettled] = useState(false);
  const [inspecting, setInspecting] = useState(false);
  const [hovered, setHovered] = useState(null);
  const scrollRef = useRef(null);
  const scrollSource = useRef('programmatic');

  // Responsive scale — shrinks everything on narrow viewports
  const vs = useViewScale();
  const walletW    = Math.round(WALLET_W * vs);
  const walletH    = Math.round(WALLET_H * vs);
  const containerH = Math.round(CONTAINER_H * vs);
  const cardYIn    = Math.round(CARD_Y_IN * vs);
  const cardYOut   = Math.round(CARD_Y_OUT * vs);
  const gap        = Math.round(GAP * vs);
  const liftPx     = Math.round(6 * vs);

  // Scroll to active item; skip if the change came from user scroll
  useEffect(() => {
    if (!scrollRef.current) return;
    if (scrollSource.current === 'user') {
      scrollSource.current = 'programmatic';
      return;
    }
    scrollRef.current.scrollTo({ left: active * (walletW + gap), behavior: 'smooth' });
  }, [active, walletW, gap]);

  useEffect(() => {
    if (paused || settled) return;
    const id = setInterval(() => setActive(i => (i + 1) % CARDS.length), 3500);
    return () => clearInterval(id);
  }, [paused, settled]);

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const i = Math.round(scrollRef.current.scrollLeft / (walletW + gap));
    const clamped = Math.max(0, Math.min(CARDS.length - 1, i));
    if (clamped !== active) {
      scrollSource.current = 'user';
      setActive(clamped);
      setSettled(true);
    }
  }, [active, walletW, gap]);

  const handleItemClick = (i) => {
    if (i === active) {
      setInspecting(true);
    } else {
      setActive(i);
      setSettled(true);
    }
  };

  const handleVerify = useCallback(() => {
    setInspecting(false);
    onSearch(CARDS[active].address);
  }, [active, onSearch]);

  return (
    <>
      {inspecting && (
        <InspectOverlay
          card={CARDS[active]}
          onClose={() => setInspecting(false)}
          onVerify={handleVerify}
        />
      )}

      <div
        className="flex flex-col items-center select-none"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* Carousel rail — scroll-snap, horizontally scrollable */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="showcase-scroll relative w-full"
          style={{
            height: `${containerH}px`,
            overflowX: 'auto',
            scrollSnapType: 'x mandatory',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          <div
            className="flex"
            style={{
              gap: `${gap}px`,
              paddingLeft: `calc(50% - ${walletW / 2}px)`,
              paddingRight: `calc(50% - ${walletW / 2}px)`,
              height: '100%',
              width: 'max-content',
            }}
          >
            {CARDS.map((c, i) => {
              const dist            = Math.abs(i - active);
              const isActive        = dist === 0;
              const isHovered       = hovered === i;
              const isActiveHovered = isActive && isHovered;

              return (
                <div
                  key={c.tier}
                  onClick={() => handleItemClick(i)}
                  style={{
                    width: `${walletW}px`,
                    height: `${containerH}px`,
                    position: 'relative',
                    flexShrink: 0,
                    scrollSnapAlign: 'center',
                    cursor: 'pointer',
                    opacity: isActive ? 1 : isHovered ? (dist === 1 ? 0.65 : 0.38) : (dist === 1 ? 0.45 : 0.2),
                    transition: 'opacity 0.3s ease',
                  }}
                >
                  {/* Credential card — hover target is the card only */}
                  <div
                    onMouseEnter={() => setHovered(i)}
                    onMouseLeave={() => setHovered(null)}
                    style={{
                      position: 'absolute', left: '50%', top: 0,
                      transform: `translateX(-50%) translateY(${isActive ? (isActiveHovered ? cardYOut - liftPx : cardYOut) : cardYIn}px)`,
                      transition: 'transform 0.4s cubic-bezier(0.25, 1.35, 0.5, 1), filter 0.3s ease',
                      filter: isActiveHovered ? `drop-shadow(0 12px 28px ${c.accent}${gh('45', c.tier)})` : 'none',
                      zIndex: 5,
                    }}
                  >
                    <CardFace c={c} scale={vs} />
                    {/* Seal — on card face, lower-right, partially tucked under wallet lip */}
                    <img
                      src={`/tiers/tier-${c.tier}.png`}
                      alt=""
                      style={{
                        position: 'absolute',
                        top: `${Math.round(-40 * vs)}px`,
                        right: `${Math.round(-50 * vs)}px`,
                        width: `${Math.round(300 * vs)}px`,
                        height: `${Math.round(300 * vs)}px`,
                        objectFit: 'contain',
                        opacity: 0.92,
                        pointerEvents: 'none',
                      }}
                    />
                  </div>

                  {/* Wallet body */}
                  <div
                    style={{
                      position: 'absolute', bottom: 0, left: '50%',
                      transform: 'translateX(-50%)',
                      width: `${walletW}px`,
                      height: `${walletH}px`,
                      zIndex: 10,
                      background: 'linear-gradient(180deg, #120009 0%, #0a0005 60%, #070003 100%)',
                      border: `1px solid rgba(255,255,255,0.08)`,
                      borderTop: `2px solid ${c.accent}${gh('55', c.tier)}`,
                      borderRadius: '0 0 4px 4px',
                      boxShadow: `0 8px 32px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.04)`,
                    }}
                  >

                    <div style={{ height: '1px', background: `${c.accent}20`, marginTop: '10px', marginLeft: '16px', marginRight: '16px' }} />
                    <div style={{ padding: '14px 18px 0' }}>
                      <div style={{ height: '1px', background: 'rgba(255,255,255,0.04)', marginBottom: '6px' }} />
                      <div style={{ height: '1px', background: 'rgba(255,255,255,0.03)' }} />
                    </div>
                    <div style={{ position: 'absolute', bottom: '14px', left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                      <p style={{ fontFamily: 'Cinzel, serif', fontSize: '7px', letterSpacing: '0.4em', textTransform: 'uppercase', color: `${c.accent}35` }}>
                        Covenant
                      </p>
                      <p style={{ fontFamily: 'monospace', fontSize: '9px', letterSpacing: '0.08em', color: `${c.accent}45` }}>
                        {c.address.slice(0, 6)}···{c.address.slice(-6)}
                      </p>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        </div>

        {/* Dot indicators */}
        <div className="flex items-center gap-3 mt-7">
          {CARDS.map((c, i) => (
            <button
              key={c.tier}
              onClick={() => { setActive(i); setSettled(true); }}
              className="transition-all duration-300 rounded-full"
              style={{
                width: i === active ? '32px' : '10px',
                height: '10px',
                background: i === active ? CARDS[active].accent : 'rgba(255,255,255,0.18)',
                padding: 0,
              }}
            />
          ))}
        </div>

      </div>
    </>
  );
}
