'use client';

import React, { useState, useEffect } from 'react';
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

const STORAGE_KEY = 'habits';

function loadHabits(): Habit[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveHabits(habits: Habit[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
  } catch {
    // Silent failure per spec
  }
}

export default function NewHabitPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [reminderTime, setReminderTime] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const draftName = sessionStorage.getItem('scaffold_draft_name');
    const draftTime = sessionStorage.getItem('scaffold_draft_time');
    if (draftName) setName(draftName);
    if (draftTime) setReminderTime(draftTime);
  }, []);

  useEffect(() => {
    sessionStorage.setItem('scaffold_draft_name', name);
    sessionStorage.setItem('scaffold_draft_time', reminderTime);
  }, [name, reminderTime]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !reminderTime) return;

    setIsSaving(true);
    const newHabit: Habit = {
      id: crypto.randomUUID(),
      name: name.trim(),
      reminder_time: new Date(reminderTime).toISOString(),
      streak: 0,
      miss_logged: false,
      last_completed_date: null,
      created_at: new Date().toISOString(),
    };

    const updatedHabits = [...loadHabits(), newHabit];
    saveHabits(updatedHabits);
    
    sessionStorage.removeItem('scaffold_draft_name');
    sessionStorage.removeItem('scaffold_draft_time');

    router.push('/');
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex items-center justify-center p-4" style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}>
      <form onSubmit={handleSubmit} className="bg-white shadow-sm rounded-lg p-6 w-full max-w-md space-y-6">
        <h1 className="text-2xl font-semibold text-[#0F172A]">New Habit</h1>
        
        <div className="space-y-2">
          <label htmlFor="name" className="block text-sm font-medium text-[#0F172A]">Habit Name</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Morning Walk"
            className="w-full px-4 py-2 border border-[#E2E8F0] rounded-md focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent"
            required
            autoFocus
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="reminder" className="block text-sm font-medium text-[#0F172A]">Reminder Time</label>
          <input
            id="reminder"
            type="datetime-local"
            value={reminderTime}
            onChange={(e) => setReminderTime(e.target.value)}
            className="w-full px-4 py-2 border border-[#E2E8F0] rounded-md focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent"
            required
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 px-4 py-2 border border-[#E2E8F0] text-[#64748B] rounded-md hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="flex-1 px-4 py-2 bg-[#3B82F6] text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  );
}