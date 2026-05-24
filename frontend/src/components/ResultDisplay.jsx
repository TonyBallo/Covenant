import { TIERS, formatDate, formatJurisdiction, formatBurnCountdown } from '../utils/constants';
import { ETHERSCAN_BASE } from '../utils/contract';
import { getCrossChainStatus } from '../utils/api';
import { useState, useEffect } from 'react';

const TIER_DESCRIPTION = {
  1: "A Bronze seal means the person behind this wallet is a verified, real human — not a bot and not a duplicate account. It's the starting point of trust. You may not know who they are, but you know they're real.",
  2: "A Silver seal means this wallet belongs to a real person whose legal identity has been confirmed. They've verified who they are against a government-issued document. When you see Silver, you're dealing with a real, named individual.",
  3: "A Gold seal means this person has gone through a thorough vetting process — their identity has been confirmed, they've passed sanctions and background screening, and they've declared where their money comes from. Gold is the standard for serious financial interactions.",
  4: "A Platinum seal means this person has been verified as a qualified investor in their country. They meet the legal standards required to participate in higher-level financial opportunities. When you see Platinum, you're dealing with someone who has been cleared for serious investment activity.",
  5: "A Diamond seal means this wallet represents a verified business or organization — not an individual. Their ownership structure is transparent, their compliance program is certified, and their legitimacy has been formally established. Diamond is institutional-grade trust.",
};

const TIER_TAGLINE = {
  1: 'Verified Human',
  2: 'Named Identity',
  3: 'Enhanced Due Diligence',
  4: 'Sophisticated Investor',
  5: 'Institutional Entity',
};

const TIER_ACCENT = {
  1: '#c8922a',
  2: '#a09488',
  3: '#d4af5a',
  4: '#93c5fd',
  5: '#d8b4fe',
};

const TIER_GLOW_SCALE = { 1: 0.2, 2: 0.4, 3: 0.6, 4: 0.8, 5: 1.0 };
const gh = (base, tier) => {
  const n = Math.round(parseInt(base, 16) * (TIER_GLOW_SCALE[tier] ?? 1.0));
  return n.toString(16).padStart(2, '0');
};

const TIER_BG = {
  1: 'linear-gradient(145deg, #1c0900 0%, #14000c 55%, #0a0006 100%)',
  2: 'linear-gradient(145deg, #151515 0%, #14000c 55%, #0a0006 100%)',
  3: 'linear-gradient(145deg, #1a1300 0%, #14000c 55%, #0a0006 100%)',
  4: 'linear-gradient(145deg, #00091c 0%, #14000c 55%, #0a0006 100%)',
  5: 'linear-gradient(145deg, #0e0018 0%, #14000c 55%, #0a0006 100%)',
};

