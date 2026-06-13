<?php

namespace App\Http\Controllers;

use App\Models\Account;
use Illuminate\Http\Request;

class AccountController extends Controller
{
    public function index(Request $request)
    {
        $query = Account::query();

        if ($request->has('limit')) {
            $query->limit($request->integer('limit'));
        }

        return response()->json($query->get());
    }

    public function show(Account $account)
    {
        return response()->json($account);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'balance' => 'sometimes|integer',
        ]);

        $account = Account::create($validated);

        return response()->json($account, 201);
    }
}
