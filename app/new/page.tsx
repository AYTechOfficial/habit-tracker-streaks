'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function NewHabit() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [reminderTime, setReminderTime] = useState('');
  const [error, setError] = useState('');
  const [storageError, setStorageError] = useState(false);

  useEffect(() => {
    const savedName = sessionStorage.getItem('draft_name');
    const savedTime = sessionStorage.getItem('draft_time');
    if (savedName) setName(savedName);
    if (savedTime) setReminderTime(savedTime);
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a habit name.');
      return;
    }
    if (!reminderTime) {
      setError('Please select a reminder time.');
      return;
    }

    const newHabit = {
      id: crypto.randomUUID(),
      name: name.trim(),
      reminder_time: new Date(reminderTime).toISOString(),
      streak: 0,
      miss_logged: false,
      last_completed_date: null,
      created_at: new Date().toISOString()
    };

    try {
      const stored = localStorage.getItem('habits');
      const habits = stored ? JSON.parse(stored) : [];
      if (!Array.isArray(habits)) throw new Error('Invalid habits data');
      habits.push(newHabit);
      localStorage.setItem('habits', JSON.stringify(habits));
    } catch (e) {
      console.error('Failed to save habit', e);
      setStorageError(true);
      return;
    }

    sessionStorage.removeItem('draft_name');
    sessionStorage.removeItem('draft_time');
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-[#0F172A] leading-relaxed">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap');
        body { font-family: 'Inter', sans-serif; }
        h1, h2, h3, h4, h5, h6 { font-weight: 600; }
        p, span, div, button, input, label { font-weight: 400; }
      `}</style>
      <div className="max-w-md mx-auto p-4 pt-12">
        <h1 className="text-2xl text-[#0F172A] mb-6">Create Habit</h1>
        <form onSubmit={handleSave} className="bg-white shadow-sm border border-[#E2E8F0] p-6 rounded-lg space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm text-[#64748B] mb-1">Habit Name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(''); }}
              className="w-full px-3 py-2 border border-[#E2E8F0] rounded-md focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent"
              placeholder="e.g., Morning Walk"
              autoFocus
            />
          </div>
          <div>
            <label htmlFor="reminder" className="block text-sm text-[#64748B] mb-1">Reminder Time</label>
            <input
              id="reminder"
              type="datetime-local"
              value={reminderTime}
              onChange={(e) => { setReminderTime(e.target.value); setError(''); }}
              className="w-full px-3 py-2 border border-[#E2E8F0] rounded-md focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent"
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          {storageError && (
            <div className="bg-[#F59E0B] text-white px-3 py-2 rounded-md text-sm">
              Storage full. Please clear some data to continue.
            </div>
          )}
          <button
            type="submit"
            className="w-full bg-[#3B82F6] text-white py-2 rounded-md font-medium hover:bg-blue-600 transition-colors"
          >
            Save
          </button>
        </form>
      </div>
    </div>
  );
}