// components/TransactionForm.jsx
import React, { useState } from 'react';
import { Input } from "@/components/ui/input";

// Internal component for the transaction type tabs
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

export default function TransactionForm({ form, setForm, onSubmit, isSaving, type, setType }) {
    
    // Check form validity derived from parent state
    const isFormValid = form.category && form.amount && !Number.isNaN(parseFloat(form.amount));

    function handleChange(e) {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    }

    return (
        <div className="bg-white shadow-lg rounded-2xl p-4 mb-6">
            <h2 className="text-lg font-bold text-gray-800 mb-3">New Transaction</h2>
            
            <TransactionTypeTabs type={type} setType={setType} />
            
            <form onSubmit={onSubmit} className="space-y-4">
                <Input
                    name="amount"
                    type="number"
                    step="0.01"
                    value={form.amount}
                    onChange={handleChange}
                    placeholder={`Amount (${type === 'out' ? 'Expense' : 'Income'})`}
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
                            : type === 'out' 
                                ? "bg-red-500 hover:bg-red-600" 
                                : "bg-green-500 hover:bg-green-600"
                        }`}
                >
                    {isSaving ? "Saving..." : `Add ${type === 'out' ? 'Expense' : 'Income'}`}
                </button>
            </form>
        </div>
    );
}