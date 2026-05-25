import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { submitKYC, sendOTP, verifyOTP } from '../utils/api';
import { TIERS } from '../utils/constants';
import { isValidEmailFormat, isEmailDomainAllowed } from '../utils/emailValidation';

export function ApplyForm({ walletAddress, walletConnected }) {
  const location = useLocation();
  const isUpgrade = location.state?.isUpgrade === true;
  const currentTier = location.state?.currentTier ?? 0;
  const tierRequested = location.state?.tierRequested ?? 1;

  const [formData, setFormData] = useState({
    walletAddress: walletAddress || '',
    fullName: '',
    email: '',
    phone: '',
    tierRequested,
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [emailError, setEmailError] = useState(null);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [phoneToken, setPhoneToken] = useState(null);
  const [phoneError, setPhoneError] = useState(null);

  useEffect(() => {
    setFormData(prev => ({ ...prev, walletAddress: walletAddress || '' }));
  }, [walletAddress]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValidEmailFormat(formData.email)) {
      setEmailError('Please enter a valid email address.');
      return;
    }
    if (!isEmailDomainAllowed(formData.email)) {
      setEmailError('Please use a personal, institutional (.edu/.gov), or business email. Disposable addresses are not accepted.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await submitKYC({ ...formData, phoneVerificationToken: phoneToken });
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (e.target.name === 'email') setEmailError(null);
    if (e.target.name === 'phone') {
      setOtpSent(false);
      setOtpVerified(false);
      setPhoneToken(null);
      setOtpCode('');
      setPhoneError(null);
    }
  };

  const handleEmailBlur = () => {
    if (!formData.email) return;
    if (!isValidEmailFormat(formData.email)) {
      setEmailError('Please enter a valid email address.');
    } else if (!isEmailDomainAllowed(formData.email)) {
      setEmailError('Please use a personal, institutional (.edu/.gov), or business email. Disposable addresses are not accepted.');
    } else {
      setEmailError(null);
    }
  };

  const handleSendOTP = async () => {
    setOtpLoading(true);
    setPhoneError(null);
    try {
      await sendOTP(formData.phone);
      setOtpSent(true);
    } catch (err) {
      setPhoneError(err.message);
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    setOtpLoading(true);
    setPhoneError(null);
    try {
      const { phoneVerificationToken } = await verifyOTP(formData.phone, otpCode);
      setPhoneToken(phoneVerificationToken);
      setOtpVerified(true);
    } catch (err) {
      setPhoneError(err.message);
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setOtpSent(false);
    setOtpCode('');
    setPhoneError(null);
    setOtpLoading(true);
    try {
      await sendOTP(formData.phone);
      setOtpSent(true);
    } catch (err) {
      setPhoneError(err.message);
    } finally {
      setOtpLoading(false);
    }
  };

  const requestedTierInfo = TIERS[tierRequested];
  const currentTierInfo = TIERS[currentTier];

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 py-16">
        <div className="max-w-md w-full border border-gold/30 bg-tyrian-darker p-10 text-center">
          <div className="w-px h-10 bg-gradient-to-b from-transparent via-gold/50 to-transparent mx-auto mb-8"></div>
          <h2 className="font-cinzel text-marble text-2xl tracking-wide mb-4">Check Your Email</h2>
          <p className="font-cormorant text-marble-dim italic text-xl leading-relaxed mb-3">
            We've sent a verification link to your email address. Click it to confirm your {isUpgrade ? 'upgrade' : 'application'}.
          </p>
          <p className="font-cormorant text-marble-muted italic text-base mb-8">
            The link expires in 15 minutes. Check your spam folder if needed.
          </p>
          <Link
            to="/demo"
            className="font-cinzel text-xs tracking-widest uppercase text-gold/70 hover:text-gold transition-colors"
          >
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-16 px-6">
      <div className="max-w-xl mx-auto">

        <div className="relative text-center mb-10">
          <Link to="/demo/get-verified" state={isUpgrade ? { upgrade: true, currentTier } : undefined} className="absolute left-0 top-0 font-cinzel text-gold/60 hover:text-gold text-xs tracking-widest uppercase transition-colors">
            ← Back to Tiers
          </Link>

          {isUpgrade ? (
            <>
              <div className="flex items-center justify-center gap-3 mb-5">
                <div className="inline-flex items-center gap-2 border border-gold/20 text-marble-muted bg-tyrian-dark px-4 py-1.5 font-cinzel text-xs tracking-widest uppercase">
                  Tier {currentTier} — {currentTierInfo?.name}
                </div>
                <span className="font-cinzel text-gold/60 text-xs">→</span>
                <div className="inline-flex items-center gap-2 border border-gold/40 text-gold bg-gold/10 px-4 py-1.5 font-cinzel text-xs tracking-widest uppercase">
                  Tier {tierRequested} — {requestedTierInfo?.name}
                </div>
              </div>
              <h1 className="font-cinzel text-marble text-3xl tracking-wide mb-3">Apply for Tier Upgrade</h1>
              <p className="font-cormorant text-marble-muted italic text-lg">
                Your existing seal will be upgraded upon approval. Submit your information to begin.
              </p>
            </>
          ) : (
            <>
              <div className="inline-flex items-center gap-2 border border-gold/40 text-gold bg-gold/10 px-5 py-1.5 font-cinzel text-xs tracking-widest uppercase mb-5">
                Tier {tierRequested} — {requestedTierInfo?.name} Verification
              </div>
              <h1 className="font-cinzel text-marble text-3xl tracking-wide mb-3">Apply for Verification</h1>
              <p className="font-cormorant text-marble-muted italic text-lg">
                Basic email verification. Review typically takes 1–2 business days.
              </p>
            </>
          )}
        </div>

        <div className="border border-gold/20 bg-tyrian-darker p-8">
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Wallet */}
            <div>
              <label className="font-cinzel text-marble-muted text-xs tracking-widest uppercase block mb-2">
                Wallet Address *
              </label>
              {walletConnected ? (
                <div className="border border-green-900/60 bg-green-950/20 px-4 py-3">
                  <p className="font-cinzel text-green-400 text-xs tracking-widest uppercase mb-1">Connected</p>
                  <p className="font-mono text-marble-dim text-sm">
                    {walletAddress.slice(0, 6)}…{walletAddress.slice(-4)}
                  </p>
                </div>
              ) : (
                <div className="border border-gold/30 bg-gold/5 px-4 py-3">
                  <p className="font-cormorant text-gold italic text-base">
                    Please connect your wallet using the navigation menu.
                  </p>
                </div>
              )}
              <p className="font-cormorant text-marble-muted/60 italic text-sm mt-1">
                The address that holds your existing seal.
              </p>
            </div>

            {/* Full Name */}
            <div>
              <label className="font-cinzel text-marble-muted text-xs tracking-widest uppercase block mb-2">
                Full Name *
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="John Smith"
                required
                className="w-full px-4 py-3 bg-tyrian-dark border border-gold/30 text-marble placeholder-marble-muted/50 focus:outline-none focus:border-gold/70 font-cormorant text-lg transition-colors"
              />
            </div>

            {/* Email */}
            <div>
              <label className="font-cinzel text-marble-muted text-xs tracking-widest uppercase block mb-2">
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleEmailBlur}
                placeholder="john@example.com"
                required
                className={`w-full px-4 py-3 bg-tyrian-dark border text-marble placeholder-marble-muted/50 focus:outline-none font-cormorant text-lg transition-colors ${emailError ? 'border-red-700/70 focus:border-red-600' : 'border-gold/30 focus:border-gold/70'}`}
              />
              {emailError && (
                <p className="font-cormorant text-red-400 italic text-sm mt-1">{emailError}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="font-cinzel text-marble-muted text-xs tracking-widest uppercase block mb-2">
                Phone Number *
              </label>
              {otpVerified ? (
                <div className="border border-green-900/60 bg-green-950/20 px-4 py-3 flex items-center gap-3">
                  <span className="text-green-400 text-sm">✓</span>
                  <div>
                    <p className="font-cinzel text-green-400 text-xs tracking-widest uppercase">Verified</p>
                    <p className="font-mono text-marble-dim text-sm">{formData.phone}</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex gap-0">
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+1 (555) 000-0000"
                      disabled={otpSent || loading}
                      className="flex-1 px-4 py-3 bg-tyrian-dark border border-gold/30 text-marble placeholder-marble-muted/50 focus:outline-none focus:border-gold/70 font-cormorant text-lg transition-colors disabled:opacity-60"
                    />
                    <button
                      type="button"
                      onClick={handleSendOTP}
                      disabled={otpLoading || !formData.phone || otpSent}
                      className="font-cinzel text-xs tracking-widest uppercase px-5 py-3 border border-gold/30 text-gold bg-gold/5 hover:bg-gold/15 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      {otpLoading && !otpSent ? 'Sending…' : otpSent ? 'Sent' : 'Send Code'}
                    </button>
                  </div>
                  {otpSent && (
                    <div className="mt-3">
                      <div className="flex gap-0">
                        <input
                          type="text"
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value)}
                          placeholder="6-digit code"
                          maxLength={6}
                          className="flex-1 px-4 py-3 bg-tyrian-dark border border-gold/30 text-marble placeholder-marble-muted/50 focus:outline-none focus:border-gold/70 font-mono text-lg tracking-widest transition-colors"
                        />
                        <button
                          type="button"
                          onClick={handleVerifyOTP}
                          disabled={otpLoading || otpCode.length < 6}
                          className="font-cinzel text-xs tracking-widest uppercase px-5 py-3 border border-gold/30 text-gold bg-gold/5 hover:bg-gold/15 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          {otpLoading ? 'Verifying…' : 'Verify'}
                        </button>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        {phoneError && (
                          <p className="font-cormorant text-red-400 italic text-sm">{phoneError}</p>
                        )}
                        <button
                          type="button"
                          onClick={handleResendOTP}
                          disabled={otpLoading}
                          className="font-cormorant text-gold/50 italic text-sm hover:text-gold transition-colors ml-auto"
                        >
                          Resend code
                        </button>
                      </div>
                    </div>
                  )}
                  {phoneError && !otpSent && (
                    <p className="font-cormorant text-red-400 italic text-sm mt-1">{phoneError}</p>
                  )}
                </>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="border-l-4 border-red-800 bg-red-950/30 px-5 py-3">
                <p className="font-cinzel text-red-400 text-xs tracking-widest uppercase mb-1">Error</p>
                <p className="font-cormorant text-red-300 italic text-base">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !walletConnected || !!emailError || !otpVerified}
              className="w-full font-cinzel text-xs tracking-widest uppercase py-4 bg-gold text-tyrian-deep font-semibold hover:bg-gold-dim disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Submitting…' : isUpgrade ? 'Submit Upgrade Request' : 'Submit Application'}
            </button>

            {!walletConnected && (
              <p className="font-cormorant text-marble-muted/60 italic text-sm text-center">
                Connect your wallet to enable submission.
              </p>
            )}

          </form>

          <p className="font-cormorant text-marble-muted/50 italic text-sm text-center mt-6">
            * Required. Your information is encrypted and stored securely off-chain.
          </p>
        </div>
      </div>
    </div>
  );
}
