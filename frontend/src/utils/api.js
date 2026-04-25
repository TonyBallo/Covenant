// Backend base URL. Falls back to Railway production if VITE_API_URL is not set.
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://covenant-production-4cf7.up.railway.app';

// Set by Admin.jsx on successful login. Never stored in the bundle.
let _adminSecret = '';
export function setAdminSecret(secret) { _adminSecret = secret; }

// Sent as a header on every admin request. Verified server-side against ADMIN_SECRET.
// Falls back to sessionStorage so Vite HMR module reloads don't silently clear the secret.
const ADMIN_HEADERS = () => ({
  'Content-Type': 'application/json',
  'x-admin-secret': _adminSecret || sessionStorage.getItem('admin-secret') || '',
});
/**
 * Submit KYC application
 */
export async function submitKYC(data) {
  const response = await fetch(`${API_BASE_URL}/api/kyc/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to submit KYC');
  }
  
  return response.json();
}

/**
 * Check cross-chain status for an address
 */
export async function getCrossChainStatus(address) {
  const response = await fetch(`${API_BASE_URL}/api/kyc/cross-chain-status/${address}`);
  
  if (!response.ok) {
    throw new Error('Failed to check cross-chain status');
  }
  
  return response.json();
}

/**
 * Check KYC status for an address
 */
export async function checkKYCStatus(address) {
  const response = await fetch(`${API_BASE_URL}/api/kyc/status/${address}`);
  
  if (!response.ok) {
    throw new Error('Failed to check status');
  }
  
  return response.json();
}

/**
 * Get pending KYC submissions (admin only)
 */
export async function getPendingSubmissions() {
  const response = await fetch(`${API_BASE_URL}/api/admin/pending`, { headers: ADMIN_HEADERS() });
  
  if (!response.ok) {
    throw new Error('Failed to get pending submissions');
  }
  
  return response.json();
}

/**
 * Approve KYC submission (admin only)
 */
export async function approveKYC(submissionId) {
  const response = await fetch(`${API_BASE_URL}/api/admin/approve/${submissionId}`, {
    method: 'POST',
    headers: ADMIN_HEADERS(),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to approve KYC');
  }
  
  return response.json();
}

/**
 * Mint seal on-chain (admin only)
 */
export async function mintSeal(data) {
  const response = await fetch(`${API_BASE_URL}/api/admin/mint`, {
    method: 'POST',
    headers: ADMIN_HEADERS(),
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to mint seal');
  }
  
  return response.json();
}

/**
 * Reject a KYC submission (admin only)
 */
export async function rejectKYC(submissionId, reason) {
  const response = await fetch(`${API_BASE_URL}/api/admin/reject/${submissionId}`, {
    method: 'POST',
    headers: ADMIN_HEADERS(),
    body: JSON.stringify({ reason })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to reject submission');
  }

  return response.json();
}

/**
 * Attest seal on Polygon (admin only)
 */
export async function attestPolygon(submissionId) {
  const response = await fetch(`${API_BASE_URL}/api/admin/attest/${submissionId}`, {
    method: 'POST',
    headers: ADMIN_HEADERS(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to attest on Polygon');
  }

  return response.json();
}

/**
 * Check Polygon attestation status (admin only)
 */
export async function checkPolygonStatus(address) {
  const response = await fetch(`${API_BASE_URL}/api/admin/polygon-status/${address}`, { headers: ADMIN_HEADERS() });
  
  if (!response.ok) {
    throw new Error('Failed to check Polygon status');
  }
  
  return response.json();
}

/**
 * Look up a seal by wallet address (admin only)
 */
export async function lookupSeal(address) {
  const response = await fetch(`${API_BASE_URL}/api/admin/seal/${address}`, { headers: ADMIN_HEADERS() });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to look up seal');
  }

  return response.json();
}

/**
 * Revoke a minted seal (admin only)
 */
export async function revokeSeal({ sealId, walletAddress, reason }) {
  const response = await fetch(`${API_BASE_URL}/api/admin/revoke`, {
    method: 'POST',
    headers: ADMIN_HEADERS(),
    body: JSON.stringify({ sealId, walletAddress, reason })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to revoke seal');
  }

  return response.json();
}

/**
 * Get all revoked submissions (admin only)
 */
export async function getRevokedSeals() {
  const response = await fetch(`${API_BASE_URL}/api/admin/revoked`, { headers: ADMIN_HEADERS() });

  if (!response.ok) {
    throw new Error('Failed to get revoked seals');
  }

  return response.json();
}

/**
 * Get all seals with a pending burn request (admin only)
 */
export async function getPendingBurns() {
  const response = await fetch(`${API_BASE_URL}/api/admin/pending-burns`, { headers: ADMIN_HEADERS() });

  if (!response.ok) {
    throw new Error('Failed to get pending burns');
  }

  return response.json();
}

/**
 * Get ready-to-mint submissions (admin only)
 */
export async function getReadyToMint() {
  const response = await fetch(`${API_BASE_URL}/api/admin/ready-to-mint`, { headers: ADMIN_HEADERS() });
  
  if (!response.ok) {
    throw new Error('Failed to get ready-to-mint');
  }
  
  return response.json();
}
