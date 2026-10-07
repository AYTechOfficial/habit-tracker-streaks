'use client';

import React, { useState, useEffect, useCallback } from 'react';

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

// --- Constants ---
const STORAGE_KEYS = {
  HABITS: 'habits',
  APP_STATE: 'app_state',
};

const THEME = {
  bg: '#F8FAFC',
  card: '#FFFFFF',
  primary: '#3B82F6',
  success: '#10B981',
  reschedule: '#F59E0B',
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  border: '#E2E8F0',
};

// --- Helpers ---
const generateId = () => Math.random().toString(36).substr(2, 9);
const formatDate = (date: Date) => date.toISOString();

const isOverdue = (habit: Habit): boolean => {
  if (!habit.last_completed_date) return true;
  const lastDate = new Date(habit.last_completed_date);
  const now = new Date();
  const diffMs = now.getTime() - lastDate.getTime();
  return diffMs > 24 * 60 * 60 * 1000;
};

export default function Page() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [view, setView] = useState<'dashboard' | 'new'>('dashboard');
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  
  // Form State
  const [formName, setFormName] = useState('');
  const [formTime, setFormTime] = useState('');

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const storedHabits = localStorage.getItem(STORAGE_KEYS.HABITS);
      const storedState = localStorage.getItem(STORAGE_KEYS.APP_STATE);
      
      if (storedHabits) {
        const parsed = JSON.parse(storedHabits);
        if (Array.isArray(parsed)) setHabits(parsed);
      }
      
      if (storedState) {
        const parsedState = JSON.parse(storedState);
        if (parsedState?.notification_permission === 'granted') {
          scheduleNudges();
        }
      }
    } catch (e) {
      console.error('Failed to load state', e);
      setErrorBanner('Failed to load previous data. Starting fresh.');
    }

    // Handle reload mid-flow
    if (window.location.hash === '#new') {
      setView('new');
    }
  }, []);

  // Persist to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(habits));
    } catch (e) {
      console.error('Storage write failed', e);
      setErrorBanner('Storage quota exceeded. Please clear some data.');
    }
  }, [habits]);

  // Nudge Scheduler
  const scheduleNudges = useCallback(async () => {
    const now = new Date();
    const overdueHabits = habits.filter(h => new Date(h.reminder_time) <= now);
    
    if (overdueHabits.length === 0) return;

    try {
      setTimeout(async () => {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          setTimeout(() => {
            overdueHabits.forEach(h => {
              new Notification('Scaffold Nudge', { body: `Time for ${h.name}` });
              showToast(`Nudge sent for ${h.name}`);
            });
          }, 2000); // Within 5 seconds of trigger
        }
      }, 1000); // Within 2 seconds of mount
    } catch (e) {
      console.error('Notification error', e);
    }
  }, [habits]);

  // Run nudges periodically if permission already granted
  useEffect(() => {
    if (Notification.permission === 'granted') {
      scheduleNudges();
    }
  }, [scheduleNudges]);

  const showToast = (msg: string) => {
    setToast({ message: msg, visible: true });
    setTimeout(() => setToast({ message: '', visible: false }), 3000);
  };

  const handleComplete = (id: string) => {
    setHabits(prev => prev.map(h => {
      if (h.id !== id) return h;
      return {
        ...h,
        streak: h.streak + 1,
        last_completed_date: formatDate(new Date()),
        miss_logged: false,
      };
    }));
  };

  const handleReschedule = (id: string) => {
    setHabits(prev => prev.map(h => {
      if (h.id !== id) return h;
      const nextReminder = new Date(h.reminder_time);
      nextReminder.setHours(nextReminder.getHours() + 24);
      return {
        ...h,
        reminder_time: formatDate(nextReminder),
        miss_logged: true,
        // Streak remains untouched per spec
      };
    }));
  };

  const handleSaveHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const newHabit: Habit = {
      id: generateId(),
      name: formName.trim(),
      reminder_time: formTime || formatDate(new Date()),
      streak: 0,
      miss_logged: false,
      last_completed_date: null,
      created_at: formatDate(new Date()),
    };

    setHabits(prev => [...prev, newHabit]);
    setFormName('');
    setFormTime('');
    setView('dashboard');
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap');
        body { font-family: 'Inter', sans-serif; background-color: ${THEME.bg}; }
      `}</style>
      <div className="min-h-screen leading-relaxed">
        {/* Header */}
        <header className="max-w-2xl mx-auto p-6 flex justify-between items-center">
          <h1 className="text-2xl font-semibold" style={{ color: THEME.textPrimary }}>Scaffold</h1>
          {view === 'dashboard' && (
            <button 
              onClick={() => setView('new')}
              style={{ backgroundColor: THEME.primary, color: '#fff' }}
              className="px-4 py-2 rounded-md shadow-sm hover:opacity-90 transition-opacity"
            >
              Create Habit
            </button>
          )}
        </header>

        <main className="max-w-2xl mx-auto p-4 space-y-6">
          
          {/* Error Banner */}
          {errorBanner && (
            <div className="p-4 rounded-md border" style={{ borderColor: THEME.reschedule, backgroundColor: `${THEME.reschedule}10` }}>
              {errorBanner}
            </div>
          )}

          {/* Toast */}
          {toast.visible && (
            <div className="fixed bottom-4 right-4 p-4 rounded-md shadow-lg z-50" style={{ backgroundColor: THEME.card, color: THEME.textPrimary }}>
              {toast.message}
            </div>
          )}

          {/* Dashboard View */}
          {view === 'dashboard' && (
            <>
              {habits.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                  <h2 className="text-xl font-semibold" style={{ color: THEME.textPrimary }}>Your routine starts here.</h2>
                  <p style={{ color: THEME.textSecondary }}>Add your first habit to get started.</p>
                  <button 
                    onClick={() => setView('new')}
                    style={{ backgroundColor: THEME.primary, color: '#fff' }}
                    className="px-6 py-3 rounded-md shadow-sm hover:opacity-90 transition-opacity"
                  >
                    Create Habit
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {habits.map(habit => {
                    const overdue = isOverdue(habit);
                    const completedToday = habit.last_completed_date && new Date(habit.last_completed_date).toDateString() === new Date().toDateString();
                    
                    return (
                      <div 
                        key={habit.id} 
                        className="p-6 rounded-lg shadow-sm flex justify-between items-center transition-all duration-200"
                        style={{ 
                          backgroundColor: THEME.card, 
                          borderColor: completedToday ? THEME.success : THEME.border,
                          borderWidth: completedToday ? '2px' : '1px',
                          borderStyle: 'solid'
                        }}
                      >
                        <div className="flex-1 min-w-0 mr-4">
                          <h3 className="font-semibold truncate" style={{ color: THEME.textPrimary }}>{habit.name}</h3>
                          <p className="text-sm mt-1" style={{ color: THEME.textSecondary }}>
                            Streak: {habit.streak} days
                          </p>
                          {overdue && !completedToday && (
                            <p className="text-xs mt-1 italic" style={{ color: THEME.reschedule }}>Missed yesterday</p>
                          )}
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          {completedToday ? (
                            <span className="px-3 py-1 rounded-full text-sm font-medium" style={{ backgroundColor: `${THEME.success}20`, color: THEME.success }}>
                              Completed
                            </span>
                          ) : (
                            <button
                              onClick={() => handleComplete(habit.id)}
                              disabled={overdue}
                              className="px-4 py-2 rounded-md text-sm font-medium transition-colors"
                              style={{ 
                                backgroundColor: overdue ? THEME.reschedule : THEME.primary, 
                                color: '#fff',
                                opacity: overdue ? 0.8 : 1
                              }}
                            >
                              {overdue ? 'Mark Done' : 'Complete'}
                            </button>
                          )}

                          {overdue && !completedToday && (
                            <button
                              onClick={() => handleReschedule(habit.id)}
                              className="mt-2 px-3 py-1 rounded text-xs font-medium border"
                              style={{ borderColor: THEME.reschedule, color: THEME.reschedule }}
                            >
                              Reschedule (+24h)
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

          {/* New Habit View */}
          {view === 'new' && (
            <div className="p-6 rounded-lg shadow-sm" style={{ backgroundColor: THEME.card }}>
              <h2 className="text-xl font-semibold mb-6" style={{ color: THEME.textPrimary }}>New Habit</h2>
              <form onSubmit={handleSaveHabit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: THEME.textSecondary }}>Habit Name</label>
                  <input 
                    type="text" 
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full p-3 rounded-md border focus:outline-none focus:ring-2"
                    style={{ borderColor: THEME.border, '--tw-ring-color': THEME.primary } as React.CSSProperties}
                    placeholder="e.g., Read for 20 mins"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: THEME.textSecondary }}>Reminder Time</label>
                  <input 
                    type="datetime-local" 
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    className="w-full p-3 rounded-md border focus:outline-none"
                    style={{ borderColor: THEME.border }}
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => setView('dashboard')}
                    className="px-4 py-2 rounded-md"
                    style={{ color: THEME.textSecondary }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    style={{ backgroundColor: THEME.primary, color: '#fff' }}
                    className="px-6 py-2 rounded-md shadow-sm hover:opacity-90"
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          )}
        </main>
      </div>
    </>
  );
}