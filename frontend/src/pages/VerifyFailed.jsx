import { Link, useSearchParams } from 'react-router-dom';

export function VerifyFailed() {
  const [searchParams] = useSearchParams();
  const reason = searchParams.get('reason');

  const messages = {
    invalid: 'This verification link is invalid or has already been used.',
    expired: 'This verification link has expired. Please submit a new application.',
    error:   'An error occurred during verification. Please try again.',
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-16">
      <div className="max-w-md w-full border border-red-900/40 bg-tyrian-darker p-10 text-center">

        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="h-px w-10 bg-gradient-to-r from-transparent to-red-900/50"></div>
          <div className="w-1.5 h-1.5 bg-red-700 rotate-45"></div>
          <div className="h-px w-10 bg-gradient-to-l from-transparent to-red-900/50"></div>
        </div>

        <h2 className="font-cinzel text-marble text-2xl tracking-wide mb-4">
          Verification Failed
        </h2>
        <p className="font-cormorant text-marble-dim italic text-xl leading-relaxed mb-10">
          {messages[reason] || 'Verification could not be completed.'}
        </p>

        <div className="flex flex-col gap-3">
          <Link
            to="/demo/get-verified"
            className="font-cinzel text-xs tracking-widest uppercase px-6 py-3 bg-gold text-tyrian-deep hover:bg-gold-dim transition-colors"
          >
            Apply Again
          </Link>
          <Link
            to="/demo"
            className="font-cinzel text-xs tracking-widest uppercase px-6 py-3 border border-gold/30 text-gold/70 hover:border-gold/60 hover:text-gold transition-colors"
          >
            Return Home
          </Link>
        </div>

      </div>
    </div>
  );
}
