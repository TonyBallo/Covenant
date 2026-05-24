import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI, RPC_URL } from '../utils/contract';

// ============ Mock Dashboard (shown when access is granted) ============

function ProtectedDashboard({ walletAddress }) {
  return (
    <div className="space-y-6">

      {/* Access granted header */}
      <div className="border border-gold/40 bg-tyrian-darker overflow-hidden">
        <div className="bg-tyrian-dark border-b border-gold/25 px-5 py-4 sm:px-8 sm:py-5 flex items-center justify-between">
          <div>
            <p className="font-cinzel text-marble-muted text-xs tracking-widest uppercase mb-1">
              Protected Protocol
            </p>
            <p className="font-cinzel text-gold text-lg tracking-wide">Access Granted</p>
          </div>
          <div className="flex items-center gap-2 bg-gold/10 border border-gold/30 px-3 py-2">
            <span className="w-2 h-2 bg-gold rounded-full animate-pulse"></span>
            <span className="font-cinzel text-gold text-xs tracking-widest uppercase">Verified</span>
          </div>
        </div>
        <div className="px-5 py-5 sm:px-8 sm:py-6">
          <p className="font-cormorant text-marble text-xl italic mb-2">
            Your Covenant seal has been verified. Welcome to Protected Protocol.
          </p>
          <p className="font-mono text-marble-muted text-xs break-all">{walletAddress}</p>
        </div>
      </div>

      {/* Mock dashboard */}
      <div className="border border-gold/20 bg-tyrian-darker overflow-hidden">
        <div className="border-b border-gold/15 px-8 py-5">
          <h2 className="font-cinzel text-marble text-base tracking-widest uppercase">
            Protected Protocol Dashboard
          </h2>
        </div>

        {/* Metrics row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-gold/10 border-b border-gold/15">
          {[
            { label: 'Total Value Locked', value: '$4,821,300', change: '+2.4%' },
            { label: 'Your Position',      value: '$12,450',   change: '+0.8%' },
            { label: 'Yield (30d)',         value: '6.12%',     change: '+0.3%' },
          ].map(({ label, value, change }) => (
            <div key={label} className="bg-tyrian-darker px-5 py-4 sm:px-6 sm:py-5">
              <p className="font-cinzel text-marble-muted text-xs tracking-widest uppercase mb-2">{label}</p>
              <p className="font-cinzel text-marble text-2xl tracking-wide mb-1">{value}</p>
              <p className="font-cormorant text-gold italic text-sm">{change} this week</p>
            </div>
          ))}
        </div>

        {/* Mock activity feed */}
        <div className="px-8 py-6">
          <p className="font-cinzel text-marble-muted text-xs tracking-widest uppercase mb-4">
            Recent Activity
          </p>
          <div className="space-y-3">
            {[
              { type: 'Deposit',    amount: '+500 USDC',  time: '2 hours ago',   status: 'Confirmed' },
              { type: 'Yield',      amount: '+1.24 USDC', time: '8 hours ago',   status: 'Confirmed' },
              { type: 'Deposit',    amount: '+200 USDC',  time: '3 days ago',    status: 'Confirmed' },
              { type: 'Withdrawal', amount: '-150 USDC',  time: '5 days ago',    status: 'Confirmed' },
            ].map(({ type, amount, time, status }, i) => (
              <div key={i} className="flex items-center justify-between border border-gold/10 bg-tyrian-dark px-5 py-3">
                <div>
                  <p className="font-cinzel text-marble text-xs tracking-wide">{type}</p>
                  <p className="font-cormorant text-marble-muted italic text-sm">{time}</p>
                </div>
                <div className="text-right">
                  <p className={`font-mono text-sm font-semibold ${amount.startsWith('+') ? 'text-gold' : 'text-marble-dim'}`}>
                    {amount}
                  </p>
                  <p className="font-cinzel text-marble-muted text-xs tracking-widest">{status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mock action buttons */}
        <div className="px-5 pb-6 sm:px-8 sm:pb-8 flex flex-wrap gap-4">
          <button className="font-cinzel text-xs tracking-widest uppercase px-6 py-3 bg-gold text-tyrian-deep hover:bg-gold-dim transition-colors">
            Deposit
          </button>
          <button className="font-cinzel text-xs tracking-widest uppercase px-6 py-3 border border-gold/40 text-gold hover:bg-gold/10 transition-colors">
            Withdraw
          </button>
        </div>
      </div>
    </div>
  );
}

// ============ Access Restricted ============

const DENIAL_COPY = {
  no_seal: {
    headline: 'No Covenant seal found for this wallet.',
    detail: 'Protected Protocol requires a minimum Silver (Tier II) Covenant seal. This wallet has not completed Covenant verification.',
    cta: 'Get Verified',
    borderColor: 'border-red-900/50',
    headerBorder: 'border-red-900/30',
    headerText: 'text-red-400',
    badgeBg: 'bg-red-950/40 border-red-900/40',
    badgeDot: 'bg-red-500',
    badgeText: 'text-red-400',
    divider: 'via-red-800/50',
  },
  wrong_tier: {
    headline: 'Insufficient trust tier.',
    detail: 'Protected Protocol requires a minimum Silver (Tier II) Covenant seal. This wallet holds a seal below the required tier.',
    cta: 'View Tier Requirements',
    borderColor: 'border-red-900/50',
    headerBorder: 'border-red-900/30',
    headerText: 'text-red-400',
    badgeBg: 'bg-red-950/40 border-red-900/40',
    badgeDot: 'bg-red-500',
    badgeText: 'text-red-400',
    divider: 'via-red-800/50',
  },
  expired: {
    headline: 'Covenant seal has expired.',
    detail: 'This wallet\'s Covenant seal is no longer valid. Verification must be renewed before access can be granted.',
    cta: 'Renew Verification',
    borderColor: 'border-amber-700/50',
    headerBorder: 'border-amber-700/30',
    headerText: 'text-amber-400',
    badgeBg: 'bg-amber-950/40 border-amber-700/40',
    badgeDot: 'bg-amber-500',
    badgeText: 'text-amber-400',
    divider: 'via-amber-700/50',
  },
  revoked: {
    headline: 'Covenant seal has been revoked.',
    detail: 'This wallet\'s Covenant seal was revoked and is no longer valid for protocol access. Contact Covenant support if this is unexpected.',
    cta: null,
    borderColor: 'border-red-900/50',
    headerBorder: 'border-red-900/30',
    headerText: 'text-red-400',
    badgeBg: 'bg-red-950/40 border-red-900/40',
    badgeDot: 'bg-red-500',
    badgeText: 'text-red-400',
    divider: 'via-red-800/50',
  },
};

function AccessRestricted({ reason = 'no_seal' }) {
  const copy = DENIAL_COPY[reason] ?? DENIAL_COPY.no_seal;
  return (
    <div className={`border ${copy.borderColor} bg-tyrian-darker overflow-hidden`}>
      <div className={`bg-tyrian-dark border-b ${copy.headerBorder} px-8 py-5 flex items-center justify-between`}>
        <div>
          <p className="font-cinzel text-marble-muted text-xs tracking-widest uppercase mb-1">
            Protected Protocol
          </p>
          <p className={`font-cinzel ${copy.headerText} text-lg tracking-wide`}>Access Restricted</p>
        </div>
        <div className={`flex items-center gap-2 ${copy.badgeBg} border px-3 py-2`}>
          <span className={`w-2 h-2 ${copy.badgeDot} rounded-full`}></span>
          <span className={`font-cinzel ${copy.badgeText} text-xs tracking-widest uppercase`}>Denied</span>
        </div>
      </div>
      <div className="px-8 py-10 text-center">
        <div className={`w-px h-12 bg-gradient-to-b from-transparent ${copy.divider} to-transparent mx-auto mb-8`}></div>
        <p className="font-cormorant text-marble text-2xl italic mb-4 leading-relaxed">
          {copy.headline}
        </p>
        <p className="font-cormorant text-marble-muted italic text-lg mb-10">
          {copy.detail}
        </p>
        {copy.cta && (
          <Link
            to="/demo/get-verified"
            className="font-cinzel text-xs tracking-widest uppercase px-8 py-3 bg-gold text-tyrian-deep hover:bg-gold-dim transition-colors"
          >
            {copy.cta}
          </Link>
        )}
      </div>
    </div>
  );
}

// ============ Mystery Showcase ============

const NEUTRAL = '#7a7080';
const CB = 'linear-gradient(145deg, #130009 0%, #0e0007 55%, #0a0005 100%)';
// Addresses shuffled — tier order is intentionally non-sequential
const MYSTERY_CARDS = [
  { id: 0, accent: NEUTRAL, cardBg: CB, address: '0x3333333333333333333333333333333333333333' },
  { id: 1, accent: NEUTRAL, cardBg: CB, address: '0x1111111111111111111111111111111111111111' },
  { id: 2, accent: NEUTRAL, cardBg: CB, address: '0x8888888888888888888888888888888888888888' },
  { id: 3, accent: NEUTRAL, cardBg: CB, address: '0x2222222222222222222222222222222222222222' },
  { id: 4, accent: NEUTRAL, cardBg: CB, address: '0x5555555555555555555555555555555555555555' },
];

const MC_W = 320;
const MC_H = 172;

function MysteryCard({ c, vs, isActive }) {
  const s = px => `${Math.round(px * vs)}px`;
  return (
    <div style={{
      width: s(MC_W), height: s(MC_H),
      position: 'relative',
      background: c.cardBg,
      border: `1px solid ${c.accent}${isActive ? '50' : '20'}`,
      overflow: 'hidden', flexShrink: 0,
      transition: 'border-color 0.3s',
    }}>
      <div style={{ height: s(3), background: c.accent, opacity: isActive ? 0.75 : 0.25 }} />
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 18px, rgba(255,255,255,0.013) 18px, rgba(255,255,255,0.013) 19px)',
      }} />
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        fontFamily: 'Cinzel, serif', fontWeight: 700,
        fontSize: s(130), lineHeight: 1,
        color: c.accent, opacity: 0.04,
        pointerEvents: 'none', userSelect: 'none',
      }}>?</div>
      <img src="/tiers/tier-1.png" alt="" style={{
        position: 'absolute', top: s(-28), right: s(-36),
        width: s(230), height: s(230), objectFit: 'contain',
        opacity: 0.08, filter: 'blur(10px)', pointerEvents: 'none',
      }} />
      <div style={{ padding: `${s(11)} ${s(15)}`, display: 'flex', flexDirection: 'column', height: `calc(100% - ${s(3)})` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p style={{ fontFamily: 'Cinzel, serif', fontSize: s(7), letterSpacing: '0.36em', textTransform: 'uppercase', color: '#ffffff2a' }}>Covenant</p>
            <p style={{ fontFamily: 'Cinzel, serif', fontSize: s(5.5), letterSpacing: '0.44em', textTransform: 'uppercase', color: '#ffffff16', marginTop: s(2) }}>Protocol</p>
          </div>
          <span style={{ width: s(6), height: s(6), borderRadius: '50%', background: 'rgba(148,132,122,0.2)', flexShrink: 0, marginTop: s(2) }} />
        </div>
        <div style={{ height: '1px', background: `${c.accent}1a`, margin: `${s(9)} 0` }} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: s(6) }}>
          <span style={{ fontFamily: 'Cinzel, serif', fontWeight: 700, fontSize: s(44), lineHeight: 1, color: c.accent, opacity: 0.35 }}>?</span>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: s(4) }}>
            <div style={{ width: s(80), height: s(8), background: `${c.accent}22`, filter: 'blur(3px)', borderRadius: '2px' }} />
            <div style={{ width: s(110), height: s(7), background: 'rgba(255,255,255,0.07)', filter: 'blur(3px)', borderRadius: '2px' }} />
          </div>
        </div>
        <div style={{ height: '1px', background: `${c.accent}1a`, margin: `${s(9)} 0` }} />
        <p style={{ fontFamily: 'monospace', fontSize: s(8), color: '#ffffff15', letterSpacing: '0.08em' }}>
          0x• • • • • • • • • •
        </p>
      </div>
    </div>
  );
}

