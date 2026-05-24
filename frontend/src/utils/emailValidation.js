const PERSONAL_DOMAINS = new Set([
  'gmail.com', 'icloud.com', 'me.com', 'mac.com',
  'outlook.com', 'hotmail.com', 'live.com',
  'yahoo.com', 'proton.me', 'protonmail.com',
]);

const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com', 'guerrillamail.com', 'guerrillamail.info',
  'guerrillamail.net', 'guerrillamail.org', 'guerrillamail.de',
  'grr.la', 'sharklasers.com', 'guerrillamailblock.com',
  'tempmail.com', 'temp-mail.org', 'temp-mail.io',
  '10minutemail.com', '10minutemail.net', '10minutemail.org',
  'yopmail.com', 'yopmail.fr',
  'trashmail.com', 'trashmail.at', 'trashmail.io',
  'trashmail.me', 'trashmail.net', 'trashmail.org',
  'getairmail.com', 'fakeinbox.com', 'mailnull.com',
  'maildrop.cc', 'spamgourmet.com', 'dispostable.com',
  'spam4.me', 'throwam.com', 'mohmal.com',
  'mintemail.com', 'tempr.email', 'discard.email',
  'harakirimail.com', 'mailnesia.com', 'mytrashmail.com',
  'nwytg.com', 'mytemp.email', 'tempinbox.com',
  'mailtemp.net', 'getnada.com', 'filzmail.com',
  'zetmail.com', 'jetable.fr', 'spambox.us',
]);

export function isValidEmailFormat(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test((email || '').trim());
}

export function isEmailDomainAllowed(email) {
  const parts = (email || '').toLowerCase().trim().split('@');
  if (parts.length !== 2 || !parts[1]) return false;
  const domain = parts[1];

  if (PERSONAL_DOMAINS.has(domain)) return true;
  if (domain.endsWith('.edu') || domain.endsWith('.gov')) return true;
  if (DISPOSABLE_DOMAINS.has(domain)) return false;
  return true;
}
