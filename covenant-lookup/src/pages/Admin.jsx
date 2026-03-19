import { useState, useEffect } from 'react';
import { getPendingSubmissions, approveKYC, mintSeal, getReadyToMint, rejectKYC, attestPolygon, checkPolygonStatus } from '../utils/api';
import { TIERS } from '../utils/constants';

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
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // CHANGE THIS PASSWORD!
  const ADMIN_PASSWORD = 'covenant-demo-2026';

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setAuthenticated(true);
      setAuthError(false);
      localStorage.setItem('admin-auth', 'true');
    } else {
      setAuthError(true);
    }
  };

  useEffect(() => {
    if (localStorage.getItem('admin-auth') === 'true') {
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
      const [pendingData, mintData] = await Promise.all([
        getPendingSubmissions(),
        getReadyToMint()
      ]);
      setPending(pendingData.submissions || []);
      setReadyToMint(mintData.submissions || []);

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
      const result = await mintSeal({
        submissionId: submission.id,
        walletAddress: submission.wallet_address,
        tier: submission.tier_requested,
        signature: approval.signature
      });
      setSuccess(`Seal #${result.sealId} minted! Tx: ${result.transactionHash}`);
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

  const handleLogout = () => {
    setAuthenticated(false);
    localStorage.removeItem('admin-auth');
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

          <p className="font-cormorant text-marble-muted/40 italic text-sm text-center mt-6">
            Demo: covenant-demo-2026
          </p>
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
        <div className="flex justify-between items-start mb-10">
          <div>
            <h1 className="font-cinzel text-marble text-4xl tracking-wide mb-2">Admin Panel</h1>
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
          <div className="flex gap-0">
            <button
              onClick={() => setActiveTab('pending')}
              className={`font-cinzel text-xs tracking-widest uppercase px-6 py-3 border-b-2 transition-colors ${
                activeTab === 'pending'
                  ? 'border-gold text-gold'
                  : 'border-transparent text-marble-muted hover:text-marble'
              }`}
            >
              Pending ({pending.length})
            </button>
            <button
              onClick={() => setActiveTab('approved')}
              className={`font-cinzel text-xs tracking-widest uppercase px-6 py-3 border-b-2 transition-colors ${
                activeTab === 'approved'
                  ? 'border-gold text-gold'
                  : 'border-transparent text-marble-muted hover:text-marble'
              }`}
            >
              Ready to Mint ({readyToMint.length})
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
                      <h3 className="font-cinzel text-marble text-base tracking-wide">{submission.full_name}</h3>
                      <p className="font-cormorant text-marble-muted italic text-base mt-0.5">{submission.email}</p>
                      <p className="font-mono text-marble-muted/60 text-xs mt-1">{submission.wallet_address}</p>
                    </div>
                    <span className={`border font-cinzel text-xs tracking-widest uppercase px-3 py-1 ${tierBadgeClass[TIERS[submission.tier_requested].color]}`}>
                      Tier {submission.tier_requested} — {TIERS[submission.tier_requested].name}
                    </span>
                  </div>

                  {/* Card Body */}
                  <div className="px-6 py-4">
                    <div className="grid grid-cols-2 gap-4 mb-5">
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

                      <div className="flex gap-2">
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

                return (
                  <div key={submission.id} className="border border-gold/20 bg-tyrian-darker overflow-hidden">

                    {/* Card Header */}
                    <div className="bg-tyrian-dark border-b border-gold/15 px-6 py-4 flex justify-between items-start">
                      <div>
                        <h3 className="font-cinzel text-marble text-base tracking-wide">{submission.full_name}</h3>
                        <p className="font-cormorant text-marble-muted italic text-base mt-0.5">{submission.email}</p>
                        <p className="font-mono text-marble-muted/60 text-xs mt-1">{submission.wallet_address}</p>
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

                      <div className="flex gap-2 pt-1">
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
                    </div>

                  </div>
                );
              })
            )}
          </div>
        )}

      </div>
    </div>
  );
}
