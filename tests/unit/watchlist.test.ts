import { describe, it, expect, beforeEach } from 'vitest';

describe('Watchlist Engine Logic', () => {
  let watchlist: string[] = [];

  beforeEach(() => {
    watchlist = ['PLTR', 'NVDA', 'IONQ'];
  });

  it('should add a ticker to watchlist without duplicates', () => {
    const addTicker = (sym: string) => {
      if (!watchlist.includes(sym)) watchlist.push(sym);
    };

    addTicker('NFLX');
    expect(watchlist).toContain('NFLX');
    expect(watchlist.length).toBe(4);

    addTicker('PLTR'); // Duplicate
    expect(watchlist.length).toBe(4);
  });

  it('should remove ticker from watchlist', () => {
    watchlist = watchlist.filter(t => t !== 'IONQ');
    expect(watchlist).not.toContain('IONQ');
    expect(watchlist.length).toBe(2);
  });
});
