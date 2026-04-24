import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import { checkKYCStatus, getCrossChainStatus, getTreeStatus, recordLink, recordUnlink } from '../utils/api';
import { TIERS, formatDate, formatAddress } from '../utils/constants';
import { CONTRACT_ADDRESS, CONTRACT_ABI, RPC_URL, ETHERSCAN_BASE, CHAIN_ID } from '../utils/contract';

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
  const [walletError, setWalletError] = useState(null);

  // Trust tree state
  const [treePosition, setTreePosition] = useState(null);   // { isLinked, effectiveTier, root, parent }
  const [treeChildren, setTreeChildren] = useState([]);      // address[]
  const [linkAddress, setLinkAddress] = useState('');
  const [treeError, setTreeError] = useState(null);
  const [treeTxPending, setTreeTxPending] = useState(false);

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

        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
        const [verified, tier, revoked, burnPending] = await contract.getVerificationStatus(walletAddress);

        if (verified) {
          const sealId = await contract.addressToSealId(walletAddress);
          const seal = await contract.sealData(sealId);
          setSealData({ verified, tier: Number(tier), revoked, burnPending, sealId: Number(sealId), mintedAt: Number(seal.mintedAt), expiresAt: Number(seal.expiresAt) });

          try {
            const chains = await getCrossChainStatus(walletAddress);
            setChainStatus(chains);
          } catch {
            setChainStatus({ ethereum: true, polygon: false });
          }

          // Load trust tree children for root seal holders
          const children = await contract.getTreeChildren(walletAddress);
          setTreeChildren(children.map(a => a));
        } else {
          // Not a seal holder — check if this is a linked wallet
          const pos = await getTreeStatus(walletAddress);
          if (pos.isLinked) setTreePosition(pos);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadStatus();
  }, [walletAddress]);

  const refreshTreeChildren = async () => {
    try {
      const provider = new ethers.JsonRpcProvider(RPC_URL);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      const children = await contract.getTreeChildren(walletAddress);
      setTreeChildren(children.map(a => a));
    } catch { /* non-critical */ }
  };

  // Returns a signer locked to walletAddress on Arbitrum Sepolia,
  // plus fresh fee data with a 2x buffer to avoid base-fee underpricing.
  const getGuardedSigner = async () => {
    if (!window.ethereum) throw new Error('MetaMask not found');
    const provider = new ethers.BrowserProvider(window.ethereum);

    const { chainId } = await provider.getNetwork();
    if (Number(chainId) !== CHAIN_ID) {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x' + CHAIN_ID.toString(16) }],
      });
    }

    const signer = await provider.getSigner(walletAddress);
    if (signer.address.toLowerCase() !== walletAddress.toLowerCase()) {
      throw new Error('Switch MetaMask to the wallet that holds this seal.');
    }

    // Fetch current fee data — MetaMask sometimes caches stale values
    const feeData = await provider.getFeeData();
    const gasOpts = {
      maxFeePerGas: feeData.maxFeePerGas * 2n,
      maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
    };

    return { provider, signer, gasOpts };
  };

  const handleLinkWallet = async () => {
    if (!linkAddress || treeTxPending) return;
    setTreeError(null);
    setTreeTxPending(true);
    try {
      const { provider, signer, gasOpts } = await getGuardedSigner();
      const { chainId } = await provider.getNetwork();

      const childTier = sealData.tier - 1;
      const message = ethers.solidityPackedKeccak256(
        ['address', 'address', 'uint8', 'address', 'uint256'],
        [walletAddress, linkAddress, childTier, walletAddress, chainId]
      );
      const signature = await signer.signMessage(ethers.getBytes(message));

      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const tx = await contract.linkWallet(linkAddress, childTier, signature, gasOpts);
      const receipt = await tx.wait();

      await recordLink(receipt.hash);
      setLinkAddress('');
      await refreshTreeChildren();
    } catch (err) {
      setTreeError(err.reason || err.message);
    } finally {
      setTreeTxPending(false);
    }
  };

  const handleUnlinkWallet = async (childAddress) => {
    if (treeTxPending) return;
    setTreeError(null);
    setTreeTxPending(true);
    try {
      const { signer, gasOpts } = await getGuardedSigner();

      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const tx = await contract.unlinkWallet(childAddress, gasOpts);
      const receipt = await tx.wait();

      await recordUnlink(receipt.hash);
      await refreshTreeChildren();
    } catch (err) {
      setTreeError(err.reason || err.message);
    } finally {
      setTreeTxPending(false);
    }
  };

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

        {/* Linked Wallet — in a trust tree but holds no seal directly */}
        {!sealData?.verified && treePosition?.isLinked && (
          <div className="border border-gold/20 bg-tyrian-darker p-10">
            <div className="w-px h-10 bg-gradient-to-b from-transparent via-gold/40 to-transparent mx-auto mb-6"></div>
            <h3 className="font-cinzel text-marble text-lg tracking-wide mb-1 text-center">Linked Wallet</h3>
            <p className="font-cormorant text-marble-muted italic text-xl mb-8 text-center">
              This wallet is part of a trust tree.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="border border-gold/10 bg-tyrian-dark px-5 py-4">
                <p className="font-cinzel text-marble-muted text-xs tracking-widest uppercase mb-1">Effective Tier</p>
                <p className="font-cormorant text-gold text-lg">
                  {TIERS[treePosition.effectiveTier]?.name} — {TIERS[treePosition.effectiveTier]?.numeral}
                </p>
              </div>
              <div className="border border-gold/10 bg-tyrian-dark px-5 py-4">
                <p className="font-cinzel text-marble-muted text-xs tracking-widest uppercase mb-1">Status</p>
                <p className="font-cormorant text-gold text-lg">Active</p>
              </div>
              <div className="col-span-2 border border-gold/10 bg-tyrian-dark px-5 py-4">
                <p className="font-cinzel text-marble-muted text-xs tracking-widest uppercase mb-1">Parent Wallet</p>
                <p className="font-mono text-marble-dim text-xs break-all">{treePosition.parent}</p>
              </div>
              <div className="col-span-2 border border-gold/10 bg-tyrian-dark px-5 py-4">
                <p className="font-cinzel text-marble-muted text-xs tracking-widest uppercase mb-1">Root Seal Holder</p>
                <p className="font-mono text-marble-dim text-xs break-all">{treePosition.root}</p>
              </div>
            </div>
            <p className="font-cormorant text-marble-muted italic text-sm mt-6 text-center">
              Validity is determined by the root seal holder's on-chain status.
            </p>
          </div>
        )}

        {/* No Application */}
        {!kycStatus?.hasSubmission && !sealData?.verified && !treePosition?.isLinked && (
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
                <p className="font-cormorant text-marble text-lg">
                  {!sealData.expiresAt ? 'No expiry set' : formatDate(sealData.expiresAt)}
                </p>
              </div>
              <div>
                <p className="font-cinzel text-marble-muted text-xs tracking-widest uppercase mb-1">Status</p>
                <p className={`font-cormorant text-lg font-semibold ${sealData.revoked ? 'text-red-400' : 'text-gold'}`}>
                  {sealData.revoked ? 'Revoked' : 'Active'}
                </p>
              </div>
              <div>
                <p className="font-cinzel text-marble-muted text-xs tracking-widest uppercase mb-1">Burn Status</p>
                <p className={`font-cormorant text-lg font-semibold ${sealData.burnPending ? 'text-gold/70' : 'text-marble-muted'}`}>
                  {sealData.burnPending ? 'Pending' : 'None'}
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
            </div>

          </div>
        )}

        {/* Trust Tree — shown for root seal holders with tier > 1 (can link children) */}
        {sealData?.verified && sealData.tier > 1 && (
          <div className="border border-gold/20 bg-tyrian-darker mt-6 overflow-hidden">

            {/* Header */}
            <div className="bg-tyrian-dark border-b border-gold/25 px-5 py-4 sm:px-8 sm:py-5 flex items-center justify-between">
              <div>
                <p className="font-cinzel text-marble-muted text-xs tracking-widest uppercase mb-1">Trust Tree</p>
                <p className="font-cinzel text-gold tracking-wide">Linked Wallets</p>
              </div>
              <p className="font-mono text-marble-muted text-xs">
                {treeChildren.length} / {sealData.tier - 1} slots
              </p>
            </div>

            {/* Children list */}
            {treeChildren.length > 0 && (
              <div className="divide-y divide-gold/10">
                {treeChildren.map(child => (
                  <div key={child} className="px-5 py-4 sm:px-8 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-cinzel text-marble-muted text-xs tracking-widest uppercase mb-1">
                        {TIERS[sealData.tier - 1]?.name} — Tier {TIERS[sealData.tier - 1]?.numeral}
                      </p>
                      <p className="font-mono text-marble text-xs">{formatAddress(child)}</p>
                    </div>
                    <button
                      onClick={() => handleUnlinkWallet(child)}
                      disabled={treeTxPending}
                      className="font-cinzel text-xs tracking-widest uppercase px-4 py-2 border border-red-800/50 text-red-400 hover:border-red-600 hover:text-red-300 transition-colors disabled:opacity-40 shrink-0"
                    >
                      {treeTxPending ? '…' : 'Unlink'}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Empty state */}
            {treeChildren.length === 0 && (
              <p className="font-cormorant text-marble-muted italic text-center py-8 px-5 text-xl">
                No wallets linked yet.
              </p>
            )}

            {/* Link form — only shown when slots are available */}
            {treeChildren.length < sealData.tier - 1 && (
              <div className="border-t border-gold/15 px-5 py-5 sm:px-8">
                <p className="font-cinzel text-marble-muted text-xs tracking-widest uppercase mb-3">
                  Link a {TIERS[sealData.tier - 1]?.name} Wallet
                </p>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={linkAddress}
                    onChange={e => setLinkAddress(e.target.value)}
                    placeholder="0x..."
                    disabled={treeTxPending}
                    className="flex-1 font-mono text-xs bg-tyrian-dark border border-gold/20 text-marble px-4 py-3 focus:outline-none focus:border-gold/50 placeholder:text-marble-muted/40 disabled:opacity-50"
                  />
                  <button
                    onClick={handleLinkWallet}
                    disabled={!linkAddress || treeTxPending}
                    className="font-cinzel text-xs tracking-widest uppercase px-5 py-3 bg-gold text-tyrian-deep hover:bg-gold-dim transition-colors disabled:opacity-40 shrink-0"
                  >
                    {treeTxPending ? 'Pending…' : 'Link'}
                  </button>
                </div>
                {treeError && (
                  <p className="font-cormorant text-red-400 italic text-sm mt-3">{treeError}</p>
                )}
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}
