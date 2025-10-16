<?php

namespace App\Http\Controllers;

use App\Models\Transaction; 
use Illuminate\Http\Request;
use Illuminate\Routing\Controller; 


class TransactionController extends Controller
{
    
    public function index()
    {
        
        return response()->json(Transaction::orderBy('created_at', 'desc')->get());
    }

    
    public function store(Request $request)
    {
        
        $validated = $request->validate([
            'category' => 'required|string',
            'amount' => 'required|numeric',
            'date' => 'nullable|date',
            'notes' => 'nullable|string'
        ]);
        
        
        $transaction = Transaction::create($validated);
        
        return response()->json($transaction, 201);
    }
}