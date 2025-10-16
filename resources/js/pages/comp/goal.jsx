
import React from 'react';

export default function BudgetGoal({ total, goal }) {
    const progress = (total / goal) * 100;
    const progressClamped = Math.max(0, Math.min(100, progress));

    const [budgetGoal, setBudgetGoal] = useState(20000)

    
    
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
