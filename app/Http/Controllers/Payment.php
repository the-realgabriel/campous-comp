<?php
namespace App\Http\Controllers;

use App\Models\Account;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class PaymentController extends Controller
{
    // POST /api/payments
    public function create(Request $request)
    {
        $data = $request->validate([
            'account_id' => 'required|exists:accounts,id',
            'amount' => 'required|numeric|min:0.01', // dollars
            'currency' => 'string|nullable',
            'email' => 'string|nullable',
        ]);

        $account = Account::findOrFail($data['account_id']);

        // amount in cents/kobo
        $amountCents = (int) round($data['amount'] * 100);

        // create local pending transaction to reserve id and for idempotency
        $tx = $account->transactions()->create([
            'amount' => $amountCents,
            'currency' => $data['currency'] ?? 'NGN',
            'status' => 'pending',
            'source' => 'interswitch',
            'metadata' => ['email' => $data['email'] ?? null],
            // gateway_transaction_id reserved for gateway reference once received
        ]);

        // Build Interswitch payload (adjust fields to Interswitch docs)
        $payload = [
            'product_id' => env('INTERSWITCH_PRODUCT_ID', ''), // if used
            'amount' => $amountCents,
            'txn_ref' => (string) $tx->id, // use local tx id as reference
            'currency' => $tx->currency,
            'redirect_url' => env('INTERSWITCH_CALLBACK_URL'),
            'cust_id' => $data['email'] ?? 'guest',
        ];

        // create signature / hash per Interswitch requirement
        $secret = env('INTERSWITCH_SECRET');
        $signature = hash_hmac('sha512', json_encode($payload), $secret);

        // Typically you either redirect to a hosted payment page or POST to gateway
        // Return info for frontend to redirect or auto-post to gateway
        return response()->json([
            'payment_url' => env('INTERSWITCH_ENDPOINT'),
            'payload' => $payload,
            'signature' => $signature,
            'local_tx_id' => $tx->id,
        ], 201);
    }
}