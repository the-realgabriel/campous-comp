<?php

namespace App\Http\Controllers;

use App\Models\Timetable;
use Illuminate\Http\Request;

class TimetableController extends Controller
{
    public function index()
    {
        return response()->json(Timetable::orderBy('created_at', 'desc')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'course' => 'required|string|max:255',
            'lecturer' => 'required|string|max:255',
            'date' => 'required|date',
            'time' => 'required|string|max:255',
            'location' => 'required|string|max:255',
            'user_id' => 'required|exists:users,id',
        ]);

        $timetable = Timetable::create($validated);

        return response()->json($timetable, 201);
    }

    public function show(Timetable $timetable)
    {
        return response()->json($timetable);
    }

    public function update(Request $request, Timetable $timetable)
    {
        $validated = $request->validate([
            'course' => 'sometimes|string|max:255',
            'lecturer' => 'sometimes|string|max:255',
            'date' => 'sometimes|date',
            'time' => 'sometimes|string|max:255',
            'location' => 'sometimes|string|max:255',
        ]);

        $timetable->update($validated);

        return response()->json($timetable);
    }

    public function destroy(Timetable $timetable)
    {
        $timetable->delete();

        return response()->json(null, 204);
    }
}
