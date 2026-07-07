import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { decodeJwt, signJwt } from '../api/mockAuthEngine';
import { setStoredApiTokens, setMockLatency } from '../api/authApiClient';
import { useSecureStorage } from '@/shared/hooks/useStorage';
import {
  Terminal,
  Activity,
  Trash2,
  Clock,
  ShieldAlert,
  RotateCw,
  Gauge,
  Database,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export const JwtDebugger: React.FC = () => {
  const {
    accessToken,
    refreshToken,
    apiLogs,
    clearLogs,
    simulationTimes,
    setSimulationTimes,
    refreshSession,
    isAuthenticated
  } = useAuth();

  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'tokens' | 'logs' | 'settings'>(
    'tokens'
  );
  const [latency, setLatency] = useState(600);
  const [accessCountdown, setAccessCountdown] = useState<number | null>(null);
  const [refreshCountdown, setRefreshCountdown] = useState<number | null>(null);

  // Load set setters for forcing token states directly in storage
  const [, setSecAccessToken] = useSecureStorage('auth_access_token', '');
  const [, setSecRefreshToken] = useSecureStorage('auth_refresh_token', '');

  // Keep track of countdowns
  useEffect(() => {
    const interval = setInterval(() => {
      const getSecondsLeft = (token: string | null) => {
        if (!token) return null;
        const decoded = decodeJwt(token);
        if (!decoded?.exp) return null;
        const diff = decoded.exp - Math.floor(Date.now() / 1000);
        return diff > 0 ? diff : 0;
      };

      setAccessCountdown(getSecondsLeft(accessToken));
      setRefreshCountdown(getSecondsLeft(refreshToken));
    }, 1000);

    return () => clearInterval(interval);
  }, [accessToken, refreshToken]);

  // Adjust api client latency when state changes
  useEffect(() => {
    setMockLatency(latency);
  }, [latency]);

  const forceExpireAccessToken = async () => {
    if (!accessToken) return;
    const decoded = decodeJwt(accessToken);
    if (!decoded) return;

    // Create an expired payload
    const expiredToken = signJwt(
      { sub: decoded.sub, email: decoded.email, role: decoded.role },
      -10 // Expired 10 seconds ago
    );

    // Save in API client and secure storage
    setStoredApiTokens(expiredToken, refreshToken);
    await setSecAccessToken(expiredToken);

    // Force countdown recalculation
    setAccessCountdown(0);
  };

  const forceExpireRefreshToken = async () => {
    if (!refreshToken) return;
    const decoded = decodeJwt(refreshToken);
    if (!decoded) return;

    const expiredToken = signJwt(
      { sub: decoded.sub, type: 'refresh' },
      -10 // Expired 10 seconds ago
    );

    // Save in API client and secure storage
    setStoredApiTokens(accessToken, expiredToken);
    await setSecRefreshToken(expiredToken);

    setRefreshCountdown(0);
  };

  // Decode tokens for detail displays
  const decodedAccess = accessToken ? decodeJwt(accessToken) : null;
  const decodedRefresh = refreshToken ? decodeJwt(refreshToken) : null;

  return (
    <div className="fixed bottom-4 right-4 z-40 w-96 rounded-xl border border-border-primary bg-background-card/90 shadow-2xl backdrop-blur-md overflow-hidden text-sm">
      {/* Header */}
      <div
        className="flex items-center justify-between bg-background-secondary px-4 py-3 cursor-pointer select-none border-b border-border-primary"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center space-x-2">
          <Terminal className="h-4 w-4 text-accent-primary animate-pulse" />
          <span className="font-semibold tracking-wide text-text-primary">
            JWT Interceptor Console
          </span>
          {isAuthenticated && (
            <span className="inline-flex h-2 w-2 rounded-full bg-accent-success" />
          )}
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-text-tertiary">v1.0.0</span>
          {isOpen ? (
            <ChevronDown className="h-4 w-4 text-text-secondary" />
          ) : (
            <ChevronUp className="h-4 w-4 text-text-secondary" />
          )}
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: '420px', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="flex flex-col h-[420px] bg-background-card"
          >
            {/* Tabs */}
            <div className="flex border-b border-border-primary bg-background-secondary/50 text-xs font-medium">
              <button
                onClick={() => setActiveTab('tokens')}
                className={`flex-1 py-2 px-3 text-center border-b-2 transition-all ${
                  activeTab === 'tokens'
                    ? 'border-accent-primary text-accent-primary bg-background-primary/40 font-semibold'
                    : 'border-transparent text-text-secondary hover:text-text-primary hover:bg-background-hover/30'
                }`}
              >
                JWT Inspector
              </button>
              <button
                onClick={() => setActiveTab('logs')}
                className={`flex-1 py-2 px-3 text-center border-b-2 transition-all relative ${
                  activeTab === 'logs'
                    ? 'border-accent-primary text-accent-primary bg-background-primary/40 font-semibold'
                    : 'border-transparent text-text-secondary hover:text-text-primary hover:bg-background-hover/30'
                }`}
              >
                Network Terminal
                {apiLogs.length > 0 && (
                  <span className="ml-1 px-1 rounded bg-accent-primary text-text-inverse text-[9px]">
                    {apiLogs.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`flex-1 py-2 px-3 text-center border-b-2 transition-all ${
                  activeTab === 'settings'
                    ? 'border-accent-primary text-accent-primary bg-background-primary/40 font-semibold'
                    : 'border-transparent text-text-secondary hover:text-text-primary hover:bg-background-hover/30'
                }`}
              >
                Simulator Options
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              {/* Tab 1: Tokens */}
              {activeTab === 'tokens' && (
                <div className="space-y-4">
                  {/* Access Token */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between font-medium">
                      <span className="flex items-center text-text-primary">
                        <Clock className="mr-1.5 h-3.5 w-3.5 text-accent-info" />
                        Access Token (JWT)
                      </span>
                      {accessCountdown !== null && (
                        <span
                          className={`text-xs px-2 py-0.5 rounded font-mono ${
                            accessCountdown === 0
                              ? 'bg-state-error-bg text-accent-error'
                              : accessCountdown < 15
                                ? 'bg-state-warning-bg text-accent-warning animate-pulse'
                                : 'bg-state-success-bg text-accent-success'
                          }`}
                        >
                          {accessCountdown === 0
                            ? 'Expired'
                            : `Expires: ${accessCountdown}s`}
                        </span>
                      )}
                    </div>
                    {accessToken ? (
                      <div className="space-y-1">
                        <div className="p-2 rounded bg-background-secondary border border-border-primary font-mono text-[10px] break-all max-h-16 overflow-y-auto">
                          <span className="text-accent-error font-semibold">
                            {accessToken.split('.')[0]}
                          </span>
                          .
                          <span className="text-accent-warning font-semibold">
                            {accessToken.split('.')[1]}
                          </span>
                          .
                          <span className="text-accent-info">
                            {accessToken.split('.')[2]}
                          </span>
                        </div>
                        {decodedAccess && (
                          <div className="p-2 rounded bg-background-secondary/60 text-xs border border-border-secondary space-y-1 font-mono">
                            <div>
                              sub (User ID):{' '}
                              <span className="text-text-primary font-semibold">
                                {decodedAccess.sub}
                              </span>
                            </div>
                            <div>
                              email:{' '}
                              <span className="text-text-primary">
                                {decodedAccess.email}
                              </span>
                            </div>
                            <div>
                              role:{' '}
                              <span className="text-accent-warning">
                                {decodedAccess.role}
                              </span>
                            </div>
                            <div>
                              exp:{' '}
                              <span className="text-text-tertiary">
                                {new Date(
                                  decodedAccess.exp * 1000
                                ).toLocaleTimeString()}
                              </span>
                            </div>
                          </div>
                        )}
                        <button
                          onClick={forceExpireAccessToken}
                          disabled={accessCountdown === 0}
                          className="w-full mt-1.5 flex items-center justify-center space-x-1.5 py-1 px-2 text-xs border border-accent-error bg-state-error-bg text-accent-error hover:bg-accent-error hover:text-text-inverse rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ShieldAlert className="h-3.5 w-3.5" />
                          <span>Simulate Expired Access Token</span>
                        </button>
                      </div>
                    ) : (
                      <div className="p-3 text-center text-text-tertiary bg-background-secondary/40 rounded border border-dashed border-border-primary font-mono text-xs">
                        No Access Token (Logged Out)
                      </div>
                    )}
                  </div>

                  {/* Refresh Token */}
                  <div className="space-y-2 border-t border-border-muted pt-3">
                    <div className="flex items-center justify-between font-medium">
                      <span className="flex items-center text-text-primary">
                        <RotateCw className="mr-1.5 h-3.5 w-3.5 text-accent-success" />
                        Refresh Token
                      </span>
                      {refreshCountdown !== null && (
                        <span
                          className={`text-xs px-2 py-0.5 rounded font-mono ${
                            refreshCountdown === 0
                              ? 'bg-state-error-bg text-accent-error'
                              : 'bg-state-success-bg text-accent-success'
                          }`}
                        >
                          {refreshCountdown === 0
                            ? 'Expired'
                            : `Expires: ${refreshCountdown}s`}
                        </span>
                      )}
                    </div>
                    {refreshToken ? (
                      <div className="space-y-1">
                        <div className="p-2 rounded bg-background-secondary border border-border-primary font-mono text-[10px] break-all max-h-12 overflow-y-auto">
                          <span className="text-text-secondary">
                            {refreshToken}
                          </span>
                        </div>
                        {decodedRefresh && (
                          <div className="p-2 rounded bg-background-secondary/60 text-xs border border-border-secondary space-y-1 font-mono">
                            <div>
                              sub (User ID):{' '}
                              <span className="text-text-primary">
                                {decodedRefresh.sub}
                              </span>
                            </div>
                            <div>
                              type:{' '}
                              <span className="text-accent-success">
                                {decodedRefresh.type}
                              </span>
                            </div>
                            <div>
                              exp:{' '}
                              <span className="text-text-tertiary">
                                {new Date(
                                  decodedRefresh.exp * 1000
                                ).toLocaleTimeString()}
                              </span>
                            </div>
                          </div>
                        )}
                        <div className="flex space-x-2 pt-1">
                          <button
                            onClick={forceExpireRefreshToken}
                            disabled={refreshCountdown === 0}
                            className="flex-1 flex items-center justify-center space-x-1.5 py-1 px-2 text-xs border border-accent-error bg-state-error-bg text-accent-error hover:bg-accent-error hover:text-text-inverse rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <ShieldAlert className="h-3.5 w-3.5" />
                            <span>Expire Refresh</span>
                          </button>
                          <button
                            onClick={refreshSession}
                            className="flex-1 flex items-center justify-center space-x-1.5 py-1 px-2 text-xs border border-accent-success bg-state-success-bg text-accent-success hover:bg-accent-success hover:text-text-inverse rounded transition-colors"
                          >
                            <RotateCw className="h-3.5 w-3.5" />
                            <span>Force Silent Refresh</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 text-center text-text-tertiary bg-background-secondary/40 rounded border border-dashed border-border-primary font-mono text-xs">
                        No Refresh Token
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 2: Logs */}
              {activeTab === 'logs' && (
                <div className="flex flex-col h-full space-y-2">
                  <div className="flex justify-between items-center text-xs pb-1 border-b border-border-primary">
                    <span className="flex items-center text-text-secondary font-mono">
                      <Activity className="mr-1.5 h-3.5 w-3.5 text-accent-success" />
                      Live Feed
                    </span>
                    <button
                      onClick={clearLogs}
                      className="flex items-center text-accent-error hover:underline text-xs bg-transparent"
                    >
                      <Trash2 className="mr-1 h-3 w-3" />
                      Wipe Logs
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-1.5 text-xs font-mono max-h-[300px]">
                    {apiLogs.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-text-tertiary">
                        <Terminal className="h-6 w-6 mb-2 opacity-30" />
                        <span>No requests captured yet.</span>
                        <span className="text-[10px]">
                          Interactions generate live HTTP event outputs.
                        </span>
                      </div>
                    ) : (
                      apiLogs.map(log => {
                        let badgeBg =
                          'bg-background-tertiary text-text-primary';
                        let rowBorder = 'border-border-secondary';

                        if (log.type === 'request') {
                          badgeBg = 'bg-state-info-bg text-accent-info';
                        } else if (log.type === 'response') {
                          badgeBg = 'bg-state-success-bg text-accent-success';
                          rowBorder = 'border-accent-success/20';
                        } else if (log.type === 'error') {
                          badgeBg = 'bg-state-error-bg text-accent-error';
                          rowBorder = 'border-accent-error/45';
                        } else if (log.type === 'system') {
                          badgeBg =
                            'bg-purple-100 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400';
                          rowBorder = 'border-purple-500/20';
                        }

                        return (
                          <div
                            key={log.id}
                            className={`p-2 rounded border bg-background-secondary/35 space-y-1 ${rowBorder}`}
                          >
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="font-semibold text-text-tertiary">
                                {log.timestamp}
                              </span>
                              <span
                                className={`px-1.5 rounded text-[9px] uppercase font-bold tracking-wide ${badgeBg}`}
                              >
                                {log.type}
                              </span>
                            </div>
                            <div className="font-bold text-text-primary">
                              {log.method}{' '}
                              <span className="text-accent-secondary">
                                {log.url}
                              </span>
                              {log.status && (
                                <span className="ml-1 text-[10px]">
                                  [{log.status}]
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-text-secondary break-words">
                              {log.message}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* Tab 3: Settings */}
              {activeTab === 'settings' && (
                <div className="space-y-4">
                  {/* Token Expire Configuration */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-text-primary flex items-center">
                      <Clock className="mr-1.5 h-3.5 w-3.5 text-accent-primary" />
                      JWT Expiry Settings
                    </h4>
                    <p className="text-xs text-text-secondary">
                      Simulate different expiration lifetimes to test
                      interceptors and auto-rotation:
                    </p>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block text-text-secondary font-medium mb-1">
                          Access Token Expiry
                        </label>
                        <select
                          value={simulationTimes.access}
                          onChange={e =>
                            setSimulationTimes(
                              Number(e.target.value),
                              simulationTimes.refresh
                            )
                          }
                          className="w-full p-2 border border-border-primary bg-background-primary text-text-primary rounded"
                        >
                          <option value={15}>15 Seconds</option>
                          <option value={30}>30 Seconds</option>
                          <option value={60}>1 Minute</option>
                          <option value={180}>3 Minutes</option>
                          <option value={600}>10 Minutes</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-text-secondary font-medium mb-1">
                          Refresh Token Expiry
                        </label>
                        <select
                          value={simulationTimes.refresh}
                          onChange={e =>
                            setSimulationTimes(
                              simulationTimes.access,
                              Number(e.target.value)
                            )
                          }
                          className="w-full p-2 border border-border-primary bg-background-primary text-text-primary rounded"
                        >
                          <option value={60}>1 Minute</option>
                          <option value={180}>3 Minutes</option>
                          <option value={300}>5 Minutes</option>
                          <option value={900}>15 Minutes</option>
                          <option value={3600}>1 Hour</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Network Delay Slider */}
                  <div className="space-y-2 border-t border-border-muted pt-3">
                    <div className="flex items-center justify-between font-medium">
                      <span className="flex items-center text-text-primary">
                        <Gauge className="mr-1.5 h-3.5 w-3.5 text-accent-warning" />
                        Network Delay Simulation
                      </span>
                      <span className="font-mono text-xs text-accent-warning font-semibold">
                        {latency}ms
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={3000}
                      step={100}
                      value={latency}
                      onChange={e => setLatency(Number(e.target.value))}
                      className="w-full h-1.5 bg-background-secondary rounded-lg appearance-none cursor-pointer accent-accent-primary"
                    />
                    <div className="flex justify-between text-[10px] text-text-tertiary">
                      <span>Instant (0ms)</span>
                      <span>Slow 3G (3.0s)</span>
                    </div>
                  </div>

                  {/* Data Persistence Resets */}
                  <div className="space-y-2 border-t border-border-muted pt-3 text-xs">
                    <h4 className="font-semibold text-text-primary flex items-center">
                      <Database className="mr-1.5 h-3.5 w-3.5 text-accent-success" />
                      LocalStorage Database
                    </h4>
                    <button
                      onClick={() => {
                        localStorage.removeItem('mock_jwt_user_db');
                        alert(
                          'Mock database wiped. Reload the browser to load initial users.'
                        );
                        window.location.reload();
                      }}
                      className="w-full flex items-center justify-center space-x-1.5 py-2 px-3 border border-border-primary bg-background-secondary text-accent-error hover:bg-background-hover hover:border-accent-error/40 rounded transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Factory Reset Users Database</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
