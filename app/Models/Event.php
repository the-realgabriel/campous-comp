<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Event extends Model
{
    protected $fillable = [
        'title', 'description', 'date', 'time', 'location',
        'category', 'max_attendees', 'user_id',
    ];

    protected $casts = ['date' => 'date'];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function attendees(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'event_attendees')
            ->withTimestamps();
    }

    public function isFull(): bool
    {
        if ($this->max_attendees === null) return false;
        return $this->attendees()->count() >= $this->max_attendees;
    }

    public function isUserAttending(int $userId): bool
    {
        return $this->attendees()->where('user_id', $userId)->exists();
    }
}
