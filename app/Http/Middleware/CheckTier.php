<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckTier
{
    public function handle(Request $request, Closure $next, string ...$tiers): Response
    {
        if (! $request->user() || ! in_array($request->user()->tier, $tiers)) {
            abort(403, 'You do not have the required access level.');
        }

        return $next($request);
    }
}
