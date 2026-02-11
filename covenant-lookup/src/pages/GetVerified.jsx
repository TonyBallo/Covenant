import { useState } from 'react';
import { submitKYC } from '../utils/api';
import { TIERS } from '../utils/constants';

export function GetVerified() {
  const [formData, setFormData] = useState({
    walletAddress: '',
    email: '',
    phone: '',
    fullName: '',
    tierRequested: 3
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await submitKYC(formData);
      setSuccess(true);
      console.log('KYC submitted:', result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

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
            Your KYC application has been received and is pending review. 
            You'll be notified once your verification is approved.
          </p>
          
          <a
            href="/"
            className="inline-block bg-covenant-purple text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition"
          >
            Return Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Get Verified
          </h1>
          <p className="text-gray-600">
            Submit your information to receive a Covenant verification seal
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <form onSubmit={handleSubmit}>
            {/* Wallet Address */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Wallet Address *
              </label>
              <input
                type="text"
                name="walletAddress"
                value={formData.walletAddress}
                onChange={handleChange}
                placeholder="0x..."
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-covenant-purple focus:border-transparent"
              />
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

            {/* Phone */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+1-555-0100"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-covenant-purple focus:border-transparent"
              />
            </div>

            {/* Tier Selection */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Verification Tier *
              </label>
              <select
                name="tierRequested"
                value={formData.tierRequested}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-covenant-purple focus:border-transparent"
              >
                {[1, 2, 3, 4, 5].map(tier => (
                  <option key={tier} value={tier}>
                    Tier {tier} - {TIERS[tier].name} - {TIERS[tier].description}
                  </option>
                ))}
              </select>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded">
                <p className="text-red-800 font-semibold">Error</p>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-covenant-purple hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? 'Submitting...' : 'Submit Application'}
            </button>
          </form>

          <p className="text-xs text-gray-500 mt-6 text-center">
            * Required fields. Your information is encrypted and stored securely.
          </p>
        </div>
      </div>
    </div>
  );
}
