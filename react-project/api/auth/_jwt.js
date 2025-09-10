// api/auth/_jwt.js
import jwt from 'jsonwebtoken';

export const COOKIE_NAME = 'vendor_session';

export function signVendorJWT(vendor, maxAgeSeconds = 60 * 60 * 24 * 7) {
  const payload = { sub: vendor.id, email: vendor.email, role: 'vendor' };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: maxAgeSeconds });
}

export function verifyVendorJWT(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

export function makeSessionCookie(token, req) {
  const host = (req.headers.host || '').toLowerCase();
  const isLocal = host.includes('localhost');
  const parts = [
    `${COOKIE_NAME}=${encodeURIComponent(token)}`,
    'Path=/',
    `Max-Age=${60 * 60 * 24 * 7}`,
    'HttpOnly',
  ];
  if (isLocal) {
    parts.push('SameSite=Lax');            // local dev
  } else {
    parts.push('Secure');                  // required for cross-subdomain
    parts.push('SameSite=None');           // required for cross-subdomain
    parts.push('Domain=.getyovonow.com');  // share cookie with vendor.getyovonow.com
  }
  return parts.join('; ');
}

export function clearSessionCookie(req) {
  const host = (req.headers.host || '').toLowerCase();
  const isLocal = host.includes('localhost');
  const parts = [
    `${COOKIE_NAME}=`,
    'Path=/',
    'Max-Age=0',
    'HttpOnly',
  ];
  if (isLocal) parts.push('SameSite=Lax');
  else { parts.push('Secure'); parts.push('SameSite=None'); parts.push('Domain=.getyovonow.com'); }
  return parts.join('; ');
}