const LOGS_KEY = 'trading-journal-activity';

export const loadActivityLogs = () => {
  try {
    const data = localStorage.getItem(LOGS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const saveActivityLogs = (logs) => {
  localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
};

export const logActivity = (actionType, description) => {
  const logs = loadActivityLogs();
  const newLog = {
    id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    type: actionType,
    description,
    timestamp: new Date().toISOString()
  };
  
  const updatedLogs = [newLog, ...logs].slice(0, 100); // Keep last 100
  saveActivityLogs(updatedLogs);
  
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('trading-journal-log-updated'));
  }
  
  return updatedLogs;
};

export const clearActivityLogs = () => {
  saveActivityLogs([]);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('trading-journal-log-updated'));
  }
};
