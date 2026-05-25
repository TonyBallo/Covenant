import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI, RPC_URL } from '../utils/contract';
import { ResultDisplay } from '../components/ResultDisplay';

// ─── SETUP REQUIRED ───────────────────────────────────────────────────────────
// This address must hold a REVOKED seal on Arbitrum Sepolia before the demo
// goes live. Via the admin panel:
//   1. Mint a Bronze seal to any test wallet.
//   2. Revoke it with reason: "Fraud — confirmed link to pig-butchering syndicate"
//   3. Paste that wallet address here.
const DEMO_REVOKED_ADDRESS = '0x0000000000000000000000000000000000000000'; // ← replace before launch
// ──────────────────────────────────────────────────────────────────────────────

// Used when the real address isn't configured yet — keeps the demo presentable.
const MOCK_SEAL_RESULT = {
  verified: true,
  address: DEMO_REVOKED_ADDRESS,
  tier: 1,
  revoked: true,
  isExpired: false,
  mintedAt: Math.floor(Date.now() / 1000) - 60 * 60 * 24 * 45, // 45 days ago
  expiresAt: 0,
  sealId: 1,
  jurisdictionCode: 0,
  covenantSignature: '',
  burnPending: false,
  burnExecutableAt: 0,
  revocationReason: 'Fraud — confirmed link to pig-butchering syndicate',
};

const ANALYSIS_STEPS = [
  'Checking wallet creation date…',
  'Scanning transaction history…',
  'Cross-referencing 4 fraud databases…',
  'Matching behavioral signatures…',
  'Compiling report…',
];

const VERIFY_FIELDS = [
  { label: 'Full Legal Name',                 placeholder: 'As it appears on your ID' },
  { label: 'Email Address',                   placeholder: 'your@email.com',    action: 'Verify' },
  { label: 'Phone Number',                    placeholder: '+1 (555) 000-0000', action: 'Send Code' },
  { label: 'Government-Issued ID',            type: 'upload' },
  { label: 'Live Photo Verification',         type: 'photo' },
  { label: 'Social Security Number (last 4)', placeholder: '_ _ _ _' },
  { label: 'Bank Statement (last 3 months)',  type: 'upload' },
  { label: 'CAPTCHA Verification',            type: 'captcha' },
];

