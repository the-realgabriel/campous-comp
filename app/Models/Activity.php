<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Activity extends Model
{
    use HasFactory;

    // adjust to match your migration columns
    protected $fillable = [
        'title',
        'description',
        'date',
        'user_id',
        
    ];

    protected $casts = [
        'date' => 'date',
        
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
