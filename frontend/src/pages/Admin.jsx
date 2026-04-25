import { useState, useEffect } from 'react';
import { getPendingSubmissions, approveKYC, mintSeal, getReadyToMint, rejectKYC, attestPolygon, checkPolygonStatus, revokeSeal, getRevokedSeals, lookupSeal, setAdminSecret, getPendingBurns, upgradeSealTier } from '../utils/api';
import { TIERS, formatBurnCountdown, JURISDICTIONS, formatJurisdiction, formatDate } from '../utils/constants';

export function Admin() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState(false);

  const [activeTab, setActiveTab] = useState('pending');
  const [pending, setPending] = useState([]);
  const [readyToMint, setReadyToMint] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [rejectionReasons, setRejectionReasons] = useState({});
  const [rejecting, setRejecting] = useState(null);
  const [polygonStatuses, setPolygonStatuses] = useState({});
  const [attesting, setAttesting] = useState(null);
  const [expiryDates, setExpiryDates] = useState({});
  const [jurisdictionCodes, setJurisdictionCodes] = useState({});
  const [revoked, setRevoked] = useState([]);
  const [pendingBurns, setPendingBurns] = useState([]);
  const [revoking, setRevoking] = useState(null);
  const [lookupAddress, setLookupAddress] = useState('');
  const [lookupResult, setLookupResult] = useState(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState(null);
  const [upgradeAddress, setUpgradeAddress] = useState('');
  const [upgradeSeal, setUpgradeSeal] = useState(null);
  const [upgradeLookupLoading, setUpgradeLookupLoading] = useState(false);
  const [upgradeLookupError, setUpgradeLookupError] = useState(null);
  const [selectedTier, setSelectedTier] = useState(null);
  const [upgrading, setUpgrading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError(false);
    try {
      setAdminSecret(password);
      await getPendingSubmissions(); // validates the secret against the backend
      setAuthenticated(true);
      sessionStorage.setItem('admin-secret', password);
    } catch {
      setAdminSecret('');
      setAuthError(true);
    }
  };

  useEffect(() => {
    const stored = sessionStorage.getItem('admin-secret');
    if (stored) {
      setAdminSecret(stored);
      setPassword(stored);
      setAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (authenticated) {
      fetchData();
    }
  }, [authenticated]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pendingData, mintData, revokedData, burnsData] = await Promise.all([
        getPendingSubmissions(),
        getReadyToMint(),
        getRevokedSeals().catch(() => ({ submissions: [] })),
        getPendingBurns().catch(() => ({ seals: [] })),
      ]);
      setPending(pendingData.submissions || []);
      setReadyToMint(mintData.submissions || []);
      setRevoked(revokedData.submissions || []);
      setPendingBurns(burnsData.seals || []);

      const statuses = {};
      for (const submission of mintData.submissions || []) {
        try {
          const status = await checkPolygonStatus(submission.wallet_address);
          statuses[submission.wallet_address] = status;
        } catch  {
          statuses[submission.wallet_address] = { hasAttestation: false };
        }
      }
      setPolygonStatuses(statuses);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (submission) => {
    setProcessing(submission.id);
    setError(null);
    setSuccess(null);
    try {
      const result = await approveKYC(submission.id);
      setSuccess(`Approved! Signature: ${result.signature.slice(0, 20)}...`);
      await fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessing(null);
    }
  };

  const handleMint = async (submission) => {
    setProcessing(submission.id);
    setError(null);
    setSuccess(null);
    try {
      const approval = await approveKYC(submission.id);
      const dateStr = expiryDates[submission.id];
      const expiresAt = dateStr ? Math.floor(new Date(dateStr).getTime() / 1000) : null;
      const jurisdictionCode = Number(jurisdictionCodes[submission.id] ?? 0);
      const result = await mintSeal({
        submissionId: submission.id,
        walletAddress: submission.wallet_address,
        tier: submission.tier_requested,
        signature: approval.signature,
        jurisdictionCode,
        ...(expiresAt !== null && { expiresAt }),
      });
      setSuccess(`Seal #${result.sealId} minted! Tx: ${result.transactionHash}`);
      await fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessing(null);
    }
  };

  const handleExecuteUpgrade = async (submission) => {
    setProcessing(submission.id);
    setError(null);
    setSuccess(null);
    try {
      const result = await upgradeSealTier({
        sealId: submission.currentSealId,
        newTier: submission.tier_requested,
        submissionId: submission.id,
      });
      setSuccess(`Seal #${result.sealId} upgraded to Tier ${result.newTier}! Tx: ${result.transactionHash}`);
      await fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (submission) => {
    const reason = rejectionReasons[submission.id];
    if (!reason || reason.trim() === '') {
      setError('Please enter a rejection reason');
      return;
    }
    setRejecting(submission.id);
    setError(null);
    setSuccess(null);
    try {
      await rejectKYC(submission.id, reason);
      setSuccess(`Submission from ${submission.full_name} rejected`);
      await fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setRejecting(null);
    }
  };

  const handleLookup = async (e) => {
    e.preventDefault();
    if (!lookupAddress.trim()) return;
    setLookupLoading(true);
    setLookupResult(null);
    setLookupError(null);
    try {
      const result = await lookupSeal(lookupAddress.trim());
      setLookupResult(result);
    } catch (err) {
      setLookupError(err.message);
    } finally {
      setLookupLoading(false);
    }
  };

  const handleRevoke = async (submission) => {
    setRevoking(submission.id);
    setError(null);
    setSuccess(null);
    try {
      await revokeSeal({
        sealId: submission.sealId,
        walletAddress: submission.wallet_address,
        reason: 'Revoked by admin'
      });
      setSuccess(`Seal #${submission.sealId} revoked for ${submission.wallet_address}`);
      // Refresh lookup result if this revoke came from the lookup tab
      if (lookupResult?.found) {
        setLookupResult({ ...lookupResult, revoked: true });
      }
      await fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setRevoking(null);
    }
  };

  const handleAttest = async (submission) => {
    setAttesting(submission.id);
    setError(null);
    setSuccess(null);
    try {
      const result = await attestPolygon(submission.id);
      setSuccess(`Attested on Polygon! Tx: ${result.polygonTxHash.slice(0, 10)}...`);
      await fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setAttesting(null);
    }
  };

  const handleUpgradeLookup = async (e) => {
    e.preventDefault();
    if (!upgradeAddress.trim()) return;
    setUpgradeLookupLoading(true);
    setUpgradeSeal(null);
    setUpgradeLookupError(null);
    setSelectedTier(null);
    try {
      const result = await lookupSeal(upgradeAddress.trim());
      if (!result.found) {
        setUpgradeLookupError('No seal found for this address.');
      } else if (result.revoked) {
        setUpgradeLookupError('This seal has been revoked and cannot be upgraded.');
      } else {
        setUpgradeSeal(result);
        setSelectedTier(result.tier + 1 <= 5 ? result.tier + 1 : null);
      }
    } catch (err) {
      setUpgradeLookupError(err.message);
    } finally {
      setUpgradeLookupLoading(false);
    }
  };

  const handleUpgrade = async () => {
    if (!upgradeSeal || !selectedTier) return;
    setUpgrading(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await upgradeSealTier({ sealId: upgradeSeal.sealId, newTier: selectedTier });
      setSuccess(`Seal #${result.sealId} upgraded to Tier ${result.newTier} — ${TIERS[result.newTier]?.name}. Tx: ${result.transactionHash}`);
      setUpgradeSeal(null);
      setUpgradeAddress('');
      setSelectedTier(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setUpgrading(false);
    }
  };

  const handleLogout = () => {
    setAuthenticated(false);
    setPassword('');
    setAdminSecret('');
    sessionStorage.removeItem('admin-secret');
  };

  const tierBadgeClass = {
    orange: 'border-gold/40 text-gold bg-gold/10',
    gray:   'border-marble-muted/20 text-marble-muted bg-tyrian-dark',
    yellow: 'border-gold/40 text-gold bg-gold/10',
    blue:   'border-blue-900/30 text-blue-400 bg-tyrian-dark',
    purple: 'border-purple-900/30 text-purple-400 bg-tyrian-dark',
  };

  // Login Screen
  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 py-16">
        <div className="max-w-md w-full border border-gold/30 bg-tyrian-darker p-10">

          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="h-px w-10 bg-gradient-to-r from-transparent to-gold/40"></div>
            <div className="w-1.5 h-1.5 bg-gold rotate-45"></div>
            <div className="h-px w-10 bg-gradient-to-l from-transparent to-gold/40"></div>
          </div>

          <div className="text-center mb-8">
            <h2 className="font-cinzel text-marble text-2xl tracking-wide mb-2">Admin Panel</h2>
            <p className="font-cormorant text-marble-muted italic text-lg">Enter password to continue</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoFocus
              className="w-full px-4 py-3 bg-tyrian-dark border border-gold/30 text-marble placeholder-marble-muted/50 focus:outline-none focus:border-gold/70 font-cormorant text-lg transition-colors"
            />

            {authError && (
              <div className="border-l-4 border-red-800 bg-red-950/30 px-4 py-3">
                <p className="font-cinzel text-red-400 text-xs tracking-widest uppercase">Invalid password</p>
              </div>
            )}

            <button
              type="submit"
              className="w-full font-cinzel text-xs tracking-widest uppercase py-4 bg-gold text-tyrian-deep font-semibold hover:bg-gold-dim transition-colors"
            >
              Enter
            </button>
          </form>

        </div>
      </div>
    );
  }

  // Loading Screen
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border border-gold/50 border-t-gold rounded-full animate-spin mx-auto mb-4"></div>
          <p className="font-cormorant text-marble-muted italic text-lg">Loading admin panel…</p>
        </div>
      </div>
    );
  }

  // Admin Panel
  return (
    <div className="min-h-screen py-16 px-6">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex justify-between items-start mb-8 sm:mb-10">
          <div>
            <h1 className="font-cinzel text-marble text-3xl sm:text-4xl tracking-wide mb-2">Admin Panel</h1>
            <p className="font-cormorant text-marble-muted italic text-lg">
              Manage KYC submissions and mint verification seals
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="font-cinzel text-xs tracking-widest uppercase text-gold/60 hover:text-gold border border-gold/20 hover:border-gold/50 px-4 py-2 transition-colors"
          >
            Logout
          </button>
        </div>

        {/* Notifications */}
        {error && (
          <div className="border-l-4 border-red-800 bg-red-950/30 px-6 py-4 mb-6">
            <p className="font-cinzel text-red-400 text-xs tracking-widest uppercase mb-1">Error</p>
            <p className="font-cormorant text-red-300 italic text-lg">{error}</p>
          </div>
        )}

        {success && (
          <div className="border-l-4 border-gold/60 bg-gold/5 px-6 py-4 mb-6">
            <p className="font-cinzel text-gold text-xs tracking-widest uppercase mb-1">Success</p>
            <p className="font-cormorant text-marble-dim italic text-lg">{success}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 border-b border-gold/15">
          <div className="flex gap-0 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveTab('pending')}
              className={`font-cinzel text-xs tracking-widest uppercase px-4 sm:px-6 py-3 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'pending'
                  ? 'border-gold text-gold'
                  : 'border-transparent text-marble-muted hover:text-marble'
              }`}
            >
              Pending ({pending.length})
            </button>
            <button
              onClick={() => setActiveTab('approved')}
              className={`font-cinzel text-xs tracking-widest uppercase px-4 sm:px-6 py-3 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'approved'
                  ? 'border-gold text-gold'
                  : 'border-transparent text-marble-muted hover:text-marble'
              }`}
            >
              Ready to Mint ({readyToMint.length})
            </button>
            <button
              onClick={() => setActiveTab('upgrade')}
              className={`font-cinzel text-xs tracking-widest uppercase px-4 sm:px-6 py-3 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'upgrade'
                  ? 'border-gold text-gold'
                  : 'border-transparent text-marble-muted hover:text-marble'
              }`}
            >
              Upgrade Tier
            </button>
            <button
              onClick={() => setActiveTab('pending-burns')}
              className={`font-cinzel text-xs tracking-widest uppercase px-4 sm:px-6 py-3 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'pending-burns'
                  ? 'border-amber-600 text-amber-400'
                  : 'border-transparent text-marble-muted hover:text-marble'
              }`}
            >
              Seals Burning {pendingBurns.length > 0 && `(${pendingBurns.length})`}
            </button>
            <button
              onClick={() => setActiveTab('revoke-lookup')}
              className={`font-cinzel text-xs tracking-widest uppercase px-4 sm:px-6 py-3 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'revoke-lookup'
                  ? 'border-red-700 text-red-400'
                  : 'border-transparent text-marble-muted hover:text-marble'
              }`}
            >
              Revoke Seal
            </button>
            <button
              onClick={() => setActiveTab('revoked')}
              className={`font-cinzel text-xs tracking-widest uppercase px-4 sm:px-6 py-3 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'revoked'
                  ? 'border-red-700 text-red-400'
                  : 'border-transparent text-marble-muted hover:text-marble'
              }`}
            >
              Revoked Seals ({revoked.length})
            </button>
          </div>
        </div>

        {/* Pending Submissions */}
        {activeTab === 'pending' && (
          <div className="space-y-4">
            {pending.length === 0 ? (
              <div className="border border-gold/20 bg-tyrian-darker p-10 text-center">
                <div className="w-px h-8 bg-gradient-to-b from-transparent via-gold/30 to-transparent mx-auto mb-4"></div>
                <p className="font-cormorant text-marble-muted italic text-xl">No pending submissions</p>
              </div>
            ) : (
              pending.map((submission) => (
                <div key={submission.id} className="border border-gold/20 bg-tyrian-darker overflow-hidden">

                  {/* Card Header */}
                  <div className="bg-tyrian-dark border-b border-gold/15 px-6 py-4 flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-cinzel text-marble text-base tracking-wide">{submission.full_name}</h3>
                        {submission.isUpgradeRequest && (
                          <span className="font-cinzel text-xs tracking-widest uppercase px-2 py-0.5 border border-blue-700/50 text-blue-300 bg-blue-950/30">
                            Upgrade
                          </span>
                        )}
                      </div>
                      <p className="font-cormorant text-marble-muted italic text-base mt-0.5">{submission.email}</p>
                      <p className="font-mono text-marble-muted/60 text-xs mt-1">{submission.wallet_address}</p>
                      {submission.isUpgradeRequest && submission.currentTier > 0 && (
                        <p className="font-cinzel text-marble-muted/60 text-xs tracking-widest mt-1">
                          Tier {submission.currentTier} → Tier {submission.tier_requested}
                        </p>
                      )}
                    </div>
                    <span className={`border font-cinzel text-xs tracking-widest uppercase px-3 py-1 ${tierBadgeClass[TIERS[submission.tier_requested].color]}`}>
                      Tier {submission.tier_requested} — {TIERS[submission.tier_requested].name}
                    </span>
                  </div>

                  {/* Card Body */}
                  <div className="px-6 py-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-5">
                      <div>
                        <p className="font-cinzel text-marble-muted text-xs tracking-widest uppercase mb-1">Phone</p>
                        <p className="font-cormorant text-marble text-base">{submission.phone || '—'}</p>
                      </div>
                      <div>
                        <p className="font-cinzel text-marble-muted text-xs tracking-widest uppercase mb-1">Submitted</p>
                        <p className="font-cormorant text-marble text-base">
                          {new Date(submission.submitted_at).toLocaleDateString('en-US', {
                            year: 'numeric', month: 'long', day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3">
                      <button
                        onClick={() => handleApprove(submission)}
                        disabled={processing === submission.id || rejecting === submission.id}
                        className="w-full font-cinzel text-xs tracking-widest uppercase py-3 bg-gold text-tyrian-deep hover:bg-gold-dim disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        {processing === submission.id ? 'Processing…' : 'Approve & Generate Signature'}
                      </button>

                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          placeholder="Rejection reason…"
                          value={rejectionReasons[submission.id] || ''}
                          onChange={(e) => setRejectionReasons({
                            ...rejectionReasons,
                            [submission.id]: e.target.value
                          })}
                          className="flex-1 px-4 py-2 bg-tyrian-dark border border-red-900/40 text-marble placeholder-marble-muted/40 focus:outline-none focus:border-red-700/60 font-cormorant text-base transition-colors"
                        />
                        <button
                          onClick={() => handleReject(submission)}
                          disabled={processing === submission.id || rejecting === submission.id}
                          className="font-cinzel text-xs tracking-widest uppercase py-2 px-5 border border-red-900/60 text-red-400 hover:bg-red-950/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          {rejecting === submission.id ? 'Rejecting…' : 'Reject'}
                        </button>
                      </div>
                    </div>
                  </div>

                </div>
              ))
            )}
          </div>
        )}

        {/* Ready to Mint */}
        {activeTab === 'approved' && (
          <div className="space-y-4">
            {readyToMint.length === 0 ? (
              <div className="border border-gold/20 bg-tyrian-darker p-10 text-center">
                <div className="w-px h-8 bg-gradient-to-b from-transparent via-gold/30 to-transparent mx-auto mb-4"></div>
                <p className="font-cormorant text-marble-muted italic text-xl">No submissions ready to mint</p>
                <p className="font-cormorant text-marble-muted/60 italic text-base mt-1">Approve pending submissions first</p>
              </div>
            ) : (
              readyToMint.map((submission) => {
                const hasPolygonAttestation = polygonStatuses[submission.wallet_address]?.hasAttestation || false;
                const isMinted = submission.isMinted || false;
                const isUpgradeRequest = submission.isUpgradeRequest || false;

                return (
                  <div key={submission.id} className="border border-gold/20 bg-tyrian-darker overflow-hidden">

                    {/* Card Header */}
                    <div className="bg-tyrian-dark border-b border-gold/15 px-6 py-4 flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <h3 className="font-cinzel text-marble text-base tracking-wide">{submission.full_name}</h3>
                          {isUpgradeRequest && (
                            <span className="font-cinzel text-xs tracking-widest uppercase px-2 py-0.5 border border-blue-700/50 text-blue-300 bg-blue-950/30">
                              Upgrade
                            </span>
                          )}
                        </div>
                        <p className="font-cormorant text-marble-muted italic text-base mt-0.5">{submission.email}</p>
                        <p className="font-mono text-marble-muted/60 text-xs mt-1">{submission.wallet_address}</p>
                        {isUpgradeRequest && submission.currentTier > 0 && (
                          <p className="font-cinzel text-marble-muted/60 text-xs tracking-widest mt-1">
                            Tier {submission.currentTier} → Tier {submission.tier_requested}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className={`border font-cinzel text-xs tracking-widest uppercase px-3 py-1 ${tierBadgeClass[TIERS[submission.tier_requested].color]}`}>
                          Tier {submission.tier_requested} — {TIERS[submission.tier_requested].name}
                        </span>
                        <p className="font-cinzel text-gold text-xs tracking-widest uppercase mt-2">Approved</p>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="px-6 py-4 flex flex-col gap-3">

                      {/* Expiry date + jurisdiction — only for new mints, not upgrades */}
                      {!isUpgradeRequest && !isMinted && (
                        <>
                          <div>
                            <p className="font-cinzel text-marble-muted text-xs tracking-widest uppercase mb-2">
                              Expiry Date <span className="normal-case text-marble-muted/50">(optional — leave blank for tier default)</span>
                            </p>
                            <input
                              type="date"
                              value={expiryDates[submission.id] || ''}
                              min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                              onChange={(e) => setExpiryDates({ ...expiryDates, [submission.id]: e.target.value })}
                              className="w-full px-4 py-2 bg-tyrian-dark border border-gold/20 text-marble focus:outline-none focus:border-gold/50 font-cormorant text-base transition-colors"
                            />
                          </div>
                          <div>
                            <p className="font-cinzel text-marble-muted text-xs tracking-widest uppercase mb-2">
                              Jurisdiction <span className="normal-case text-marble-muted/50">(defaults to Global)</span>
                            </p>
                            <select
                              value={jurisdictionCodes[submission.id] ?? 0}
                              onChange={(e) => setJurisdictionCodes({ ...jurisdictionCodes, [submission.id]: Number(e.target.value) })}
                              className="w-full px-4 py-2 bg-tyrian-dark border border-gold/20 text-marble focus:outline-none focus:border-gold/50 font-cormorant text-base transition-colors"
                            >
                              {Object.entries(JURISDICTIONS).map(([code, { label, flag }]) => (
                                <option key={code} value={code}>{flag} {label}</option>
                              ))}
                            </select>
                          </div>
                        </>
                      )}

                      {/* Primary action: Mint (new) or Execute Upgrade */}
                      {isUpgradeRequest ? (
                        <button
                          onClick={() => handleExecuteUpgrade(submission)}
                          disabled={isMinted || processing === submission.id || attesting === submission.id}
                          className={`w-full font-cinzel text-xs tracking-widest uppercase py-3 transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                            isMinted
                              ? 'border border-blue-700/30 text-blue-400/60 cursor-default'
                              : 'bg-blue-900/60 border border-blue-700/60 text-blue-200 hover:bg-blue-900/80'
                          }`}
                        >
                          {isMinted
                            ? 'Upgraded on Arbitrum'
                            : processing === submission.id
                              ? 'Upgrading…'
                              : 'Execute Upgrade on Arbitrum'}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleMint(submission)}
                          disabled={isMinted || processing === submission.id || attesting === submission.id || rejecting === submission.id}
                          className={`w-full font-cinzel text-xs tracking-widest uppercase py-3 transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                            isMinted
                              ? 'border border-gold/30 text-gold/60 cursor-default'
                              : 'bg-gold text-tyrian-deep hover:bg-gold-dim'
                          }`}
                        >
                          {isMinted
                            ? 'Minted on Arbitrum'
                            : processing === submission.id
                              ? 'Minting…'
                              : 'Mint Seal on Arbitrum'}
                        </button>
                      )}

                      {!hasPolygonAttestation && (
                        <button
                          onClick={() => handleAttest(submission)}
                          disabled={processing === submission.id || attesting === submission.id || rejecting === submission.id}
                          className="w-full font-cinzel text-xs tracking-widest uppercase py-3 border border-purple-900/40 text-purple-400 hover:bg-purple-950/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          {attesting === submission.id ? 'Attesting on Polygon…' : 'Attest to Polygon'}
                        </button>
                      )}

                      {hasPolygonAttestation && (
                        <div className="w-full border border-gold/15 bg-tyrian-dark font-cinzel text-xs tracking-widest uppercase py-3 text-center text-marble-muted">
                          Attested on Polygon
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row gap-2 pt-1">
                        <input
                          type="text"
                          placeholder="Rejection reason…"
                          value={rejectionReasons[submission.id] || ''}
                          onChange={(e) => setRejectionReasons({
                            ...rejectionReasons,
                            [submission.id]: e.target.value
                          })}
                          className="flex-1 px-4 py-2 bg-tyrian-dark border border-red-900/40 text-marble placeholder-marble-muted/40 focus:outline-none focus:border-red-700/60 font-cormorant text-base transition-colors"
                        />
                        <button
                          onClick={() => handleReject(submission)}
                          disabled={processing === submission.id || attesting === submission.id || rejecting === submission.id}
                          className="font-cinzel text-xs tracking-widest uppercase py-2 px-5 border border-red-900/60 text-red-400 hover:bg-red-950/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          {rejecting === submission.id ? 'Rejecting…' : 'Reject'}
                        </button>
                      </div>

                      {isMinted && (
                        <button
                          onClick={() => handleRevoke(submission)}
                          disabled={revoking === submission.id || processing === submission.id || attesting === submission.id}
                          className="w-full font-cinzel text-xs tracking-widest uppercase py-3 border border-red-800/50 text-red-400 hover:bg-red-950/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          {revoking === submission.id ? 'Revoking…' : 'Revoke Seal'}
                        </button>
                      )}
                    </div>

                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Upgrade Tier */}
        {activeTab === 'upgrade' && (
          <div className="space-y-4">

            {/* Address lookup */}
            <form onSubmit={handleUpgradeLookup} className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={upgradeAddress}
                onChange={(e) => { setUpgradeAddress(e.target.value); setUpgradeSeal(null); setUpgradeLookupError(null); setSelectedTier(null); }}
                placeholder="Wallet address (0x…)"
                className="flex-1 px-4 py-3 bg-tyrian-dark border border-gold/30 text-marble placeholder-marble-muted/50 focus:outline-none focus:border-gold/70 font-mono text-sm transition-colors"
              />
              <button
                type="submit"
                disabled={upgradeLookupLoading || !upgradeAddress.trim()}
                className="font-cinzel text-xs tracking-widest uppercase px-6 py-3 bg-gold text-tyrian-deep hover:bg-gold-dim disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {upgradeLookupLoading ? 'Looking up…' : 'Look Up'}
              </button>
            </form>

            {upgradeLookupError && (
              <div className="border-l-4 border-red-800 bg-red-950/30 px-6 py-4">
                <p className="font-cinzel text-red-400 text-xs tracking-widest uppercase mb-1">Error</p>
                <p className="font-cormorant text-red-300 italic text-lg">{upgradeLookupError}</p>
              </div>
            )}

            {upgradeSeal && (
              <div className="border border-gold/20 bg-tyrian-darker overflow-hidden">

                {/* Current seal */}
                <div className="bg-tyrian-dark border-b border-gold/15 px-6 py-4 flex justify-between items-start">
                  <div>
                    <p className="font-cinzel text-marble text-base tracking-wide">Seal #{upgradeSeal.sealId}</p>
                    <p className="font-mono text-marble-muted/60 text-xs mt-1">{upgradeAddress}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="font-cinzel text-marble-muted text-xs tracking-widest uppercase">Current Tier</p>
                    <span className={`block border font-cinzel text-xs tracking-widest uppercase px-3 py-1 ${tierBadgeClass[TIERS[upgradeSeal.tier]?.color] || ''}`}>
                      Tier {upgradeSeal.tier} — {TIERS[upgradeSeal.tier]?.name ?? '—'}
                    </span>
                  </div>
                </div>

                <div className="px-6 py-5 space-y-5">

                  {upgradeSeal.tier >= 5 ? (
                    <p className="font-cormorant text-marble-muted italic text-lg text-center">
                      This seal is already at the maximum tier (Diamond V).
                    </p>
                  ) : (
                    <>
                      {/* Tier picker */}
                      <div>
                        <p className="font-cinzel text-marble-muted text-xs tracking-widest uppercase mb-3">Select New Tier</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {[2, 3, 4, 5].filter(t => t > upgradeSeal.tier).map(t => (
                            <button
                              key={t}
                              onClick={() => setSelectedTier(t)}
                              className={`px-4 py-3 border font-cinzel text-xs tracking-widest uppercase transition-colors text-left ${
                                selectedTier === t
                                  ? `${tierBadgeClass[TIERS[t].color]} border-opacity-100`
                                  : 'border-gold/15 text-marble-muted hover:border-gold/40 hover:text-marble'
                              }`}
                            >
                              <span className="block text-lg font-bold mb-0.5">{TIERS[t].numeral}</span>
                              {TIERS[t].name}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Upgrade button */}
                      <button
                        onClick={handleUpgrade}
                        disabled={!selectedTier || upgrading}
                        className="w-full font-cinzel text-xs tracking-widest uppercase py-3 bg-gold text-tyrian-deep hover:bg-gold-dim disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        {upgrading
                          ? 'Upgrading…'
                          : selectedTier
                            ? `Upgrade to ${TIERS[selectedTier]?.name} (Tier ${selectedTier})`
                            : 'Select a tier above'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Seals Burning */}
        {activeTab === 'pending-burns' && (
          <div className="space-y-4">
            <div className="border border-amber-700/20 bg-amber-950/10 px-5 py-3 flex items-start gap-3">
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full flex-shrink-0 mt-1.5"></span>
              <p className="font-cormorant text-amber-300/70 italic text-sm leading-relaxed">
                These users have initiated seal deletion. The 90-day window gives time to reach out before their trust standing is permanently removed.
              </p>
            </div>

            {pendingBurns.length === 0 ? (
              <div className="border border-gold/20 bg-tyrian-darker p-10 text-center">
                <div className="w-px h-8 bg-gradient-to-b from-transparent via-gold/30 to-transparent mx-auto mb-4"></div>
                <p className="font-cormorant text-marble-muted italic text-xl">No seals currently burning</p>
              </div>
            ) : (
              pendingBurns.map((seal) => {
                const countdown = formatBurnCountdown(seal.burnExecutableAt);
                const elapsed = 90 - Math.ceil(seal.secondsRemaining / 86400);
                const progressPct = Math.min(100, Math.round((elapsed / 90) * 100));
                return (
                  <div key={seal.sealId} className="border border-amber-700/30 bg-tyrian-darker overflow-hidden">
                    <div className="bg-tyrian-dark border-b border-amber-700/15 px-6 py-4 flex justify-between items-start">
                      <div>
                        <p className="font-cinzel text-marble text-base tracking-wide">Seal #{seal.sealId}</p>
                        <p className="font-mono text-marble-muted/60 text-xs mt-1">{seal.walletAddress}</p>
                      </div>
                      <span className={`border font-cinzel text-xs tracking-widest uppercase px-3 py-1 ${tierBadgeClass[TIERS[seal.tier]?.color] || ''}`}>
                        Tier {seal.tier} — {TIERS[seal.tier]?.name ?? '—'}
                      </span>
                    </div>
                    <div className="px-6 py-4 space-y-4">
                      {/* Progress bar */}
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <p className="font-cinzel text-marble-muted text-xs tracking-widest uppercase">Burn Progress</p>
                          <p className="font-cinzel text-amber-400 text-xs tracking-widest">{countdown}</p>
                        </div>
                        <div className="h-1.5 bg-tyrian-dark border border-amber-700/20 overflow-hidden">
                          <div
                            className="h-full bg-amber-600/60 transition-all"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                        <p className="font-cormorant text-marble-muted/60 italic text-xs mt-1">{elapsed} of 90 days elapsed</p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Revoke Seal Lookup */}
        {activeTab === 'revoke-lookup' && (
          <div className="space-y-4">
            <form onSubmit={handleLookup} className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={lookupAddress}
                onChange={(e) => { setLookupAddress(e.target.value); setLookupResult(null); setLookupError(null); }}
                placeholder="Wallet address (0x…)"
                className="flex-1 px-4 py-3 bg-tyrian-dark border border-gold/30 text-marble placeholder-marble-muted/50 focus:outline-none focus:border-gold/70 font-mono text-sm transition-colors"
              />
              <button
                type="submit"
                disabled={lookupLoading || !lookupAddress.trim()}
                className="font-cinzel text-xs tracking-widest uppercase px-6 py-3 bg-gold text-tyrian-deep hover:bg-gold-dim disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {lookupLoading ? 'Looking up…' : 'Look Up'}
              </button>
            </form>

            {lookupError && (
              <div className="border-l-4 border-red-800 bg-red-950/30 px-6 py-4">
                <p className="font-cinzel text-red-400 text-xs tracking-widest uppercase mb-1">Error</p>
                <p className="font-cormorant text-red-300 italic text-lg">{lookupError}</p>
              </div>
            )}

            {lookupResult && !lookupResult.found && (
              <div className="border border-gold/20 bg-tyrian-darker p-8 text-center">
                <p className="font-cormorant text-marble-muted italic text-xl">No seal found for this address</p>
              </div>
            )}

            {lookupResult?.found && (
              <div className="border border-gold/20 bg-tyrian-darker overflow-hidden">
                <div className="bg-tyrian-dark border-b border-gold/15 px-6 py-4 flex justify-between items-start">
                  <div>
                    <p className="font-cinzel text-marble text-base tracking-wide">Seal #{lookupResult.sealId}</p>
                    <p className="font-mono text-marble-muted/60 text-xs mt-1">{lookupAddress}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <span className={`block border font-cinzel text-xs tracking-widest uppercase px-3 py-1 ${tierBadgeClass[TIERS[lookupResult.tier]?.color] || ''}`}>
                      Tier {lookupResult.tier} — {TIERS[lookupResult.tier]?.name ?? '—'}
                    </span>
                    {lookupResult.revoked && (
                      <span className="block border border-red-800/50 font-cinzel text-xs tracking-widest uppercase px-3 py-1 text-red-400 bg-red-950/30">
                        Already Revoked
                      </span>
                    )}
                  </div>
                </div>

                <div className="px-6 py-3 grid grid-cols-3 gap-4 border-b border-gold/10">
                  <div>
                    <p className="font-cinzel text-marble-muted text-xs tracking-widest uppercase mb-1">Issued</p>
                    <p className="font-cormorant text-marble text-sm">{lookupResult.issuedAt ? formatDate(lookupResult.issuedAt) : '—'}</p>
                  </div>
                  <div>
                    <p className="font-cinzel text-marble-muted text-xs tracking-widest uppercase mb-1">Expires</p>
                    <p className="font-cormorant text-marble text-sm">{lookupResult.expiresAt ? formatDate(lookupResult.expiresAt) : 'No expiry'}</p>
                  </div>
                  <div>
                    <p className="font-cinzel text-marble-muted text-xs tracking-widest uppercase mb-1">Jurisdiction</p>
                    <p className="font-cormorant text-marble text-sm">{(() => { const j = formatJurisdiction(lookupResult.jurisdictionCode ?? 0); return `${j.flag} ${j.label}`; })()}</p>
                  </div>
                </div>

                <div className="px-6 py-4">
                  {lookupResult.revoked ? (
                    <div className="w-full border border-gold/15 bg-tyrian-dark font-cinzel text-xs tracking-widest uppercase py-3 text-center text-marble-muted">
                      This seal has already been revoked
                    </div>
                  ) : (
                    <button
                      onClick={() => handleRevoke({ id: `lookup-${lookupResult.sealId}`, sealId: lookupResult.sealId, wallet_address: lookupAddress })}
                      disabled={revoking === `lookup-${lookupResult.sealId}`}
                      className="w-full font-cinzel text-xs tracking-widest uppercase py-3 border border-red-800/50 text-red-400 hover:bg-red-950/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      {revoking === `lookup-${lookupResult.sealId}` ? 'Revoking…' : 'Revoke Seal'}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Revoked Seals */}
        {activeTab === 'revoked' && (
          <div className="space-y-4">
            {revoked.length === 0 ? (
              <div className="border border-gold/20 bg-tyrian-darker p-10 text-center">
                <div className="w-px h-8 bg-gradient-to-b from-transparent via-gold/30 to-transparent mx-auto mb-4"></div>
                <p className="font-cormorant text-marble-muted italic text-xl">No revoked seals</p>
              </div>
            ) : (
              revoked.map((submission) => (
                <div key={submission.id} className="border border-red-900/30 bg-tyrian-darker overflow-hidden">

                  <div className="bg-tyrian-dark border-b border-red-900/20 px-6 py-4 flex justify-between items-start">
                    <div>
                      <h3 className="font-cinzel text-marble text-base tracking-wide">{submission.full_name}</h3>
                      <p className="font-mono text-marble-muted/60 text-xs mt-1">{submission.wallet_address}</p>
                    </div>
                    <span className="border border-red-800/50 font-cinzel text-xs tracking-widest uppercase px-3 py-1 text-red-400 bg-red-950/30">
                      Revoked
                    </span>
                  </div>

                  <div className="px-6 py-4 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    <div>
                      <p className="font-cinzel text-marble-muted text-xs tracking-widest uppercase mb-1">Seal ID</p>
                      <p className="font-cormorant text-marble text-base">#{submission.sealId ?? '—'}</p>
                    </div>
                    <div>
                      <p className="font-cinzel text-marble-muted text-xs tracking-widest uppercase mb-1">Tier</p>
                      <p className="font-cormorant text-marble text-base">
                        {TIERS[submission.sealTier ?? submission.tier_requested]
                          ? `Tier ${submission.sealTier ?? submission.tier_requested} — ${TIERS[submission.sealTier ?? submission.tier_requested].name}`
                          : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="font-cinzel text-marble-muted text-xs tracking-widest uppercase mb-1">Date Revoked</p>
                      <p className="font-cormorant text-marble text-base">
                        {submission.reviewed_at
                          ? new Date(submission.reviewed_at).toLocaleDateString('en-US', {
                              year: 'numeric', month: 'long', day: 'numeric'
                            })
                          : '—'}
                      </p>
                    </div>
                  </div>

                  {submission.revocationReason && (
                    <div className="px-6 pb-4 border-t border-red-900/20 pt-3">
                      <p className="font-cinzel text-marble-muted text-xs tracking-widest uppercase mb-1">Revocation Reason</p>
                      <p className="font-cormorant text-red-300/80 italic text-base">{submission.revocationReason}</p>
                    </div>
                  )}

                </div>
              ))
            )}
          </div>
        )}

      </div>
    </div>
  );
}
