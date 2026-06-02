// Journal entry data model and storage utilities

import { logActivity } from './logger';

const JOURNAL_KEY = 'trading-journal-entries';

export const loadJournalEntries = () => {
  try {
    const data = localStorage.getItem(JOURNAL_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
};

export const saveJournalEntries = (entries) => {
  localStorage.setItem(JOURNAL_KEY, JSON.stringify(entries));
};

export const getJournalEntry = (date) => {
  const entries = loadJournalEntries();
  return entries[date] || null;
};

export const saveJournalEntry = (date, entry) => {
  const entries = loadJournalEntries();
  entries[date] = { ...entry, date, updatedAt: new Date().toISOString() };
  saveJournalEntries(entries);
  logActivity('JOURNAL_UPDATED', `Updated daily journal for ${date}`);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('journal_updated'));
  }
  return entries;
};

export const emptyJournalEntry = {
  preMarketPlan: '',
  mood: 'neutral',
  discipline: 3,
  marketConditions: 'range',
  postMarketReview: '',
  lessonsLearned: '',
  mistakes: '',
  whatWorked: '',
  grade: '',
};

export const MOODS = [
  { value: 'focused', label: 'Focused', emoji: '🎯' },
  { value: 'confident', label: 'Confident', emoji: '💪' },
  { value: 'neutral', label: 'Neutral', emoji: '😐' },
  { value: 'anxious', label: 'Anxious', emoji: '😰' },
  { value: 'fearful', label: 'Fearful', emoji: '😨' },
  { value: 'tilted', label: 'Tilted', emoji: '😤' },
  { value: 'excited', label: 'Excited', emoji: '🔥' },
];

export const MARKET_CONDITIONS = [
  { value: 'trending-up', label: 'Trending Up' },
  { value: 'trending-down', label: 'Trending Down' },
  { value: 'range', label: 'Range-bound' },
  { value: 'choppy', label: 'Choppy' },
  { value: 'volatile', label: 'High Volatility' },
  { value: 'low-vol', label: 'Low Volatility' },
];

export const GRADES = ['A+', 'A', 'B+', 'B', 'C', 'D', 'F'];
