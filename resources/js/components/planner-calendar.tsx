import React, { useState, useEffect, useCallback, JSX } from 'react';
import { usePage } from '@inertiajs/react';
import { type SharedData } from '@/types';
import { Plus, Trash2, ChevronLeft, ChevronRight, CalendarDays, BookOpen } from 'lucide-react';

async function ensureCsrf(): Promise<void> {
  try {
    await fetch('/sanctum/csrf-cookie', { credentials: 'include' });
  } catch { /* ignore */ }
}

type TimetableItem = {
  id: number; course: string; lecturer: string; date: string; time: string; location: string; user_id?: number | null;
};

type ActivityItem = {
  id: number; title: string; description?: string | null; date?: string | null; user_id?: number | null;
};

export type CalendarEvent = {
  id: string;
  source: 'planner' | 'activity';
  title: string;
  subtitle: string;
  date: string;
  time?: string;
  color: 'amber' | 'emerald';
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function useMonth() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const prev = useCallback(() => setMonth(m => (m === 0 ? (setYear(y => y - 1), 11) : m - 1)), []);
  const next = useCallback(() => setMonth(m => (m === 11 ? (setYear(y => y + 1), 0) : m + 1)), []);
  const today = useCallback(() => { const d = new Date(); setYear(d.getFullYear()); setMonth(d.getMonth()); }, []);
  return { year, month, prev, next, today };
}

function buildCalendarGrid(year: number, month: number): (number | null)[][] {
  const first = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const weeks: (number | null)[][] = [];
  let week: (number | null)[] = new Array(first).fill(null);
  for (let d = 1; d <= daysInMonth; d++) {
    week.push(d);
    if (week.length === 7) { weeks.push(week); week = []; }
  }
  if (week.length > 0) { while (week.length < 7) week.push(null); weeks.push(week); }
  return weeks;
}

function eventsForDay(events: CalendarEvent[], day: number | null, year: number, month: number): CalendarEvent[] {
  if (day === null) return [];
  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  return events.filter(e => e.date === dateStr);
}

type Props = {
  compact?: boolean;
};

