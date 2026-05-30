const TRADES_KEY = 'trading-journal-trades';
const SETTINGS_KEY = 'trading-journal-settings';

const getStorage = () => {
  if (typeof window !== 'undefined' && window.storage) {
    return window.storage;
  }
  return {
    getItem: (key) => {
      try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
    },
    setItem: (key, value) => {
      localStorage.setItem(key, JSON.stringify(value));
    },
  };
};

export const loadTrades = () => {
  const storage = getStorage();
  const data = storage.getItem(TRADES_KEY);
  return data || {};
};

export const saveTrades = (trades) => {
  const storage = getStorage();
  storage.setItem(TRADES_KEY, trades);
};

export const loadSettings = () => {
  const storage = getStorage();
  const data = storage.getItem(SETTINGS_KEY);
  return data || { googleSheetId: '', quickEntry: false, theme: 'dark' };
};

export const saveSettings = (settings) => {
  const storage = getStorage();
  storage.setItem(SETTINGS_KEY, settings);
};

export const getDateKey = (date) => {
  if (!date) {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return date;
};
