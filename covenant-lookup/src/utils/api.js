// Backend API configuration
const API_BASE_URL = 'https://covenant-production-4cf7.up.railway.app';
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
  const response = await fetch(`${API_BASE_URL}/api/admin/pending`);
  
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
    headers: { 'Content-Type': 'application/json' }
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
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to mint seal');
  }
  
  return response.json();
}

/**
 * Get ready-to-mint submissions (admin only)
 */
export async function getReadyToMint() {
  const response = await fetch(`${API_BASE_URL}/api/admin/ready-to-mint`);
  
  if (!response.ok) {
    throw new Error('Failed to get ready-to-mint');
  }
  
  return response.json();
}
