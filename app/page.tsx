'use client';
import { useState, useEffect } from 'react';
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

export default function Dashboard() {
  const router = useRouter();
  const [habits, setHabits] = useState<Habit[]>(() => {
    try {
      const stored = localStorage.getItem('habits');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  });
  const [storageError, setStorageError] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem('app_state')) {
      localStorage.setItem('app_state', JSON.stringify({
        notification_permission: 'default',
        theme: 'light',
        timezone_offset: new Date().getTimezoneOffset(),
        last_sync_timestamp: Date.now()
      }));
    }

    const now = Date.now();
    try {
      const stored = localStorage.getItem('habits');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const dueHabits = parsed.filter(h => new Date(h.reminder_time).getTime() <= now);
          if (dueHabits.length > 0 && 'Notification' in window) {
            setTimeout(() => {
              Notification.requestPermission().then(perm => {
                if (perm === 'granted') {
                  dueHabits.forEach(habit => {
                    setTimeout(() => alert(`Scaffold Nudge: ${habit.name}`), 5000);
                  });
                }
              }).catch(() => {});
            }, 2000);
          }
        }
      }
    } catch (e) {}
  }, []);

  const saveHabits = (updated: Habit[]) => {
    try {
      localStorage.setItem('habits', JSON.stringify(updated));
    } catch (e) {
      console.warn('LocalStorage write failed', e);
      setStorageError(true);
    }
  };

  const handleComplete = (id: string) => {
    setHabits(prev => {
      const updated = prev.map(h => {
        if (h.id === id) {
          return {
            ...h,
            streak: h.streak + 1,
            last_completed_date: new Date().toISOString(),
            miss_logged: false
          };
        }
        return h;
      });
      saveHabits(updated);
      return updated;
    });
  };

  const handleReschedule = (id: string) => {
    setHabits(prev => {
      const updated = prev.map(h => {
        if (h.id === id) {
          const currentRemind = new Date(h.reminder_time);
          const newRemind = new Date(currentRemind.getTime() + 24 * 60 * 60 * 1000).toISOString();
          return {
            ...h,
            reminder_time: newRemind,
            miss_logged: true
          };
        }
        return h;
      });
      saveHabits(updated);
      return updated;
    });
  };

  const isMissed = (habit: Habit) => {
    if (!habit.last_completed_date) return true;
    const diff = Date.now() - new Date(habit.last_completed_date).getTime();
    return diff > 24 * 60 * 60 * 1000;
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-[#0F172A] leading-relaxed">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap');
        body { font-family: 'Inter', sans-serif; }
        h1, h2, h3, h4, h5, h6 { font-weight: 600; }
        p, span, div, button, input, label { font-weight: 400; }
      `}</style>
      <div className="max-w-2xl mx-auto p-4 space-y-6">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-2xl text-[#0F172A]">Scaffold</h1>
          <button
            onClick={() => router.push('/new')}
            className="bg-[#3B82F6] text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
          >
            Create Habit
          </button>
        </header>

        {storageError && (
          <div className="fixed bottom-4 left-4 bg-[#F59E0B] text-white px-4 py-2 rounded-md text-sm shadow-sm z-50">
            Storage full. Please clear some data to continue.
          </div>
        )}

        {habits.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <h2 className="text-xl text-[#0F172A] mb-2">Your routine starts here.</h2>
            <p className="text-[#64748B] mb-6">Add your first habit to get started.</p>
            <button
              onClick={() => router.push('/new')}
              className="bg-[#3B82F6] text-white px-6 py-3 rounded-md font-medium hover:bg-blue-600 transition-colors"
            >
              Create Habit
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {habits.map(habit => {
              const missed = isMissed(habit);
              return (
                <div
                  key={habit.id}
                  className={`bg-white shadow-sm border p-6 rounded-lg transition-all duration-200 ${
                    !missed && habit.last_completed_date ? 'border-[#10B981]' : 'border-[#E2E8F0]'
                  }`}
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg text-[#0F172A] truncate">{habit.name}</h3>
                      <p className="text-[#64748B] text-sm mt-1">
                        Streak: {habit.streak} day{habit.streak !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {missed ? (
                        <button
                          onClick={() => handleReschedule(habit.id)}
                          className="bg-[#F59E0B] text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-amber-600 transition-colors"
                        >
                          Reschedule
                        </button>
                      ) : (
                        <button
                          onClick={() => handleComplete(habit.id)}
                          disabled={!missed && habit.last_completed_date}
                          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                            !missed && habit.last_completed_date
                              ? 'bg-[#10B981] text-white cursor-default'
                              : 'bg-[#3B82F6] text-white hover:bg-blue-600'
                          }`}
                        >
                          {!missed && habit.last_completed_date ? 'Completed' : 'Mark Done'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}