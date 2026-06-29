import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Star, ShieldCheck, Search, Coins, Sparkles, Award } from 'lucide-react';
import { Complaint, User as AppUser } from '../types';
import { getGoogleFallbackAvatar } from './MobileSimulator';

interface LeaderboardUser {
  id: string;
  fullName: string;
  username?: string;
  avatarUrl?: string;
  coinBalance: number;
  resolvedCount: number;
}

interface LeaderboardProps {
  currentUser: AppUser | null;
  complaints: Complaint[];
  onAddLog: (type: 'auth' | 'database' | 'geofence' | 'rewards' | 'challenge', message: string) => void;
}

export default function Leaderboard({ currentUser, complaints, onAddLog }: LeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'resolved' | 'coins'>('resolved');

  useEffect(() => {
    fetchLeaderboard();
  }, [complaints]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/leaderboard');
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data);
        onAddLog('database', 'Leaderboard loaded successfully from cloud database.');
      } else {
        throw new Error('API returned error status');
      }
    } catch (err) {
      console.warn('Leaderboard API failed, computing from local memory state:', err);
      computeLocalLeaderboard();
    } finally {
      setLoading(false);
    }
  };

  const computeLocalLeaderboard = () => {
    // Basic local fallback if server cannot be reached
    // Group resolved complaints by reporterId
    const resolvedCounts: Record<string, number> = {};
    complaints.forEach((comp) => {
      if (comp.status === 'resolved') {
        resolvedCounts[comp.reporterId] = (resolvedCounts[comp.reporterId] || 0) + 1;
      }
    });

    // We have some default seed users
    const defaultCitizens = [
      {
        id: 'user_1',
        fullName: 'Rahul Sharma',
        username: 'rahul_sharma',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
        coinBalance: 350
      },
      {
        id: 'user_3',
        fullName: 'Priya Patel',
        username: 'priya_patel',
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
        coinBalance: 600
      },
      {
        id: 'user_4',
        fullName: 'Ananya Iyer',
        username: 'ananya_i',
        avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80',
        coinBalance: 450
      },
      {
        id: 'user_5',
        fullName: 'Kabir Singh',
        username: 'kabir_vanguard',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
        coinBalance: 150
      }
    ];

    // If the current user is logged in and not in the list, add them
    if (currentUser && currentUser.role === 'citizen') {
      if (!defaultCitizens.some(u => u.id === currentUser.id)) {
        defaultCitizens.push({
          id: currentUser.id,
          fullName: currentUser.fullName,
          username: currentUser.username,
          avatarUrl: currentUser.avatarUrl,
          coinBalance: currentUser.coinBalance
        });
      } else {
        // Update current user values in seed list
        const idx = defaultCitizens.findIndex(u => u.id === currentUser.id);
        if (idx !== -1) {
          defaultCitizens[idx].coinBalance = currentUser.coinBalance;
          defaultCitizens[idx].username = currentUser.username || defaultCitizens[idx].username;
          defaultCitizens[idx].avatarUrl = currentUser.avatarUrl || defaultCitizens[idx].avatarUrl;
        }
      }
    }

    const computed = defaultCitizens.map(user => ({
      id: user.id,
      fullName: user.fullName,
      username: user.username,
      avatarUrl: user.avatarUrl,
      coinBalance: user.coinBalance,
      resolvedCount: resolvedCounts[user.id] || 0
    }));

    setLeaderboard(computed);
  };

  // Sort and filter leaderboard
  const sortedLeaderboard = [...leaderboard]
    .sort((a, b) => {
      if (sortBy === 'resolved') {
        if (b.resolvedCount !== a.resolvedCount) {
          return b.resolvedCount - a.resolvedCount;
        }
        return b.coinBalance - a.coinBalance;
      } else {
        if (b.coinBalance !== a.coinBalance) {
          return b.coinBalance - a.coinBalance;
        }
        return b.resolvedCount - a.resolvedCount;
      }
    });

  const filteredLeaderboard = sortedLeaderboard.filter(user => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      user.fullName.toLowerCase().includes(q) ||
      (user.username && user.username.toLowerCase().includes(q))
    );
  });

  const topThree = filteredLeaderboard.slice(0, 3);
  const remaining = filteredLeaderboard.slice(3);

  // Position index mapping for top 3 visual: 2nd place on left, 1st in center, 3rd on right
  const podiumOrder = [
    topThree[1], // 2nd
    topThree[0], // 1st
    topThree[2], // 3rd
  ].filter(Boolean);

  const getRankStyle = (rankIndex: number) => {
    if (rankIndex === 0) {
      return {
        bg: 'bg-amber-500/10 border-amber-500/40 text-amber-400',
        crown: '👑',
        border: 'border-amber-400',
        medalIcon: <Trophy className="h-5 w-5 text-amber-400" />
      };
    }
    if (rankIndex === 1) {
      return {
        bg: 'bg-slate-300/10 border-slate-300/40 text-slate-300',
        crown: '🥈',
        border: 'border-slate-300',
        medalIcon: <Medal className="h-5 w-5 text-slate-300" />
      };
    }
    return {
      bg: 'bg-amber-700/10 border-amber-700/40 text-amber-600',
      crown: '🥉',
      border: 'border-amber-700',
      medalIcon: <Medal className="h-5 w-5 text-amber-700" />
    };
  };

  return (
    <div className="space-y-4 pt-3" id="leaderboard-screen">
      <div className="px-4 flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-sm text-brand-text-main flex items-center gap-1.5">
            <Trophy className="h-4 w-4 text-amber-400 animate-pulse" />
            Vanguard Leaderboard
          </h2>
          <p className="text-[10px] text-brand-text-dim">Top civic wardens & active reporting citizens</p>
        </div>
        
        {/* Toggle sort options */}
        <div className="flex bg-brand-dark-card border border-brand-border rounded-lg p-0.5" id="leaderboard-toggle">
          <button
            onClick={() => setSortBy('resolved')}
            className={`px-2 py-0.5 text-[9px] font-bold rounded transition-colors ${
              sortBy === 'resolved' ? 'bg-brand-cyan text-brand-dark-bg' : 'text-brand-text-dim hover:text-brand-text-main'
            }`}
          >
            Resolved
          </button>
          <button
            onClick={() => setSortBy('coins')}
            className={`px-2 py-0.5 text-[9px] font-bold rounded transition-colors ${
              sortBy === 'coins' ? 'bg-brand-cyan text-brand-dark-bg' : 'text-brand-text-dim hover:text-brand-text-main'
            }`}
          >
            Coins
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="px-4">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-brand-text-dim/60" />
          <input
            type="text"
            placeholder="Search warden by name or @handle..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-brand-dark-card border border-brand-border rounded-lg pl-8 pr-3 py-1.5 text-xs text-brand-text-main focus:outline-none focus:border-brand-cyan"
            id="leaderboard-search"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center" id="leaderboard-loader">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-brand-cyan border-t-transparent mx-auto mb-2" />
          <p className="text-xs text-brand-text-dim font-mono">Syncing national leaderboard...</p>
        </div>
      ) : leaderboard.length === 0 ? (
        <div className="py-12 text-center border border-dashed border-brand-border rounded-xl mx-4 bg-brand-dark-card" id="leaderboard-empty">
          <Award className="h-8 w-8 text-brand-text-dim mx-auto mb-2" />
          <p className="text-xs text-brand-text-dim">No citizen records found on state registry.</p>
        </div>
      ) : (
        <div className="space-y-4">
          
          {/* PODIUM SECTION FOR TOP 3 - Only show when no search is active */}
          {!searchQuery && topThree.length > 0 && (
            <div className="px-4 pt-1 pb-2 bg-gradient-to-b from-brand-cyan/5 to-transparent rounded-2xl border border-brand-border/30 mx-4" id="leaderboard-podium">
              <div className="flex justify-center items-end gap-2 pt-3 h-44">
                
                {/* 2nd Place */}
                {topThree[1] && (
                  <div className="flex flex-col items-center flex-1">
                    <div className="relative">
                      <div className="h-12 w-12 rounded-full overflow-hidden border-2 border-slate-300 shadow-md">
                        {topThree[1].avatarUrl ? (
                          <img 
                            src={topThree[1].avatarUrl} 
                            alt={topThree[1].fullName} 
                            className="h-full w-full object-cover" 
                            referrerPolicy="no-referrer" 
                            onError={(e) => {
                              e.currentTarget.src = getGoogleFallbackAvatar(topThree[1].fullName, '');
                            }}
                          />
                        ) : (
                          <div className="h-full w-full bg-slate-800 flex items-center justify-center font-bold text-slate-300 text-xs">
                            {topThree[1].fullName.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <span className="absolute -top-2 -right-1 text-xs">🥈</span>
                    </div>
                    <span className="text-[10px] font-bold text-brand-text-main mt-1 truncate max-w-[70px] text-center">
                      {topThree[1].fullName.split(' ')[0]}
                    </span>
                    <span className="text-[8px] text-brand-text-dim">@{topThree[1].username || 'warden'}</span>
                    
                    {/* Pedestal block */}
                    <div className="w-full bg-slate-400/10 border-t border-slate-300/40 rounded-t-lg h-14 mt-1.5 flex flex-col items-center justify-center p-1">
                      <span className="text-[10px] font-mono font-extrabold text-slate-300">#2</span>
                      <span className="text-[8.5px] text-brand-cyan font-bold">{topThree[1].resolvedCount} solved</span>
                      <span className="text-[7.5px] font-mono text-brand-coin flex items-center gap-0.5 mt-0.5">
                        <Coins className="h-2 w-2" />
                        {topThree[1].coinBalance}
                      </span>
                    </div>
                  </div>
                )}

                {/* 1st Place */}
                {topThree[0] && (
                  <div className="flex flex-col items-center flex-1 z-10 -translate-y-1 scale-105">
                    <div className="relative">
                      <div className="h-15 w-15 rounded-full overflow-hidden border-2 border-amber-400 shadow-lg shadow-amber-400/10">
                        {topThree[0].avatarUrl ? (
                          <img 
                            src={topThree[0].avatarUrl} 
                            alt={topThree[0].fullName} 
                            className="h-full w-full object-cover" 
                            referrerPolicy="no-referrer" 
                            onError={(e) => {
                              e.currentTarget.src = getGoogleFallbackAvatar(topThree[0].fullName, '');
                            }}
                          />
                        ) : (
                          <div className="h-full w-full bg-amber-950 flex items-center justify-center font-bold text-amber-300 text-sm">
                            {topThree[0].fullName.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <span className="absolute -top-3.5 left-1/2 transform -translate-x-1/2 text-sm animate-bounce">👑</span>
                    </div>
                    <span className="text-[11px] font-bold text-amber-400 mt-1 truncate max-w-[80px] text-center flex items-center gap-0.5">
                      {topThree[0].fullName.split(' ')[0]}
                    </span>
                    <span className="text-[8.5px] text-brand-text-dim">@{topThree[0].username || 'sentinel'}</span>
                    
                    {/* Pedestal block */}
                    <div className="w-full bg-amber-500/10 border-t-2 border-amber-400 rounded-t-lg h-20 mt-1.5 flex flex-col items-center justify-center p-1">
                      <span className="text-xs font-mono font-extrabold text-amber-400">#1</span>
                      <span className="text-[9.5px] text-brand-cyan font-extrabold">{topThree[0].resolvedCount} solved</span>
                      <span className="text-[8.5px] font-mono text-brand-coin flex items-center gap-0.5 mt-0.5 font-bold">
                        <Coins className="h-2.5 w-2.5" />
                        {topThree[0].coinBalance}
                      </span>
                    </div>
                  </div>
                )}

                {/* 3rd Place */}
                {topThree[2] && (
                  <div className="flex flex-col items-center flex-1">
                    <div className="relative">
                      <div className="h-11 w-11 rounded-full overflow-hidden border-2 border-amber-700 shadow-md">
                        {topThree[2].avatarUrl ? (
                          <img 
                            src={topThree[2].avatarUrl} 
                            alt={topThree[2].fullName} 
                            className="h-full w-full object-cover" 
                            referrerPolicy="no-referrer" 
                            onError={(e) => {
                              e.currentTarget.src = getGoogleFallbackAvatar(topThree[2].fullName, '');
                            }}
                          />
                        ) : (
                          <div className="h-full w-full bg-orange-950 flex items-center justify-center font-bold text-amber-600 text-xs">
                            {topThree[2].fullName.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <span className="absolute -top-2 -right-1 text-xs">🥉</span>
                    </div>
                    <span className="text-[10px] font-bold text-brand-text-main mt-1 truncate max-w-[70px] text-center">
                      {topThree[2].fullName.split(' ')[0]}
                    </span>
                    <span className="text-[8px] text-brand-text-dim">@{topThree[2].username || 'warden'}</span>
                    
                    {/* Pedestal block */}
                    <div className="w-full bg-amber-800/10 border-t border-amber-700/40 rounded-t-lg h-12 mt-1.5 flex flex-col items-center justify-center p-1">
                      <span className="text-[9.5px] font-mono font-extrabold text-amber-700">#3</span>
                      <span className="text-[8px] text-brand-cyan font-bold">{topThree[2].resolvedCount} solved</span>
                      <span className="text-[7px] font-mono text-brand-coin flex items-center gap-0.5 mt-0.5">
                        <Coins className="h-2 w-2" />
                        {topThree[2].coinBalance}
                      </span>
                    </div>
                  </div>
                )}

              </div>
            </div>
          )}

          {/* LIST VIEW (Ranks 4 to 50, or full list if searching) */}
          <div className="space-y-1.5 px-4" id="leaderboard-list">
            <span className="text-[8.5px] font-bold text-brand-text-dim block uppercase tracking-wider mb-2">
              {searchQuery ? `Search Results (${filteredLeaderboard.length})` : 'Warden Standings'}
            </span>
            
            {(searchQuery ? filteredLeaderboard : remaining).map((user, idx) => {
              const actualRank = searchQuery ? sortedLeaderboard.findIndex(u => u.id === user.id) + 1 : idx + 4;
              const isCurrentUser = currentUser?.id === user.id;

              return (
                <div 
                  key={user.id}
                  className={`flex items-center justify-between p-2 rounded-xl border transition-all ${
                    isCurrentUser 
                      ? 'bg-brand-cyan/5 border-brand-cyan/40 shadow-inner' 
                      : 'bg-brand-dark-card border-brand-border/60 hover:border-brand-border'
                  }`}
                  id={`leaderboard-row-${user.id}`}
                >
                  <div className="flex items-center gap-2.5">
                    {/* Rank Badge */}
                    <span className={`w-5 font-mono text-center text-xs font-bold ${
                      actualRank <= 3 
                        ? 'text-brand-cyan' 
                        : isCurrentUser 
                          ? 'text-brand-cyan' 
                          : 'text-brand-text-dim'
                    }`}>
                      #{actualRank}
                    </span>

                    {/* Avatar */}
                    <div className="h-8 w-8 rounded-full overflow-hidden border border-brand-border bg-brand-dark-bg flex-shrink-0">
                      {user.avatarUrl ? (
                        <img 
                          src={user.avatarUrl} 
                          alt={user.fullName} 
                          className="h-full w-full object-cover" 
                          referrerPolicy="no-referrer" 
                          onError={(e) => {
                            e.currentTarget.src = getGoogleFallbackAvatar(user.fullName, '');
                          }}
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center font-bold text-[10px] text-brand-text-main">
                          {user.fullName.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>

                    {/* User Info */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-[11px] text-brand-text-main truncate block max-w-[110px]">
                          {user.fullName}
                        </span>
                        {isCurrentUser && (
                          <span className="text-[7.5px] font-bold bg-brand-cyan/20 text-brand-cyan px-1 rounded uppercase tracking-wider">
                            You
                          </span>
                        )}
                      </div>
                      <span className="text-[9px] text-brand-text-dim block truncate">
                        @{user.username || 'active_warden'}
                      </span>
                    </div>
                  </div>

                  {/* Leaderboard stats */}
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-brand-cyan font-mono block">
                        {user.resolvedCount} <span className="text-[8px] font-sans font-normal text-brand-text-dim">solved</span>
                      </span>
                      <span className="text-[9px] font-mono text-brand-coin flex items-center justify-end gap-0.5">
                        <Coins className="h-2 w-2" />
                        {user.coinBalance}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}
    </div>
  );
}
