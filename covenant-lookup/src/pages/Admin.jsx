import { useState, useEffect } from 'react';
import { getPendingSubmissions, approveKYC, mintSeal, getReadyToMint } from '../utils/api';
import { TIERS } from '../utils/constants';

export function Admin() {
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' or 'approved'
  const [pending, setPending] = useState([]);
  const [readyToMint, setReadyToMint] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pendingData, mintData] = await Promise.all([
        getPendingSubmissions(),
        getReadyToMint()
      ]);
      setPending(pendingData.submissions || []);
      setReadyToMint(mintData.submissions || []);
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
      
      // Refresh data
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
      // First approve to get signature
      const approval = await approveKYC(submission.id);
      
      // Then mint
      const result = await mintSeal({
        submissionId: submission.id,
        walletAddress: submission.wallet_address,
        tier: submission.tier_requested,
        signature: approval.signature
      });

      setSuccess(`Seal #${result.sealId} minted! Tx: ${result.transactionHash}`);
      
      // Refresh data
      await fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessing(null);
    }
  };

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin Panel</h1>
          <p className="text-gray-600">Manage KYC submissions and mint verification seals</p>
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

                  <button
                    onClick={() => handleApprove(submission)}
                    disabled={processing === submission.id}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    {processing === submission.id ? 'Processing...' : 'Approve & Generate Signature'}
                  </button>
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
              readyToMint.map((submission) => (
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

                  <button
                    onClick={() => handleMint(submission)}
                    disabled={processing === submission.id}
                    className="w-full bg-covenant-purple hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    {processing === submission.id ? 'Minting on Sepolia...' : '⛓️ Mint Seal on Blockchain'}
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
