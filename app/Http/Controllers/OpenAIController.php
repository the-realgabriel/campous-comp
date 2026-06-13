<?php

namespace App\Http\Controllers;

use App\Models\ChatMessage;
use Illuminate\Http\Request;

class OpenAIController extends Controller
{
    public function history(Request $request)
    {
        $messages = ChatMessage::where('user_id', $request->user()->id)
            ->orderBy('created_at', 'asc')
            ->get()
            ->map(fn ($m) => [
                'id' => (string) $m->id,
                'text' => $m->content,
                'sender' => $m->role === 'user' ? 'user' : 'bot',
            ]);

        return response()->json($messages);
    }

    public function destroyHistory(Request $request)
    {
        ChatMessage::where('user_id', $request->user()->id)->delete();

        return response()->noContent();
    }

    public function chat(Request $request)
    {
        $request->validate([
            'message' => 'required|string',
        ]);

        $user = $request->user();

        // save user message
        ChatMessage::create([
            'user_id' => $user->id,
            'role' => 'user',
            'content' => $request->input('message'),
        ]);

        $client = \OpenAI::factory()
            ->withApiKey(config('services.groq.key'))
            ->withBaseUri('https://api.groq.com/openai/v1')
            ->make();

        $response = $client->chat()->create([
            'model' => config('services.groq.model'),
            'messages' => [
                ['role' => 'system', 'content' => 'You are a helpful campus assistant for students. You can generate charts using the following format:

```chart
{
  "type": "bar" | "line" | "pie" | "area",
  "title": "Chart Title",
  "labels": ["Label1", "Label2", ...],
  "datasets": [
    { "label": "Series Name", "data": [value1, value2, ...] }
  ]
}
```

Wrap the JSON in a fenced code block with the language "chart". The frontend will render it as an interactive chart. Use this whenever visualizing data would be helpful.'],
                ['role' => 'user', 'content' => $request->input('message')],
            ],
        ]);

        $reply = $response->choices[0]->message->content;

        // save bot reply
        $botMsg = ChatMessage::create([
            'user_id' => $user->id,
            'role' => 'assistant',
            'content' => $reply,
        ]);

        return response()->json([
            'reply' => $reply,
            'id' => (string) $botMsg->id,
        ]);
    }
}
