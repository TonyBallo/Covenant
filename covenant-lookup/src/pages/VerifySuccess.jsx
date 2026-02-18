import { Link } from 'react-router-dom';

export function VerifySuccess() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
          <span className="text-5xl">✅</span>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          Email Verified!
        </h2>
        <p className="text-gray-600 mb-6">
          Your application has been submitted and is now under review.
          This typically takes 1-2 business days.
        </p>
        <div className="flex flex-col gap-3">
          <Link
            to="/status"
            className="inline-block bg-covenant-purple text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition"
          >
            Check Application Status
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
