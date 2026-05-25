import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI, RPC_URL } from '../utils/contract';

const SCAM_ADDRESS = '0x7FA9385bE102ac3EAc297483Dd6233D62b3e1496';

const ANALYSIS_STEPS = [
  'Checking wallet creation date…',
  'Scanning transaction history…',
  'Cross-referencing 4 fraud databases…',
  'Matching behavioral signatures…',
  'Compiling report…',
];

const VERIFY_FIELDS = [
  { label: 'Full Legal Name',                  placeholder: 'As it appears on your ID' },
  { label: 'Email Address',                    placeholder: 'your@email.com',           action: 'Verify' },
  { label: 'Phone Number',                     placeholder: '+1 (555) 000-0000',        action: 'Send Code' },
  { label: 'Government-Issued ID',             type: 'upload' },
  { label: 'Live Photo Verification',          type: 'photo' },
  { label: 'Social Security Number (last 4)',  placeholder: '_ _ _ _' },
  { label: 'Bank Statement (last 3 months)',   type: 'upload' },
  { label: 'CAPTCHA Verification',             type: 'captcha' },
];

export function MemberDemo() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState('scenario');
  const [analysisStep, setAnalysisStep] = useState(-1);
  const [sealVisible, setSealVisible] = useState(false);

  // Drive the blockchain analysis animation
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

  // Trigger the seal popup after the verification wall has had time to land
  useEffect(() => {
    if (phase !== 'verify_wall') return;
    setSealVisible(false);
    const id = setTimeout(() => setSealVisible(true), 2800);
    return () => clearTimeout(id);
  }, [phase]);

  const runLookup = async () => {
    setPhase('searching');
    try {
      const provider = new ethers.JsonRpcProvider(RPC_URL);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      await contract.getVerificationStatus(SCAM_ADDRESS);
    } catch (_) {
      // no-op — result is "no seal" regardless of network errors
    }
    setTimeout(() => setPhase('no_seal'), 1000);
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
                Everything about this looks normal. Their accounts are real. You've known them for years.
              </p>
            </div>

            <div className="border border-gold/20 bg-tyrian-darker mb-8">
              <div className="border-b border-gold/15 px-5 py-3 flex items-center justify-between bg-tyrian-dark">
                <div>
                  <p className="font-cinzel text-marble text-xs tracking-widest uppercase">Alex M.</p>
                  <p className="font-cormorant text-marble-muted/60 italic text-sm">
                    Via verified email · Facebook · iPhone
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400/60" />
                  <span className="font-cinzel text-green-400/60 text-xs tracking-widest">Verified accounts</span>
                </div>
              </div>
              <div className="px-5 py-6 space-y-4">
                <p className="font-cormorant text-marble italic text-lg leading-relaxed">
                  "Hey, hope you're doing well. I'm so sorry to reach out like this — I don't normally
                  ask for this kind of thing. I'm in a bit of a situation and could really use some help.
                  Please keep this between us, I don't want other family to know, it's embarrassing."
                </p>
                <p className="font-cormorant text-marble italic text-lg leading-relaxed">
                  "The banks won't work for this — a couple of my accounts have eyes on them, family
                  stuff, long story. That's actually why crypto is better here. Keeps it private.
                  I've already got a wallet ready."
                </p>
                <p className="font-cormorant text-marble italic text-lg leading-relaxed">
                  "$1,000 would genuinely get me back on my feet. I'll pay you back two-fold the moment
                  I'm sorted, I promise. You can trust me on this."
                </p>
                <div className="border-t border-gold/15 pt-4">
                  <p className="font-cinzel text-marble-muted text-xs tracking-widest uppercase mb-2">
                    Their wallet address
                  </p>
                  <p className="font-mono text-marble-dim text-sm break-all">{SCAM_ADDRESS}</p>
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
                {SCAM_ADDRESS}
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

        {/* ── NO SEAL ──────────────────────────────────────────── */}
        {phase === 'no_seal' && (
          <>
            <div className="border border-red-900/40 bg-red-950/10 mb-8">
              <div className="border-b border-red-900/30 px-5 py-3 flex items-center gap-3 bg-red-950/10">
                <div className="w-2 h-2 rounded-full bg-red-500/70 shrink-0" />
                <p className="font-cinzel text-red-400/80 text-xs tracking-widest uppercase">
                  No Covenant seal found
                </p>
              </div>
              <div className="px-5 py-5">
                <p className="font-mono text-marble-muted/50 text-xs break-all mb-4">{SCAM_ADDRESS}</p>
                <p className="font-cormorant text-marble-dim italic text-lg leading-relaxed">
                  This wallet holds no verified standing in the Covenant trust network. No pact has
                  been entered. No identity has been confirmed.
                </p>
              </div>
            </div>

            <p className="font-cormorant text-marble-dim italic text-lg leading-relaxed mb-8">
              A Covenant member has a real identity behind their wallet — one they put on the line
              by entering the pact. This wallet has no such commitment. That alone is worth
              paying attention to.
            </p>

            <button
              onClick={() => setPhase('investigating')}
              className="w-full font-cinzel text-xs tracking-widest uppercase py-4 border border-gold/30 text-gold hover:bg-gold/5 hover:border-gold/60 transition-colors"
            >
              Something feels wrong — investigate further →
            </button>
          </>
        )}

        {/* ── INVESTIGATING ─────────────────────────────────────── */}
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

        {/* ── EXPOSED ──────────────────────────────────────────── */}
        {phase === 'exposed' && (
          <>
            <div className="mb-8">
              <p className="font-cinzel text-red-400/70 text-xs tracking-[0.3em] uppercase mb-4">
                Analysis complete
              </p>
              <h2 className="font-cinzel text-marble text-2xl md:text-3xl tracking-wide mb-4 leading-snug">
                That wasn't Alex.
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

            <div className="border-l-2 border-gold/30 pl-6 mb-10">
              <p className="font-cormorant text-marble italic text-xl leading-relaxed">
                You just avoided losing $1,000 to a criminal operation — not because you ran a
                blockchain trace, but because you checked one thing: whether that wallet held a
                Covenant seal.
              </p>
            </div>

            <p className="font-cormorant text-marble-dim italic text-lg leading-relaxed mb-8">
              Now imagine the other side of that equation — and what a seal does when it's yours.
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

            <div className={`border border-gold/15 bg-tyrian-darker transition-opacity duration-700 ${sealVisible ? 'opacity-25' : 'opacity-100'}`}>
              <div className="border-b border-gold/15 px-5 py-3 bg-tyrian-dark">
                <p className="font-cinzel text-marble text-xs tracking-widest uppercase">
                  Secure Verification Portal — Step 1 of 7
                </p>
              </div>
              <div className="px-5 py-6 space-y-4">
                {VERIFY_FIELDS.map(({ label, placeholder, type, action }) => (
                  <div key={label}>
                    <label className="font-cinzel text-marble-muted text-xs tracking-widest uppercase block mb-1.5">
                      {label}
                    </label>
                    {type === 'upload' && (
                      <div className="border border-dashed border-gold/15 py-3 px-4 text-center">
                        <span className="font-cormorant text-marble-muted/30 italic text-sm">Upload file</span>
                      </div>
                    )}
                    {type === 'photo' && (
                      <div className="border border-dashed border-gold/15 py-3 px-4 text-center">
                        <span className="font-cormorant text-marble-muted/30 italic text-sm">Open camera</span>
                      </div>
                    )}
                    {type === 'captcha' && (
                      <div className="border border-gold/15 bg-tyrian-dark py-3 px-4 flex items-center gap-3">
                        <div className="w-4 h-4 border border-gold/20 rounded shrink-0" />
                        <span className="font-cormorant text-marble-muted/30 italic text-sm">I am not a robot</span>
                      </div>
                    )}
                    {!type && (
                      <div className="flex gap-2">
                        <input
                          disabled
                          placeholder={placeholder}
                          className="flex-1 px-3 py-2.5 bg-tyrian-dark border border-gold/15 text-marble-muted/30 placeholder-marble-muted/20 font-cormorant text-base outline-none"
                        />
                        {action && (
                          <button disabled className="font-cinzel text-xs tracking-widest uppercase px-4 py-2.5 border border-gold/15 text-marble-muted/25 shrink-0">
                            {action}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Seal popup — slides up from bottom */}
            <div
              className={`fixed inset-x-0 bottom-0 z-50 flex justify-center px-6 pb-6 transition-all duration-700 ${
                sealVisible
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-10 pointer-events-none'
              }`}
            >
              <div className="w-full max-w-md border border-blue-400/30 bg-tyrian-deeper shadow-2xl overflow-hidden">
                <div className="border-b border-blue-400/15 px-5 py-2.5 bg-blue-950/20">
                  <p className="font-cinzel text-blue-300/70 text-xs tracking-widest uppercase">
                    Covenant · Seal Detected
                  </p>
                </div>
                <div className="px-5 py-5 flex items-center gap-5">
                  <img src="/tiers/tier-4.png" alt="Platinum Seal" className="w-16 h-16 shrink-0" />
                  <div>
                    <p className="font-cinzel text-marble text-lg tracking-wide mb-1">Platinum Member</p>
                    <p className="font-cormorant text-marble-muted italic text-base leading-snug">
                      Identity verified. Bypass this form instantly.
                    </p>
                  </div>
                </div>
                <div className="px-5 pb-5">
                  <button
                    onClick={() => setPhase('granted')}
                    className="w-full font-cinzel text-xs tracking-widest uppercase py-3.5 bg-blue-500/20 border border-blue-400/40 text-blue-300 hover:bg-blue-500/30 transition-colors"
                  >
                    Use my seal
                  </button>
                </div>
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
                Covenant spoke for you.
              </p>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => navigate('/demo/get-verified')}
                className="w-full font-cinzel text-xs tracking-widest uppercase py-4 bg-gold text-tyrian-deep font-semibold hover:bg-gold-dim transition-colors"
              >
                Apply for your seal
              </button>
              <button
                onClick={() => navigate('/demo')}
                className="w-full font-cinzel text-xs tracking-widest uppercase py-4 border border-gold/30 text-gold hover:bg-gold/5 hover:border-gold/60 transition-colors"
              >
                Explore the lookup tool
              </button>
              <button
                onClick={() => navigate('/waitlist')}
                className="w-full font-cinzel text-marble-muted/40 hover:text-marble-muted text-xs tracking-widest uppercase py-3 transition-colors"
              >
                Join the mainnet waitlist →
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
