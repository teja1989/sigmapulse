'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface WatchlistContextType {
  watchlist: string[];
  addToWatchlist: (ticker: string) => void;
  removeFromWatchlist: (ticker: string) => void;
  toggleWatchlist: (ticker: string) => void;
  isWatchlisted: (ticker: string) => boolean;
  clearWatchlist: () => void;
}

const DEFAULT_WATCHLIST = ['PLTR', 'NVDA', 'IONQ', 'LLY', 'NFLX', 'MSFT'];

const WatchlistContext = createContext<WatchlistContextType>({
  watchlist: DEFAULT_WATCHLIST,
  addToWatchlist: () => {},
  removeFromWatchlist: () => {},
  toggleWatchlist: () => {},
  isWatchlisted: () => false,
  clearWatchlist: () => {},
});

export const WatchlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [watchlist, setWatchlist] = useState<string[]>(DEFAULT_WATCHLIST);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('sigmapulse_watchlist');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setWatchlist(parsed);
        }
      }
    } catch (e) {
      // Keep defaults
    }
  }, []);

  const saveWatchlist = (newList: string[]) => {
    setWatchlist(newList);
    try {
      localStorage.setItem('sigmapulse_watchlist', JSON.stringify(newList));
    } catch (e) {}
  };

  const addToWatchlist = (ticker: string) => {
    const symbol = ticker.trim().toUpperCase();
    if (!watchlist.includes(symbol)) {
      saveWatchlist([symbol, ...watchlist]);
    }
  };

  const removeFromWatchlist = (ticker: string) => {
    const symbol = ticker.trim().toUpperCase();
    saveWatchlist(watchlist.filter(t => t !== symbol));
  };

  const toggleWatchlist = (ticker: string) => {
    const symbol = ticker.trim().toUpperCase();
    if (watchlist.includes(symbol)) {
      removeFromWatchlist(symbol);
    } else {
      addToWatchlist(symbol);
    }
  };

  const isWatchlisted = (ticker: string): boolean => {
    return watchlist.includes(ticker.trim().toUpperCase());
  };

  const clearWatchlist = () => {
    saveWatchlist([]);
  };

  return (
    <WatchlistContext.Provider
      value={{
        watchlist,
        addToWatchlist,
        removeFromWatchlist,
        toggleWatchlist,
        isWatchlisted,
        clearWatchlist,
      }}
    >
      {children}
    </WatchlistContext.Provider>
  );
};

export const useWatchlist = () => useContext(WatchlistContext);
