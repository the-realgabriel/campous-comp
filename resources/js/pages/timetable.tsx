import React, { JSX, useState, useEffect } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { timetable } from '@/routes';
import { PlusCircleIcon, Trash2 } from 'lucide-react';
import { usePage } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Timetable',
    href: timetable().url,
  },
];

type TimetableItem = {
  id: number;
  course: string;
  lecturer: string;
  date: string;
  time: string;
  location: string;
  user_id?: number | null;
};

export default function Timetable(): JSX.Element {
  const { props } = usePage<SharedData>();
  const currentUserId = props?.auth?.user?.id ?? null;

  const [date, setDate] = useState('');
  const [course, setCourse] = useState('');
  const [lecturer, setLecturer] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [timetable, setTimetable] = useState<TimetableItem[]>([]);


  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('api', { credentials: 'include' });
        if (!res.ok) throw new Error(`Failed to load (${res.status})`);
        const data = await res.json();
        if (mounted) setTimetable(Array.isArray(data) ? data : []);
      } catch (e: any) {
        setError(e.message ?? 'Failed to load activities');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, []);

  // Assuming ensureCsrf() is defined elsewhere and imported if needed
  async function createActivity(e?: React.FormEvent) {
    e?.preventDefault();

    if (!course.trim()) return setError('Course is required');
    if (!lecturer.trim()) return setError('Lecturer is required');
    if (!date) return setError('Date is required');
    if (!time.trim()) return setError('Time is required');
    if (!location.trim()) return setError('Location is required');

    await ensureCsrf();

    setError(null);

    try {
      const payload = {
        course: course.trim(),
        lecturer: lecturer.trim(),
        date,
        time: time.trim(),
        location: location.trim(),
        user_id: currentUserId,
      };

      const res = await fetch('api', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.message || `Failed to create activity (${res.status})`);
      }

      const created = await res.json();

      setTimetable(prev => [created, ...prev]);
      setCourse('');
      setLecturer('');
      setDate('');
      setTime('');
      setLocation('');
      setShowForm(false);
    } catch (e: any) {
      setError(e.message ?? 'Failed to create activity');
    }
  }

  async function deleteActivity(id: number) {
    if (!confirm('Delete this activity?')) return;

    await ensureCsrf();

    try {
      const res = await fetch(`api/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) throw new Error(`Delete failed (${res.status})`);

      setTimetable(prev => prev.filter(a => a.id !== id));
    } catch (e: any) {
      alert(e.message ?? 'Delete failed');
    }
  }

  return (
    <AppLayout>
      <Head title="Timetable" />

      <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
        <div className="relative min-h-[60vh] flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 md:min-h-min dark:border-sidebar-border">
          <div className="p-4 rounded-xl shadow-md mb-6 h-full relative">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-500 mb-2">Activity</h3>
                <p className="text-2xl font-bold text-gray-800">Recent activity</p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowForm(s => !s)}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-amber-600 "
                >
                  <PlusCircleIcon className="w-4 h-4" /> New
                </button>
              </div>
            </div>

            {showForm && (
              <form onSubmit={createActivity} className="mt-4 grid gap-2 grid-cols-1 sm:grid-cols-5 items-end">
                <div className="sm:col-span-1">
                  <label className="text-xs ">Course</label>
                  <input
                    value={course}
                    onChange={e => setCourse(e.target.value)}
                    className="w-full rounded border px-2 py-1"
                    required
                  />
                </div>

                <div className="sm:col-span-1">
                  <label className="text-xs ">Lecturer</label>
                  <input
                    value={lecturer}
                    onChange={e => setLecturer(e.target.value)}
                    className="w-full rounded border px-2 py-1"
                    required
                  />
                </div>

                <div className="sm:col-span-1">
                  <label className="text-xs ">Date</label>
                  <input
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    type="date"
                    className="w-full rounded border px-2 py-1"
                    required
                  />
                </div>

                <div className="sm:col-span-1">
                  <label className="text-xs ">Time</label>
                  <input
                    value={time}
                    onChange={e => setTime(e.target.value)}
                    type="time"
                    className="w-full rounded border px-2 py-1"
                    required
                  />
                </div>

                <div className="sm:col-span-1">
                  <label className="text-xs ">Location</label>
                  <input
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    className="w-full rounded border px-2 py-1"
                    required
                  />
                </div>

                <div className="sm:col-span-5 mt-2 flex gap-2">
                  <button type="submit" className="px-3 py-2 bg-emerald-600  rounded">
                    Create
                  </button>
                  <button type="button" onClick={() => setShowForm(false)} className="px-3 py-2 border rounded">
                    Cancel
                  </button>
                </div>
              </form>
            )}

            <div className="mt-6">
              {loading && <div className="text-sm ">Loading…</div>}
              {error && <div className="text-sm text-red-600">{error}</div>}

              {!loading && timetable.length === 0 && (
                <div className="text-sm  mt-6">No activities yet.</div>
              )}

              <ul className="mt-4 space-y-3">
                {timetable.map(activity => (
                  <li
                    key={activity.id}
                    className="flex items-center justify-between border border-slate-100 rounded-lg p-3"
                  >
                    <div>
                      <div className="text-sm font-medium ">{activity.course}</div>
                      <div className="text-xs ">
                        {activity.date} {activity.time}
                      </div>
                      <div className="text-sm  mt-1">Lecturer: {activity.lecturer}</div>
                      <div className="text-sm  mt-1">Location: {activity.location}</div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => deleteActivity(activity.id)}
                        className="text-red-500 hover:text-red-700"
                        aria-label="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