export function ResultDisplay({ result }) {
  const [chainStatus, setChainStatus] = useState({ ethereum: true, polygon: false });
  const [copied, setCopied] = useState(false);
  const [showSignature, setShowSignature] = useState(false);
  const [sigCopied, setSigCopied] = useState(false);
  const [showTierInfo, setShowTierInfo] = useState(false);

  const copyAddress = () => {
    navigator.clipboard.writeText(result.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    if (result.verified) {
      getCrossChainStatus(result.address)
        .then(status => setChainStatus(status))
        .catch(err => console.error('Failed to load chain status:', err));
    }
  }, [result.address, result.verified]);

  if (!result.verified) {
    return (
      <div style={{
        background: 'linear-gradient(145deg, #0d0010 0%, #0a0006 100%)',
        border: '1px solid rgba(212,175,90,0.15)',
        padding: '48px 32px',
        textAlign: 'center',
      }}>
        <div style={{ width: '1px', height: '40px', background: 'linear-gradient(to bottom, transparent, rgba(212,175,90,0.4), transparent)', margin: '0 auto 20px' }} />
        <p style={{ fontFamily: 'Cinzel, serif', fontSize: '14px', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: '12px' }}>
          No Trust Seal Found
        </p>
        <p style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: '20px', color: 'rgba(255,255,255,0.25)', marginBottom: '20px' }}>
          This wallet has not completed Covenant verification.
        </p>
        <p style={{ fontFamily: 'monospace', fontSize: '13px', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.04em' }}>
          {result.address}
        </p>
      </div>
    );
  }

  const tierInfo = TIERS[result.tier];
  const accent   = TIER_ACCENT[result.tier] ?? '#d4af5a';
  const mintDate = formatDate(result.mintedAt);
  const jurisdiction = formatJurisdiction(result.jurisdictionCode ?? 0);

  const statusColor = result.revoked ? '#fca5a5' : result.isExpired ? '#fcd34d' : accent;
  const statusLabel = result.revoked ? 'Revoked' : result.isExpired ? 'Expired' : 'Active';

  const expiryLabel = (() => {
    if (!result.expiresAt) return 'No Expiry';
    if (result.isExpired) return `${formatDate(result.expiresAt)} — Expired`;
    const msLeft = result.expiresAt * 1000 - Date.now();
    if (msLeft < 30 * 24 * 60 * 60 * 1000) return `${formatDate(result.expiresAt)} — Soon`;
    return formatDate(result.expiresAt);
  })();

  return (
    <div>

      {/* Seal — full-width, floats above card with cast shadow */}
      {result.tier >= 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
          <img
            src={`/tiers/tier-${result.tier}.png`}
            alt={`Tier ${result.tier} seal`}
            style={{ width: '100%', height: 'auto', display: 'block' }}
          />
          <div style={{
            width: '40%', height: '18px',
            background: 'rgba(0,0,0,0.55)',
            borderRadius: '50%',
            filter: 'blur(12px)',
            marginTop: '-8px',
            marginBottom: '14px',
          }} />
        </div>
      )}

      {/* Main card */}
      <div style={{
        background: TIER_BG[result.tier],
        border: `1px solid ${accent}${gh('38', result.tier)}`,
        overflow: 'hidden',
        position: 'relative',
      }}>

        {/* Top accent bar */}
        <div style={{ height: '4px', background: accent, opacity: 0.75 }} />

        {/* Diagonal stripe texture */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 18px, rgba(255,255,255,0.013) 18px, rgba(255,255,255,0.013) 19px)`,
        }} />

        {/* Watermark numeral */}
        <div style={{
          position: 'absolute', top: '50%', left: '35%',
          transform: 'translate(-50%, -50%)',
          fontFamily: 'Cinzel, serif', fontWeight: 700,
          fontSize: 'clamp(120px, 20vw, 220px)', lineHeight: 1,
          color: accent, opacity: 0.04,
          pointerEvents: 'none', userSelect: 'none',
        }}>
          {tierInfo.numeral}
        </div>

        {/* Content */}
        <div style={{ padding: '26px 32px', position: 'relative' }}>

          {/* Row 1 — Covenant header + status + chain badges */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
            <div>
              <p style={{ fontFamily: 'Cinzel, serif', fontSize: '11px', letterSpacing: '0.36em', textTransform: 'uppercase', color: '#ffffff2a' }}>
                Covenant
              </p>
              <p style={{ fontFamily: 'Cinzel, serif', fontSize: '8px', letterSpacing: '0.44em', textTransform: 'uppercase', color: '#ffffff16', marginTop: '4px' }}>
                Protocol
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {chainStatus.ethereum && (
                <span style={{ fontFamily: 'Cinzel, serif', color: accent, fontSize: '20px', opacity: 0.7 }} title="Verified on Arbitrum">⟠</span>
              )}
              {chainStatus.polygon && (
                <span style={{ color: '#c084fc', fontSize: '20px', opacity: 0.7 }} title="Attested on Polygon">⬡</span>
              )}
              <span style={{
                fontFamily: 'Cinzel, serif', fontSize: '10px', letterSpacing: '0.22em',
                textTransform: 'uppercase', padding: '5px 14px',
                border: `1px solid ${statusColor}50`,
                color: statusColor,
                background: `${statusColor}12`,
              }}>
                {statusLabel}
              </span>
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: '1px', background: `${accent}22`, marginBottom: '18px' }} />

          {/* Tier hero */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '20px', marginBottom: '18px' }}>
            <span style={{ fontFamily: 'Cinzel, serif', fontWeight: 700, fontSize: 'clamp(44px, 9vw, 64px)', lineHeight: 1, color: accent }}>
              {tierInfo.numeral}
            </span>
            <div style={{ position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <p style={{ fontFamily: 'Cinzel, serif', fontSize: '18px', letterSpacing: '0.2em', textTransform: 'uppercase', color: accent }}>
                  {tierInfo.name}
                </p>
                <button
                  onMouseEnter={() => setShowTierInfo(true)}
                  onMouseLeave={() => setShowTierInfo(false)}
                  style={{
                    width: '15px', height: '15px', borderRadius: '50%',
                    border: `1px solid ${accent}55`, background: 'transparent',
                    color: `${accent}88`, fontFamily: 'Georgia, serif',
                    fontSize: '10px', fontStyle: 'italic', fontWeight: 'bold',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'default', flexShrink: 0, padding: 0, lineHeight: 1,
                    alignSelf: 'center', marginBottom: '2px',
                  }}
                >i</button>
              </div>
              <p style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: '16px', color: 'rgba(255,255,255,0.3)', marginTop: '4px' }}>
                {TIER_TAGLINE[result.tier]}
              </p>
              {showTierInfo && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 8px)', left: 0,
                  zIndex: 50, maxWidth: '320px', pointerEvents: 'none',
                  background: 'rgba(8,0,5,0.97)',
                  border: `1px solid ${accent}30`,
                  boxShadow: `0 4px 24px rgba(0,0,0,0.7), 0 0 16px ${accent}10`,
                  padding: '14px 18px',
                }}>
                  <p style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: '15px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.65, margin: 0 }}>
                    {TIER_DESCRIPTION[result.tier]}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: '1px', background: `${accent}22`, marginBottom: '18px' }} />

          {/* Data grid — 2×2 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginBottom: '18px' }}>
            {[
              { label: 'Seal ID',      value: `#${result.sealId}` },
              { label: 'Issued',       value: mintDate },
              { label: 'Expires',      value: expiryLabel, color: result.isExpired ? '#fca5a5' : result.expiresAt && (result.expiresAt * 1000 - Date.now()) < 30 * 24 * 60 * 60 * 1000 ? '#fcd34d' : null },
              { label: 'Jurisdiction', value: `${jurisdiction.flag} ${jurisdiction.label}` },
            ].map(({ label, value, color }) => (
              <div key={label}>
                <p style={{ fontFamily: 'Cinzel, serif', fontSize: '9px', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', marginBottom: '6px' }}>
                  {label}
                </p>
                <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '18px', color: color ?? 'rgba(255,255,255,0.65)' }}>
                  {value}
                </p>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div style={{ height: '1px', background: `${accent}22`, marginBottom: '16px' }} />

          {/* Footer — address + actions */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <p style={{ fontFamily: 'Cinzel, serif', fontSize: '9px', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)' }}>
                Wallet Address
              </p>
              <button
                onClick={copyAddress}
                style={{ fontFamily: 'monospace', fontSize: '13px', color: copied ? accent : 'rgba(255,255,255,0.25)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, transition: 'color 0.2s', textAlign: 'left' }}
              >
                {copied ? 'Copied ✓' : `${result.address.slice(0, 6)}···${result.address.slice(-6)}`}
              </button>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <a
                href={`${ETHERSCAN_BASE}/address/${result.address}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontFamily: 'Cinzel, serif', fontSize: '10px', letterSpacing: '0.22em',
                  textTransform: 'uppercase', padding: '7px 16px',
                  background: accent, color: '#0a0006',
                  textDecoration: 'none', fontWeight: 600,
                }}
              >
                Arbiscan ↗
              </a>
            </div>
          </div>

        </div>

        {/* Warning banners — inside the card at the bottom */}
        {result.revoked && (
          <div style={{ borderTop: '1px solid rgba(239,68,68,0.25)', background: 'rgba(127,29,29,0.3)', padding: '14px 32px' }}>
            <p style={{ fontFamily: 'Cinzel, serif', fontSize: '10px', letterSpacing: '0.28em', textTransform: 'uppercase', color: '#fca5a5', marginBottom: '6px' }}>
              Trust Seal Revoked
            </p>
            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: '16px', color: 'rgba(252,165,165,0.7)' }}>
              {result.revocationReason || 'This seal has been revoked and should not be trusted for protocol access.'}
            </p>
          </div>
        )}

        {result.isExpired && !result.revoked && (
          <div style={{ borderTop: '1px solid rgba(217,119,6,0.25)', background: 'rgba(120,53,15,0.2)', padding: '14px 32px' }}>
            <p style={{ fontFamily: 'Cinzel, serif', fontSize: '10px', letterSpacing: '0.28em', textTransform: 'uppercase', color: '#fcd34d', marginBottom: '6px' }}>
              Seal Expired
            </p>
            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: '16px', color: 'rgba(252,211,77,0.6)' }}>
              This seal is no longer valid. The wallet holder must renew their Covenant verification.
            </p>
          </div>
        )}

        {result.burnPending && (
          <div style={{ borderTop: `1px solid ${accent}25`, background: `${accent}08`, padding: '14px 32px' }}>
            <p style={{ fontFamily: 'Cinzel, serif', fontSize: '10px', letterSpacing: '0.28em', textTransform: 'uppercase', color: accent, marginBottom: '6px', opacity: 0.7 }}>
              Burn Pending
            </p>
            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: '16px', color: 'rgba(255,255,255,0.3)' }}>
              The owner has requested deletion of this seal.{' '}
              {result.burnExecutableAt
                ? formatBurnCountdown(result.burnExecutableAt)
                : 'Awaiting 90-day delay.'}
            </p>
          </div>
        )}

      </div>

      {/* Covenant Signature — collapsible, below the card */}
      {result.covenantSignature && result.covenantSignature !== '0x' && (
        <div style={{
          marginTop: '8px',
          border: `1px solid ${accent}${gh('55', result.tier)}`,
          background: 'rgba(10,0,6,0.6)',
          boxShadow: `0 0 28px ${accent}${gh('28', result.tier)}, 0 0 8px ${accent}${gh('18', result.tier)}, inset 0 0 32px ${accent}${gh('0c', result.tier)}`,
        }}>
          {/* Top accent bar matching the main card */}
          <div style={{ height: '2px', background: `linear-gradient(90deg, transparent, ${accent}${gh('70', result.tier)}, transparent)` }} />
          <button
            style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', background: 'none', border: 'none', cursor: 'pointer' }}
            onClick={() => setShowSignature(v => !v)}
          >
            <span style={{ fontFamily: 'Cinzel, serif', fontSize: '10px', letterSpacing: '0.28em', textTransform: 'uppercase', color: `${accent}99` }}>
              Covenant Signature
            </span>
            <span style={{ fontFamily: 'Cinzel, serif', fontSize: '10px', color: `${accent}70` }}>{showSignature ? '▲' : '▼'}</span>
          </button>
          {showSignature && (
            <div style={{ padding: '0 20px 16px', borderTop: `1px solid ${accent}20` }}>
              <p style={{ fontFamily: 'monospace', fontSize: '12px', color: 'rgba(255,255,255,0.3)', wordBreak: 'break-all', lineHeight: 1.6, padding: '12px 0' }}>
                {result.covenantSignature}
              </p>
              <button
                onClick={() => { navigator.clipboard.writeText(result.covenantSignature); setSigCopied(true); setTimeout(() => setSigCopied(false), 2000); }}
                style={{ fontFamily: 'Cinzel, serif', fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase', padding: '6px 14px', border: `1px solid ${accent}40`, color: `${accent}99`, background: `${accent}0a`, cursor: 'pointer' }}
              >
                {sigCopied ? 'Copied ✓' : 'Copy'}
              </button>
            </div>
          )}
        </div>
      )}


    </div>
  );
}
