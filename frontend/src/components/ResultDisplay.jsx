import { TIERS, formatDate, formatJurisdiction, formatBurnCountdown } from '../utils/constants';
import { ETHERSCAN_BASE, CONTRACT_ADDRESS } from '../utils/contract';
import { getCrossChainStatus } from '../utils/api';
import { useState, useEffect } from 'react';

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
        padding: '40px 24px',
        textAlign: 'center',
      }}>
        <div style={{ width: '1px', height: '40px', background: 'linear-gradient(to bottom, transparent, rgba(212,175,90,0.4), transparent)', margin: '0 auto 20px' }} />
        <p style={{ fontFamily: 'Cinzel, serif', fontSize: '12px', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: '10px' }}>
          No Trust Seal Found
        </p>
        <p style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: '16px', color: 'rgba(255,255,255,0.25)', marginBottom: '20px' }}>
          This wallet has not completed Covenant verification.
        </p>
        <p style={{ fontFamily: 'monospace', fontSize: '11px', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.04em' }}>
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
    <div className="mt-10">

      {/* Seal — full-width, floats above card with cast shadow */}
      {result.tier >= 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
          <img
            src={`/tiers/tier-${result.tier}.png`}
            alt={`Tier ${result.tier} seal`}
            style={{ width: '100%', height: 'auto', display: 'block' }}
          />
          <div style={{
            width: '40%', height: '14px',
            background: 'rgba(0,0,0,0.55)',
            borderRadius: '50%',
            filter: 'blur(10px)',
            marginTop: '-8px',
            marginBottom: '12px',
          }} />
        </div>
      )}

      {/* Main card */}
      <div style={{
        background: TIER_BG[result.tier],
        border: `1px solid ${accent}38`,
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
        <div style={{ padding: '20px 24px', position: 'relative' }}>

          {/* Row 1 — Covenant header + status + chain badges */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
            <div>
              <p style={{ fontFamily: 'Cinzel, serif', fontSize: '8px', letterSpacing: '0.36em', textTransform: 'uppercase', color: '#ffffff2a' }}>
                Covenant
              </p>
              <p style={{ fontFamily: 'Cinzel, serif', fontSize: '6px', letterSpacing: '0.44em', textTransform: 'uppercase', color: '#ffffff16', marginTop: '3px' }}>
                Protocol
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {chainStatus.ethereum && (
                <span style={{ fontFamily: 'Cinzel, serif', color: accent, fontSize: '16px', opacity: 0.7 }} title="Verified on Arbitrum">⟠</span>
              )}
              {chainStatus.polygon && (
                <span style={{ color: '#c084fc', fontSize: '16px', opacity: 0.7 }} title="Attested on Polygon">⬡</span>
              )}
              <span style={{
                fontFamily: 'Cinzel, serif', fontSize: '7px', letterSpacing: '0.22em',
                textTransform: 'uppercase', padding: '4px 10px',
                border: `1px solid ${statusColor}50`,
                color: statusColor,
                background: `${statusColor}12`,
              }}>
                {statusLabel}
              </span>
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: '1px', background: `${accent}22`, marginBottom: '14px' }} />

          {/* Tier hero */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '16px', marginBottom: '14px' }}>
            <span style={{ fontFamily: 'Cinzel, serif', fontWeight: 700, fontSize: 'clamp(36px, 8vw, 52px)', lineHeight: 1, color: accent }}>
              {tierInfo.numeral}
            </span>
            <div>
              <p style={{ fontFamily: 'Cinzel, serif', fontSize: '14px', letterSpacing: '0.2em', textTransform: 'uppercase', color: accent }}>
                {tierInfo.name}
              </p>
              <p style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: '13px', color: 'rgba(255,255,255,0.3)', marginTop: '3px' }}>
                {TIER_TAGLINE[result.tier]}
              </p>
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: '1px', background: `${accent}22`, marginBottom: '14px' }} />

          {/* Data grid — 2×2 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', marginBottom: '14px' }}>
            {[
              { label: 'Seal ID',      value: `#${result.sealId}` },
              { label: 'Issued',       value: mintDate },
              { label: 'Expires',      value: expiryLabel, color: result.isExpired ? '#fca5a5' : result.expiresAt && (result.expiresAt * 1000 - Date.now()) < 30 * 24 * 60 * 60 * 1000 ? '#fcd34d' : null },
              { label: 'Jurisdiction', value: `${jurisdiction.flag} ${jurisdiction.label}` },
            ].map(({ label, value, color }) => (
              <div key={label}>
                <p style={{ fontFamily: 'Cinzel, serif', fontSize: '6px', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', marginBottom: '4px' }}>
                  {label}
                </p>
                <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '14px', color: color ?? 'rgba(255,255,255,0.65)' }}>
                  {value}
                </p>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div style={{ height: '1px', background: `${accent}22`, marginBottom: '12px' }} />

          {/* Footer — address + actions */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <button
              onClick={copyAddress}
              style={{ fontFamily: 'monospace', fontSize: '11px', color: copied ? accent : 'rgba(255,255,255,0.25)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, transition: 'color 0.2s' }}
            >
              {copied ? 'Copied ✓' : `${result.address.slice(0, 6)}···${result.address.slice(-6)}`}
            </button>
            <div style={{ display: 'flex', gap: '8px' }}>
              <a
                href={`${ETHERSCAN_BASE}/address/${result.address}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontFamily: 'Cinzel, serif', fontSize: '7px', letterSpacing: '0.22em',
                  textTransform: 'uppercase', padding: '5px 12px',
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
          <div style={{ borderTop: '1px solid rgba(239,68,68,0.25)', background: 'rgba(127,29,29,0.3)', padding: '10px 24px' }}>
            <p style={{ fontFamily: 'Cinzel, serif', fontSize: '7px', letterSpacing: '0.28em', textTransform: 'uppercase', color: '#fca5a5', marginBottom: '4px' }}>
              Trust Seal Revoked
            </p>
            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: '13px', color: 'rgba(252,165,165,0.7)' }}>
              {result.revocationReason || 'This seal has been revoked and should not be trusted for protocol access.'}
            </p>
          </div>
        )}

        {result.isExpired && !result.revoked && (
          <div style={{ borderTop: '1px solid rgba(217,119,6,0.25)', background: 'rgba(120,53,15,0.2)', padding: '10px 24px' }}>
            <p style={{ fontFamily: 'Cinzel, serif', fontSize: '7px', letterSpacing: '0.28em', textTransform: 'uppercase', color: '#fcd34d', marginBottom: '4px' }}>
              Seal Expired
            </p>
            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: '13px', color: 'rgba(252,211,77,0.6)' }}>
              This seal is no longer valid. The wallet holder must renew their Covenant verification.
            </p>
          </div>
        )}

        {result.burnPending && (
          <div style={{ borderTop: `1px solid ${accent}25`, background: `${accent}08`, padding: '10px 24px' }}>
            <p style={{ fontFamily: 'Cinzel, serif', fontSize: '7px', letterSpacing: '0.28em', textTransform: 'uppercase', color: accent, marginBottom: '4px', opacity: 0.7 }}>
              Burn Pending
            </p>
            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: '13px', color: 'rgba(255,255,255,0.3)' }}>
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
        <div style={{ marginTop: '8px', border: `1px solid ${accent}18`, background: 'rgba(10,0,6,0.6)' }}>
          <button
            style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer' }}
            onClick={() => setShowSignature(v => !v)}
          >
            <span style={{ fontFamily: 'Cinzel, serif', fontSize: '7px', letterSpacing: '0.28em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)' }}>
              Covenant Signature
            </span>
            <span style={{ fontFamily: 'Cinzel, serif', fontSize: '7px', color: 'rgba(255,255,255,0.2)' }}>{showSignature ? '▲' : '▼'}</span>
          </button>
          {showSignature && (
            <div style={{ padding: '0 16px 14px', borderTop: `1px solid ${accent}12` }}>
              <p style={{ fontFamily: 'monospace', fontSize: '10px', color: 'rgba(255,255,255,0.25)', wordBreak: 'break-all', lineHeight: 1.6, padding: '10px 0' }}>
                {result.covenantSignature}
              </p>
              <button
                onClick={() => { navigator.clipboard.writeText(result.covenantSignature); setSigCopied(true); setTimeout(() => setSigCopied(false), 2000); }}
                style={{ fontFamily: 'Cinzel, serif', fontSize: '7px', letterSpacing: '0.22em', textTransform: 'uppercase', padding: '5px 12px', border: `1px solid ${accent}25`, color: 'rgba(255,255,255,0.3)', background: 'none', cursor: 'pointer' }}
              >
                {sigCopied ? 'Copied ✓' : 'Copy'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Footer links */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginTop: '14px' }}>
        <a
          href={`${ETHERSCAN_BASE}/address/${CONTRACT_ADDRESS}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontFamily: 'Cinzel, serif', fontSize: '7px', letterSpacing: '0.28em', textTransform: 'uppercase', color: `${accent}55`, textDecoration: 'none' }}
        >
          View Contract
        </a>
        <span style={{ color: 'rgba(212,175,90,0.2)' }}>•</span>
        <a
          href={`${ETHERSCAN_BASE}/address/${result.address}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontFamily: 'Cinzel, serif', fontSize: '7px', letterSpacing: '0.28em', textTransform: 'uppercase', color: `${accent}55`, textDecoration: 'none' }}
        >
          View Address
        </a>
      </div>

    </div>
  );
}
