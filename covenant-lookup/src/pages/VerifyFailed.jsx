import { Link, useSearchParams } from 'react-router-dom';

export function VerifyFailed() {
  const [searchParams] = useSearchParams();
  const reason = searchParams.get('reason');

  const messages = {
    invalid: 'This verification link is invalid or has already been used.',
    expired: 'This verification link has expired. Please submit a new application.',
    error: 'An error occurred during verification. Please try again.'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-5xl">❌</span>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          Verification Failed
        </h2>
        <p className="text-gray-600 mb-6">
          {messages[reason] || 'Verification could not be completed.'}
        </p>
        <div className="flex flex-col gap-3">
          <Link
            to="/get-verified"
            className="inline-block bg-covenant-purple text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition"
          >
            Apply Again
          </Link>
          <Link
            to="/"
            className="inline-block text-covenant-purple px-6 py-3 rounded-lg font-semibold hover:underline transition"
          >
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}
