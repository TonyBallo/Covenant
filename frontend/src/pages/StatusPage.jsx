import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import { checkKYCStatus, getCrossChainStatus } from '../utils/api';
import { TIERS, formatDate, formatBurnCountdown, formatJurisdiction } from '../utils/constants';
import { CONTRACT_ADDRESS, CONTRACT_ABI, RPC_URL, ETHERSCAN_BASE } from '../utils/contract';

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

const TIER_TAGLINE = {
  1: 'Verified Human',
  2: 'Named Identity',
  3: 'Enhanced Due Diligence',
  4: 'Sophisticated Investor',
  5: 'Institutional Entity',
};

const TIER_GLOW_SCALE = { 1: 0.2, 2: 0.4, 3: 0.6, 4: 0.8, 5: 1.0 };
const gh = (base, tier) => {
  const n = Math.round(parseInt(base, 16) * (TIER_GLOW_SCALE[tier] ?? 1.0));
  return n.toString(16).padStart(2, '0');
};

export function StatusPage({ walletAddress }) {
  const navigate = useNavigate();
  const [kycStatus, setKycStatus] = useState(null);
  const [sealData, setSealData] = useState(null);
  const [chainStatus, setChainStatus] = useState({ ethereum: false, polygon: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sealAdded, setSealAdded] = useState(false);
  const [sealExpired, setSealExpired] = useState(false);
  const [walletError, setWalletError] = useState(null);
  const [burnLoading, setBurnLoading] = useState(false);
  const [burnError, setBurnError] = useState(null);
  const [burnTx, setBurnTx] = useState(null);
  const [showBurnConfirm, setShowBurnConfirm] = useState(false);
  const [showExecuteConfirm, setShowExecuteConfirm] = useState(false);
  const [showSignature, setShowSignature] = useState(false);
  const [sigCopied, setSigCopied] = useState(false);
  const [copied, setCopied] = useState(false);

  const addToWallet = async () => {
    if (!window.ethereum) return;
    setWalletError(null);
    try {
      await window.ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC721',
          options: {
            address: CONTRACT_ADDRESS,
            tokenId: sealData.sealId.toString(),
          },
        },
      });
      setSealAdded(true);
    } catch (err) {
      if (err?.code === 4001) return;
      setWalletError('Your wallet does not support adding NFTs directly. Try MetaMask, or view on Arbiscan instead.');
    }
  };

  const burnErrorMessage = (err) => {
    const msg = err?.message ?? '';
    if (msg.includes('max fee per gas less than block base fee') || msg.includes('maxFeePerGas') || msg.includes('baseFee'))
      return 'Gas fee too low for current network conditions. Please try again.';
    if (msg.includes('insufficient funds'))
      return 'Insufficient funds to pay for gas. Add ETH to your wallet and try again.';
    if (msg.includes('Not seal owner'))
      return 'This wallet does not own the seal.';
    if (msg.includes('Burn already requested'))
      return 'A deletion request is already pending for this seal.';
    if (msg.includes('No pending burn request'))
      return 'No active deletion request found.';
    if (msg.includes('Burn delay not elapsed'))
      return 'The 90-day waiting period has not yet elapsed.';
    if (msg.includes('Cannot burn revoked seal'))
      return 'Revoked seals cannot be deleted through this flow.';
    return 'Transaction failed. Please try again.';
  };

  const getSigner = async () => {
    if (!window.ethereum) throw new Error('No wallet detected. Please install MetaMask.');
    const browserProvider = new ethers.BrowserProvider(window.ethereum);
    const network = await browserProvider.getNetwork();
    if (Number(network.chainId) !== 421614) {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x66EEE' }],
      });
    }
    return browserProvider.getSigner();
  };

  const reloadSeal = async () => {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
    const [verified, tier, revoked, burnPending, burnExecutableAt] = await contract.getVerificationStatus(walletAddress);
    if (verified) {
      const sealId = await contract.addressToSealId(walletAddress);
      const [seal, expired] = await Promise.all([
        contract.sealData(sealId),
        contract.isExpired(walletAddress),
      ]);
      setSealData({ verified, tier: Number(tier), revoked, burnPending, burnExecutableAt: Number(burnExecutableAt), sealId: Number(sealId), mintedAt: Number(seal.mintedAt), expiresAt: Number(seal.expiresAt), jurisdictionCode: Number(seal.jurisdictionCode), covenantSignature: seal.covenantSignature, revocationReason: seal.revocationReason || '' });
      setSealExpired(expired);
    } else {
      setSealData(null);
    }
  };

  const handleRequestBurn = async () => {
    setShowBurnConfirm(false);
    setBurnError(null);
    setBurnLoading(true);
    try {
      const signer = await getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const tx = await contract.requestBurn(sealData.sealId);
      setBurnTx(tx.hash);
      await tx.wait();
      await reloadSeal();
    } catch (err) {
      if (err?.code === 4001 || err?.code === 'ACTION_REJECTED') return;
      setBurnError(burnErrorMessage(err));
    } finally {
      setBurnLoading(false);
    }
  };

  const handleCancelBurn = async () => {
    setBurnError(null);
    setBurnLoading(true);
    try {
      const signer = await getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const tx = await contract.cancelBurnRequest(sealData.sealId);
      setBurnTx(tx.hash);
      await tx.wait();
      setBurnTx(null);
      await reloadSeal();
    } catch (err) {
      if (err?.code === 4001 || err?.code === 'ACTION_REJECTED') return;
      setBurnError(burnErrorMessage(err));
    } finally {
      setBurnLoading(false);
    }
  };

  const handleExecuteBurn = async () => {
    setShowExecuteConfirm(false);
    setBurnError(null);
    setBurnLoading(true);
    try {
      const signer = await getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const tx = await contract.executeBurn(sealData.sealId);
      setBurnTx(tx.hash);
      await tx.wait();
      await reloadSeal();
    } catch (err) {
      if (err?.code === 4001 || err?.code === 'ACTION_REJECTED') return;
      setBurnError(burnErrorMessage(err));
    } finally {
      setBurnLoading(false);
    }
  };

  useEffect(() => {
    if (!walletAddress) setLoading(false);
  }, [walletAddress]);

  useEffect(() => {
    if (!sealData?.verified) return;
    const key = `mintCeremony_${sealData.sealId}`;
    if (!sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, 'shown');
      navigate('/demo/mint-ceremony', { state: { tier: sealData.tier, sealId: sealData.sealId } });
    }
  }, [sealData, navigate]);

  useEffect(() => {
    if (!walletAddress) return;
    const loadStatus = async () => {
      setLoading(true);
      setError(null);
      try {
        const status = await checkKYCStatus(walletAddress);
        setKycStatus(status);

        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
        const [verified, tier, revoked, burnPending, burnExecutableAt] = await contract.getVerificationStatus(walletAddress);

        if (verified) {
          const sealId = await contract.addressToSealId(walletAddress);
          const [seal, expired] = await Promise.all([
            contract.sealData(sealId),
            contract.isExpired(walletAddress),
          ]);
          setSealData({ verified, tier: Number(tier), revoked, burnPending, burnExecutableAt: Number(burnExecutableAt), sealId: Number(sealId), mintedAt: Number(seal.mintedAt), expiresAt: Number(seal.expiresAt), jurisdictionCode: Number(seal.jurisdictionCode), covenantSignature: seal.covenantSignature, revocationReason: seal.revocationReason || '' });
          setSealExpired(expired);

          try {
            const chains = await getCrossChainStatus(walletAddress);
            setChainStatus(chains);
          } catch {
            setChainStatus({ ethereum: true, polygon: false });
          }
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadStatus();
  }, [walletAddress]);

  if (!walletAddress) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-md w-full border border-gold/20 bg-tyrian-darker p-10 text-center">
          <div className="w-px h-10 bg-gradient-to-b from-transparent via-gold/40 to-transparent mx-auto mb-6" />
          <h2 className="font-cinzel text-marble text-xl tracking-wide mb-3">Connect Your Wallet</h2>
          <p className="font-cormorant text-marble-muted italic text-lg mb-8">
            Connect your wallet using the navigation menu to view your verification status.
          </p>
          <Link to="/demo" className="font-cinzel text-gold/60 hover:text-gold text-xs tracking-widest uppercase transition-colors">
            ← Return to Lookup
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border border-gold/50 border-t-gold rounded-full animate-spin mx-auto mb-4"></div>
          <p className="font-cormorant text-marble-muted italic text-lg">Loading your status…</p>
        </div>
      </div>
    );
  }

  // Derived display values — only valid when sealData is set
  const tierInfo    = sealData ? TIERS[sealData.tier] : null;
  const accent      = sealData ? (TIER_ACCENT[sealData.tier] ?? '#d4af5a') : '#d4af5a';
  const jurisdiction = sealData ? formatJurisdiction(sealData.jurisdictionCode ?? 0) : null;
  const statusColor = sealData ? (sealData.revoked ? '#fca5a5' : sealExpired ? '#fcd34d' : accent) : accent;
  const statusLabel = sealData ? (sealData.revoked ? 'Revoked' : sealExpired ? 'Expired' : 'Active') : '';
  const expiryLabel = sealData ? (() => {
    if (!sealData.expiresAt) return 'No Expiry';
    if (sealExpired) return `${formatDate(sealData.expiresAt)} — Expired`;
    const msLeft = sealData.expiresAt * 1000 - Date.now();
    if (msLeft < 30 * 24 * 60 * 60 * 1000) return `${formatDate(sealData.expiresAt)} — Soon`;
    return formatDate(sealData.expiresAt);
  })() : '';

  return (
    <div className="min-h-screen py-16 px-6">
      <div className="max-w-lg mx-auto">

        {/* Page header */}
        <div className="relative text-center mb-10">
          <Link to="/demo" className="absolute left-0 top-0 font-cinzel text-gold/60 hover:text-gold text-xs tracking-widest uppercase transition-colors">
            ← Return
          </Link>
          <h1 className="font-cinzel text-marble text-4xl tracking-wide mb-2">My Status</h1>
          <p className="font-mono text-marble-muted text-xs">
            {walletAddress.slice(0, 6)}…{walletAddress.slice(-4)}
          </p>
        </div>

        {error && (
          <div className="border-l-4 border-red-800 bg-red-950/30 px-6 py-4 mb-6">
            <p className="font-cinzel text-red-400 text-xs tracking-widest uppercase mb-1">Error</p>
            <p className="font-cormorant text-red-300 italic text-lg">{error}</p>
          </div>
        )}

        {/* No Application */}
        {!kycStatus?.hasSubmission && !sealData?.verified && (
          <div className="border border-gold/20 bg-tyrian-darker p-10 text-center">
            <div className="w-px h-10 bg-gradient-to-b from-transparent via-gold/40 to-transparent mx-auto mb-6"></div>
            <h3 className="font-cinzel text-marble text-lg tracking-wide mb-3">No Application Found</h3>
            <p className="font-cormorant text-marble-muted italic text-xl mb-8">
              You haven't submitted a verification application yet.
            </p>
            <Link
              to="/demo/get-verified"
              className="font-cinzel text-xs tracking-widest uppercase px-6 py-3 bg-gold text-tyrian-deep hover:bg-gold-dim transition-colors"
            >
              Apply for Verification
            </Link>
          </div>
        )}

        {/* Pending */}
        {kycStatus?.hasSubmission && kycStatus.status === 'pending' && !sealData?.verified && (
          <div className="border border-gold/20 bg-tyrian-darker p-10 text-center">
            <div className="w-px h-10 bg-gradient-to-b from-transparent via-gold/40 to-transparent mx-auto mb-6"></div>
            <h3 className="font-cinzel text-marble text-lg tracking-wide mb-3">Application Under Review</h3>
            <p className="font-cormorant text-marble-muted italic text-xl mb-6">
              Your Tier {kycStatus.tierRequested} application is pending review.
              This typically takes 1–2 business days.
            </p>
            <div className="border border-gold/10 bg-tyrian-dark px-5 py-4 text-left">
              <p className="font-cinzel text-marble-muted text-xs tracking-widest uppercase mb-1">Submitted</p>
              <p className="font-cormorant text-marble text-lg">
                {new Date(kycStatus.submittedAt).toLocaleDateString('en-US', {
                  year: 'numeric', month: 'long', day: 'numeric'
                })}
              </p>
            </div>
          </div>
        )}

        {/* Rejected */}
        {kycStatus?.hasSubmission && kycStatus.status === 'rejected' && !sealData?.verified && (
          <div className="border border-red-900/40 bg-tyrian-darker p-10 text-center">
            <div className="w-px h-10 bg-gradient-to-b from-transparent via-red-800/50 to-transparent mx-auto mb-6"></div>
            <h3 className="font-cinzel text-marble text-lg tracking-wide mb-3">Application Rejected</h3>
            <p className="font-cormorant text-marble-muted italic text-xl mb-6">
              Unfortunately your application was not approved.
            </p>
            {kycStatus.rejectionReason && (
              <div className="border-l-4 border-red-800 bg-red-950/30 px-5 py-4 text-left mb-8">
                <p className="font-cinzel text-red-400 text-xs tracking-widest uppercase mb-1">Reason</p>
                <p className="font-cormorant text-red-300 italic text-lg">{kycStatus.rejectionReason}</p>
              </div>
            )}
            <Link
              to="/demo/get-verified"
              className="font-cinzel text-xs tracking-widest uppercase px-6 py-3 bg-gold text-tyrian-deep hover:bg-gold-dim transition-colors"
            >
              Apply Again
            </Link>
          </div>
        )}

        {/* ── Verified Seal Card ── */}
        {sealData?.verified && (
          <div>

            {/* Seal image — full width, floats above card */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
              <img
                src={`/tiers/tier-${sealData.tier}.png`}
                alt={`Tier ${sealData.tier} seal`}
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

            {/* Main card */}
            <div style={{
              background: TIER_BG[sealData.tier],
              border: `1px solid ${accent}${gh('38', sealData.tier)}`,
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

                {/* Row 1 — Covenant header + chain badges + status */}
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
                  <div>
                    <p style={{ fontFamily: 'Cinzel, serif', fontSize: '18px', letterSpacing: '0.2em', textTransform: 'uppercase', color: accent }}>
                      {tierInfo.name}
                    </p>
                    <p style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: '16px', color: 'rgba(255,255,255,0.3)', marginTop: '4px' }}>
                      {TIER_TAGLINE[sealData.tier]}
                    </p>
                  </div>
                </div>

                {/* Divider */}
                <div style={{ height: '1px', background: `${accent}22`, marginBottom: '18px' }} />

                {/* Data grid — 2×3 */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginBottom: '18px' }}>
                  {[
                    { label: 'Seal ID',      value: `#${sealData.sealId}` },
                    { label: 'Issued',       value: formatDate(sealData.mintedAt) },
                    { label: 'Expires',      value: expiryLabel, color: sealExpired ? '#fca5a5' : sealData.expiresAt && (sealData.expiresAt * 1000 - Date.now()) < 30 * 24 * 60 * 60 * 1000 ? '#fcd34d' : null },
                    { label: 'Jurisdiction', value: `${jurisdiction.flag} ${jurisdiction.label}` },
                    { label: 'Deletion',     value: sealData.burnPending ? 'Requested' : 'None', color: sealData.burnPending ? '#fcd34d' : null },
                    { label: 'Polygon',      value: chainStatus.polygon ? 'Witnessed' : 'Pending', color: chainStatus.polygon ? '#c084fc' : null },
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

                {/* Footer — wallet address + Arbiscan */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <p style={{ fontFamily: 'Cinzel, serif', fontSize: '9px', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)' }}>
                      Wallet Address
                    </p>
                    <button
                      onClick={() => { navigator.clipboard.writeText(walletAddress); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                      style={{ fontFamily: 'monospace', fontSize: '13px', color: copied ? accent : 'rgba(255,255,255,0.25)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, transition: 'color 0.2s', textAlign: 'left' }}
                    >
                      {copied ? 'Copied ✓' : `${walletAddress.slice(0, 6)}···${walletAddress.slice(-6)}`}
                    </button>
                  </div>
                  <a
                    href={`${ETHERSCAN_BASE}/token/${CONTRACT_ADDRESS}?a=${sealData.sealId}`}
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

              {/* Warning banners */}
              {sealData.revoked && (
                <div style={{ borderTop: '1px solid rgba(239,68,68,0.25)', background: 'rgba(127,29,29,0.3)', padding: '14px 32px' }}>
                  <p style={{ fontFamily: 'Cinzel, serif', fontSize: '10px', letterSpacing: '0.28em', textTransform: 'uppercase', color: '#fca5a5', marginBottom: '6px' }}>
                    Trust Seal Revoked
                  </p>
                  <p style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: '16px', color: 'rgba(252,165,165,0.7)' }}>
                    {sealData.revocationReason || 'This seal has been revoked and should not be trusted for protocol access.'}
                  </p>
                </div>
              )}

              {sealExpired && !sealData.revoked && (
                <div style={{ borderTop: '1px solid rgba(217,119,6,0.25)', background: 'rgba(120,53,15,0.2)', padding: '14px 32px' }}>
                  <p style={{ fontFamily: 'Cinzel, serif', fontSize: '10px', letterSpacing: '0.28em', textTransform: 'uppercase', color: '#fcd34d', marginBottom: '6px' }}>
                    Seal Expired
                  </p>
                  <p style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: '16px', color: 'rgba(252,211,77,0.6)' }}>
                    This seal is no longer valid. Contact Covenant to renew your verification.
                  </p>
                </div>
              )}

              {sealData.burnPending && (
                <div style={{ borderTop: `1px solid ${accent}25`, background: `${accent}08`, padding: '14px 32px' }}>
                  <p style={{ fontFamily: 'Cinzel, serif', fontSize: '10px', letterSpacing: '0.28em', textTransform: 'uppercase', color: accent, marginBottom: '6px', opacity: 0.7 }}>
                    Burn Pending
                  </p>
                  <p style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: '16px', color: 'rgba(255,255,255,0.3)' }}>
                    {formatBurnCountdown(sealData.burnExecutableAt)}
                  </p>
                </div>
              )}

            </div>

            {/* Covenant Signature — collapsible, matches ResultDisplay */}
            {sealData.covenantSignature && sealData.covenantSignature !== '0x' && (
              <div style={{
                marginTop: '8px',
                border: `1px solid ${accent}${gh('55', sealData.tier)}`,
                background: 'rgba(10,0,6,0.6)',
                boxShadow: `0 0 28px ${accent}${gh('28', sealData.tier)}, 0 0 8px ${accent}${gh('18', sealData.tier)}, inset 0 0 32px ${accent}${gh('0c', sealData.tier)}`,
              }}>
                <div style={{ height: '2px', background: `linear-gradient(90deg, transparent, ${accent}${gh('70', sealData.tier)}, transparent)` }} />
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
                      {sealData.covenantSignature}
                    </p>
                    <button
                      onClick={() => { navigator.clipboard.writeText(sealData.covenantSignature); setSigCopied(true); setTimeout(() => setSigCopied(false), 2000); }}
                      style={{ fontFamily: 'Cinzel, serif', fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase', padding: '6px 14px', border: `1px solid ${accent}40`, color: `${accent}99`, background: `${accent}0a`, cursor: 'pointer' }}
                    >
                      {sigCopied ? 'Copied ✓' : 'Copy'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Actions — Add to Wallet, Upgrade */}
            <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {sealAdded ? (
                <p style={{ fontFamily: 'Cinzel, serif', fontSize: '10px', letterSpacing: '0.3em', textTransform: 'uppercase', color: accent, textAlign: 'center', padding: '12px 0', opacity: 0.8 }}>
                  Seal added to wallet ✓
                </p>
              ) : (
                <button
                  onClick={addToWallet}
                  style={{ width: '100%', fontFamily: 'Cinzel, serif', fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase', padding: '12px', border: `1px solid ${accent}30`, color: `${accent}80`, background: 'none', cursor: 'pointer' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = `${accent}60`; e.currentTarget.style.color = accent; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = `${accent}30`; e.currentTarget.style.color = `${accent}80`; }}
                >
                  Add Seal to Wallet
                </button>
              )}
              {walletError && (
                <p style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: '14px', color: '#fca5a5', textAlign: 'center' }}>{walletError}</p>
              )}
              {!sealData.revoked && !sealExpired && sealData.tier < 5 && (
                <Link
                  to="/demo/get-verified"
                  state={{ upgrade: true, currentTier: sealData.tier }}
                  style={{ display: 'block', textAlign: 'center', fontFamily: 'Cinzel, serif', fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase', padding: '12px', border: `1px solid ${accent}20`, color: `${accent}60`, textDecoration: 'none' }}
                >
                  Apply for Tier Upgrade →
                </Link>
              )}
            </div>

            {/* Seal Deletion — collapsible, hidden for revoked seals */}
            {!sealData.revoked && (
              <div style={{ marginTop: '8px', border: '1px solid rgba(239,68,68,0.15)', background: 'rgba(10,0,6,0.6)' }}>
                <button
                  style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', background: 'none', border: 'none', cursor: 'pointer' }}
                  onClick={() => { if (!sealData.burnPending) setShowBurnConfirm(v => !v); }}
                >
                  <span style={{ fontFamily: 'Cinzel, serif', fontSize: '10px', letterSpacing: '0.28em', textTransform: 'uppercase', color: 'rgba(252,165,165,0.35)' }}>
                    Seal Deletion
                  </span>
                  <span style={{ fontFamily: 'Cinzel, serif', fontSize: '10px', color: 'rgba(252,165,165,0.25)' }}>
                    {showBurnConfirm || showExecuteConfirm || sealData.burnPending ? '▲' : '▼'}
                  </span>
                </button>

                {(showBurnConfirm || showExecuteConfirm || sealData.burnPending) && (
                  <div style={{ padding: '0 20px 20px', borderTop: '1px solid rgba(239,68,68,0.1)' }}>

                    {/* Idle */}
                    {!sealData.burnPending && !showBurnConfirm && (
                      <div style={{ textAlign: 'center', paddingTop: '16px' }}>
                        <p style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: '15px', color: 'rgba(255,255,255,0.3)', marginBottom: '16px' }}>
                          Requesting deletion starts a 90-day countdown. You may cancel at any time before it completes.
                        </p>
                        <button
                          onClick={() => setShowBurnConfirm(true)}
                          style={{ fontFamily: 'Cinzel, serif', fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase', padding: '8px 20px', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', background: 'none', cursor: 'pointer' }}
                        >
                          Request Deletion
                        </button>
                      </div>
                    )}

                    {/* Confirm requestBurn */}
                    {!sealData.burnPending && showBurnConfirm && (
                      <div style={{ textAlign: 'center', paddingTop: '16px' }}>
                        <p style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: '15px', color: 'rgba(255,255,255,0.55)', marginBottom: '6px' }}>
                          Are you sure you want to request deletion of your Covenant seal?
                        </p>
                        <p style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: '13px', color: 'rgba(255,255,255,0.25)', marginBottom: '20px' }}>
                          A 90-day countdown will begin. Your seal remains valid until it completes. You can cancel at any time.
                        </p>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                          <button
                            onClick={() => setShowBurnConfirm(false)}
                            disabled={burnLoading}
                            style={{ fontFamily: 'Cinzel, serif', fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase', padding: '8px 18px', border: `1px solid ${accent}25`, color: `${accent}60`, background: 'none', cursor: 'pointer' }}
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleRequestBurn}
                            disabled={burnLoading}
                            style={{ fontFamily: 'Cinzel, serif', fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase', padding: '8px 18px', border: '1px solid rgba(239,68,68,0.35)', color: '#fca5a5', background: 'none', cursor: 'pointer', opacity: burnLoading ? 0.5 : 1 }}
                          >
                            {burnLoading ? 'Submitting…' : 'Confirm Request'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Burn pending — countdown + cancel */}
                    {sealData.burnPending && !showExecuteConfirm && (() => {
                      const canExecute = Math.floor(Date.now() / 1000) >= sealData.burnExecutableAt;
                      const countdown = formatBurnCountdown(sealData.burnExecutableAt);
                      return (
                        <div style={{ textAlign: 'center', paddingTop: '16px' }}>
                          {canExecute ? (
                            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: '15px', color: 'rgba(252,165,165,0.7)', marginBottom: '16px' }}>
                              The 90-day period has elapsed. You may now permanently delete your seal.
                            </p>
                          ) : (
                            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: '15px', color: 'rgba(252,211,77,0.6)', marginBottom: '16px' }}>
                              Deletion requested — <span style={{ fontWeight: 600 }}>{countdown}</span>.
                            </p>
                          )}
                          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                            <button
                              onClick={handleCancelBurn}
                              disabled={burnLoading}
                              style={{ fontFamily: 'Cinzel, serif', fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase', padding: '8px 18px', border: `1px solid ${accent}25`, color: `${accent}60`, background: 'none', cursor: 'pointer', opacity: burnLoading ? 0.5 : 1 }}
                            >
                              {burnLoading ? 'Submitting…' : 'Cancel Request'}
                            </button>
                            {canExecute && (
                              <button
                                onClick={() => setShowExecuteConfirm(true)}
                                disabled={burnLoading}
                                style={{ fontFamily: 'Cinzel, serif', fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase', padding: '8px 18px', border: '1px solid rgba(239,68,68,0.35)', color: '#fca5a5', background: 'none', cursor: 'pointer', opacity: burnLoading ? 0.5 : 1 }}
                              >
                                Delete Seal
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Final execute confirmation */}
                    {sealData.burnPending && showExecuteConfirm && (
                      <div style={{ textAlign: 'center', paddingTop: '16px' }}>
                        <p style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: '15px', color: 'rgba(252,165,165,0.7)', marginBottom: '6px' }}>
                          This will permanently delete your Covenant seal.
                        </p>
                        <p style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: '13px', color: 'rgba(255,255,255,0.25)', marginBottom: '20px' }}>
                          This action is irreversible. Your seal and all associated trust standing will be removed from the blockchain.
                        </p>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                          <button
                            onClick={() => setShowExecuteConfirm(false)}
                            disabled={burnLoading}
                            style={{ fontFamily: 'Cinzel, serif', fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase', padding: '8px 18px', border: `1px solid ${accent}25`, color: `${accent}60`, background: 'none', cursor: 'pointer' }}
                          >
                            Go Back
                          </button>
                          <button
                            onClick={handleExecuteBurn}
                            disabled={burnLoading}
                            style={{ fontFamily: 'Cinzel, serif', fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase', padding: '8px 18px', background: 'rgba(127,29,29,0.5)', border: '1px solid rgba(239,68,68,0.4)', color: '#fca5a5', cursor: 'pointer', opacity: burnLoading ? 0.5 : 1 }}
                          >
                            {burnLoading ? 'Deleting…' : 'Permanently Delete'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Tx feedback */}
                    {burnTx && (
                      <p style={{ fontFamily: 'Cinzel, serif', fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', textAlign: 'center', marginTop: '16px' }}>
                        Tx: <a href={`${ETHERSCAN_BASE}/tx/${burnTx}`} target="_blank" rel="noopener noreferrer" style={{ color: `${accent}80` }}>{burnTx.slice(0, 10)}…</a>
                      </p>
                    )}
                    {burnError && (
                      <p style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: '14px', color: '#fca5a5', textAlign: 'center', marginTop: '12px' }}>{burnError}</p>
                    )}

                  </div>
                )}
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}
