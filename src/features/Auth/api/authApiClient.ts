import {
  getUsersDb,
  saveUsersDb,
  signJwt,
  verifyJwt,
  User
} from './mockAuthEngine';

// Module token storage for non-hook HTTP layer access
const tokenStorage = {
  accessToken: null as string | null,
  refreshToken: null as string | null,
  expiryTimes: {
    access: 60, // Access token lifetime in seconds (1 min for quick demo)
    refresh: 300 // Refresh token lifetime in seconds (5 mins for quick demo)
  }
};

export const setStoredApiTokens = (
  access: string | null,
  refresh: string | null
) => {
  tokenStorage.accessToken = access;
  tokenStorage.refreshToken = refresh;
};

export const setSimulationExpiryTimes = (
  accessSeconds: number,
  refreshSeconds: number
) => {
  tokenStorage.expiryTimes.access = accessSeconds;
  tokenStorage.expiryTimes.refresh = refreshSeconds;
};

// Token update subscription system
type TokenListener = (access: string | null, refresh: string | null) => void;
const tokenListeners = new Set<TokenListener>();

export const subscribeToTokenUpdates = (listener: TokenListener) => {
  tokenListeners.add(listener);
  return () => {
    tokenListeners.delete(listener);
  };
};

const notifyTokenListeners = (
  access: string | null,
  refresh: string | null
) => {
  tokenListeners.forEach(l => l(access, refresh));
};

// API Logger subscriber system
export interface ApiLog {
  id: string;
  timestamp: string;
  type: 'request' | 'response' | 'error' | 'system';
  method: string;
  url: string;
  status?: number;
  message: string;
  payload?: any;
}

type LogListener = (log: ApiLog) => void;
const listeners = new Set<LogListener>();