export default function PlannerCalendar({ compact }: Props): JSX.Element {
  const { props } = usePage<SharedData>();
  const currentUserId = props?.auth?.user?.id ?? null;
  const { year, month, prev, next, today } = useMonth();
  const grid = buildCalendarGrid(year, month);

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const [showPlannerForm, setShowPlannerForm] = useState(false);
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [course, setCourse] = useState('');
  const [lecturer, setLecturer] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [pDate, setPDate] = useState('');
  const [aTitle, setATitle] = useState('');
  const [aDescription, setADescription] = useState('');
  const [aDate, setADate] = useState('');

  useEffect(() => {
    if (selectedDay !== null) {
      const ds = `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
      setPDate(ds);
      setADate(ds);
    }
  }, [selectedDay, year, month]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true); setError(null);
      try {
        const [tRes, aRes] = await Promise.all([
          fetch('/api/timetable', { credentials: 'include' }),
          fetch('/api/activity', { credentials: 'include' }),
        ]);
        if (!tRes.ok) throw new Error(`Failed to load planner (${tRes.status})`);
        if (!aRes.ok) throw new Error(`Failed to load activities (${aRes.status})`);
        const tData = await tRes.json();
        const aData = await aRes.json();
        if (!mounted) return;
        const planner: CalendarEvent[] = (Array.isArray(tData) ? tData : []).map((t: TimetableItem) => ({
          id: `p-${t.id}`, source: 'planner' as const, title: t.course, subtitle: `${t.lecturer} · ${t.location}`, date: t.date, time: t.time, color: 'amber' as const,
        }));
        const activity: CalendarEvent[] = (Array.isArray(aData) ? aData : []).filter((a: ActivityItem) => a.date).map((a: ActivityItem) => ({
          id: `a-${a.id}`, source: 'activity' as const, title: a.title, subtitle: a.description || '', date: a.date as string, color: 'emerald' as const,
        }));
        setEvents([...planner, ...activity]);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to load');
      } finally { if (mounted) setLoading(false); }
    }
    load();
    return () => { mounted = false; };
  }, []);

  async function createPlanner(e: React.FormEvent) {
    e.preventDefault();
    if (!course.trim() || !lecturer.trim() || !pDate || !time.trim() || !location.trim()) return setError('All fields required');
    await ensureCsrf(); setError(null);
    try {
      const res = await fetch('/api/timetable', {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ course: course.trim(), lecturer: lecturer.trim(), date: pDate, time: time.trim(), location: location.trim(), user_id: currentUserId }),
      });
      if (!res.ok) { const err = await res.json().catch(() => null); throw new Error(err?.message || `Failed (${res.status})`); }
      const created = await res.json();
      setEvents(prev => [{ id: `p-${created.id}`, source: 'planner', title: created.course, subtitle: `${created.lecturer} · ${created.location}`, date: created.date, time: created.time, color: 'amber' }, ...prev]);
      setCourse(''); setLecturer(''); setTime(''); setLocation(''); setShowPlannerForm(false); setSelectedDay(null);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Failed'); }
  }

  async function createActivity(e: React.FormEvent) {
    e.preventDefault();
    if (!aTitle.trim() || !aDate) return setError('Title and date required');
    await ensureCsrf(); setError(null);
    try {
      const res = await fetch('/api/activity', {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: aTitle.trim(), description: aDescription.trim() || null, date: aDate, user_id: currentUserId }),
      });
      if (!res.ok) { const err = await res.json().catch(() => null); throw new Error(err?.message || `Failed (${res.status})`); }
      const created = await res.json();
      setEvents(prev => [{ id: `a-${created.id}`, source: 'activity', title: created.title, subtitle: created.description || '', date: created.date, color: 'emerald' }, ...prev]);
      setATitle(''); setADescription(''); setShowActivityForm(false); setSelectedDay(null);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Failed'); }
  }

  async function deleteEvent(ev: CalendarEvent) {
    if (!confirm(`Delete "${ev.title}"?`)) return;
    await ensureCsrf();
    try {
      const [prefix, id] = ev.id.split('-');
      const endpoint = prefix === 'p' ? `/api/timetable/${id}` : `/api/activity/${id}`;
      const res = await fetch(endpoint, { method: 'DELETE', credentials: 'include', headers: { 'Content-Type': 'application/json' } });
      if (!res.ok) throw new Error(`Delete failed (${res.status})`);
      setEvents(prev => prev.filter(e => e.id !== ev.id));
    } catch (e: unknown) { alert(e instanceof Error ? e.message : 'Delete failed'); }
  }

  const selectedEvents = selectedDay !== null ? eventsForDay(events, selectedDay, year, month) : [];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className={`flex items-center justify-between mb-3 ${compact ? '' : 'mb-4'}`}>
        <div className="flex items-center gap-2">
          <CalendarDays className={`${compact ? 'w-4 h-4' : 'w-5 h-5'} text-amber-600`} />
          <h2 className={`font-bold ${compact ? 'text-sm' : 'text-lg'}`}>{compact ? `${MONTHS[month].slice(0, 3)} ${year}` : `${MONTHS[month]} ${year}`}</h2>
          {!compact && <button onClick={today} className="text-xs px-2 py-1 border rounded hover:bg-gray-100">Today</button>}
        </div>
        <div className="flex items-center gap-2">
          {!compact && (
            <div className="flex items-center gap-1 text-xs mr-2">
              <span className="inline-block w-2 h-2 rounded-full bg-amber-400" /> Planner
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 ml-2" /> Activity
            </div>
          )}
          {!compact && (
            <div className="flex gap-1">
              <button onClick={() => setShowPlannerForm(true)} className="inline-flex items-center gap-1 px-2 py-1 bg-amber-600 text-white rounded text-xs"><Plus className="w-3 h-3" /> Class</button>
              <button onClick={() => setShowActivityForm(true)} className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-600 text-white rounded text-xs"><Plus className="w-3 h-3" /> Activity</button>
            </div>
          )}
          <div className="flex gap-1">
            <button onClick={prev} className="p-1 border rounded hover:bg-gray-100"><ChevronLeft className={`${compact ? 'w-3 h-3' : 'w-4 h-4'}`} /></button>
            <button onClick={next} className="p-1 border rounded hover:bg-gray-100"><ChevronRight className={`${compact ? 'w-3 h-3' : 'w-4 h-4'}`} /></button>
          </div>
        </div>
      </div>

      {error && <div className="text-xs text-red-600 mb-1">{error}</div>}

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 border-t border-l flex-1">
        {DAYS.map(d => <div key={d} className={`font-semibold text-gray-500 text-center border-r border-b bg-gray-50 ${compact ? 'text-[10px] py-1' : 'text-xs py-2'}`}>{compact ? d[0] : d}</div>)}
        {grid.flat().map((day, i) => {
          const dayEvents = eventsForDay(events, day, year, month);
          const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
          const isSelected = day === selectedDay;
          return (
            <div
              key={i}
              onClick={() => setSelectedDay(isSelected && day !== null ? null : day)}
              className={`border-r border-b p-0.5 cursor-pointer transition-colors ${isSelected ? 'bg-amber-50' : 'hover:bg-gray-50'} ${day === null ? 'bg-gray-50/50' : ''} ${compact ? 'min-h-[50px]' : 'min-h-[90px]'}`}
            >
              {day !== null && (
                <>
                  <div className={`${compact ? 'text-[10px] w-4 h-4' : 'text-xs w-5 h-5'} font-medium flex items-center justify-center rounded-full mb-0.5 ${isToday ? 'bg-amber-600 text-white' : 'text-gray-700'}`}>{day}</div>
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, compact ? 1 : 2).map(ev => (
                      <div key={ev.id} className={`${compact ? 'text-[8px] px-0.5' : 'text-[10px] px-1'} py-0.5 rounded truncate ${ev.color === 'amber' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                        {compact ? '' : (ev.time ? `${ev.time} ` : '')}{ev.title}
                      </div>
                    ))}
                    {dayEvents.length > (compact ? 1 : 2) && <div className={`text-gray-400 px-0.5 ${compact ? 'text-[8px]' : 'text-[10px]'}`}>+{dayEvents.length - (compact ? 1 : 2)}</div>}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Compact quick-add */}
      {compact && (
        <div className="flex gap-2 mt-2">
          <button onClick={() => { setShowPlannerForm(true); const d = new Date(); setPDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`); }} className="flex-1 text-xs px-2 py-1.5 bg-amber-600 text-white rounded flex items-center justify-center gap-1"><Plus className="w-3 h-3" /> Class</button>
          <button onClick={() => { setShowActivityForm(true); const d = new Date(); setADate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`); }} className="flex-1 text-xs px-2 py-1.5 bg-emerald-600 text-white rounded flex items-center justify-center gap-1"><Plus className="w-3 h-3" /> Activity</button>
        </div>
      )}

      {/* Selected Day Detail */}
      {selectedDay !== null && !compact && (
        <div className="mt-3 border-t pt-2">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold">{MONTHS[month]} {selectedDay}, {year}</h3>
            <div className="flex gap-1">
              <button onClick={() => setShowPlannerForm(true)} className="text-xs px-2 py-1 bg-amber-600 text-white rounded"><Plus className="w-3 h-3 inline" /> Class</button>
              <button onClick={() => setShowActivityForm(true)} className="text-xs px-2 py-1 bg-emerald-600 text-white rounded"><Plus className="w-3 h-3 inline" /> Activity</button>
            </div>
          </div>
          {selectedEvents.length === 0 && <p className="text-xs text-gray-400">No events on this day.</p>}
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {selectedEvents.map(ev => (
              <div key={ev.id} className={`flex items-center justify-between text-xs px-2.5 py-1.5 rounded ${ev.color === 'amber' ? 'bg-amber-50 border border-amber-200' : 'bg-emerald-50 border border-emerald-200'}`}>
                <div className="flex items-center gap-1.5 min-w-0 truncate">
                  {ev.color === 'amber' ? <BookOpen className="w-3 h-3 shrink-0 text-amber-600" /> : <CalendarDays className="w-3 h-3 shrink-0 text-emerald-600" />}
                  <span className="font-medium truncate">{ev.title}</span>
                  {ev.subtitle && <span className="text-gray-500 truncate">— {ev.subtitle}</span>}
                  {ev.time && <span className="text-gray-400">@ {ev.time}</span>}
                </div>
                <button onClick={() => deleteEvent(ev)} className="text-red-400 hover:text-red-600 shrink-0 ml-1"><Trash2 className="w-3 h-3" /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading && <div className="text-xs text-gray-500 mt-1">Loading…</div>}

      {/* Planner Form Modal */}
      {showPlannerForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setShowPlannerForm(false)}>
          <div className="bg-white rounded-xl shadow-xl p-5 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold mb-3 flex items-center gap-2"><BookOpen className="w-4 h-4 text-amber-600" /> New Class</h3>
            <form onSubmit={createPlanner} className="grid gap-3">
              <div className="grid grid-cols-2 gap-3">
                <input value={course} onChange={e => setCourse(e.target.value)} placeholder="Course" required className="w-full rounded border px-3 py-2 text-sm" />
                <input value={lecturer} onChange={e => setLecturer(e.target.value)} placeholder="Lecturer" required className="w-full rounded border px-3 py-2 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input value={pDate} onChange={e => setPDate(e.target.value)} type="date" required className="w-full rounded border px-3 py-2 text-sm" />
                <input value={time} onChange={e => setTime(e.target.value)} type="time" required className="w-full rounded border px-3 py-2 text-sm" />
              </div>
              <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Location" required className="w-full rounded border px-3 py-2 text-sm" />
              <div className="flex gap-2 justify-end mt-1">
                <button type="button" onClick={() => setShowPlannerForm(false)} className="px-3 py-2 border rounded text-sm">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-amber-600 text-white rounded text-sm">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Activity Form Modal */}
      {showActivityForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setShowActivityForm(false)}>
          <div className="bg-white rounded-xl shadow-xl p-5 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold mb-3 flex items-center gap-2"><CalendarDays className="w-4 h-4 text-emerald-600" /> New Activity</h3>
            <form onSubmit={createActivity} className="grid gap-3">
              <input value={aTitle} onChange={e => setATitle(e.target.value)} placeholder="Title" required className="w-full rounded border px-3 py-2 text-sm" />
              <input value={aDescription} onChange={e => setADescription(e.target.value)} placeholder="Description (optional)" className="w-full rounded border px-3 py-2 text-sm" />
              <input value={aDate} onChange={e => setADate(e.target.value)} type="date" required className="w-full rounded border px-3 py-2 text-sm" />
              <div className="flex gap-2 justify-end mt-1">
                <button type="button" onClick={() => setShowActivityForm(false)} className="px-3 py-2 border rounded text-sm">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded text-sm">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
