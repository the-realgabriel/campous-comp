import React, { useState, useEffect, JSX } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, usePage } from '@inertiajs/react';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { eventspace } from '@/routes';
import { Plus, Users, MapPin, Clock, CalendarDays, Trash2, LogIn, LogOut } from 'lucide-react';

async function ensureCsrf(): Promise<void> {
  try { await fetch('/sanctum/csrf-cookie', { credentials: 'include' }); } catch { /* ignore */ }
}

type EventItem = {
  id: number;
  title: string;
  description?: string | null;
  date: string;
  time?: string | null;
  location?: string | null;
  category?: string | null;
  max_attendees?: number | null;
  user_id: number;
  creator?: { id: number; name: string };
  attendees_count?: number;
  is_attending?: boolean;
};

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Event Space', href: eventspace().url },
];

const CATEGORIES = ['Social', 'Academic', 'Sports', 'Music', 'Art', 'Tech', 'Food', 'Other'];

export default function EventSpace(): JSX.Element {
  const { props } = usePage<SharedData>();
  const currentUser = props.auth.user;

  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showForm, setShowForm] = useState(false);
  const [joining, setJoining] = useState<number | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('');
  const [maxAttendees, setMaxAttendees] = useState('');

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch('/api/events', { credentials: 'include' });
        if (!res.ok) throw new Error(`Failed (${res.status})`);
        const data = await res.json();
        if (mounted) setEvents(Array.isArray(data) ? data : []);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to load');
      } finally { if (mounted) setLoading(false); }
    }
    load();
    return () => { mounted = false; };
  }, []);

  async function createEvent(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !date) return setError('Title and date required');
    await ensureCsrf(); setError(null);
    try {
      const payload: Record<string, unknown> = {
        title: title.trim(), description: description.trim() || null, date,
        time: time.trim() || null, location: location.trim() || null,
        category: category || null, user_id: currentUser.id,
      };
      if (maxAttendees) payload.max_attendees = parseInt(maxAttendees);
      const res = await fetch('/api/events', {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) { const err = await res.json().catch(() => null); throw new Error(err?.message || `Failed (${res.status})`); }
      const created = await res.json();
      setEvents(prev => [created, ...prev]);
      setTitle(''); setDescription(''); setDate(''); setTime(''); setLocation(''); setCategory(''); setMaxAttendees('');
      setShowForm(false);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Failed'); }
  }

  async function toggleJoin(ev: EventItem) {
    setJoining(ev.id);
    await ensureCsrf();
    try {
      const method = ev.is_attending ? 'leave' : 'join';
      const res = await fetch(`/api/events/${ev.id}/${method}`, {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.message || `Failed (${res.status})`);
      }
      const data = await res.json();
      setEvents(prev => prev.map(e => e.id === ev.id ? { ...e, attendees_count: data.attendees_count, is_attending: data.is_attending } : e));
    } catch (e: unknown) { alert(e instanceof Error ? e.message : 'Failed'); }
    finally { setJoining(null); }
  }

  async function deleteEvent(id: number) {
    if (!confirm('Delete this event?')) return;
    await ensureCsrf();
    try {
      const res = await fetch(`/api/events/${id}`, { method: 'DELETE', credentials: 'include', headers: { 'Content-Type': 'application/json' } });
      if (!res.ok) throw new Error(`Delete failed (${res.status})`);
      setEvents(prev => prev.filter(e => e.id !== id));
    } catch (e: unknown) { alert(e instanceof Error ? e.message : 'Delete failed'); }
  }

  const filtered = selectedCategory === 'All' ? events : events.filter(e => e.category === selectedCategory);

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Event Space" />
      <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
        <div className="relative flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 md:min-h-min dark:border-sidebar-border">
          <div className="p-4 rounded-xl shadow-md h-full relative flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-amber-600" />
                <h1 className="text-lg font-bold">Event Space</h1>
              </div>
              <button onClick={() => setShowForm(s => !s)} className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-600 text-white rounded text-sm"><Plus className="w-4 h-4" /> Create Event</button>
            </div>

            {error && <div className="text-sm text-red-600 mb-2">{error}</div>}

            {/* Category filter */}
            <div className="flex gap-2 mb-4 flex-wrap">
              {['All', ...CATEGORIES].map(c => (
                <button key={c} onClick={() => setSelectedCategory(c)}
                  className={`text-xs px-3 py-1 rounded-full border transition-colors ${selectedCategory === c ? 'bg-amber-600 text-white border-amber-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>{c}</button>
              ))}
            </div>

            {loading && <div className="text-sm text-gray-500">Loading…</div>}

            {!loading && filtered.length === 0 && (
              <div className="text-sm text-gray-400 text-center py-10">No events yet. Create one!</div>
            )}

            {/* Events grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 flex-1">
              {filtered.map(ev => (
                <div key={ev.id} className="border border-gray-200 rounded-xl p-4 flex flex-col hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-[10px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">{ev.category || 'General'}</span>
                    {ev.user_id === currentUser.id && (
                      <button onClick={() => deleteEvent(ev.id)} className="text-gray-300 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                    )}
                  </div>
                  <h3 className="font-semibold text-sm mb-1">{ev.title}</h3>
                  {ev.description && <p className="text-xs text-gray-500 mb-3 line-clamp-2">{ev.description}</p>}
                  <div className="mt-auto space-y-1 text-xs text-gray-500">
                    <div className="flex items-center gap-1.5"><CalendarDays className="w-3 h-3" /> {ev.date}</div>
                    {ev.time && <div className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> {ev.time}</div>}
                    {ev.location && <div className="flex items-center gap-1.5"><MapPin className="w-3 h-3" /> {ev.location}</div>}
                    <div className="flex items-center gap-1.5"><Users className="w-3 h-3" /> {ev.attendees_count ?? 0}{ev.max_attendees ? ` / ${ev.max_attendees}` : ''} attending</div>
                    {ev.creator && <div className="text-[10px] text-gray-400 mt-1">by {ev.creator.name}</div>}
                  </div>
                      <button onClick={() => toggleJoin(ev)} disabled={joining === ev.id}
                    className={`mt-3 w-full text-xs py-1.5 rounded-lg flex items-center justify-center gap-1 transition-colors ${
                      ev.is_attending
                        ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        : 'bg-amber-600 text-white hover:bg-amber-700'
                    } ${joining === ev.id ? 'opacity-50' : ''}`}>
                    {joining === ev.id ? '...' : ev.is_attending ? <><LogOut className="w-3 h-3" /> Leave</> : <><LogIn className="w-3 h-3" /> Join</>}
                  </button>
                </div>
              ))}
            </div>

            {/* Create Event Modal */}
            {showForm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setShowForm(false)}>
                <div className="bg-white rounded-xl shadow-xl p-5 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                  <h3 className="font-semibold mb-3 flex items-center gap-2"><Plus className="w-4 h-4 text-amber-600" /> Create Event</h3>
                  <form onSubmit={createEvent} className="grid gap-3">
                    <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Event title" required className="w-full rounded border px-3 py-2 text-sm" />
                    <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description (optional)" rows={3} className="w-full rounded border px-3 py-2 text-sm resize-none" />
                    <div className="grid grid-cols-2 gap-3">
                      <input value={date} onChange={e => setDate(e.target.value)} type="date" required className="w-full rounded border px-3 py-2 text-sm" />
                      <input value={time} onChange={e => setTime(e.target.value)} type="time" className="w-full rounded border px-3 py-2 text-sm" />
                    </div>
                    <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Location (optional)" className="w-full rounded border px-3 py-2 text-sm" />
                    <div className="grid grid-cols-2 gap-3">
                      <select value={category} onChange={e => setCategory(e.target.value)} className="w-full rounded border px-3 py-2 text-sm">
                        <option value="">Select category</option>
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <input value={maxAttendees} onChange={e => setMaxAttendees(e.target.value)} type="number" min="1" placeholder="Max attendees (optional)" className="w-full rounded border px-3 py-2 text-sm" />
                    </div>
                    <div className="flex gap-2 justify-end mt-1">
                      <button type="button" onClick={() => setShowForm(false)} className="px-3 py-2 border rounded text-sm">Cancel</button>
                      <button type="submit" className="px-4 py-2 bg-amber-600 text-white rounded text-sm">Create</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
