import React, { useState, useMemo, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { fund } from "@/routes";
import { type BreadcrumbItem } from '@/types'
import AppLayout from "@/layouts/app-layout";
import { Head } from '@inertiajs/react'

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Fund',
        href: fund().url,
    },
];

type FormState = {
    type: "in" | "out"
    amount: string
    source: string
    date: string
    notes: string
}

type RecordItem = {
    id: number
    type: "in" | "out"
    amount: number // dollars (decimal)
    source?: string
    date?: string
    notes?: string
}

export default function FundPage(): JSX.Element {
    const [form, setForm] = useState<FormState>({ type: "in", amount: "", source: "", date: "", notes: "" })
    const [records, setRecords] = useState<RecordItem[]>([])

    function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
        const { name, value } = e.target
        setForm(prev => ({ ...prev, [name]: value } as FormState))
    }

    // <-- add these helpers ------------------------------------------------
    const ACCOUNT_ID: number = 1 // TODO: replace with real account id (prop, context or current user mapping)

    // If using Laravel Sanctum cookie auth: call /sanctum/csrf-cookie first and send credentials: 'include'
    async function ensureCsrf(): Promise<void> {
        try {
            await fetch("/sanctum/csrf-cookie", { credentials: "include" })
        } catch (e) { /* ignore */ }
    }

    async function saveRecordToApi(record: RecordItem) {
        // record.amount is dollars in your UI; convert to cents
        const amountCents = Math.round(Number(record.amount) * 100)
        const payload = {
            account_id: ACCOUNT_ID,
            amount: amountCents,        // integer cents
            currency: "usd",
            status: "completed",
            source: record.source || "ui",
            metadata: { notes: record.notes || "", date: record.date || null }
        }

        // If using token (API token / Bearer), set Authorization header instead of credentials.
        await ensureCsrf()

        const res = await fetch("/api/transactions", {
            method: "POST",
            credentials: "include", // include cookies for Sanctum; remove if using token auth
            headers: { "Content-Type": "application/json" /*, Authorization: 'Bearer ...' */ },
            body: JSON.stringify(payload),
        })

        if (!res.ok) {
            const err = await res.json().catch(() => ({ error: res.statusText }))
            throw new Error(err.error || "Failed to save transaction")
        }

        return res.json()
    }

    // Example: call API whenever a new local record is added
    async function addRecord(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        const amount = parseFloat(form.amount)
        if (Number.isNaN(amount) || amount === 0) return
        const signed = form.type === "in" ? Math.abs(amount) : -Math.abs(amount)
        const r: RecordItem = { id: Date.now(), type: form.type, ...form, amount: signed } as RecordItem

        // optimistic UI
        setRecords(prev => [r, ...prev])
        setForm({ type: "in", amount: "", source: "", date: "", notes: "" })

        // persist to API (handle errors as needed)
        try {
            await saveRecordToApi(r)
            // optionally mark record as saved / update id from server
        } catch (err) {
            console.error("Save failed", err)
            // rollback or show error to user
        }
    }
    // <-- end helpers -----------------------------------------------------

    function removeRecord(id: number) {
        setRecords(prev => prev.filter(r => r.id !== id))
    }

    // optional: load recent transactions from API on mount (if you add a GET route)
    useEffect(() => {
        async function load() {
            try {
                const res = await fetch("/api/transactions?limit=50", {
                    credentials: "include"
                })
                if (res.ok) {
                    const list = await res.json()
                    // map server rows (amount in cents) to UI format (dollars)
                    setRecords(list.map((t: any) => ({
                        id: t.id,
                        type: t.amount >= 0 ? "in" : "out",
                        amount: Number(t.amount) / 100,
                        source: t.source,
                        date: t.created_at,
                        notes: (t.metadata && t.metadata.notes) || ""
                    })))
                }
            } catch (e) { /* ignore */ }
        }
        load()
    }, [])

    const totals = useMemo(() => {
        const incoming = records.filter(r => r.amount > 0).reduce((s, r) => s + r.amount, 0)
        const outgoing = records.filter(r => r.amount < 0).reduce((s, r) => s + Math.abs(r.amount), 0)
        const balance = incoming - outgoing
        return { incoming, outgoing, balance }
    }, [records])

    const quickAdd = (amt: number, type: "in" | "out" = "in") => {
        const signed = type === "in" ? Math.abs(amt) : -Math.abs(amt)
        const r: RecordItem = { id: Date.now(), type, amount: signed, source: "Quick", date: new Date().toISOString().slice(0, 10), notes: "" }
        setRecords(prev => [r, ...prev])
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title='Fund' />
            <div className="min-h-screen  p-6">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-white shadow-xl rounded-2xl p-6">
                        <header className="flex items-center justify-between mb-6">
                            <h1 className="text-2xl font-extrabold ">Fund Manager</h1>
                            <div className="text-right">
                                <div className="text-sm text-gray-500">Balance</div>
                                <div className="text-2xl font-bold">
                                    <span className={totals.balance >= 0 ? "text-green-600" : "text-red-600"}>
                                        ${totals.balance.toFixed(2)}
                                    </span>
                                </div>
                                <div className="text-xs text-gray-500">
                                    In: <span className="text-green-600 font-medium">${totals.incoming.toFixed(2)}</span>{" "}
                                    Out: <span className="text-red-600 font-medium">${totals.outgoing.toFixed(2)}</span>
                                </div>
                            </div>
                        </header>

                        <form onSubmit={addRecord} className="grid gap-3 md:grid-cols-5 items-end mb-5">
                            <div className="md:col-span-1">
                                <label className="block text-sm font-medium text-gray-600 mb-1">Type</label>
                                <select
                                    name="type"
                                    value={form.type}
                                    onChange={handleChange}
                                    className="w-full rounded-lg border border-gray-200 px-3 py-2 bg-white"
                                >
                                    <option value="in">Add (In)</option>
                                    <option value="out">Withdraw (Out)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">Amount</label>
                                <Input
                                    name="amount"
                                    type="number"
                                    step="0.01"
                                    value={form.amount}
                                    onChange={handleChange}
                                    placeholder="e.g. 100.00"
                                    className="w-full"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">Source / To</label>
                                <Input
                                    name="source"
                                    value={form.source}
                                    onChange={handleChange}
                                    placeholder="e.g. Donation / Bank"
                                    className="w-full"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">Date</label>
                                <Input
                                    name="date"
                                    type="date"
                                    value={form.date}
                                    onChange={handleChange}
                                    className="w-full"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">Notes</label>
                                <Input
                                    name="notes"
                                    value={form.notes}
                                    onChange={handleChange}
                                    placeholder="Optional"
                                    className="w-full"
                                />
                            </div>

                            <div className="md:col-span-5 flex justify-between mt-2">
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => quickAdd(50, "in")}
                                        className="inline-flex items-center px-3 py-2 bg-green-50 text-green-700 rounded-lg border border-green-100 text-sm"
                                    >
                                        +$50 Quick
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => quickAdd(100, "in")}
                                        className="inline-flex items-center px-3 py-2 bg-green-600 text-white rounded-lg text-sm shadow"
                                    >
                                        +$100
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => quickAdd(20, "out")}
                                        className="inline-flex items-center px-3 py-2 bg-red-50 text-red-700 rounded-lg border border-red-100 text-sm"
                                    >
                                        -$20 Quick
                                    </button>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        type="submit"
                                        className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg shadow hover:bg-emerald-700 transition"
                                    >
                                        Add Record
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setRecords([])}
                                        className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg border hover:bg-gray-50"
                                    >
                                        Clear All
                                    </button>
                                </div>
                            </div>
                        </form>

                        <section>
                            <h2 className="text-sm font-semibold text-gray-600 mb-3">History</h2>
                            <div className="space-y-3">
                                {records.length === 0 && (
                                    <div className="text-sm text-gray-500">No records yet. Add funds or withdraw above.</div>
                                )}
                                {records.map(r => (
                                    <div key={r.id} className="flex items-center justify-between bg-emerald-50 border border-emerald-100 rounded-lg p-3">
                                        <div>
                                            <div className="flex items-baseline gap-3">
                                                <div className="font-medium text-emerald-800">{r.source || (r.type === "in" ? "Fund" : "Withdrawal")}</div>
                                                <div className="text-xs text-gray-500">{r.date || "No date"}</div>
                                            </div>
                                            <div className="text-sm text-gray-600">{r.notes}</div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className={`font-semibold ${r.amount >= 0 ? "text-green-600" : "text-red-600"}`}>
                                                ${Number(r.amount).toFixed(2)}
                                            </div>
                                            <button
                                                onClick={() => removeRecord(r.id)}
                                                className="text-sm text-gray-500 hover:text-red-600"
                                                aria-label="Remove"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </AppLayout>
    )
}