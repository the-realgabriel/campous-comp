<?php

namespace App\Http\Controllers;

use App\Models\Account;
use Illuminate\Http\Request;

class TransactionController extends Controller
{
    // Create local transaction (UI)
    public function store(Request $request)
    {
        $data = $request->validate([
            'account_id' => 'required|exists:accounts,id',
            'amount' => 'required|integer', // cents
            'currency' => 'string|nullable',
            'status' => 'string|nullable',
            'source' => 'string|nullable',
            'metadata' => 'array|nullable',
        ]);

        $account = Account::findOrFail($data['account_id']);
        $tx = $account->recordTransaction($data);

        return response()->json($tx, 201);
    }
}
