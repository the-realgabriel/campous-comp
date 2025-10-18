import React, { useState, useMemo, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { fund } from "@/routes"
import { type BreadcrumbItem, type SharedData } from '@/types'
import AppLayout from "@/layouts/app-layout"
import { Head, usePage } from '@inertiajs/react'


declare global {
    interface Window {
        webpayCheckout: (request: PaymentRequest) => void;
    }
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Fund',
        href: fund().url,
    },
];

type FormState = {
    type: "in" | "out";
    amount: string;
    source: string;
    date: string;
    notes: string;
};

type RecordItem = {
    id: number;
    serverId?: number;
    type: "in" | "out";
    amount: number;
    source?: string;
    date?: string;
    notes?: string;
};

type PaymentRequest = {
    merchant_code: string;
    pay_item_id: string;
    txn_ref: string;
    amount: string;
    currency: number;
    site_redirect_url: string;
    onComplete: (response: any) => void;
    mode: "TEST" | "LIVE";
};

// --- Constants & API Helpers (No changes needed here) ---
const ACCOUNT_FALLBACK_ID: number | null = null;

async function ensureCsrf(): Promise<void> {
    try {
        await fetch("/sanctum/csrf-cookie", { credentials: "include" });
    } catch {
        /* ignore */
    }
}

async function ensureAccountExistsOnServer(id: number): Promise<boolean> {
    try {
        const res = await fetch(`/api/accounts/${id}`, { credentials: "include" });
        return res.ok;
    } catch {
        return false;
    }
}

async function saveRecordToApi(record: RecordItem, accountId: number | null): Promise<any> {
    if (!accountId) throw new Error("No account selected. Please select or create an account.");

    const amountCents = Math.round(record.amount * 100);
    const payload = {
        account_id: accountId,
        amount: amountCents,
        currency: "usd",
        status: "completed",
        source: record.source || "ui",
        metadata: { notes: record.notes || "", date: record.date || null },
    };

    await ensureCsrf();

    const res = await fetch("/api/transactions", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || "Failed to save transaction");
    }

    return res.json();
}

async function deleteRecordFromApi(serverId: number): Promise<void> {
    await ensureCsrf();

    const res = await fetch(`/api/transactions/${serverId}`, {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || "Failed to delete transaction");
    }
}


async function loadWebpayScript(): Promise<void> {
    if (typeof window.webpayCheckout === "function") return;
    return new Promise((resolve, reject) => {
        const src = import.meta.env.VITE_WEBPAY_URL || "https://newwebpay.qa.interswitchng.com/inline-checkout.js";
        const existing = document.querySelector(`script[src="${src}"]`);
        if (existing) {
            setTimeout(() => {
                if (typeof window.webpayCheckout === "function") resolve();
                else reject(new Error("webpayCheckout not available after script load"));
            }, 300);
            return;
        }

        const s = document.createElement("script");
        s.src = src;
        s.async = true;
        s.onload = () => {
            if (typeof window.webpayCheckout === "function") resolve();
            else reject(new Error("webpayCheckout not available after script load"));
        };
        s.onerror = () => reject(new Error("Failed to load webpay script"));
        document.head.appendChild(s);
    });
}

