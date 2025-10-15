import { useState } from "react"
import { Input } from "@/components/ui/input"

export default function Time_table() {
    const [form, setForm] = useState({ category: "", amount: "", date: "", notes: "" })
    const [items, setItems] = useState([])

    function handleChange(e) {
        const { name, value } = e.target
        setForm(prev => ({ ...prev, [name]: value }))
    }

    function addItem(e) {
        e.preventDefault()
        const amount = parseFloat(form.amount)
        if (!form.category || Number.isNaN(amount)) return
        setItems(prev => [{ id: Date.now(), ...form, amount }, ...prev])
        setForm({ category: "", amount: "", date: "", notes: "" })
    }

    function removeItem(id) {
        setItems(prev => prev.filter(i => i.id !== id))
    }

    const total = items.reduce((s, i) => s + (Number(i.amount) || 0), 0)

    return (
        <div className="min-h-screen  p-6">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white shadow-lg rounded-2xl p-6">
                    <header className="flex items-center justify-between mb-4">
                        <h1 className="text-2xl font-extrabold text-amber-700">Budget Tracker</h1>
                        <div className="text-right">
                            <div className="text-sm text-gray-500">Balance</div>
                            <div className="text-lg font-bold">
                                <span className={total >= 0 ? "text-green-600" : "text-red-600"}>
                                    N{total.toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </header>

                    <form onSubmit={addItem} className="grid gap-3 md:grid-cols-4 items-end mb-6">
                        <div className="md:col-span-1">
                            <label className="block text-sm font-medium text-gray-600 mb-1">Category</label>
                            <Input
                                name="category"
                                value={form.category}
                                onChange={handleChange}
                                placeholder="Groceries"
                                className="w-full"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Amount</label>
                            <Input
                                name="amount"
                                type="number"
                                step="0.01"
                                value={form.amount}
                                onChange={handleChange}
                                placeholder="e.g. 12.50 (use - for expense)"
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
                        <div className="md:col-span-4 flex justify-end">
                            <button
                                type="submit"
                                className="mt-2 inline-flex items-center px-4 py-2 bg-amber-600 text-white rounded-lg shadow hover:bg-amber-700 transition"
                            >
                                Add Transaction
                            </button>
                        </div>
                    </form>

                    <section>
                        <h2 className="text-sm font-semibold text-gray-600 mb-3">Transactions</h2>
                        <div className="space-y-3">
                            {items.length === 0 && (
                                <div className="text-sm text-gray-500">No transactions yet. Add one above.</div>
                            )}
                            {items.map(item => (
                                <div key={item.id} className="flex items-center justify-between bg-amber-50 border border-amber-100 rounded-lg p-3">
                                    <div>
                                        <div className="flex items-baseline gap-3">
                                            <div className="font-medium text-amber-800">{item.category}</div>
                                            <div className="text-xs text-gray-500">{item.date || "No date"}</div>
                                        </div>
                                        <div className="text-sm text-gray-600">{item.notes}</div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className={`font-semibold N{item.amount >= 0 ? "text-green-600" : "text-red-600"}`}>
                                            N{Number(item.amount).toFixed(2)}
                                        </div>
                                        <button
                                            onClick={() => removeItem(item.id)}
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
    )
}