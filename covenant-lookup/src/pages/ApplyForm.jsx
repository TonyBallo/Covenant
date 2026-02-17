import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ethers } from 'ethers';
import { submitKYC } from '../utils/api';

export function ApplyForm() {
  const [formData, setFormData] = useState({
    walletAddress: '',
    fullName: '',
    email: '',
    tierRequested: 1  // Hardcoded - user never sees this
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [walletConnected, setWalletConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const handleConnectWallet = async () => {
    setConnecting(true);
    setError(null);

    try {
      if (!window.ethereum) {
        throw new Error('No wallet detected. Please install MetaMask.');
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);

      setFormData({ ...formData, walletAddress: accounts[0] });
      setWalletConnected(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setConnecting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await submitKYC(formData);
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Success screen
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">✅</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Application Submitted!
          </h2>
          <p className="text-gray-600 mb-6">
            Your Tier I application has been received and is pending review.
            You'll be notified once your verification is approved.
          </p>
          <Link
            to="/"
            className="inline-block bg-covenant-purple text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition"
          >
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/get-verified" className="text-sm text-covenant-purple hover:underline mb-4 inline-block">
            ← Back to Tier Selection
          </Link>
          <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-800 px-4 py-1 rounded-full text-sm font-semibold mb-4">
            <span>Tier I — Bronze Verification</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Apply for Verification</h1>
          <p className="text-gray-600">
            Basic email verification. Review typically takes 1-2 business days.
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <form onSubmit={handleSubmit}>

            {/* Wallet Connection */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Wallet Address *
              </label>

              {!walletConnected ? (
                <button
                  type="button"
                  onClick={handleConnectWallet}
                  disabled={connecting}
                  className="w-full px-4 py-3 border-2 border-dashed border-covenant-purple text-covenant-purple font-semibold rounded-lg hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {connecting ? 'Connecting...' : '🔗 Connect Wallet'}
                </button>
              ) : (
                <div className="w-full px-4 py-3 bg-green-50 border border-green-300 rounded-lg flex items-center justify-between">
                  <div>
                    <p className="text-xs text-green-600 font-semibold">Connected</p>
                    <p className="text-sm font-mono text-gray-800">
                      {formData.walletAddress.slice(0, 6)}...{formData.walletAddress.slice(-4)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setWalletConnected(false);
                      setFormData({ ...formData, walletAddress: '' });
                    }}
                    className="text-xs text-gray-500 hover:text-red-500 transition"
                  >
                    Disconnect
                  </button>
                </div>
              )}

              <p className="text-xs text-gray-500 mt-1">
                The Ethereum address that will receive the verification seal
              </p>
            </div>

            {/* Full Name */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="John Smith"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-covenant-purple focus:border-transparent"
              />
            </div>

            {/* Email */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="john@example.com"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-covenant-purple focus:border-transparent"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded">
                <p className="text-red-800 font-semibold">Error</p>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !walletConnected}
              className="w-full bg-covenant-purple hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? 'Submitting...' : 'Submit Application'}
            </button>

            {!walletConnected && (
              <p className="text-xs text-center text-gray-500 mt-3">
                Connect your wallet to enable submission
              </p>
            )}

          </form>

          <p className="text-xs text-gray-500 mt-6 text-center">
            * Required fields. Your information is encrypted and stored securely.
          </p>
        </div>
      </div>
    </div>
  );
}
