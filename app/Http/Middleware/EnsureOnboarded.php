<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureOnboarded
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user() && $request->user()->onboarded_at === null) {
            return redirect()->route('onboarding');
        }

        return $next($request);
    }
}
