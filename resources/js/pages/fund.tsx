import React, { useState, useMemo, useEffect } from "react"
import { Input } from "@/components/ui/input"
// ... (other imports remain the same)
import { fund } from "@/routes";
import { type BreadcrumbItem } from '@/types'
import AppLayout from "@/layouts/app-layout";
import { Head } from '@inertiajs/react'
import { JSX } from "react/jsx-runtime";


// --- Global Interface for TypeScript ---
// This tells TypeScript that `webpayCheckout` exists on the window object.
declare global {
    interface Window {
        webpayCheckout: (request: PaymentRequest) => void;
    }
}

// --- Payment Types (Optional but recommended) ---
type PaymentRequest = {
    merchant_code: string;
    pay_item_id: string;
    txn_ref: string;
    amount: string; // Amount often kept as string for payment APIs
    currency: number;
    site_redirect_url: string;
    onComplete: (response: any) => void;
    mode: "TEST" | "LIVE";
};


// ... (Existing types: breadcrumbs, FormState, RecordItem, ACCOUNT_ID, helpers like ensureCsrf, saveRecordToApi, deleteRecordFromApi)
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
    amount: number
    source?: string
    date?: string
    notes?: string
}

const ACCOUNT_ID: number = 1 // TODO: replace with real account id (prop, context or current user mapping)

async function ensureCsrf(): Promise<void> {
    try {
        await fetch("/sanctum/csrf-cookie", { credentials: "include" })
    } catch (e) { /* ignore */ }
}

async function saveRecordToApi(record: RecordItem) {
    const amountCents = Math.round(record.amount * 100)
    const payload = {
        account_id: ACCOUNT_ID,
        amount: amountCents,
        currency: "usd",
        status: "completed",
        source: record.source || "ui",
        metadata: { notes: record.notes || "", date: record.date || null }
    }

    await ensureCsrf()

    const res = await fetch("/api/transactions", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    })

    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }))
        throw new Error(err.error || "Failed to save transaction")
    }

    return res.json()
}

async function deleteRecordFromApi(id: number): Promise<void> {
    await ensureCsrf()
    
    const res = await fetch(`/api/transactions/${id}`, {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
    })

    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }))
        throw new Error(err.error || "Failed to delete transaction")
    }
}


// --- Component ---
export default function FundPage(): JSX.Element {
    const [form, setForm] = useState<FormState>({ type: "in", amount: "", source: "", date: "", notes: "" })
    const [records, setRecords] = useState<RecordItem[]>([])

    function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
        const { name, value } = e.target
        const key = name as keyof FormState;

        setForm(prev => ({ 
            ...prev, 
            [key]: value 
        }))
    }

    // Existing function for adding a record without payment (e.g., manual entry)
    async function addRecord(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        const amount = parseFloat(form.amount)
        if (Number.isNaN(amount) || amount === 0) return

        const signed = form.type === "in" ? Math.abs(amount) : -Math.abs(amount)
        
        const r: RecordItem = { 
            id: Date.now(), 
            type: form.type, 
            amount: signed, 
            source: form.source, 
            date: form.date, 
            notes: form.notes 
        }

        setRecords(prev => [r, ...prev])
        setForm({ type: "in", amount: "", source: "", date: "", notes: "" })

        try {
            await saveRecordToApi(r)
        } catch (err) {
            console.error("Save failed, rolling back local record.", err)
            setRecords(prev => prev.filter(rec => rec.id !== r.id)) 
        }
    }
    
    // --- NEW PAYMENT GATEWAY LOGIC ---
    
    // 1. Payment Callback Handler
    const paymentCallback = (response: any) => {
        console.log("Payment Gateway Response:", response);
        // TODO: Handle the response here. 
        // Typically, you check response status and then call your API 
        // to verify the transaction reference (txn_ref) and update the fund record.
    }

    // 2. Payment Submission Handler
    const handlePaymentSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        // Check if the external function is loaded
        if (typeof window.webpayCheckout !== 'function') {
            console.error("Payment checkout function not available. Did you include the external script?");
            return;
        }

        // Use the current location for site_redirect_url
        const redirectUrl = window.location.href; 
        
        // Use the amount from the form, but validate and ensure it's a string as required by your snippet.
        const amountValue = (parseFloat(form.amount) * 100).toFixed(0); // Convert to cents/kobo and make integer string
        
        // You should use a unique txn_ref based on your backend logic, not Math.random()
        const txnRef = `MX-TRN-${Date.now()}`; 

        const paymentRequest: PaymentRequest = {
            merchant_code: "MX6072",
            pay_item_id: "9405967",
            txn_ref: txnRef, 
            amount: amountValue, // Use amount from form, converted to cents
            currency: 566, // NGN currency code
            site_redirect_url: redirectUrl,
            onComplete: paymentCallback,
            mode: "TEST"
        };

        window.webpayCheckout(paymentRequest);
    };
    // ------------------------------------

    async function removeRecord(id: number) {
        setRecords(prev => prev.filter(r => r.id !== id))
        
        try {
            await deleteRecordFromApi(id)
        } catch (err) {
            console.error("Delete failed on server.", err)
            alert("Failed to delete record from server. Please refresh.")
        }
    }

    // ... (useEffect and useMemo remain the same)
    useEffect(() => {
        // ... (API loading logic)
    }, [])

    const totals = useMemo(() => {
        // ... (totals calculation logic)
        const incoming = records.filter(r => r.amount > 0).reduce((s, r) => s + r.amount, 0)
        const outgoing = records.filter(r => r.amount < 0).reduce((s, r) => s + Math.abs(r.amount), 0)
        const balance = incoming - outgoing
        return { incoming, outgoing, balance }
    }, [records])

    const quickAdd = async (amt: number, type: "in" | "out" = "in") => {
        // ... (quickAdd logic remains the same)
        const signed = type === "in" ? Math.abs(amt) : -Math.abs(amt)
        const r: RecordItem = { 
            id: Date.now(), 
            type, 
            amount: signed, 
            source: "Quick Add", 
            date: new Date().toISOString().slice(0, 10), 
            notes: "" 
        }
        
        setRecords(prev => [r, ...prev])

        try {
            await saveRecordToApi(r)
        } catch (err) {
            console.error("Quick Add Save failed", err)
            setRecords(prev => prev.filter(rec => rec.id !== r.id)) 
        }
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title='Fund' />
            {/* ... (Layout and Header content) ... */}
            <div className="min-h-screen p-6">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-white shadow-xl rounded-2xl p-6">
                        <header className="flex items-center justify-between mb-6">
                            {/* ... (Header details) ... */}
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

                        {/* --- FORM: Changed onSubmit to handlePaymentSubmit --- */}
                        <form onSubmit={handlePaymentSubmit} className="grid gap-3 md:grid-cols-5 items-end mb-5">
                            {/* ... (Form inputs remain the same) ... */}
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
                            {/* ... (Quick Add buttons and Submission buttons) ... */}

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
                                        Pay & Add Fund
                                    </button>
                                    <button
                                        type="button"
                                        onClick={addRecord} // Keeping the manual add record for non-payment uses
                                        className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-lg border hover:bg-blue-50"
                                    >
                                        Manual Add
                                    </button>
                                </div>
                            </div>
                        </form>
                        
                        {/* ... (History section) ... */}
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
                                                Remove (API)
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