import React, { useEffect, useState, JSX } from 'react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { activity } from '@/routes';
import { PlusCircle, Trash2 } from 'lucide-react';


const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Activity',
        href: activity().url,
    },
];

type ActivityItem = {
    id: number
    title: string
    description?: string | null
    date?: string | null
    user_id?: number | null
    created_at?: string
    updated_at?: string
}

async function ensureCsrf(): Promise<void> {
    try {
        await fetch('/sanctum/csrf-cookie', { credentials: 'include' })
    } catch {
        // ignore
    }
}

export default function Activity(): JSX.Element {
    const { props } = usePage<SharedData>()
    const currentUserId = props?.auth?.user?.id ?? null

    const [activities, setActivities] = useState<ActivityItem[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<string | null>(null)

    const [showForm, setShowForm] = useState(false)
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [date, setDate] = useState('')

    useEffect(() => {
        let mounted = true
        async function load() {
            setLoading(true)
            setError(null)
            try {
                const res = await fetch('/api/activity', { credentials: 'include' })
                if (!res.ok) throw new Error(`Failed to load (${res.status})`)
                const data = await res.json()
                if (mounted) setActivities(Array.isArray(data) ? data : [])
            } catch (e: any) {
                setError(e.message ?? 'Failed to load activities')
            } finally {
                if (mounted) setLoading(false)
            }
        }
        load()
        return () => { mounted = false }
    }, [])

    async function createActivity(e?: React.FormEvent) {
        e?.preventDefault()
        if (!title.trim()) return setError('Title is required')

        await ensureCsrf()
        setError(null)
        try {
            const payload = {
                title: title.trim(),
                description: description.trim() || null,
                date: date || null,
                user_id: currentUserId,
            }
            const res = await fetch('/api/activity', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })
            if (!res.ok) {
                const err = await res.json().catch(() => null)
                throw new Error(err?.message || `Dev wants to sleep abeg (${res.status})`)
            }
            const created = await res.json()
            // APIResource usually returns created model
            setActivities(prev => [created, ...prev])
            setTitle('')
            setDescription('')
            setDate('')
            setShowForm(false)
        } catch (e: any) {
            setError(e.message ?? 'Dev wants to sleep abeg')
        }
    }

    async function deleteActivity(id: number) {
        if (!confirm('Delete this activity?')) return
        await ensureCsrf()
        try {
            const res = await fetch(`/api/activity/${id}`, {
                method: 'DELETE',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
            })
            if (!res.ok) throw new Error(`Delete failed (${res.status})`)
            setActivities(prev => prev.filter(a => a.id !== id))
        } catch (e: any) {
            alert(e.message ?? 'Delete failed')
        }
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Activity" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="relative min-h-[60vh] flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 md:min-h-min dark:border-sidebar-border">
                    <div className="p-4 bg-white rounded-xl shadow-md mb-6 h-full relative">
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="text-sm font-semibold text-gray-500 mb-2">Activity</h3>
                                <p className="text-2xl font-bold text-gray-800">Recent activity</p>
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setShowForm(s => !s)}
                                    className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-amber-600 text-white"
                                >
                                    <PlusCircle className="w-4 h-4" /> New
                                </button>
                            </div>
                        </div>

                        {showForm && (
                            <form onSubmit={createActivity} className="mt-4 grid gap-2 grid-cols-1 sm:grid-cols-4 items-end">
                                <div className="sm:col-span-1">
                                    <label className="text-xs text-slate-600">Title</label>
                                    <input value={title} onChange={e => setTitle(e.target.value)} className="w-full rounded border px-2 py-1" />
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="text-xs text-slate-600">Description</label>
                                    <input value={description} onChange={e => setDescription(e.target.value)} className="w-full rounded border px-2 py-1" />
                                </div>
                                <div className="sm:col-span-1">
                                    <label className="text-xs text-slate-600">Date</label>
                                    <input value={date} onChange={e => setDate(e.target.value)} type="date" className="w-full rounded border px-2 py-1" />
                                </div>

                                <div className="sm:col-span-4 mt-2 flex gap-2">
                                    <button type="submit" className="px-3 py-2 bg-emerald-600 text-white rounded">Create</button>
                                    <button type="button" onClick={() => setShowForm(false)} className="px-3 py-2 border rounded">Cancel</button>
                                </div>
                            </form>
                        )}

                        <div className="mt-6">
                            {loading && <div className="text-sm text-slate-500">Loading…</div>}
                            {error && <div className="text-sm text-red-600">{error}</div>}

                            {!loading && activities.length === 0 && (
                                <div className="text-sm text-slate-500 mt-6">No activities yet.</div>
                            )}

                            <ul className="mt-4 space-y-3">
                                {activities.map(a => (
                                    <li key={a.id} className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-lg p-3">
                                        <div>
                                            <div className="text-sm font-medium text-slate-800">{a.title}</div>
                                            <div className="text-xs text-slate-500">{a.date ?? (a.created_at ? a.created_at.slice(0,10) : '')}</div>
                                            {a.description && <div className="text-sm text-slate-600 mt-1">{a.description}</div>}
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <button onClick={() => deleteActivity(a.id)} className="text-red-500 hover:text-red-700" aria-label="Delete">
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
    )
}