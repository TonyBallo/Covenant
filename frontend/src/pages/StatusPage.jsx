import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import { checkKYCStatus, getCrossChainStatus } from '../utils/api';
import { TIERS, formatDate, formatBurnCountdown, formatJurisdiction } from '../utils/constants';
import { CONTRACT_ADDRESS, CONTRACT_ABI, RPC_URL, ETHERSCAN_BASE } from '../utils/contract';

const tierTextClass = {
  orange: 'text-gold',
  gray:   'text-marble-dim',
  yellow: 'text-gold',
  blue:   'text-blue-300',
  purple: 'text-purple-300',
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
      if (err?.code === 4001) return; // User rejected — ignore
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
        params: [{ chainId: '0x66EEE' }], // 421614 = Arbitrum Sepolia
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
    if (!walletAddress) navigate('/demo');
  }, [walletAddress, navigate]);

  // Redirect to ceremony on first visit after minting (once per seal per session)
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

        // Always check on-chain — the contract is the source of truth regardless of backend status
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

  return (
    <div className="min-h-screen py-16 px-6">
      <div className="max-w-lg mx-auto">

        <div className="text-center mb-10">
          <Link to="/demo" className="font-cinzel text-gold/60 hover:text-gold text-xs tracking-widest uppercase transition-colors mb-6 inline-block">
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

        {/* Identity Card */}
        {sealData?.verified && (
          <div className="border border-gold/40 bg-tyrian-darker overflow-hidden">

            {/* Card header */}
            <div className="bg-tyrian-dark border-b border-gold/25 px-5 py-4 sm:px-8 sm:py-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-cinzel text-marble-muted text-xs tracking-widest uppercase mb-1">
                    Covenant Protocol
                  </p>
                  <p className="font-cinzel text-gold text-lg tracking-wide">Identity Seal</p>
                </div>
                <div className="flex items-center gap-3">
                  {chainStatus.ethereum && (
                    <span className="text-gold text-xl font-cinzel" title="Verified on Arbitrum">⟠</span>
                  )}
                  {chainStatus.polygon && (
                    <span className="text-purple-400 text-xl" title="Attested on Polygon">⬡</span>
                  )}
                  <div className="w-10 h-10 border border-gold/40 flex items-center justify-center">
                    <span className="font-cinzel text-gold font-semibold">C</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Seal image */}
            <img
              src={`/tiers/tier-${sealData.tier}.png`}
              alt={`Tier ${TIERS[sealData.tier].numeral} — ${TIERS[sealData.tier].name} seal`}
              className="w-full h-auto block border-b border-gold/10"
            />

            {/* Tier display */}
            <div className={`px-5 py-5 sm:px-8 sm:py-6 border-b border-gold/15 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 ${sealData.revoked ? 'bg-red-950/20' : ''}`}>
              <div className={`font-cinzel text-5xl sm:text-6xl font-bold leading-none ${tierTextClass[TIERS[sealData.tier].color]}`}>
                {TIERS[sealData.tier].numeral}
              </div>
              <div>
                <p className="font-cinzel text-marble-muted text-xs tracking-widest uppercase mb-1">Verification Tier</p>
                <p className={`font-cinzel text-xl sm:text-2xl tracking-wide mb-1 ${tierTextClass[TIERS[sealData.tier].color]}`}>
                  {TIERS[sealData.tier].name}
                </p>
              </div>
            </div>

            {/* Attributes */}
            <div className="px-5 py-5 sm:px-8 sm:py-6 grid grid-cols-2 gap-4">
              <div>
                <p className="font-cinzel text-marble-muted text-xs tracking-widest uppercase mb-1">Seal ID</p>
                <p className="font-mono text-marble font-bold text-lg">#{sealData.sealId}</p>
              </div>
              <div>
                <p className="font-cinzel text-marble-muted text-xs tracking-widest uppercase mb-1">Issued</p>
                <p className="font-cormorant text-marble text-lg">{formatDate(sealData.mintedAt)}</p>
              </div>
              <div>
                <p className="font-cinzel text-marble-muted text-xs tracking-widest uppercase mb-1">Expiry</p>
                {!sealData.expiresAt ? (
                  <p className="font-cormorant text-marble text-lg">No expiry set</p>
                ) : sealExpired ? (
                  <p className="font-cormorant text-red-400 text-lg font-semibold">{formatDate(sealData.expiresAt)} — Expired</p>
                ) : (sealData.expiresAt * 1000 - Date.now()) < 30 * 24 * 60 * 60 * 1000 ? (
                  <p className="font-cormorant text-amber-400 text-lg">{formatDate(sealData.expiresAt)} — Expiring soon</p>
                ) : (
                  <p className="font-cormorant text-marble text-lg">{formatDate(sealData.expiresAt)}</p>
                )}
              </div>
              <div>
                <p className="font-cinzel text-marble-muted text-xs tracking-widest uppercase mb-1">Status</p>
                <p className={`font-cormorant text-lg font-semibold ${sealData.revoked ? 'text-red-400' : sealExpired ? 'text-amber-400' : 'text-gold'}`}>
                  {sealData.revoked ? 'Revoked' : sealExpired ? 'Expired' : 'Active'}
                </p>
              </div>
              <div>
                <p className="font-cinzel text-marble-muted text-xs tracking-widest uppercase mb-1">Deletion Request</p>
                <p className={`font-cormorant text-lg font-semibold ${sealData.burnPending ? 'text-amber-400' : 'text-marble-muted'}`}>
                  {sealData.burnPending ? 'Pending' : 'None'}
                </p>
              </div>
              <div>
                <p className="font-cinzel text-marble-muted text-xs tracking-widest uppercase mb-1">Jurisdiction</p>
                <p className="font-cormorant text-marble text-lg">
                  {(() => { const j = formatJurisdiction(sealData.jurisdictionCode ?? 0); return `${j.flag} ${j.label}`; })()}
                </p>
              </div>
              <div>
                <p className="font-cinzel text-marble-muted text-xs tracking-widest uppercase mb-1">Polygon Attestation</p>
                {chainStatus.polygon ? (
                  <p className="font-cormorant text-purple-400 text-lg font-semibold">Witnessed on Amoy</p>
                ) : (
                  <p className="font-cormorant text-marble-muted text-lg font-semibold">Pending</p>
                )}
              </div>
            </div>

            {/* Wallet */}
            <div className="px-5 pb-5 sm:px-8 sm:pb-6">
              <div className="border border-gold/10 bg-tyrian-dark px-5 py-4">
                <p className="font-cinzel text-marble-muted text-xs tracking-widest uppercase mb-1">Wallet Address</p>
                <p className="font-mono text-marble-dim text-xs break-all">{walletAddress}</p>
              </div>
            </div>

            {/* Revoked warning */}
            {sealData.revoked && (
              <div className="mx-5 mb-5 sm:mx-8 sm:mb-6 border-l-4 border-red-800 bg-red-950/30 px-5 py-3">
                <p className="font-cinzel text-red-400 text-xs tracking-widest uppercase mb-1">Trust Seal Revoked</p>
                <p className="font-cormorant text-red-300 italic text-base">
                  This seal has been revoked and should not be used for protocol access.
                </p>
                {sealData.revocationReason && (
                  <p className="font-cormorant text-red-300/70 italic text-sm mt-2">
                    Reason: {sealData.revocationReason}
                  </p>
                )}
              </div>
            )}

            {/* Expired warning */}
            {sealExpired && !sealData.revoked && (
              <div className="mx-5 mb-5 sm:mx-8 sm:mb-6 border-l-4 border-amber-700 bg-amber-950/20 px-5 py-3">
                <p className="font-cinzel text-amber-400 text-xs tracking-widest uppercase mb-1">Seal Expired</p>
                <p className="font-cormorant text-amber-300/80 italic text-base">
                  This seal has expired and is no longer valid for protocol access. Contact Covenant to renew your verification.
                </p>
              </div>
            )}

            {/* Covenant Signature — collapsible, shows the ECDSA bytes stored on-chain at mint */}
            {sealData.covenantSignature && sealData.covenantSignature !== '0x' && (
              <div className="mx-5 mb-5 sm:mx-8 sm:mb-6 border border-gold/10 bg-tyrian-dark">
                <button
                  className="w-full flex items-center justify-between px-5 py-3 text-left"
                  onClick={() => setShowSignature(v => !v)}
                >
                  <span className="font-cinzel text-marble-muted text-xs tracking-widest uppercase">Covenant Signature</span>
                  <span className="font-cinzel text-marble-muted text-xs tracking-widest">{showSignature ? '▲' : '▼'}</span>
                </button>
                {showSignature && (
                  <div className="px-5 pb-5 border-t border-gold/10 pt-4">
                    <p className="font-cormorant text-marble-muted italic text-sm mb-3">
                      The ECDSA signature issued by Covenant Protocol at mint time. Stored permanently on-chain and used to verify this seal was authorised by the issuer.
                    </p>
                    <div className="bg-tyrian-darker border border-gold/10 px-4 py-3 break-all font-mono text-xs text-marble-muted/70 leading-relaxed">
                      {sealData.covenantSignature}
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(sealData.covenantSignature);
                        setSigCopied(true);
                        setTimeout(() => setSigCopied(false), 2000);
                      }}
                      className="mt-3 font-cinzel text-xs tracking-widest uppercase px-4 py-2 border border-gold/20 text-marble-muted hover:border-gold/40 hover:text-gold transition-colors"
                    >
                      {sigCopied ? 'Copied ✓' : 'Copy Signature'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Burn flow — hidden for revoked seals (contract blocks requestBurn on revoked) */}
            {!sealData.revoked && (
              <div className="mx-5 mb-5 sm:mx-8 sm:mb-6 border border-gold/10 bg-tyrian-dark">
                <button
                  className="w-full flex items-center justify-between px-5 py-3 text-left"
                  onClick={() => { if (!sealData.burnPending) setShowBurnConfirm(v => !v); }}
                >
                  <span className="font-cinzel text-marble-muted text-xs tracking-widest uppercase">Seal Deletion</span>
                  <span className="font-cinzel text-marble-muted text-xs tracking-widest">{showBurnConfirm || showExecuteConfirm ? '▲' : '▼'}</span>
                </button>

                {(showBurnConfirm || showExecuteConfirm || sealData.burnPending) && (
                  <div className="px-5 pb-5 border-t border-gold/10 pt-4">

                    {/* Idle — no burn requested */}
                    {!sealData.burnPending && !showBurnConfirm && (
                      <div className="text-center">
                        <p className="font-cormorant text-marble-muted italic text-base mb-4">
                          Requesting deletion starts a 90-day countdown. You may cancel at any time before it completes.
                        </p>
                        <button
                          onClick={() => setShowBurnConfirm(true)}
                          className="font-cinzel text-xs tracking-widest uppercase px-6 py-2 border border-red-900/50 text-red-400 hover:bg-red-950/30 transition-colors"
                        >
                          Request Deletion
                        </button>
                      </div>
                    )}

                    {/* Confirmation prompt for requestBurn */}
                    {!sealData.burnPending && showBurnConfirm && (
                      <div className="text-center">
                        <p className="font-cormorant text-marble italic text-base mb-1">
                          Are you sure you want to request deletion of your Covenant seal?
                        </p>
                        <p className="font-cormorant text-marble-muted italic text-sm mb-5">
                          A 90-day countdown will begin. Your seal remains valid until it completes. You can cancel at any time before the 90 days are up.
                        </p>
                        <div className="flex gap-3 justify-center">
                          <button
                            onClick={() => setShowBurnConfirm(false)}
                            disabled={burnLoading}
                            className="font-cinzel text-xs tracking-widest uppercase px-5 py-2 border border-gold/20 text-marble-muted hover:border-gold/40 hover:text-gold transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleRequestBurn}
                            disabled={burnLoading}
                            className="font-cinzel text-xs tracking-widest uppercase px-5 py-2 border border-red-900/50 text-red-400 hover:bg-red-950/30 transition-colors disabled:opacity-50"
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
                        <div className="text-center">
                          {canExecute ? (
                            <p className="font-cormorant text-red-300 italic text-base mb-4">
                              The 90-day period has elapsed. You may now permanently delete your seal.
                            </p>
                          ) : (
                            <p className="font-cormorant text-amber-300/80 italic text-base mb-4">
                              Deletion requested — <span className="font-semibold">{countdown}</span>.
                            </p>
                          )}
                          <div className="flex gap-3 justify-center">
                            <button
                              onClick={handleCancelBurn}
                              disabled={burnLoading}
                              className="font-cinzel text-xs tracking-widest uppercase px-5 py-2 border border-gold/20 text-marble-muted hover:border-gold/40 hover:text-gold transition-colors disabled:opacity-50"
                            >
                              {burnLoading ? 'Submitting…' : 'Cancel Request'}
                            </button>
                            {canExecute && (
                              <button
                                onClick={() => setShowExecuteConfirm(true)}
                                disabled={burnLoading}
                                className="font-cinzel text-xs tracking-widest uppercase px-5 py-2 border border-red-900/50 text-red-400 hover:bg-red-950/30 transition-colors disabled:opacity-50"
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
                      <div className="text-center">
                        <p className="font-cormorant text-red-300 italic text-base mb-1">
                          This will permanently delete your Covenant seal.
                        </p>
                        <p className="font-cormorant text-marble-muted italic text-sm mb-5">
                          This action is irreversible. Your seal and all associated trust standing will be removed from the blockchain.
                        </p>
                        <div className="flex gap-3 justify-center">
                          <button
                            onClick={() => setShowExecuteConfirm(false)}
                            disabled={burnLoading}
                            className="font-cinzel text-xs tracking-widest uppercase px-5 py-2 border border-gold/20 text-marble-muted hover:border-gold/40 hover:text-gold transition-colors"
                          >
                            Go Back
                          </button>
                          <button
                            onClick={handleExecuteBurn}
                            disabled={burnLoading}
                            className="font-cinzel text-xs tracking-widest uppercase px-5 py-2 bg-red-900/60 border border-red-800 text-red-300 hover:bg-red-900/80 transition-colors disabled:opacity-50"
                          >
                            {burnLoading ? 'Deleting…' : 'Permanently Delete'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Tx feedback */}
                    {burnTx && (
                      <p className="font-cinzel text-marble-muted text-xs tracking-widest text-center mt-4">
                        Tx: <a href={`${ETHERSCAN_BASE}/tx/${burnTx}`} target="_blank" rel="noopener noreferrer" className="text-gold/70 hover:text-gold">{burnTx.slice(0, 10)}…</a>
                      </p>
                    )}
                    {burnError && (
                      <p className="font-cormorant text-red-400 italic text-sm text-center mt-3">{burnError}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Footer */}
            <div className="px-5 pb-6 pt-2 sm:px-8 sm:pb-8 border-t border-gold/15 flex flex-col gap-3">
              <a
                href={`${ETHERSCAN_BASE}/token/${CONTRACT_ADDRESS}?a=${sealData.sealId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full font-cinzel text-xs tracking-widest uppercase py-3 px-4 bg-gold text-tyrian-deep hover:bg-gold-dim transition-colors text-center mt-4"
              >
                View NFT on Arbiscan ↗
              </a>
              <div className="flex justify-between items-center text-xs">
                <p className="font-cormorant text-marble-muted italic">Stored on Arbitrum Sepolia</p>
                <a
                  href={`${ETHERSCAN_BASE}/address/${walletAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-cinzel text-gold/60 hover:text-gold text-xs tracking-widest uppercase transition-colors"
                >
                  View Wallet →
                </a>
              </div>
              {sealAdded ? (
                <p className="font-cinzel text-gold text-xs tracking-widest uppercase text-center py-2">
                  Seal added to wallet ✓
                </p>
              ) : (
                <button
                  onClick={addToWallet}
                  className="w-full font-cinzel text-xs tracking-widest uppercase py-3 px-4 border border-gold/30 text-marble-muted hover:border-gold/60 hover:text-gold transition-colors text-center"
                >
                  Add Seal to Wallet
                </button>
              )}
              {walletError && (
                <p className="font-cormorant text-red-400 italic text-sm text-center">{walletError}</p>
              )}
              {sealData.verified && !sealData.revoked && !sealExpired && sealData.tier < 5 && (
                <Link
                  to="/demo/get-verified"
                  state={{ upgrade: true, currentTier: sealData.tier }}
                  className="w-full font-cinzel text-xs tracking-widest uppercase py-3 px-4 border border-gold/20 text-marble-muted hover:border-gold/40 hover:text-gold transition-colors text-center block"
                >
                  Apply for Tier Upgrade →
                </Link>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
