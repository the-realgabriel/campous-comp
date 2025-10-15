<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class Account extends Model
{
    protected $fillable = ['name', 'balance'];
    protected $casts = ['balance' => 'integer'];

    public function transactions()
    {
        return $this->hasMany(Transaction::class);
    }

    /**
     * Atomically record a transaction and update balance exactly once.
     * Expects 'amount' (int cents) and optional 'stripe_id'.
     */
    public function recordTransaction(array $data)
    {
        return DB::transaction(function () use ($data) {
            // lock the account row to avoid races
            $account = self::where('id', $this->id)->lockForUpdate()->firstOrFail();

            // idempotency: if stripe_id provided and exists, return existing tx (no balance change)
            if (!empty($data['stripe_id'])) {
                $existing = $account->transactions()->where('stripe_id', $data['stripe_id'])->first();
                if ($existing) {
                    return $existing;
                }
            }

            // create the transaction
            $tx = $account->transactions()->create($data);

            // update balance only here
            $account->balance = $account->balance + (int) $data['amount'];
            $account->save();

            return $tx;
        }, 5);
    }

    /**
     * Optional: explicit recalc when you intentionally want to rebuild balance
     * (call manually; not used automatically).
     */
    public function recalcBalance(): int
    {
        $sum = $this->transactions()->sum('amount'); // returns cents
        $this->balance = (int) $sum;
        $this->save();
        return $this->balance;
    }
}
