<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OnboardingController extends Controller
{
    public function show(): Response
    {
        $user = request()->user();

        if ($user->onboarded_at) {
            return Inertia::render('dashboard');
        }

        return Inertia::render('auth/onboarding', [
            'user' => [
                'department' => $user->department,
                'year_of_study' => $user->year_of_study,
            ],
        ]);
    }

    public function complete(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'department' => 'required|string|max:255',
            'year_of_study' => 'required|string|in:1st Year,2nd Year,3rd Year,4th Year,5th Year,6th Year,Graduate',
            'tier' => 'sometimes|string|in:student,staff,admin',
        ]);

        $user = $request->user();
        $user->update([
            'department' => $validated['department'],
            'year_of_study' => $validated['year_of_study'],
            'tier' => $validated['tier'] ?? 'student',
            'onboarded_at' => now(),
        ]);

        return redirect()->intended(route('dashboard', absolute: false));
    }
}
