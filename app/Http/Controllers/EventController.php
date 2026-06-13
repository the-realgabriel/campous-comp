<?php

namespace App\Http\Controllers;

use App\Models\Event;
use Illuminate\Http\Request;

class EventController extends Controller
{
    public function index(Request $request)
    {
        $events = Event::withCount('attendees')
            ->with('creator')
            ->orderBy('date', 'asc')
            ->get()
            ->map(function ($event) use ($request) {
                $event->is_attending = $event->isUserAttending($request->user()->id);
                return $event;
            });

        return response()->json($events);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'date' => 'required|date',
            'time' => 'nullable|string|max:255',
            'location' => 'nullable|string|max:255',
            'category' => 'nullable|string|max:255',
            'max_attendees' => 'nullable|integer|min:1',
        ]);

        $validated['user_id'] = $request->user()->id;

        $event = Event::create($validated);

        $event->loadCount('attendees')->load('creator');
        $event->is_attending = $event->isUserAttending($request->user()->id);

        return response()->json($event, 201);
    }

    public function show(Event $event, Request $request)
    {
        $event->loadCount('attendees')->load('creator');
        $event->is_attending = $event->isUserAttending($request->user()->id);

        return response()->json($event);
    }

    public function join(Event $event, Request $request)
    {
        $user = $request->user();

        if ($event->isUserAttending($user->id)) {
            return response()->json(['message' => 'Already joined'], 409);
        }

        if ($event->isFull()) {
            return response()->json(['message' => 'Event is full'], 422);
        }

        $event->attendees()->attach($user->id);

        $event->loadCount('attendees');

        return response()->json(['message' => 'Joined', 'attendees_count' => $event->attendees_count, 'is_attending' => true]);
    }

    public function leave(Event $event, Request $request)
    {
        $user = $request->user();

        if (!$event->isUserAttending($user->id)) {
            return response()->json(['message' => 'Not attending'], 404);
        }

        $event->attendees()->detach($user->id);

        $event->loadCount('attendees');

        return response()->json(['message' => 'Left', 'attendees_count' => $event->attendees_count, 'is_attending' => false]);
    }

    public function destroy(Event $event, Request $request)
    {
        if ($event->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $event->delete();

        return response()->json(null, 204);
    }
}
