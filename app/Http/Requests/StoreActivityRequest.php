<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Models\Activity;

class StoreActivityRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        if (!auth()->check()) {
            return false; // Returns 403 Forbidden if not logged in
        }

         $activity = $this->route('activity');
         
         if ($activity instanceof Activity) {
            return $activity->user_id === auth()->id();
        }
    }
    

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'date' => 'nullable|date',
            'user_id' => 'required|exists:users,id',
        ];
    }
}
