<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Transaction extends Model
{
    protected $fillable = [
        'account_id','stripe_id','amount','currency','status','source','metadata'
    ];
    protected $casts = [
        'amount' => 'integer',
        'metadata' => 'array',
    ];

    public function account()
    {
        return $this->belongsTo(Account::class);
    }

    // helper to display dollars
    public function amountDollars()
    {
        return number_format($this->amount / 100, 2);
    }
}