function MysteryShowcase({ inputAddress, setInputAddress, onCheck, onCardClick, error }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const scrollRef = useRef(null);
  const scrollSource = useRef('programmatic');

  const [vs, setVs] = useState(() => Math.min(1, (window.innerWidth - 32) / MC_W));
  useEffect(() => {
    const onResize = () => setVs(Math.min(1, (window.innerWidth - 32) / MC_W));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const cardW = Math.round(MC_W * vs);
  const gap   = Math.round(20 * vs);

  useEffect(() => {
    if (!scrollRef.current) return;
    if (scrollSource.current === 'user') { scrollSource.current = 'programmatic'; return; }
    scrollRef.current.scrollTo({ left: active * (cardW + gap), behavior: 'smooth' });
  }, [active, cardW, gap]);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setActive(i => (i + 1) % MYSTERY_CARDS.length), 3000);
    return () => clearInterval(id);
  }, [paused]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const i = Math.round(scrollRef.current.scrollLeft / (cardW + gap));
    const clamped = Math.max(0, Math.min(MYSTERY_CARDS.length - 1, i));
    if (clamped !== active) { scrollSource.current = 'user'; setActive(clamped); setPaused(true); }
  };

  return (
    <div
      className="flex flex-col items-center select-none"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <style>{`.mystery-scroll::-webkit-scrollbar { display: none; }`}</style>
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="mystery-scroll"
        style={{
          width: '100%', overflowX: 'auto',
          scrollSnapType: 'x mandatory', scrollbarWidth: 'none', msOverflowStyle: 'none',
        }}
      >
        <div style={{
          display: 'flex', gap: `${gap}px`,
          paddingLeft: `calc(50% - ${cardW / 2}px)`,
          paddingRight: `calc(50% - ${cardW / 2}px)`,
          width: 'max-content',
        }}>
          {MYSTERY_CARDS.map((c, i) => {
            const dist = Math.abs(i - active);
            const isActive = dist === 0;
            return (
              <div
                key={c.id}
                onClick={() => { setActive(i); setPaused(true); onCardClick(c.address); }}
                style={{
                  scrollSnapAlign: 'center', flexShrink: 0, cursor: 'pointer',
                  opacity: isActive ? 1 : dist === 1 ? 0.4 : 0.15,
                  transform: isActive ? 'scale(1)' : 'scale(0.97)',
                  transition: 'opacity 0.3s, transform 0.3s',
                  filter: isActive ? `drop-shadow(0 10px 28px ${NEUTRAL}30)` : 'none',
                }}
              >
                <MysteryCard c={c} vs={vs} isActive={isActive} />
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-3 mt-5 mb-7">
        {MYSTERY_CARDS.map((_, i) => (
          <button
            key={i}
            onClick={() => { setActive(i); setPaused(true); }}
            style={{
              width: i === active ? '28px' : '8px', height: '8px',
              borderRadius: '9999px',
              background: i === active ? NEUTRAL : 'rgba(255,255,255,0.18)',
              border: 'none', padding: 0, cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
          />
        ))}
      </div>

      <div className="w-full border border-gold/20 bg-tyrian-darker p-6 sm:p-8">
        <p className="font-cormorant text-marble-muted italic text-base text-center mb-5">
          Click any seal to check its access — or enter an address manually.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={inputAddress}
            onChange={e => setInputAddress(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && onCheck()}
            placeholder="0x..."
            className="flex-1 bg-tyrian-deep border border-gold/30 focus:border-gold/60 outline-none px-4 py-3 font-mono text-marble text-sm placeholder:text-marble-muted/40 transition-colors"
          />
          <button
            onClick={onCheck}
            disabled={!inputAddress.trim()}
            className="font-cinzel text-xs tracking-widest uppercase px-8 py-3 bg-gold text-tyrian-deep hover:bg-gold-dim transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            Check Access
          </button>
        </div>
        {error && (
          <p className="font-cormorant text-red-400 italic text-base mt-4">{error}</p>
        )}
      </div>
    </div>
  );
}

// ============ VendorDemo Page ============

export function VendorDemo() {
  const [inputAddress, setInputAddress] = useState('');
  const [checkedAddress, setCheckedAddress] = useState(null);
  const [checking, setChecking] = useState(false);
  const [accessGranted, setAccessGranted] = useState(null); // null = not yet checked
  const [denialReason, setDenialReason] = useState(null);
  const [error, setError] = useState(null);

  const checkAccess = async (override) => {
    setError(null);
    const raw = typeof override === 'string' ? override : inputAddress;
    let address;
    try {
      address = ethers.getAddress(raw.trim());
    } catch {
      setError('Invalid wallet address. Please enter a valid Ethereum address.');
      return;
    }

    setChecking(true);
    setAccessGranted(null);
    setDenialReason(null);
    try {
      const provider = new ethers.JsonRpcProvider(RPC_URL);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      const valid = await contract.isValid(address, 2);

      if (!valid) {
        const [[verified, , revoked], expired] = await Promise.all([
          contract.getVerificationStatus(address),
          contract.isExpired(address),
        ]);
        if (!verified) setDenialReason('no_seal');
        else if (revoked) setDenialReason('revoked');
        else if (expired) setDenialReason('expired');
        else setDenialReason('wrong_tier');
      }

      setCheckedAddress(address);
      setAccessGranted(valid);
    } catch (err) {
      console.error('Vendor demo check failed:', err);
      setError('Failed to verify seal status. Please try again.');
    } finally {
      setChecking(false);
    }
  };

  const reset = () => {
    setAccessGranted(null);
    setCheckedAddress(null);
    setDenialReason(null);
    setError(null);
    setInputAddress('');
  };

  return (
    <div className="min-h-screen py-16 px-6">
      <div className="max-w-2xl mx-auto">

        {/* Demo banner */}
        <div className="border border-gold/20 bg-gold/5 px-6 py-3 mb-10 flex items-center gap-3">
          <span className="w-1.5 h-1.5 bg-gold rounded-full flex-shrink-0"></span>
          <p className="font-cinzel text-marble-muted text-xs tracking-widest uppercase">
            Vendor Integration Demo — This page simulates how a protocol uses Covenant to gate access
          </p>
        </div>

        {/* Page header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-4 mb-8 opacity-60">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-gold-dim"></div>
            <div className="w-1.5 h-1.5 bg-gold rotate-45"></div>
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-gold-dim"></div>
          </div>
          <h1 className="font-cinzel text-marble text-4xl tracking-wide mb-4">Protected Protocol</h1>
          <p className="font-cormorant text-marble-dim text-xl italic max-w-lg mx-auto leading-relaxed">
            This protocol uses Covenant to verify member identity before granting access.
            Silver (Tier II) seal or above required.
          </p>
        </div>

        {/* Mystery showcase gate */}
        {accessGranted === null && !checking && (
          <MysteryShowcase
            inputAddress={inputAddress}
            setInputAddress={setInputAddress}
            onCheck={checkAccess}
            onCardClick={(addr) => { setInputAddress(addr); checkAccess(addr); }}
            error={error}
          />
        )}

        {/* Loading */}
        {checking && (
          <div className="border border-gold/20 bg-tyrian-darker py-16 text-center">
            <div className="w-10 h-10 border border-gold/50 border-t-gold rounded-full animate-spin mx-auto mb-6"></div>
            <p className="font-cormorant text-marble-muted italic text-lg">Verifying Covenant seal…</p>
          </div>
        )}

        {/* Result */}
        {!checking && accessGranted === true && (
          <ProtectedDashboard walletAddress={checkedAddress} />
        )}
        {!checking && accessGranted === false && (
          <AccessRestricted reason={denialReason} />
        )}

        {/* Integration note + check another */}
        {!checking && accessGranted !== null && (
          <>
            <div className="mt-8 border border-gold/10 bg-tyrian-dark px-6 py-5">
              <p className="font-cinzel text-marble-muted text-xs tracking-widest uppercase mb-2">
                How this works
              </p>
              <p className="font-cormorant text-marble-muted italic text-base leading-relaxed">
                This page called <span className="font-mono text-marble-dim not-italic">isValid(address, 2)</span> on
                the Covenant Pact contract and gated content based on the result — no backend required.
                Any protocol can integrate this single read call to verify member identity on-chain.
              </p>
            </div>
            <div className="mt-4 text-center">
              <button
                onClick={reset}
                className="font-cinzel text-gold/60 hover:text-gold text-xs tracking-widest uppercase transition-colors"
              >
                ← Check another address
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
