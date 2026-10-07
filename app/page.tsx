'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

type Habit = {
  id: string;
  name: string;
  reminder_time: string;
  streak: number;
  miss_logged: boolean;
  last_completed_date: string | null;
  created_at: string;
};

type AppState = {
  notification_permission: string;
  theme: string;
  timezone_offset: number;
  last_sync_timestamp: number;
};

const STORAGE_KEYS = {
  HABITS: 'habits',
  APP_STATE: 'app_state',
};

function loadHabits(): Habit[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.HABITS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function saveHabits(habits: Habit[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(habits));
  } catch {
    window.dispatchEvent(new CustomEvent('storage-error'));
  }
}

function loadAppState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.APP_STATE);
    if (!raw) {
      const defaultState: AppState = {
        notification_permission: 'default',
        theme: 'light',
        timezone_offset: new Date().getTimezoneOffset(),
        last_sync_timestamp: Date.now(),
      };
      localStorage.setItem(STORAGE_KEYS.APP_STATE, JSON.stringify(defaultState));
      return defaultState;
    }
    return JSON.parse(raw);
  } catch {
    return {
      notification_permission: 'default',
      theme: 'light',
      timezone_offset: new Date().getTimezoneOffset(),
      last_sync_timestamp: Date.now(),
    };
  }
}

export default function Dashboard() {
  const router = useRouter();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    setHabits(loadHabits());
    
    const handleStorageError = () => {
      setErrorBanner('Storage full. Please clear some data to continue.');
    };
    window.addEventListener('storage-error', handleStorageError);
    return () => window.removeEventListener('storage-error', handleStorageError);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    const now = Date.now();
    const pendingReminders = habits.filter(h => {
      const reminderTime = new Date(h.reminder_time).getTime();
      return reminderTime <= now;
    });

    if (pendingReminders.length > 0) {
      setTimeout(async () => {
        try {
          const permission = await Notification.requestPermission();
          if (permission === 'granted') {
            pendingReminders.forEach((habit, index) => {
              setTimeout(() => {
                new Notification('Scaffold Reminder', {
                  body: `Time for ${habit.name}`,
                });
              }, index * 1000);
            });
          }
        } catch {
          // Silently fail
        }
      }, 1500);
    }
  }, [habits, isMounted]);

  const handleComplete = useCallback((id: string) => {
    setHabits(prev => {
      const updated = prev.map(h => {
        if (h.id !== id) return h;
        return {
          ...h,
          streak: h.streak + 1,
          last_completed_date: new Date().toISOString(),
          miss_logged: false,
        };
      });
      saveHabits(updated);
      return updated;
    });
  }, []);

  const handleReschedule = useCallback((id: string) => {
    setHabits(prev => {
      const updated = prev.map(h => {
        if (h.id !== id) return h;
        const currentTime = new Date().getTime();
        const newReminderTime = new Date(currentTime + 24 * 60 * 60 * 1000).toISOString();
        return {
          ...h,
          reminder_time: newReminderTime,
          miss_logged: true,
        };
      });
      saveHabits(updated);
      return updated;
    });
  }, []);

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A]" style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}>
      <header className="bg-white shadow-sm p-6 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-semibold tracking-tight">Scaffold</h1>
          <button
            onClick={() => router.push('/new')}
            className="bg-[#3B82F6] hover:bg-blue-600 text-white px-4 py-2 rounded-md font-medium transition-colors duration-200"
          >
            Create Habit
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-4 space-y-6">
        {errorBanner && (
          <div className="bg-[#F59E0B]/10 border border-[#F59E0B] text-[#F59E0B] p-4 rounded-md text-sm">
            {errorBanner}
          </div>
        )}

        {habits.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <h2 className="text-xl font-semibold text-[#0F172A]">Your routine starts here.</h2>
            <p className="text-[#64748B] leading-relaxed">Add your first habit to get started.</p>
            <button
              onClick={() => router.push('/new')}
              className="bg-[#3B82F6] hover:bg-blue-600 text-white px-6 py-3 rounded-md font-medium transition-colors duration-200 mt-4"
            >
              Create Habit
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {habits.map(habit => (
              <HabitCard
                key={habit.id}
                habit={habit}
                onComplete={handleComplete}
                onReschedule={handleReschedule}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function HabitCard({ habit, onComplete, onReschedule }: {
  habit: Habit;
  onComplete: (id: string) => void;
  onReschedule: (id: string) => void;
}) {
  const isCompletedToday = habit.last_completed_date && new Date(habit.last_completed_date).toDateString() === new Date().toDateString();
  const needsReschedule = !isCompletedToday && habit.last_completed_date && (Date.now() - new Date(habit.last_completed_date).getTime() > 24 * 60 * 60 * 1000);

  return (
    <div className={`bg-white shadow-sm rounded-lg p-6 border-l-4 transition-all duration-200 ${
      isCompletedToday ? 'border-[#10B981]' : needsReschedule ? 'border-[#F59E0B]' : 'border-[#E2E8F0]'
    }`}>
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg truncate" title={habit.name}>{habit.name}</h3>
          <p className="text-sm text-[#64748B] mt-1">Streak: {habit.streak} days</p>
        </div>
        
        <div className="flex flex-col items-end gap-2 shrink-0">
          {isCompletedToday ? (
            <span className="text-[#10B981] font-medium text-sm">Completed</span>
          ) : needsReschedule ? (
            <button
              onClick={() => onReschedule(habit.id)}
              className="bg-[#F59E0B] hover:bg-amber-600 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-200"
            >
              Reschedule
            </button>
          ) : (
            <button
              onClick={() => onComplete(habit.id)}
              className="bg-[#3B82F6] hover:bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-200"
            >
              Complete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}