import { useState, useEffect, useMemo } from "react";
// REMOVED: import axios from "axios";
import { Input } from "@/components/ui/input";
// Assume a simple Button component exists for better styling
// import { Button } from "@/components/ui/button";

// --- Custom Components for Mobile View ---

// Budget Goal Tracking (New Feature)
function BudgetGoal({ total, goal }) {
    const progress = (total / goal) * 100;
    const progressClamped = Math.max(0, Math.min(100, progress));
    
    return (
        <div className="p-4 bg-white rounded-xl shadow-md mb-6">
            <h3 className="text-sm font-semibold text-gray-500 mb-2">Monthly Budget Goal</h3>
            <div className="flex justify-between items-center text-lg">
                <span className="font-bold text-gray-800">₦{total.toFixed(2)} / ₦{goal.toFixed(2)}</span>
                <span className={`font-semibold ${progressClamped > 100 ? 'text-red-500' : 'text-green-500'}`}>
                    {progressClamped.toFixed(0)}%
                </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                <div 
                    className={`h-2 rounded-full transition-all duration-500 ${progressClamped > 100 ? 'bg-red-500' : 'bg-green-500'}`} 
                    style={{ width: `${progressClamped}%` }}
                ></div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
                {total > goal ? `You've exceeded your budget by ₦${(total - goal).toFixed(2)}.` : `₦{(goal - total).toFixed(2)} remaining.`}
            </p>
        </div>
    );
}

// Transaction Input Tabs (UX Improvement)
function TransactionTypeTabs({ type, setType }) {
    const baseClass = "px-4 py-2 text-sm font-medium rounded-full transition-colors w-1/2";
    
    return (
        <div className="flex bg-gray-100 p-1 rounded-full mb-4">
            <button
                type="button"
                onClick={() => setType('out')}
                className={`${baseClass} ${type === 'out' ? 'bg-red-500 text-white shadow-md' : 'text-gray-600'}`}
            >
                Expense 💸
            </button>
            <button
                type="button"
                onClick={() => setType('in')}
                className={`${baseClass} ${type === 'in' ? 'bg-green-500 text-white shadow-md' : 'text-gray-600'}`}
            >
                Income 💰
            </button>
        </div>
    );
}