export function MemberDemo() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState('scenario');
  const [sealResult, setSealResult] = useState(null);
  const [analysisStep, setAnalysisStep] = useState(-1);
  const [sealVisible, setSealVisible] = useState(false);

  // Drive the optional blockchain analysis animation
  useEffect(() => {
    if (phase !== 'investigating') return;
    setAnalysisStep(0);
    let step = 0;
    const id = setInterval(() => {
      step++;
      if (step < ANALYSIS_STEPS.length) {
        setAnalysisStep(step);
      } else {
        clearInterval(id);
        setTimeout(() => setPhase('exposed'), 900);
      }
    }, 750);
    return () => clearInterval(id);
  }, [phase]);

  // Trigger the Covenant seal popup after the verification wall settles
  useEffect(() => {
    if (phase !== 'verify_wall') return;
    setSealVisible(false);
    const id = setTimeout(() => setSealVisible(true), 10000);
    return () => clearTimeout(id);
  }, [phase]);

  const runLookup = async () => {
    setPhase('searching');
    let resolved = false;
    try {
      const provider = new ethers.JsonRpcProvider(RPC_URL);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      const [verified, tier, revoked, burnPending, burnExecutableAt] =
        await contract.getVerificationStatus(DEMO_REVOKED_ADDRESS);
      if (verified) {
        const sealId = await contract.addressToSealId(DEMO_REVOKED_ADDRESS);
        const seal = await contract.sealData(sealId);
        const expiresAt = Number(seal.expiresAt);
        setSealResult({
          verified: true,
          address: DEMO_REVOKED_ADDRESS,
          tier: Number(tier),
          revoked: Boolean(revoked),
          isExpired: expiresAt > 0 && Date.now() / 1000 > expiresAt,
          mintedAt: Number(seal.mintedAt),
          expiresAt,
          sealId: Number(sealId),
          jurisdictionCode: Number(seal.jurisdictionCode),
          covenantSignature: seal.covenantSignature,
          burnPending: Boolean(burnPending),
          burnExecutableAt: Number(burnExecutableAt),
          revocationReason: seal.revocationReason || 'Seal revoked by Covenant.',
        });
        resolved = true;
      }
    } catch (_) { /* fall through to mock */ }
    if (!resolved) setSealResult(MOCK_SEAL_RESULT);
    setTimeout(() => setPhase('revoked_seal'), 1000);
  };

  return (
    <div className="min-h-screen py-16 px-6">
      <div className="max-w-2xl mx-auto">

        {/* ── SCENARIO ─────────────────────────────────────────── */}
        {phase === 'scenario' && (
          <>
            <button
              onClick={() => navigate('/demo/for-members')}
              className="font-cinzel text-marble-muted/40 hover:text-marble-muted text-xs tracking-widest uppercase transition-colors mb-12 inline-block"
            >
              ← Back
            </button>

            <div className="mb-8">
              <p className="font-cinzel text-gold text-xs tracking-[0.3em] uppercase mb-4">The Scenario</p>
              <h1 className="font-cinzel text-marble text-2xl md:text-3xl tracking-wide mb-4 leading-snug">
                A family friend reaches out.
              </h1>
              <p className="font-cormorant text-marble-dim italic text-xl leading-relaxed">
                Everything about this looks normal. You've known them for years.
              </p>
            </div>

            {/* SMS thread */}
            <div className="mb-8 rounded-2xl overflow-hidden" style={{ background: '#111114' }}>

              {/* Contact header */}
              <div className="flex flex-col items-center gap-2 px-4 py-4" style={{ background: '#1c1c1e', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: '#3a3a3c' }}>
                  <span style={{ fontFamily: 'system-ui, sans-serif', fontSize: '18px', color: 'rgba(255,255,255,0.85)' }}>A</span>
                </div>
                <div className="text-center">
                  <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: '15px', fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>Alex M.</p>
                  <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>Text Message</p>
                </div>
              </div>

              {/* Bubbles */}
              <div className="px-4 py-5 space-y-2">
                {[
                  "Hey, hope you're doing well. I'm so sorry to reach out like this — I don't normally ask for this kind of thing but I'm in a bit of a situation and could really use some help. Please keep this between us, I'm really ashamed and could use a friend.",
                  "I can't use a bank either, since my accounts aren't exactly private. That's actually why crypto is better here. I'll provide you my wallet address below, super simple to use and you can let me know if you need any help figuring it out.",
                  "$500 is all I need. I'll pay you back twice that amount the moment I'm sorted, I promise. You can trust me. Again I'm so sorry for the inconvenience, it's a long story I can fill you in on after.",
                ].map((msg, i) => (
                  <div key={i} className="flex justify-start">
                    <div
                      className="max-w-xs px-3.5 py-2.5 rounded-2xl rounded-tl-sm"
                      style={{ background: '#3a3a3c' }}
                    >
                      <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: '15px', color: 'rgba(255,255,255,0.88)', lineHeight: 1.4 }}>{msg}</p>
                    </div>
                  </div>
                ))}

                {/* Wallet address bubble */}
                <div className="flex justify-start pt-1">
                  <div
                    className="max-w-xs px-3.5 py-2.5 rounded-2xl rounded-tl-sm"
                    style={{ background: '#3a3a3c' }}
                  >
                    <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>Wallet address</p>
                    <p style={{ fontFamily: 'monospace', fontSize: '12px', color: 'rgba(255,255,255,0.7)', wordBreak: 'break-all', lineHeight: 1.5 }}>{DEMO_REVOKED_ADDRESS}</p>
                  </div>
                </div>

              </div>
            </div>

            <p className="font-cormorant text-marble-dim italic text-lg leading-relaxed mb-8">
              Something feels slightly off. Before you send anything — check the wallet.
            </p>

            <button
              onClick={() => setPhase('lookup')}
              className="w-full font-cinzel text-xs tracking-widest uppercase py-4 bg-gold text-tyrian-deep font-semibold hover:bg-gold-dim transition-colors"
            >
              Look up this wallet on Covenant →
            </button>
          </>
        )}

        {/* ── LOOKUP ───────────────────────────────────────────── */}
        {phase === 'lookup' && (
          <>
            <div className="mb-10">
              <p className="font-cinzel text-gold text-xs tracking-[0.3em] uppercase mb-4">Covenant Lookup</p>
              <h2 className="font-cinzel text-marble text-2xl tracking-wide mb-4">
                Is this wallet a verified member?
              </h2>
              <p className="font-cormorant text-marble-dim italic text-xl leading-relaxed">
                Any Covenant member can be checked instantly — on-chain, no login required.
              </p>
            </div>

            <div className="border border-gold/20 bg-tyrian-darker p-6 mb-8">
              <p className="font-cinzel text-marble-muted text-xs tracking-widest uppercase mb-3">
                Wallet to check
              </p>
              <p className="font-mono text-marble text-sm break-all bg-tyrian-dark border border-gold/15 px-4 py-3">
                {DEMO_REVOKED_ADDRESS}
              </p>
            </div>

            <button
              onClick={runLookup}
              className="w-full font-cinzel text-xs tracking-widest uppercase py-4 bg-gold text-tyrian-deep font-semibold hover:bg-gold-dim transition-colors"
            >
              Check Covenant seal registry
            </button>
          </>
        )}

        {/* ── SEARCHING ────────────────────────────────────────── */}
        {phase === 'searching' && (
          <div className="flex flex-col items-center justify-center py-28 text-center">
            <div className="w-10 h-10 border border-gold/50 border-t-gold rounded-full animate-spin mb-8" />
            <p className="font-cinzel text-marble-muted text-xs tracking-widest uppercase mb-3">Covenant</p>
            <p className="font-cormorant text-marble-dim italic text-lg">
              Checking seal registry on Arbitrum Sepolia…
            </p>
          </div>
        )}

        {/* ── REVOKED SEAL ─────────────────────────────────────── */}
        {phase === 'revoked_seal' && (
          <>
            <div className="mb-8">
              <ResultDisplay result={sealResult} animateRevoked />
            </div>

            <p className="font-cormorant text-marble-dim italic text-lg leading-relaxed mb-10">
              This wallet once held a verified Covenant seal — and lost it. The network already
              knows what happened. You didn't have to.
            </p>

            <div className="space-y-3">
              <button
                onClick={() => setPhase('pre_verify')}
                className="w-full font-cinzel text-xs tracking-widest uppercase py-4 bg-gold text-tyrian-deep font-semibold hover:bg-gold-dim transition-colors"
              >
                That's enough for me — continue
              </button>
              <button
                onClick={() => setPhase('investigating')}
                className="w-full font-cinzel text-xs tracking-widest uppercase py-4 border border-gold/20 text-marble-muted/60 hover:border-gold/40 hover:text-marble-muted transition-colors"
              >
                Go deeper — run blockchain analysis
              </button>
              <p className="font-cormorant text-marble-muted/30 italic text-sm text-center pt-1">
                The analysis is optional. Covenant already told you what you needed.
              </p>
            </div>
          </>
        )}

        {/* ── PRE-VERIFY (skipped analysis path) ───────────────── */}
        {phase === 'pre_verify' && (
          <>
            <div className="mb-10">
              <p className="font-cinzel text-gold text-xs tracking-[0.3em] uppercase mb-4">One lookup.</p>
              <h2 className="font-cinzel text-marble text-2xl md:text-3xl tracking-wide mb-6 leading-snug">
                Covenant surfaced the truth.
              </h2>
              <div className="space-y-4">
                <p className="font-cormorant text-marble-dim italic text-xl leading-relaxed">
                  No blockchain expertise. No hours of research. No trace tools. You checked one
                  thing — whether that wallet held a standing seal — and the network told you
                  everything you needed to know.
                </p>
                <p className="font-cormorant text-marble-dim italic text-xl leading-relaxed">
                  Let's find out what else Covenant can do for you...
                </p>
              </div>
            </div>

            <button
              onClick={() => setPhase('verify_wall')}
              className="w-full font-cinzel text-xs tracking-widest uppercase py-4 bg-gold text-tyrian-deep font-semibold hover:bg-gold-dim transition-colors"
            >
              Continue →
            </button>
          </>
        )}

        {/* ── INVESTIGATING (optional extra mile) ──────────────── */}
        {phase === 'investigating' && (
          <div className="py-12">
            <p className="font-cinzel text-marble-muted text-xs tracking-widest uppercase mb-10">
              Running blockchain analysis…
            </p>
            <div className="space-y-4">
              {ANALYSIS_STEPS.map((step, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-4 transition-opacity duration-500 ${
                    i <= analysisStep ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  {i < analysisStep ? (
                    <span className="font-mono text-green-400/60 text-xs w-4 shrink-0">✓</span>
                  ) : (
                    <span className="w-4 h-4 border border-gold/40 border-t-gold rounded-full animate-spin inline-block shrink-0" />
                  )}
                  <p className="font-mono text-marble-muted text-sm">{step}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── EXPOSED (extra mile result) ───────────────────────── */}
        {phase === 'exposed' && (
          <>
            <div className="mb-8">
              <p className="font-cinzel text-red-400/70 text-xs tracking-[0.3em] uppercase mb-4">
                Analysis complete
              </p>
              <h2 className="font-cinzel text-marble text-2xl md:text-3xl tracking-wide mb-4 leading-snug">
                The full story.
              </h2>
            </div>

            <div className="border border-red-900/40 bg-tyrian-darker mb-8">
              <div className="border-b border-red-900/30 px-5 py-3 bg-red-950/10">
                <p className="font-mono text-red-400/70 text-xs tracking-widest uppercase">
                  ⚠ High Risk — Do Not Transact
                </p>
              </div>
              <div className="px-5 py-5 font-mono text-xs space-y-1.5 text-marble-muted/60 leading-loose">
                <div className="flex justify-between gap-4">
                  <span>Wallet age</span>
                  <span className="text-red-400/70">3 days</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span>Outbound transactions</span>
                  <span className="text-red-400/70">47</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span>Inbound transactions</span>
                  <span className="text-red-400/70">0</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span>Linked flagged addresses</span>
                  <span className="text-red-400/70">12</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span>Fraud database hits</span>
                  <span className="text-red-400/70">14 across 4 sources</span>
                </div>
                <div className="border-t border-red-900/30 pt-4 mt-2">
                  <p className="text-red-400/60 uppercase tracking-widest mb-2">Associated with</p>
                  <p className="text-marble-dim">"Operation Ghost Market"</p>
                  <p className="text-marble-muted/50">Pig-butchering syndicate · Active since 2022</p>
                  <p className="text-marble-muted/50">340+ confirmed victims · $4.2M in losses</p>
                </div>
              </div>
              <div className="border-t border-gold/10 px-5 py-3">
                <p className="font-cormorant text-marble-muted/30 italic text-xs">
                  * Blockchain analysis data is illustrative for demo purposes.
                </p>
              </div>
            </div>

            <div className="border-l-2 border-gold/30 pl-6 mb-4">
              <p className="font-cormorant text-marble italic text-xl leading-relaxed">
                The analysis confirmed what Covenant already told you. The revoked seal was
                the signal. Everything else was the explanation.
              </p>
            </div>

            <p className="font-cormorant text-marble-dim italic text-lg leading-relaxed mb-8">
              Let's find out what else Covenant can do for you...
            </p>

            <button
              onClick={() => setPhase('verify_wall')}
              className="w-full font-cinzel text-xs tracking-widest uppercase py-4 bg-gold text-tyrian-deep font-semibold hover:bg-gold-dim transition-colors"
            >
              Continue →
            </button>
          </>
        )}

        {/* ── VERIFY WALL + SEAL POPUP ──────────────────────────── */}
        {phase === 'verify_wall' && (
          <>
            <div className="mb-8">
              <p className="font-cinzel text-gold text-xs tracking-[0.3em] uppercase mb-4">The Other Side</p>
              <h2 className="font-cinzel text-marble text-2xl tracking-wide mb-4 leading-snug">
                You want access to a new financial platform.
              </h2>
              <p className="font-cormorant text-marble-dim italic text-xl leading-relaxed">
                Before they let you in, they need to know who you are.
              </p>
            </div>

            <div
              className={sealVisible ? 'pointer-events-none' : ''}
              style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden', fontFamily: 'system-ui, sans-serif' }}
            >
              {/* Browser-style title bar */}
              <div style={{ background: '#f3f4f6', borderBottom: '1px solid #e5e7eb', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f87171', display: 'inline-block' }} />
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#fbbf24', display: 'inline-block' }} />
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#34d399', display: 'inline-block' }} />
                  </div>
                  <span style={{ fontSize: '12px', color: '#9ca3af', marginLeft: '8px' }}>🔒 verify.secureplatform.com</span>
                </div>
                <span style={{ fontSize: '11px', color: '#9ca3af' }}>Step 1 of 7</span>
              </div>

              {/* Form */}
              <div style={{ padding: '24px 20px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', marginBottom: '4px' }}>Identity Verification</h3>
                <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '20px' }}>To continue, we need to verify your identity. Please complete all fields.</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {VERIFY_FIELDS.map(({ label, placeholder, type, action }) => (
                    <div key={label}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '5px' }}>{label}</label>
                      {type === 'upload' && (
                        <div style={{ border: '2px dashed #d1d5db', borderRadius: '6px', padding: '12px', textAlign: 'center', background: '#fff' }}>
                          <span style={{ fontSize: '13px', color: '#9ca3af' }}>📎 Click to upload or drag and drop</span>
                        </div>
                      )}
                      {type === 'photo' && (
                        <div style={{ border: '2px dashed #d1d5db', borderRadius: '6px', padding: '12px', textAlign: 'center', background: '#fff' }}>
                          <span style={{ fontSize: '13px', color: '#9ca3af' }}>📷 Open camera</span>
                        </div>
                      )}
                      {type === 'captcha' && (
                        <div style={{ border: '1px solid #d1d5db', borderRadius: '6px', padding: '12px 14px', background: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '16px', height: '16px', border: '2px solid #d1d5db', borderRadius: '3px', flexShrink: 0 }} />
                          <span style={{ fontSize: '13px', color: '#6b7280' }}>I'm not a robot</span>
                        </div>
                      )}
                      {!type && (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <input
                            placeholder={placeholder}
                            style={{ flex: 1, padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', color: '#111827', background: '#fff', outline: 'none' }}
                          />
                          {action && (
                            <button style={{ padding: '8px 14px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '12px', fontWeight: 600, color: '#374151', background: '#f9fafb', cursor: 'pointer', flexShrink: 0 }}>
                              {action}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Covenant browser-extension popup — styled as Platinum card face */}
            <div
              className={`fixed top-4 right-4 z-50 w-72 transition-all duration-500 ease-out overflow-hidden`}
              style={{
                opacity: sealVisible ? 1 : 0,
                transform: sealVisible ? 'translateX(0)' : 'translateX(24px)',
                pointerEvents: sealVisible ? 'auto' : 'none',
                background: 'linear-gradient(145deg, #00091c 0%, #14000c 55%, #0a0006 100%)',
                border: '1px solid #93c5fd2d',
                boxShadow: '0 12px 48px rgba(0,0,0,0.8), 0 0 32px #93c5fd20',
              }}
            >
              {/* Top accent bar */}
              <div style={{ height: '4px', background: '#93c5fd', opacity: 0.75 }} />

              {/* Diagonal stripe texture */}
              <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none',
                backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 18px, rgba(255,255,255,0.013) 18px, rgba(255,255,255,0.013) 19px)',
              }} />

              {/* Watermark numeral */}
              <div style={{
                position: 'absolute', top: '50%', left: '38%',
                transform: 'translate(-50%, -50%)',
                fontFamily: 'Cinzel, serif', fontWeight: 700,
                fontSize: '120px', lineHeight: 1,
                color: '#93c5fd', opacity: 0.04,
                pointerEvents: 'none', userSelect: 'none',
              }}>IV</div>

              {/* Card content */}
              <div style={{ padding: '12px 16px', position: 'relative' }}>

                {/* Header row */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p style={{ fontFamily: 'Cinzel, serif', fontSize: '8px', letterSpacing: '0.36em', textTransform: 'uppercase', color: '#ffffff2a' }}>Covenant</p>
                    <p style={{ fontFamily: 'Cinzel, serif', fontSize: '6px', letterSpacing: '0.44em', textTransform: 'uppercase', color: '#ffffff16', marginTop: '2px' }}>Protocol</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#86efac', boxShadow: '0 0 6px #86efac' }} />
                    <span style={{ fontFamily: 'Cinzel, serif', fontSize: '9px', letterSpacing: '0.28em', textTransform: 'uppercase', color: '#93c5fd70' }}>Active</span>
                  </div>
                </div>

                {/* Divider */}
                <div style={{ height: '1px', background: '#93c5fd22', marginBottom: '12px' }} />

                {/* Seal image */}
                <div className="flex justify-center mb-2">
                  <img src="/tiers/tier-4.png" alt="Platinum Seal" style={{ width: '168px', height: '168px', objectFit: 'contain', opacity: 0.92 }} />
                </div>

                {/* Tier hero */}
                <div className="flex items-baseline gap-3 mb-3">
                  <span style={{ fontFamily: 'Cinzel, serif', fontWeight: 700, fontSize: '40px', lineHeight: 1, color: '#93c5fd' }}>IV</span>
                  <div>
                    <p style={{ fontFamily: 'Cinzel, serif', fontSize: '13px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#93c5fd' }}>Platinum</p>
                    <p style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: '11px', color: '#ffffff32', marginTop: '2px' }}>Sophisticated Investor</p>
                  </div>
                </div>

                {/* Divider */}
                <div style={{ height: '1px', background: '#93c5fd22', marginBottom: '12px' }} />

                {/* CTA */}
                <style>{`
                  @keyframes sealGlow {
                    0%, 100% { box-shadow: 0 0 8px #93c5fd30, 0 0 0px #93c5fd00; }
                    50%       { box-shadow: 0 0 18px #93c5fd60, 0 0 32px #93c5fd25; }
                  }
                `}</style>
                <button
                  onClick={() => setPhase('granted')}
                  className="w-full font-cinzel text-[10px] tracking-widest uppercase py-2.5"
                  style={{
                    background: '#93c5fd15',
                    border: '1px solid #93c5fd40',
                    color: '#93c5fdcc',
                    animation: 'sealGlow 2.2s ease-in-out infinite',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#93c5fd25'; e.currentTarget.style.animation = 'none'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#93c5fd15'; e.currentTarget.style.animation = 'sealGlow 2.2s ease-in-out infinite'; }}
                >
                  Use my seal to skip this →
                </button>
              </div>
            </div>
          </>
        )}

        {/* ── GRANTED ──────────────────────────────────────────── */}
        {phase === 'granted' && (
          <>
            <div className="border border-gold/30 bg-gold/5 mb-10">
              <div className="border-b border-gold/20 px-5 py-3 flex items-center justify-between">
                <p className="font-cinzel text-marble-muted text-xs tracking-widest uppercase">
                  Secure Verification Portal
                </p>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-gold rounded-full animate-pulse" />
                  <span className="font-cinzel text-gold text-xs tracking-widest uppercase">Verified</span>
                </div>
              </div>
              <div className="px-5 py-10 text-center">
                <p className="font-cinzel text-marble text-3xl tracking-wide mb-3">Access Granted</p>
                <p className="font-cormorant text-marble-muted italic text-lg">
                  Covenant seal confirmed. Welcome.
                </p>
              </div>
            </div>

            <div className="border-l-2 border-gold/30 pl-6 mb-10">
              <p className="font-cormorant text-marble italic text-xl leading-relaxed">
                One seal. No forms. No uploads. No waiting. Your identity was already confirmed —
                Covenant spoke for you without giving up any of your data.
              </p>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => navigate('/waitlist')}
                className="w-full font-cinzel text-xs tracking-widest uppercase py-4 bg-gold text-tyrian-deep font-semibold hover:bg-gold-dim transition-colors"
              >
                Join the waitlist
              </button>
              <button
                onClick={() => navigate('/demo')}
                className="w-full font-cinzel text-xs tracking-widest uppercase py-4 border border-gold/30 text-gold hover:bg-gold/5 hover:border-gold/60 transition-colors"
              >
                Explore the lookup tool
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
