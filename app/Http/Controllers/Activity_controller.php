<?php


namespace App\Http\Controllers;

use App\Models\Activity;
use Illuminate\Http\Request;
use App\Http\Resources\ActivityResource;
use App\Http\Requests\StoreActivityRequest;
use App\Http\Requests\UpdateActivityRequest;

class Activity_controller extends Controller
{
    public function index()
    {
        return ActivityResource::collection(Activity::orderBy('created_at', 'desc')->get());
    }

    public function show( Activity $activity){
        return new ActivityResource($activity);
    }

    public function store(StoreActivityRequest $request){
        $activity = Activity::create($request->validated());
       
        return new ActivityResource($activity);
    }

    public function update(UpdateActivityRequest $request){
        $activity = $request->route('activity');
        $activity->update($request->validated());
       
        return new ActivityResource($activity);
    }
    
}
