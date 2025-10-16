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
        return ActivityResource::collection(Activity::paginate(3));
    }

    public function show( Activity $activity){
        return new ActivityResource($activity);
    }

    public function store(StoreActivityRequest $activity){
        $activity = Activity::create($request->validated());
       
        return new ActivityResource($activity);
    }

    public function update(UpdateActivityRequest $activity){
        $activity -> update($request->validated());
       
        return new ActivityResource($activity);
    }
    
}
