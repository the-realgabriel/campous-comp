<?php
namespace App\Http\Controllers;

use App\Models\Account;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;


class InterswitchWebhookController extends Controller
{
    // POST /api/interswitch/callback
    public function handle(Request $request)
    {
        // Raw payload
        $payload = $request->getContent();
        $secret = env('INTERSWITCH_SECRET');

        // Adjust signature header name and algorithm to match Interswitch docs
        $sigHeader = $request->header('X-Interswitch-Signature', '');
        $expected = hash_hmac('sha512', $payload, $secret);

        if (!hash_equals($expected, $sigHeader)) {
            Log::warning('Interswitch signature mismatch', ['header' => $sigHeader, 'expected' => $expected]);
            return response('Invalid signature', 400);
        }

        // parse fields depending on gateway callback format
        $data = $request->json()->all();

        // Example fields: txn_ref (our local tx id), gateway_id, response_code, amount
        $localTxId = $data['txn_ref'] ?? null;
        $gatewayId = $data['transaction_id'] ?? ($data['gateway_id'] ?? null);
        $status = $data['response_code'] ?? $data['status'] ?? null;
        $amount = isset($data['amount']) ? (int)$data['amount'] : null; // cents/kobo

        if (!$localTxId || !$gatewayId) {
            Log::warning('Interswitch callback missing refs', $data);
            return response('Missing data', 400);
        }

        // Load local transaction
        $tx = \App\Models\Transaction::find($localTxId);
        if (!$tx) {
            Log::warning("Local tx not found: {$localTxId}");
            return response('Not found', 404);
        }

        // Idempotency: if gateway id already recorded, ignore
        if ($tx->gateway_transaction_id && $tx->gateway_transaction_id === $gatewayId) {
            return response('Already processed', 200);
        }

        // Check gateway status code for success (adjust per Interswitch docs)
        $success = in_array($status, ['00', '0', 'success', 'SUCCESS']);

        if ($success) {
            // Use account->recordTransaction to atomically set balance.
            // If the original tx was created pending and we need to avoid double-updating,
            // include gateway_transaction_id in data so recordTransaction will skip duplicates.
            $account = $tx->account()->lockForUpdate()->first();

            try {
                $account->recordTransaction([
                    'amount' => $amount ?? $tx->amount,
                    'currency' => $tx->currency,
                    'status' => 'completed',
                    'source' => 'interswitch',
                    'metadata' => array_merge($tx->metadata ?? [], $data),
                    'gateway_transaction_id' => $gatewayId,
                    'gateway_response' => $data,
                ]);
            } catch (\Exception $e) {
                Log::error('Failed to record transaction: '.$e->getMessage());
                return response('Server error', 500);
            }
        } else {
            // mark transaction failed
            $tx->update([
                'status' => 'failed',
                'metadata' => array_merge($tx->metadata ?? [], $data),
                'gateway_transaction_id' => $gatewayId,
            ]);
        }

        return response('OK', 200);
    }
}