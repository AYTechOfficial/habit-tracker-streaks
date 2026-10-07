'use client';

import React, { useState, useEffect } from 'react';

// --- Types ---
interface Habit {
  id: string;
  name: string;
  reminder_time: string;
  streak: number;
  miss_logged: boolean;
  last_completed_date: string | null;
  created_at: string;
}

interface AppState {
  notification_permission: string;
  theme: string;
  timezone_offset: number;
  last_sync_timestamp: number;
}

interface Draft {
  name: string;
  time: string;
}

// --- Constants & Helpers ---
const STORAGE_KEYS = {
  HABITS: 'habits',
  APP_STATE: 'app_state',
  DRAFT: 'draft_habit',
};

const COLORS = {
  bg: '#F8FAFC',
  surface: '#FFFFFF',
  primary: '#3B82F6',
  success: '#10B981',
  reschedule: '#F59E0B',
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  border: '#E2E8F0',
};

const getHabits = (): Habit[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.HABITS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

const saveHabits = (habits: Habit[]): boolean => {
  try {
    localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(habits));
    return true;
  } catch {
    return false;
  }
};

const getAppState = (): AppState => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.APP_STATE);
    return data 
      ? JSON.parse(data) 
      : { 
          notification_permission: 'default', 
          theme: 'light', 
          timezone_offset: new Date().getTimezoneOffset(), 
          last_sync_timestamp: Date.now() 
        };
  } catch {
    return { 
      notification_permission: 'default', 
      theme: 'light', 
      timezone_offset: new Date().getTimezoneOffset(), 
      last_sync_timestamp: Date.now() 
    };
  }
};

const getDraft = (): Draft => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.DRAFT);
    return data ? JSON.parse(data) : { name: '', time: '' };
  } catch {
    return { name: '', time: '' };
  }
};

const saveDraft = (draft: Draft) => {
  try {
    localStorage.setItem(STORAGE_KEYS.DRAFT, JSON.stringify(draft));
  } catch {}
};

const clearDraft = () => {
  try {
    localStorage.removeItem(STORAGE_KEYS.DRAFT);
  } catch {}
};