// --- Main Component ---
export default function MobileWallet() {
    // 💡 MODIFIED: Combined form state and added 'type' (in/out)
    const [form, setForm] = useState({ 
        type: "out", // Default to expense for quick entry
        category: "", 
        amount: "", 
        date: new Date().toISOString().slice(0, 10), // Default to today
        notes: "" 
    });
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    // 💡 NEW: State for budget tracking
    const [budgetGoal, setBudgetGoal] = useState(20000); // Example: ₦20,000 monthly budget

    useEffect(() => {
        fetchTransactions();
    }, []);

    // --- API Functions (Refactored to use fetch) ---

    async function fetchTransactions() {
        setLoading(true);
        try {
            // fetch automatically handles relative paths and returns a Promise that resolves to the Response object.
            // credentials: 'include' is the fetch equivalent of axios's { withCredentials: true }
            const res = await fetch("/api/transactions", { 
                method: 'GET',
                credentials: 'include' 
            });

            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }

            const data = await res.json(); // Explicitly parse the JSON body
            setItems(data);
        } catch (err) {
            console.error("Load failed:", err);
        } finally {
            setLoading(false);
        }
    }

    async function addItem(e) {
        e.preventDefault();
        setIsSaving(true);

        let amount = parseFloat(form.amount);
        
        // 💡 WALLET LOGIC: Apply negative sign for expenses ('out')
        if (form.type === 'out') {
            amount = -Math.abs(amount);
        } else {
            amount = Math.abs(amount);
        }
        
        const isValid = form.category && !Number.isNaN(amount) && form.amount !== "";
        if (!isValid) {
            alert("Please enter a valid Category and Amount.");
            setIsSaving(false);
            return;
        }

        const payload = {
            category: form.category,
            amount,
            date: form.date || null,
            notes: form.notes
        };

        try {
            const res = await fetch("/api/transactions", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json', // MUST be set for POST requests
                },
                body: JSON.stringify(payload), // MUST stringify the body data
                credentials: 'include' // Equivalent to axios's { withCredentials: true }
            });

            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            
            const newTx = await res.json();
            setItems(prev => [newTx, ...prev]);
            // Reset form but keep the current type and date
            setForm(prev => ({ ...prev, category: "", amount: "", notes: "" }));
        } catch (err) {
            console.error(err);
            alert("Failed to save transaction.");
        } finally {
            setIsSaving(false);
        }
    }
    
    async function removeItem(id) {
        if (!window.confirm("Are you sure you want to delete this transaction?")) return;
        try {
            const res = await fetch(`/api/transactions/${id}`, {
                method: 'DELETE', // Set the method to DELETE
                credentials: 'include'
            });

            if (!res.ok) {
                // Check for a successful deletion status, often 200 or 204 No Content
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            
            // Note: DELETE requests often return a 204 No Content, so no need to parse JSON.
            // The item is removed from the local state regardless of a body in the response.
            setItems(prev => prev.filter(i => i.id !== id));
        } catch (err) {
            console.error(err);
            alert("Failed to delete transaction.");
        }
    }

    // --- Handlers ---
    function handleChange(e) {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    }
    
    function setFormType(type) {
        setForm(prev => ({ ...prev, type }));
    }
    
    // --- Derived State (Totals and Budget Calculation) ---
    const totalBalance = useMemo(() => items.reduce((s, i) => s + (Number(i.amount) || 0), 0), [items]);
    
    // 💡 BUDGET CALCULATION: Only track expenses against the budget goal
    const totalExpenses = useMemo(() => {
        // Filter items where amount is negative (expense)
        return items
            .filter(i => Number(i.amount) < 0)
            .reduce((sum, i) => sum + Math.abs(Number(i.amount)), 0);
    }, [items]);
    
    const isFormValid = form.category && form.amount && !Number.isNaN(parseFloat(form.amount));

    // --- Render ---
    return (
        <div className="min-h-screen bg-gray-50 p-4"> {/* Mobile background change */}
            <div className="max-w-md mx-auto"> {/* Max width for mobile focus */}
                
                {/* Global Balance Card */}
                <div className="bg-blue-600 text-white rounded-2xl p-6 shadow-xl mb-6">
                    <h1 className="text-xl font-light">Current Balance</h1>
                    <div className="text-4xl font-extrabold mt-1">
                        ₦{totalBalance.toFixed(2)}
                    </div>
                </div>

                {/* Monthly Budget Tracker */}
                <BudgetGoal total={totalExpenses} goal={budgetGoal} />

                {/* Transaction Input Area (Mobile-Optimized) */}
                <div className="bg-white shadow-lg rounded-2xl p-4 mb-6">
                    <h2 className="text-lg font-bold text-gray-800 mb-3">New Transaction</h2>
                    
                    <TransactionTypeTabs type={form.type} setType={setFormType} />
                    
                    <form onSubmit={addItem} className="space-y-4">
                        <Input
                            name="amount"
                            type="number"
                            step="0.01"
                            value={form.amount}
                            onChange={handleChange}
                            placeholder={`Amount (${form.type === 'out' ? 'Expense' : 'Income'})`}
                            className="w-full text-lg p-3 border-2"
                        />
                        
                        <Input
                            name="category"
                            value={form.category}
                            onChange={handleChange}
                            placeholder="Category (e.g., Food, Salary, Transfer)"
                            className="w-full"
                        />
                        
                        <div className="flex gap-4">
                            <Input
                                name="date"
                                type="date"
                                value={form.date}
                                onChange={handleChange}
                                className="w-1/2"
                            />
                            <Input
                                name="notes"
                                value={form.notes}
                                onChange={handleChange}
                                placeholder="Notes (Optional)"
                                className="w-1/2"
                            />
                        </div>
                        
                        <button
                            type="submit"
                            disabled={isSaving || !isFormValid}
                            className={`w-full py-3 text-white rounded-lg shadow-md transition-colors font-semibold mt-2
                                ${isSaving || !isFormValid 
                                    ? "bg-gray-400 cursor-not-allowed" 
                                    : form.type === 'out' 
                                        ? "bg-red-500 hover:bg-red-600" 
                                        : "bg-green-500 hover:bg-green-600"
                                }`}
                        >
                            {isSaving ? "Saving..." : `Add ${form.type === 'out' ? 'Expense' : 'Income'}`}
                        </button>
                    </form>
                </div>

                {/* Transaction History (Scrollable Mobile List) */}
                <section>
                    <h2 className="text-lg font-bold text-gray-800 mb-3">Transaction History</h2>
                    {loading ? (
                        <div className="text-gray-500 text-sm p-4 text-center">Loading...</div>
                    ) : (
                        <div className="space-y-3">
                            {items.length === 0 && (
                                <div className="text-sm text-gray-500 p-4 text-center border rounded-lg">No transactions yet. Start tracking!</div>
                            )}
                            {items.map(item => {
                                const isExpense = Number(item.amount) < 0;
                                return (
                                    <div 
                                        key={item.id} 
                                        className={`flex items-center justify-between p-4 rounded-xl shadow-sm border ${isExpense ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'}`}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="font-semibold text-base truncate">
                                                {isExpense ? 'Expense:' : 'Income:'} {item.category}
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1 flex gap-3">
                                                <span>{item.date || "No date"}</span>
                                                <span className="truncate">{item.notes}</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end pl-3">
                                            <div className={`font-extrabold text-lg ${isExpense ? "text-red-600" : "text-green-600"}`}>
                                                ₦{Math.abs(Number(item.amount)).toFixed(2)}
                                            </div>
                                            <button
                                                onClick={() => removeItem(item.id)}
                                                className="text-xs text-gray-400 hover:text-red-500 transition-colors mt-1"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}