export const subscribeToApiLogs = (listener: LogListener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const addApiLog = (
  type: ApiLog['type'],
  method: string,
  url: string,
  message: string,
  status?: number,
  payload?: any
) => {
  const log: ApiLog = {
    id: Math.random().toString(36).substring(2, 9),
    timestamp: new Date().toLocaleTimeString(),
    type,
    method,
    url,
    status,
    message,
    payload
  };
  listeners.forEach(l => l(log));
  console.log(
    `[API CLIENT] ${log.timestamp} - [${type.toUpperCase()}] ${method} ${url}: ${message}`,
    payload || ''
  );
};

// API Simulation Latency
let mockLatencyMs = 600;
export const setMockLatency = (ms: number) => {
  mockLatencyMs = ms;
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Custom Fetch Wrapper simulating a full Axios/Fetch interceptor flow
 */
export async function apiRequest<T = any>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  path: string,
  body?: any
): Promise<T> {
  addApiLog('request', method, path, `Initiated request`, undefined, body);
  await delay(mockLatencyMs);

  try {
    const result = await executeMockRequest(method, path, body);
    addApiLog('response', method, path, `Success [200 OK]`, 200, result);
    return result;
  } catch (error: any) {
    const status = error.status || 500;
    const errorMsg = error.message || 'Unknown server error';

    addApiLog(
      'error',
      method,
      path,
      `Failed [${status}] - ${errorMsg}`,
      status
    );

    // INTERCEPTOR LOGIC: Handle 401 Unauthorized for expired access tokens
    if (status === 401 && errorMsg.includes('expired')) {
      if (tokenStorage.refreshToken) {
        addApiLog(
          'system',
          'POST',
          '/auth/refresh',
          'Access token expired. Executing silent token refresh flow...'
        );

        try {
          // Attempt silent refresh
          const refreshResponse = await apiRequest('POST', '/auth/refresh', {
            refreshToken: tokenStorage.refreshToken
          });

          // Save new tokens
          tokenStorage.accessToken = refreshResponse.accessToken;
          tokenStorage.refreshToken = refreshResponse.refreshToken;
          notifyTokenListeners(
            refreshResponse.accessToken,
            refreshResponse.refreshToken
          );

          addApiLog(
            'system',
            'POST',
            '/auth/refresh',
            'Silent refresh succeeded. Retrying original request...'
          );

          // Retry the original request
          const retriedResult = await executeMockRequest(method, path, body);
          addApiLog(
            'response',
            method,
            path,
            `Retried Success [200 OK]`,
            200,
            retriedResult
          );
          return retriedResult;
        } catch (refreshErr: any) {
          addApiLog(
            'system',
            'POST',
            '/auth/refresh',
            'Silent refresh failed. User session is invalid.'
          );
          // Reset tokens and rethrow auth failure to trigger logout
          tokenStorage.accessToken = null;
          tokenStorage.refreshToken = null;
          notifyTokenListeners(null, null);
          throw new Error('Session expired. Please log in again.');
        }
      }
    }

    throw error;
  }
}

/**
 * Local simulation of server endpoints
 */
async function executeMockRequest(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  path: string,
  body?: any
): Promise<any> {
  const db = getUsersDb();

  // Validate authorization header on protected routes
  const isPublicRoute = [
    '/auth/login',
    '/auth/register',
    '/auth/refresh'
  ].includes(path);
  let authedUser: User | null = null;

  if (!isPublicRoute) {
    const authHeader = tokenStorage.accessToken;
    if (!authHeader) {
      const err: any = new Error('Unauthorized: No access token provided');
      err.status = 401;
      throw err;
    }

    try {
      // verify JWT
      const decoded = verifyJwt(authHeader);
      // find user
      const user = Object.values(db).find(u => u.id === decoded.sub);
      if (!user) {
        const err: any = new Error('Unauthorized: User not found in database');
        err.status = 401;
        throw err;
      }
      authedUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
        role: user.role,
        createdAt: user.createdAt
      };
    } catch (e: any) {
      const err: any = new Error(`Unauthorized: ${e.message}`);
      err.status = 401;
      throw err;
    }
  }

  // Route Handlers
  if (path === '/auth/login' && method === 'POST') {
    const { email, password } = body || {};
    const userInDb = db[email];

    if (!userInDb || userInDb.passwordHash !== password) {
      const err: any = new Error('Invalid email or password');
      err.status = 400;
      throw err;
    }

    // Generate access & refresh tokens
    const userPayload = {
      sub: userInDb.id,
      email: userInDb.email,
      role: userInDb.role
    };
    const accessToken = signJwt(userPayload, tokenStorage.expiryTimes.access);
    const refreshToken = signJwt(
      { sub: userInDb.id, type: 'refresh' },
      tokenStorage.expiryTimes.refresh
    );

    return {
      user: {
        id: userInDb.id,
        name: userInDb.name,
        email: userInDb.email,
        bio: userInDb.bio,
        avatarUrl: userInDb.avatarUrl,
        role: userInDb.role,
        createdAt: userInDb.createdAt
      },
      accessToken,
      refreshToken
    };
  }

  if (path === '/auth/register' && method === 'POST') {
    const { name, email, password } = body || {};
    if (db[email]) {
      const err: any = new Error('Email is already registered');
      err.status = 400;
      throw err;
    }

    const newUser = {
      id: 'user_' + Date.now(),
      name,
      email,
      role: 'user' as const,
      bio: 'New user introducing themselves!',
      createdAt: new Date().toISOString(),
      passwordHash: password
    };

    db[email] = newUser;
    saveUsersDb(db);

    const userPayload = {
      sub: newUser.id,
      email: newUser.email,
      role: newUser.role
    };
    const accessToken = signJwt(userPayload, tokenStorage.expiryTimes.access);
    const refreshToken = signJwt(
      { sub: newUser.id, type: 'refresh' },
      tokenStorage.expiryTimes.refresh
    );

    return {
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        bio: newUser.bio,
        role: newUser.role,
        createdAt: newUser.createdAt
      },
      accessToken,
      refreshToken
    };
  }

  if (path === '/auth/refresh' && method === 'POST') {
    const { refreshToken } = body || {};
    if (!refreshToken) {
      const err: any = new Error('Refresh token is required');
      err.status = 400;
      throw err;
    }

    try {
      const decoded = verifyJwt(refreshToken);
      if (decoded.type !== 'refresh') {
        throw new Error('Not a valid refresh token');
      }

      // Find user
      const userInDb = Object.values(db).find(u => u.id === decoded.sub);
      if (!userInDb) {
        throw new Error('User not found');
      }

      // Generate new tokens (rotation)
      const userPayload = {
        sub: userInDb.id,
        email: userInDb.email,
        role: userInDb.role
      };
      const newAccessToken = signJwt(
        userPayload,
        tokenStorage.expiryTimes.access
      );
      const newRefreshToken = signJwt(
        { sub: userInDb.id, type: 'refresh' },
        tokenStorage.expiryTimes.refresh
      );

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      };
    } catch (e: any) {
      const err: any = new Error(`Invalid refresh token: ${e.message}`);
      err.status = 401;
      throw err;
    }
  }

  if (path === '/auth/me' && method === 'GET') {
    return { user: authedUser };
  }

  if (path === '/auth/update-profile' && method === 'PUT') {
    const { name, bio, avatarUrl } = body || {};
    if (!authedUser) {
      const err: any = new Error('Unauthorized');
      err.status = 401;
      throw err;
    }

    const userEmail = authedUser.email;
    if (!db[userEmail]) {
      const err: any = new Error('User not found');
      err.status = 400;
      throw err;
    }

    db[userEmail].name = name || db[userEmail].name;
    db[userEmail].bio = bio !== undefined ? bio : db[userEmail].bio;
    db[userEmail].avatarUrl =
      avatarUrl !== undefined ? avatarUrl : db[userEmail].avatarUrl;

    saveUsersDb(db);

    return {
      user: {
        id: db[userEmail].id,
        name: db[userEmail].name,
        email: db[userEmail].email,
        bio: db[userEmail].bio,
        avatarUrl: db[userEmail].avatarUrl,
        role: db[userEmail].role,
        createdAt: db[userEmail].createdAt
      }
    };
  }

  const err: any = new Error('Not Found');
  err.status = 404;
  throw err;
}