// --- Component ---
export default function FundPage(): JSX.Element {
    const { props } = usePage<SharedData>();
    const serverAccountId = props?.auth?.user?.account_id ?? null;

    const [form, setForm] = useState<FormState>({ type: "in", amount: "", source: "", date: "", notes: "" });
    const [records, setRecords] = useState<RecordItem[]>([]);
    const [accountId, setAccountId] = useState<number | null>(serverAccountId ?? ACCOUNT_FALLBACK_ID);
    const [accountMissing, setAccountMissing] = useState<boolean>(false);

    useEffect(() => {
        async function verify() {
            if (accountId) {
                const ok = await ensureAccountExistsOnServer(accountId);
                if (!ok) {
                    console.warn("Configured account id not found:", accountId);
                    setAccountMissing(true);
                    setAccountId(null);
                } else {
                    setAccountMissing(false);
                }
                return;
            }

            try {
                const res = await fetch("/api/accounts?limit=1", { credentials: "include" });
                if (res.ok) {
                    const list = await res.json();
                    if (Array.isArray(list) && list.length > 0 && list[0].id) {
                        setAccountId(list[0].id);
                        setAccountMissing(false);
                        return;
                    }
                }
            } catch {}

            setAccountMissing(true);
        }

        verify();
    }, [accountId]);

    function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    }

    async function addRecord(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const amount = parseFloat(form.amount);
        if (Number.isNaN(amount) || amount === 0) return;

        const signed = form.type === "in" ? Math.abs(amount) : -Math.abs(amount);
        const tempId = Date.now();

        const r: RecordItem = { id: tempId, type: form.type, amount: signed, source: form.source, date: form.date, notes: form.notes };
        setRecords(prev => [r, ...prev]);
        setForm({ type: "in", amount: "", source: "", date: "", notes: "" });

        try {
            const serverTx = await saveRecordToApi(r, accountId);
            const mapped: RecordItem = {
                id: tempId,
                serverId: serverTx.id,
                type: serverTx.amount >= 0 ? "in" : "out",
                amount: Number(serverTx.amount) / 100,
                source: serverTx.source || r.source,
                date: serverTx.created_at?.slice(0, 10) || r.date,
                notes: serverTx.metadata?.notes || r.notes,
            };
            setRecords(prev => prev.map(rec => (rec.id === tempId ? mapped : rec)));
        } catch (err) {
            console.error("Save failed", err);
            setRecords(prev =>
                prev.map(rec =>
                    rec.id === tempId ? { ...rec, notes: (rec.notes ? rec.notes + " | " : "") + "Failed to save" } : rec
                )
            );
        }
    }

   
    const paymentCallback = (response: any) => {
        console.log("Payment Gateway Response:", response);
        // TODO: This is where you would process the successful payment response:
        // 1. Send the response to your Laravel backend for verification (Crucial step!).
        // 2. If verification is successful, the backend creates the official transaction record.
        // 3. You can then trigger a data reload or add the new record to the state.
    };

    const handlePaymentSubmit = async () => {
        const amount = parseFloat(form.amount);
        if (Number.isNaN(amount) || amount <= 0) {
            alert("Please enter a valid, positive amount.");
            return;
        }
        if (form.type === "out") {
            alert("Payment gateway is only used for funding ('Add In') transactions.");
            return;
        }

        try {
            await loadWebpayScript();
        } catch (err) {
            console.error("Failed to load checkout script:", err);
            alert("Payment system is not available.");
            return;
        }

        if (typeof window.webpayCheckout !== "function") {
            console.error("webpayCheckout is not a function.");
            alert("Payment system not available.");
            return;
        }

        // 💡 CRITICAL: Ensure amount is in Kobo (integer string) for Webpay.
        const amountValue = (amount * 100).toFixed(0); 
        const txnRef = `MX-TRN-${Date.now()}-${Math.floor(Math.random() * 999)}`;
        const currencyCode = 566; // NGN

        const paymentRequest: PaymentRequest = {
             merchant_code: "MX6072",
            pay_item_id: "9405967",
            txn_ref: "MX-TRN-" + Math.random() * 2.5,
            site_redirect_url: window.location.href,
            amount: amountValue, 
            currency: currencyCode,
            onComplete: paymentCallback,
            mode: "TEST",
        };

        // 💡 DEBUG LOGGING: Confirm values are correct before sending to the SDK.
        console.groupCollapsed("Webpay Request Debug");
        console.log("Frontend Amount (Naira):", amount.toFixed(2));
        console.log("Payment Gateway Amount (Kobo String):", paymentRequest.amount);
        console.log("Transaction Ref:", paymentRequest.txn_ref);
        console.log("Full Request Object:", paymentRequest);
        console.groupEnd();
        
        try {
            window.webpayCheckout(paymentRequest);
        } catch (err) {
            console.error("webpayCheckout invocation failed:", err);
            alert("Failed to start payment.");
        }
    };

    async function removeRecord(id: number) {
        const rec = records.find(r => r.id === id);
        if (!rec) return;

        if (rec.serverId) {
            try {
                await deleteRecordFromApi(rec.serverId);
                setRecords(prev => prev.filter(r => r.id !== id));
            } catch (err) {
                console.error("Delete failed", err);
                alert("Failed to delete record from server.");
            }
        } else {
            setRecords(prev => prev.filter(r => r.id !== id));
        }
    }

    useEffect(() => {
        async function load() {
            try {
                const res = await fetch("/api/transactions?limit=50", { credentials: "include" });
                if (res.ok) {
                    const list = await res.json();
                    setRecords(
                        list.map((t: any) => ({
                            id: Date.now() + Math.floor(Math.random() * 100000),
                            serverId: t.id,
                            type: Number(t.amount) >= 0 ? "in" : "out",
                            amount: Number(t.amount) / 100,
                            source: t.source,
                            date: t.created_at ? t.created_at.slice(0, 10) : "",
                            notes: t.metadata?.notes || "",
                        }))
                    );
                }
            } catch {}
        }
        load();
    }, []);

    const totals = useMemo(() => {
        const incoming = records.filter(r => r.amount > 0).reduce((s, r) => s + r.amount, 0);
        const outgoing = records.filter(r => r.amount < 0).reduce((s, r) => s + Math.abs(r.amount), 0);
        return { incoming, outgoing, balance: incoming - outgoing };
    }, [records]);

    const quickAdd = async (amt: number, type: "in" | "out" = "in") => {
        const signed = type === "in" ? Math.abs(amt) : -Math.abs(amt);
        const tempId = Date.now();
        const r: RecordItem = {
            id: tempId,
            type,
            amount: signed,
            source: "Quick Add",
            date: new Date().toISOString().slice(0, 10),
            notes: "",
        };

        setRecords(prev => [r, ...prev]);
        try {
            const serverTx = await saveRecordToApi(r, accountId);
            const mapped: RecordItem = {
                id: tempId,
                serverId: serverTx.id,
                type: serverTx.amount >= 0 ? "in" : "out",
                amount: Number(serverTx.amount) / 100,
                source: serverTx.source || r.source,
                date: serverTx.created_at?.slice(0, 10) || r.date,
                notes: serverTx.metadata?.notes || r.notes,
            };
            setRecords(prev => prev.map(rec => (rec.id === tempId ? mapped : rec)));
        } catch (err) {
            console.error("Quick Add Save failed", err);
            setRecords(prev => prev.map(rec => (rec.id === tempId ? { ...rec, notes: "Failed to save" } : rec)));
        }
    };


    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title='Fund' />
            <div className="min-h-screen p-6">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-white shadow-xl rounded-2xl p-6">
                        <header className="flex items-center justify-between mb-6">
                            <h1 className="text-2xl font-extrabold ">Fund Manager</h1>
                            <div className="text-right">
                                <div className="text-sm text-gray-500">Balance</div>
                                <div className="text-2xl font-bold">
                                    <span className={totals.balance >= 0 ? "text-green-600" : "text-red-600"}>
                                        N{totals.balance.toFixed(2)}
                                    </span>
                                </div>
                                <div className="text-xs text-gray-500">
                                    In: <span className="text-green-600 font-medium">N{totals.incoming.toFixed(2)}</span>{" "}
                                    Out: <span className="text-red-600 font-medium">N{totals.outgoing.toFixed(2)}</span>
                                </div>
                            </div>
                        </header>

                        {/* FIX: Form onSubmit is correctly set to the manual handler: addRecord */}
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
                                        +N5000 Quick
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => quickAdd(100, "in")}
                                        className="inline-flex items-center px-3 py-2 bg-green-600 text-white rounded-lg text-sm shadow"
                                    >
                                        +N10,000
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => quickAdd(20, "out")}
                                        className="inline-flex items-center px-3 py-2 bg-red-50 text-red-700 rounded-lg border border-red-100 text-sm"
                                    >
                                        -N2000 Quick
                                    </button>
                                </div>

                                <div className="flex gap-2">
                                    {/* 💡 FIX: This button is type="button" and handles the external payment logic */}
                                    <button
                                        type="button" 
                                        onClick={handlePaymentSubmit}
                                        className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg shadow hover:bg-emerald-700 transition"
                                    >
                                        Pay with Webpay
                                    </button>
                                    
                                    {/* 💡 FIX: This button is type="submit" and triggers the form's onSubmit={addRecord} */}
                                    <button
                                        type="submit" 
                                        className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-lg border hover:bg-blue-50"
                                    >
                                        Manual Add Record
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
                                            <div className="flex gap-2 items-center">
                                                <button
                                                    onClick={() => removeRecord(r.id)}
                                                    className="text-sm text-gray-500 hover:text-red-600"
                                                    aria-label="Remove"
                                                >
                                                    Remove
                                                </button>
                                                {r.serverId ? (
                                                    <span className="text-xs text-slate-400">#{r.serverId}</span>
                                                ) : (
                                                    <span className="text-xs text-amber-500">Local</span>
                                                )}
                                            </div>
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