// --- Component ---
export default function ScaffoldPage() {
  const [view, setView] = useState<'dashboard' | 'new'>('dashboard');
  const [habits, setHabits] = useState<Habit[]>([]);
  const [appState, setAppState] = useState<AppState>(getAppState());
  const [draftName, setDraftName] = useState('');
  const [draftTime, setDraftTime] = useState('');
  const [storageError, setStorageError] = useState(false);

  // Initialize state and handle nudge scheduling on mount
  useEffect(() => {
    const loadedHabits = getHabits();
    setHabits(loadedHabits);

    const draft = getDraft();
    setDraftName(draft.name);
    setDraftTime(draft.time);

    // Automated Nudge Scheduling
    const now = new Date();
    const dueHabits = loadedHabits.filter(h => new Date(h.reminder_time) <= now);

    if (dueHabits.length > 0 && appState.notification_permission !== 'granted') {
      setTimeout(() => {
        Notification.requestPermission().then(perm => {
          setAppState(prev => ({ ...prev, notification_permission: perm }));
          if (perm === 'granted') {
            // Display toast within 5 seconds of trigger
            setTimeout(() => {
              dueHabits.forEach(h => {
                alert(`Nudge: ${h.name}`);
              });
            }, 2000);
          }
        }).catch(() => {});
      }, 2000);
    }
  }, []);

  // Persist habits when they change
  useEffect(() => {
    const success = saveHabits(habits);
    if (!success) setStorageError(true);
  }, [habits]);

  // Persist draft when view is 'new' or inputs change
  useEffect(() => {
    if (view === 'new') {
      saveDraft({ name: draftName, time: draftTime });
    } else {
      clearDraft();
    }
  }, [view, draftName, draftTime]);

  const handleToggle = (id: string) => {
    setHabits(prev => prev.map(h => {
      if (h.id === id) {
        const now = new Date().toISOString();
        return { ...h, streak: h.streak + 1, last_completed_date: now, miss_logged: false };
      }
      return h;
    }));
  };

  const handleReschedule = (id: string) => {
    setHabits(prev => prev.map(h => {
      if (h.id === id) {
        const currentReminder = new Date(h.reminder_time);
        const newReminder = new Date(currentReminder.getTime() + 24 * 60 * 60 * 1000).toISOString();
        return { ...h, reminder_time: newReminder, miss_logged: true };
      }
      return h;
    }));
  };

  const handleSaveHabit = () => {
    if (!draftName.trim()) return;
    
    const newHabit: Habit = {
      id: crypto.randomUUID(),
      name: draftName,
      reminder_time: draftTime || new Date().toISOString(),
      streak: 0,
      miss_logged: false,
      last_completed_date: null,
      created_at: new Date().toISOString(),
    };

    setHabits(prev => [...prev, newHabit]);
    setDraftName('');
    setDraftTime('');
    setView('dashboard');
  };

  const handleCancel = () => {
    setView('dashboard');
  };

  const isMissed = (habit: Habit) => {
    if (!habit.last_completed_date) return true;
    const last = new Date(habit.last_completed_date);
    const now = new Date();
    return (now.getTime() - last.getTime()) > 24 * 60 * 60 * 1000;
  };

  const isCompletedToday = (habit: Habit) => {
    if (!habit.last_completed_date) return false;
    const last = new Date(habit.last_completed_date);
    const now = new Date();
    return last.toDateString() === now.toDateString();
  };

  return (
    <div 
      style={{ 
        backgroundColor: COLORS.bg, 
        minHeight: '100vh', 
        fontFamily: 'Inter, system-ui, sans-serif', 
        color: COLORS.textPrimary,
        fontSize: '16px',
        lineHeight: '1.625'
      }}
    >
      {/* Header */}
      <header className="p-6 flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Scaffold</h1>
        {view === 'dashboard' && (
          <button 
            onClick={() => setView('new')}
            style={{ backgroundColor: COLORS.primary, color: 'white' }}
            className="px-4 py-2 rounded-md shadow-sm hover:opacity-90 transition-opacity font-normal"
          >
            Create Habit
          </button>
        )}
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-6">
        {view === 'dashboard' && (
          <>
            {habits.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4 text-center">
                <h2 className="text-xl font-semibold" style={{ color: COLORS.textPrimary }}>
                  Your routine starts here.
                </h2>
                <p className="text-lg" style={{ color: COLORS.textSecondary }}>
                  Add your first habit to get started.
                </p>
                <button 
                  onClick={() => setView('new')}
                  style={{ backgroundColor: COLORS.primary, color: 'white' }}
                  className="px-6 py-3 rounded-md shadow-sm hover:opacity-90 transition-opacity font-normal"
                >
                  Create Habit
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {habits.map(habit => {
                  const missed = isMissed(habit);
                  const completed = isCompletedToday(habit);
                  
                  return (
                    <div 
                      key={habit.id} 
                      className="p-6 bg-white rounded-lg shadow-sm border transition-colors duration-200"
                      style={{ 
                        borderColor: completed ? COLORS.success : COLORS.border,
                        borderWidth: completed ? '2px' : '1px'
                      }}
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold truncate" title={habit.name}>
                            {habit.name}
                          </h3>
                          <p className="text-sm mt-1" style={{ color: COLORS.textSecondary }}>
                            Streak: {habit.streak} day{habit.streak !== 1 ? 's' : ''}
                          </p>
                        </div>
                        
                        {missed ? (
                          <button 
                            onClick={() => handleReschedule(habit.id)}
                            style={{ backgroundColor: COLORS.reschedule, color: 'white' }}
                            className="px-3 py-1.5 rounded-md text-sm hover:opacity-90 transition-opacity font-normal whitespace-nowrap"
                          >
                            Reschedule
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleToggle(habit.id)}
                            disabled={completed}
                            style={{ 
                              backgroundColor: completed ? COLORS.success : 'transparent', 
                              color: completed ? 'white' : COLORS.primary, 
                              borderColor: COLORS.primary,
                              borderWidth: '1px'
                            }}
                            className={`px-3 py-1.5 rounded-md text-sm border transition-colors font-normal whitespace-nowrap ${completed ? 'cursor-default' : 'hover:bg-blue-50'}`}
                          >
                            {completed ? 'Completed' : 'Mark Done'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {view === 'new' && (
          <div className="p-6 bg-white rounded-lg shadow-sm max-w-md mx-auto">
            <h2 className="text-xl font-semibold mb-4">New Habit</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: COLORS.textSecondary }}>
                  Habit Name
                </label>
                <input 
                  type="text" 
                  value={draftName}
                  onChange={e => setDraftName(e.target.value)}
                  className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200"
                  style={{ borderColor: COLORS.border }}
                  placeholder="e.g., Drink water"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: COLORS.textSecondary }}>
                  Reminder Time
                </label>
                <input 
                  type="datetime-local" 
                  value={draftTime}
                  onChange={e => setDraftTime(e.target.value)}
                  className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200"
                  style={{ borderColor: COLORS.border }}
                />
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <button 
                  onClick={handleCancel}
                  className="px-4 py-2 rounded-md hover:bg-gray-50 transition-colors font-normal"
                  style={{ color: COLORS.textSecondary }}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveHabit}
                  style={{ backgroundColor: COLORS.primary, color: 'white' }}
                  className="px-4 py-2 rounded-md hover:opacity-90 transition-opacity font-normal"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {storageError && (
        <div 
          className="fixed bottom-4 left-4 p-4 rounded-md shadow-sm z-50"
          style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}
        >
          Storage quota exceeded. Please clear some data.
        </div>
      )}
    </div>
  );
}