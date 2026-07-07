// Custom base64url helpers for JWT spec compliance
const base64UrlEncode = (str: string): string => {
  const base64 = btoa(unescape(encodeURIComponent(str)));
  return base64.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
};

const base64UrlDecode = (str: string): string => {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return decodeURIComponent(escape(atob(base64)));
};

// Signature Key
const JWT_SECRET = 'antigravity-super-secure-jwt-secret-key-2026';

export interface User {
  id: string;
  name: string;
  email: string;
  bio?: string;
  avatarUrl?: string;
  role: 'admin' | 'user';
  createdAt: string;
}

interface UserDatabase {
  [email: string]: User & { passwordHash: string };
}

// Initial Mock DB Setup
const INITIAL_USERS: UserDatabase = {
  'demo@example.com': {
    id: 'user_1',
    name: 'Jane Doe',
    email: 'demo@example.com',
    bio: 'Senior Software Engineer & Frontend Enthusiast. Loving React 19!',
    role: 'user',
    createdAt: new Date().toISOString(),
    passwordHash: 'Password123!' // Simulating hash check (plain-text for demo ease)
  },
  'admin@example.com': {
    id: 'user_2',
    name: 'Alex Chief',
    email: 'admin@example.com',
    bio: 'System Administrator and Security Officer.',
    role: 'admin',
    createdAt: new Date().toISOString(),
    passwordHash: 'AdminSecure456!'
  }
};

// Get DB from local storage or initialize
export const getUsersDb = (): UserDatabase => {
  const db = localStorage.getItem('mock_jwt_user_db');
  if (!db) {
    localStorage.setItem('mock_jwt_user_db', JSON.stringify(INITIAL_USERS));
    return INITIAL_USERS;
  }
  try {
    return JSON.parse(db);
  } catch {
    return INITIAL_USERS;
  }
};

export const saveUsersDb = (db: UserDatabase) => {
  localStorage.setItem('mock_jwt_user_db', JSON.stringify(db));
};

/**
 * Signs and generates a real 3-part base64 encoded JWT structure.
 */
export const signJwt = (payload: object, expirySeconds: number): string => {
  const header = { alg: 'HS256', typ: 'JWT' };

  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + expirySeconds;

  const fullPayload = {
    ...payload,
    iat,
    exp
  };

  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const payloadB64 = base64UrlEncode(JSON.stringify(fullPayload));

  // Custom mock signature: btoa(header + "." + payload + "." + secret)
  const signature = base64UrlEncode(`${headerB64}.${payloadB64}.${JWT_SECRET}`);

  return `${headerB64}.${payloadB64}.${signature}`;
};

/**
 * Decodes and verifies a JWT token.
 * Throws errors on expired, altered, or invalid signatures.
 */
export const verifyJwt = (token: string): any => {
  if (!token) {
    throw new Error('Token is missing');
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid JWT structure. Must have 3 parts.');
  }

  const [headerB64, payloadB64, signature] = parts;

  // Verify signature
  const expectedSignature = base64UrlEncode(
    `${headerB64}.${payloadB64}.${JWT_SECRET}`
  );
  if (signature !== expectedSignature) {
    throw new Error('Invalid JWT Signature (Token has been tampered with!)');
  }

  // Parse payload
  let payload: any;
  try {
    payload = JSON.parse(base64UrlDecode(payloadB64));
  } catch {
    throw new Error('Failed to parse token payload');
  }

  // Check expiration
  const currentTime = Math.floor(Date.now() / 1000);
  if (payload.exp && currentTime > payload.exp) {
    const expiredError = new Error('Token has expired');
    expiredError.name = 'TokenExpiredError';
    throw expiredError;
  }

  return payload;
};

/**
 * Helper to decode a JWT without validating signature/expiration
 */
export const decodeJwt = <T = any>(token: string): T | null => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    return JSON.parse(base64UrlDecode(parts[1])) as T;
  } catch {
    return null;
  }
};
