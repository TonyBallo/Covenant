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
      localStorage.setItem('admin-auth', 'true'); // Remember login
    } else {
      setAuthError(true);
    }
  };

  // Check if already logged in
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
      
      // Load Polygon attestation statuses
      const statuses = {};
      for (const submission of mintData.submissions || []) {
        try {
          const status = await checkPolygonStatus(submission.wallet_address);
          statuses[submission.wallet_address] = status;
        } catch {
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

  // Login Screen
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-covenant-purple to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-2xl">🔒</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Admin Login</h2>
            <p className="text-gray-600 mt-2">Enter password to access admin panel</p>
          </div>
          
          <form onSubmit={handleLogin}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Admin Password"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-covenant-purple focus:border-transparent"
              autoFocus
            />
            
            {authError && (
              <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-3 rounded">
                <p className="text-red-800 text-sm font-semibold">Invalid password</p>
              </div>
            )}
            
            <button
              type="submit"
              className="w-full bg-covenant-purple hover:bg-purple-700 text-white py-3 rounded-lg font-semibold transition"
            >
              Login
            </button>
          </form>
          
          <p className="text-xs text-gray-500 mt-6 text-center">
            Demo password: covenant-demo-2026
          </p>
        </div>
      </div>
    );
  }

  // Loading Screen
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-16 h-16 border-4 border-covenant-purple border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  // Admin Panel (authenticated)
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header with Logout */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin Panel</h1>
            <p className="text-gray-600">Manage KYC submissions and mint verification seals</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-red-600 hover:text-red-700 font-semibold transition"
          >
            Logout
          </button>
        </div>

        {/* Notifications */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded">
            <p className="text-red-800 font-semibold">Error</p>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded">
            <p className="text-green-800 font-semibold">Success!</p>
            <p className="text-green-700 text-sm">{success}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 border-b">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-4 py-2 font-semibold border-b-2 transition ${
                activeTab === 'pending'
                  ? 'border-covenant-purple text-covenant-purple'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Pending ({pending.length})
            </button>
            <button
              onClick={() => setActiveTab('approved')}
              className={`px-4 py-2 font-semibold border-b-2 transition ${
                activeTab === 'approved'
                  ? 'border-covenant-purple text-covenant-purple'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
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
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <p className="text-gray-600">No pending submissions</p>
              </div>
            ) : (
              pending.map((submission) => (
                <div key={submission.id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{submission.full_name}</h3>
                      <p className="text-sm text-gray-600">{submission.email}</p>
                      <p className="text-xs text-gray-500 font-mono mt-1">{submission.wallet_address}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      TIERS[submission.tier_requested].color === 'yellow'
                        ? 'bg-yellow-100 text-yellow-800'
                        : `bg-${TIERS[submission.tier_requested].color}-100 text-${TIERS[submission.tier_requested].color}-800`
                    }`}>
                      Tier {submission.tier_requested} - {TIERS[submission.tier_requested].name}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                    <div>
                      <p className="text-gray-600">Phone</p>
                      <p className="font-semibold">{submission.phone || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Submitted</p>
                      <p className="font-semibold">
                        {new Date(submission.submitted_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <button
                      onClick={() => handleApprove(submission)}
                      disabled={processing === submission.id || rejecting === submission.id}
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      {processing === submission.id ? 'Processing...' : 'Approve & Generate Signature'}
                    </button>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Rejection reason..."
                        value={rejectionReasons[submission.id] || ''}
                        onChange={(e) => setRejectionReasons({
                          ...rejectionReasons,
                          [submission.id]: e.target.value
                        })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-400 focus:border-transparent"
                      />
                      <button
                        onClick={() => handleReject(submission)}
                        disabled={processing === submission.id || rejecting === submission.id}
                        className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition text-sm"
                      >
                        {rejecting === submission.id ? 'Rejecting...' : 'Reject'}
                      </button>
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
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <p className="text-gray-600">No submissions ready to mint</p>
                <p className="text-sm text-gray-500 mt-2">Approve pending submissions first</p>
              </div>
            ) : (
              readyToMint.map((submission) => {
                const hasPolygonAttestation = polygonStatuses[submission.wallet_address]?.hasAttestation || false;
                
                return (
                  <div key={submission.id} className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{submission.full_name}</h3>
                        <p className="text-sm text-gray-600">{submission.email}</p>
                        <p className="text-xs text-gray-500 font-mono mt-1">{submission.wallet_address}</p>
                      </div>
                      <div className="text-right">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          TIERS[submission.tier_requested].color === 'yellow'
                            ? 'bg-yellow-100 text-yellow-800'
                            : `bg-${TIERS[submission.tier_requested].color}-100 text-${TIERS[submission.tier_requested].color}-800`
                        }`}>
                          Tier {submission.tier_requested} - {TIERS[submission.tier_requested].name}
                        </span>
                        <p className="text-xs text-green-600 mt-2 font-semibold">✓ Approved</p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => handleMint(submission)}
                        disabled={processing === submission.id || attesting === submission.id}
                        className="w-full bg-covenant-purple hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
                      >
                        {processing === submission.id ? 'Minting on Sepolia...' : '⛓️ Mint Seal on Blockchain'}
                      </button>
                      
                      {!hasPolygonAttestation && (
                        <button
                          onClick={() => handleAttest(submission)}
                          disabled={processing === submission.id || attesting === submission.id}
                          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                          {attesting === submission.id ? 'Attesting on Polygon...' : '🟣 Attest to Polygon'}
                        </button>
                      )}
                      
                      {hasPolygonAttestation && (
                        <div className="w-full bg-green-50 border border-green-300 text-green-800 font-semibold py-3 px-4 rounded-lg text-center">
                          ✅ Attested on Polygon
                        </div>
                      )}
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