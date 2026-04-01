<?php

namespace App\Http\Controllers;

use App\Events\MessageSent;
use App\Models\Message;
use App\Models\User;
use Illuminate\Http\Request;

class MessageController extends Controller
{
    // Get conversation between auth user and another user
    public function index(User $user)
    {
        $messages = Message::where(function ($q) use ($user) {
                $q->where('sender_id', auth()->id())
                  ->where('receiver_id', $user->id);
            })
            ->orWhere(function ($q) use ($user) {
                $q->where('sender_id', $user->id)
                  ->where('receiver_id', auth()->id());
            })
            ->with('sender', 'receiver')
            ->orderBy('created_at', 'asc')
            ->get();

        // Mark messages as read
        Message::where('sender_id', $user->id)
               ->where('receiver_id', auth()->id())
               ->where('is_read', false)
               ->update(['is_read' => true]);

        return response()->json($messages);
    }

    // Send a message (text or photo)
    public function send(Request $request)
    {
        $request->validate([
            'receiver_id' => 'required|exists:users,id',
            'body'        => 'nullable|string|max:2000',
            'attachment'  => 'nullable|image|mimes:jpg,jpeg,png,gif|max:5120',
        ]);

        $path = null;
        if ($request->hasFile('attachment')) {
            $path = $request->file('attachment')
                            ->store('chat/photos', 'public');
        }

        $message = Message::create([
            'sender_id'   => auth()->id(),
            'receiver_id' => $request->receiver_id,
            'body'        => $request->body,
            'attachment'  => $path,
            'type'        => $path ? 'image' : 'text',
        ]);

        $message->load('sender', 'receiver');

        broadcast(new MessageSent($message))->toOthers();

        return response()->json($message, 201);
    }
}