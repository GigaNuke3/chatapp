<?php

namespace App\Http\Controllers;

use App\Events\MessageSent;
use App\Models\Message;
use App\Models\User;
use Illuminate\Http\Request;

class MessageController extends Controller
{
    // Send a message (text or multiple photos)
    public function send(Request $request)
    {
        $request->validate([
            'receiver_id' => 'required|exists:users,id',
            'body'        => 'nullable|string|max:2000',
            'attachments' => 'nullable|array',
            'attachments.*' => 'image|mimes:jpg,jpeg,png,gif|max:5120',
        ]);

        // Prevent user from messaging themselves
        if ($request->receiver_id == auth()->id()) {
            return response()->json(['error' => 'Cannot message yourself'], 400);
        }

        // Handle multiple file uploads
        $attachments = [];
        if ($request->hasFile('attachments')) {
            foreach ($request->file('attachments') as $file) {
                $attachments[] = $file->store('chat/photos', 'public');
            }
        }

        $attachmentData = !empty($attachments) ? json_encode($attachments) : null;

        $message = Message::create([
            'sender_id'   => auth()->id(),
            'receiver_id' => $request->receiver_id,
            'body'        => $request->body ?: (count($attachments) > 0 ? 'Sent ' . count($attachments) . ' image' . (count($attachments) > 1 ? 's' : '') : ''),
            'attachment'  => $attachmentData,
            'is_read'     => false,
        ]);

        // Load relationships and return
        $message->load('sender', 'receiver');

        broadcast(new MessageSent($message))->toOthers();

        return response()->json($message, 201);
    }

    // Get messages between current user and specific user
    public function getMessages(User $user)
    {
        // Prevent accessing own messages
        if ($user->id == auth()->id()) {
            return response()->json(['error' => 'Invalid user'], 400);
        }

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
}