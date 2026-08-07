import { describe, it, expect } from 'vitest';
import {
  calcGrossPnl,
  calcRMultiple,
  getSession,
  calcDailyStats,
  calcMaxDrawdown,
  calcKelly
} from './calculations';

describe('calculations.js', () => {
  describe('calcGrossPnl', () => {
    it('calculates Long correctly', () => {
      // entry 100, exit 110, qty 10 -> (110 - 100) * 10 = 100
      expect(calcGrossPnl(100, 110, 10, 'Long', 'Stock')).toBe(100);
    });
    
    it('calculates Short correctly', () => {
      // entry 100, exit 90, qty 10 -> (90 - 100) * 10 * -1 = 100
      expect(calcGrossPnl(100, 90, 10, 'Short', 'Stock')).toBe(100);
    });
    
    it('applies Option multiplier', () => {
      // 1 option contract -> 100 shares
      // entry 1.00, exit 1.50 -> 0.50 * 10 * 100 = 500
      expect(calcGrossPnl(1.00, 1.50, 10, 'Long', 'Option')).toBe(500);
    });
    
    it('applies Future multiplier', () => {
      // e.g. ES futures $50 per point
      // entry 5000, exit 5010 -> 10 * 2 * 50 = 1000
      expect(calcGrossPnl(5000, 5010, 2, 'Long', 'Future', 50)).toBe(1000);
    });
  });

  describe('calcRMultiple', () => {
    it('returns -1 for a trade that exactly hits its stop', () => {
      const trade = { entryPrice: 100, stopPrice: 90, qty: 10, netPnl: -100, assetClass: 'Stock' };
      expect(calcRMultiple(trade)).toBe(-1);
    });
    
    it('returns +2 for a 2:1 winner', () => {
      const trade = { entryPrice: 100, stopPrice: 90, qty: 10, netPnl: 200, assetClass: 'Stock' };
      expect(calcRMultiple(trade)).toBe(2);
    });
    
    it('returns null if stopPrice is missing', () => {
      const trade = { entryPrice: 100, qty: 10, netPnl: 200, assetClass: 'Stock' };
      expect(calcRMultiple(trade)).toBeNull();
    });
    
    it('returns null if stopPrice equals entryPrice', () => {
      const trade = { entryPrice: 100, stopPrice: 100, qty: 10, netPnl: 200, assetClass: 'Stock' };
      expect(calcRMultiple(trade)).toBeNull();
    });
  });

  describe('getSession', () => {
    it('buckets Open', () => expect(getSession('09:31')).toBe('Open 9:30–10:30'));
    it('buckets Midday', () => expect(getSession('12:00')).toBe('Midday 12–2'));
    it('buckets Power Hour', () => expect(getSession('15:59')).toBe('Power Hour 3–4'));
    it('buckets Extended for early times', () => expect(getSession('08:00')).toBe('Extended / Other'));
    it('buckets Extended for missing time', () => expect(getSession('')).toBe('Extended / Other'));
  });

  describe('calcDailyStats', () => {
    it('returns zeros for an empty array', () => {
      const stats = calcDailyStats([]);
      expect(stats.totalNetPnl).toBe(0);
      expect(stats.winRate).toBe(0);
      expect(Number.isNaN(stats.winRate)).toBe(false);
    });
  });

  describe('calcMaxDrawdown', () => {
    it('returns true peak-to-trough', () => {
      // Eq changes: +10 (peak 10), -5 (eq 5), -10 (eq -5, peak 10, dd 15), +20 (eq 15, peak 15)
      const trades = [
        { netPnl: 10, date: '2026-01-01', time: '10:00' },
        { netPnl: -5, date: '2026-01-01', time: '11:00' },
        { netPnl: -10, date: '2026-01-01', time: '12:00' },
        { netPnl: 20, date: '2026-01-01', time: '13:00' }
      ];
      expect(calcMaxDrawdown(trades)).toBe(15);
    });
  });

  describe('calcKelly', () => {
    it('calculates correctly', () => {
      expect(calcKelly(0.6, 2)).toBeCloseTo(0.4);
    });
    it('returns 0 for no edge', () => {
      expect(calcKelly(0.3, 1)).toBe(0);
    });
  });
});
