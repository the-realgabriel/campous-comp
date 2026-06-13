<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use Illuminate\Http\Request;

class TransactionController extends Controller
{
    public function index(Request $request)
    {
        $query = Transaction::orderBy('created_at', 'desc');

        if ($request->has('limit')) {
            $query->limit($request->integer('limit'));
        }

        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'account_id' => 'required|exists:accounts,id',
            'amount' => 'required|integer',
            'currency' => 'sometimes|string|max:3',
            'status' => 'sometimes|string|max:255',
            'source' => 'sometimes|nullable|string|max:255',
            'metadata' => 'sometimes|nullable|array',
        ]);

        $transaction = Transaction::create($validated);

        return response()->json($transaction, 201);
    }

    public function show(Transaction $transaction)
    {
        return response()->json($transaction);
    }

    public function destroy(Transaction $transaction)
    {
        $transaction->delete();

        return response()->json(null, 204);
    }
}
