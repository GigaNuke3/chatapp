<?php

namespace App\Http\Controllers;

use App\Events\MessageSent;
use App\Models\Message;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class MessageController extends Controller
{
    // Send a message (text or multiple photos)
    public function send(Request $request)
    {
        $validated = $request->validate([
            'receiver_id' => 'required|exists:users,id',
            'body' => 'nullable|string|max:2000',
            'attachments' => 'nullable|array|max:10',
            'attachments.*' => 'image|mimes:jpg,jpeg,png,gif|max:5120',
        ]);

        // Prevent user from messaging themselves
        if ((int) $validated['receiver_id'] === Auth::id()) {
            return response()->json(['error' => 'Cannot message yourself'], 400);
        }

        // Handle multiple file uploads
        $attachments = [];
        $uploadedFiles = $request->file('attachments', []);
        if (! is_array($uploadedFiles)) {
            $uploadedFiles = [$uploadedFiles];
        }

        foreach ($uploadedFiles as $file) {
            if ($file) {
                $attachments[] = $file->store('chat/photos', 'public');
            }
        }

        $attachmentData = ! empty($attachments) ? json_encode($attachments) : null;

        $message = Message::create([
            'sender_id' => Auth::id(),
            'receiver_id' => $validated['receiver_id'],
            'body' => $validated['body'] ?? null,
            'attachment' => $attachmentData,
            'is_read' => false,
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
        if ($user->id === Auth::id()) {
            return response()->json(['error' => 'Invalid user'], 400);
        }

        $messages = Message::where(function ($q) use ($user) {
            $q->where('sender_id', Auth::id())
                ->where('receiver_id', $user->id);
        })
            ->orWhere(function ($q) use ($user) {
                $q->where('sender_id', $user->id)
                    ->where('receiver_id', Auth::id());
            })
            ->with('sender', 'receiver')
            ->orderBy('created_at', 'asc')
            ->get();

        // Mark messages as read
        Message::where('sender_id', $user->id)
            ->where('receiver_id', Auth::id())
            ->where('is_read', false)
            ->update(['is_read' => true]);

        return response()->json($messages);
    }

    // Delete a single message
    public function destroy(Message $message)
    {
        // Only the sender can delete their own message
        if ($message->sender_id !== Auth::id()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $message->delete();

        return response()->json(['success' => true]);
    }

    // Batch delete multiple messages
    public function batchDelete(Request $request)
    {
        $request->validate([
            'message_ids' => 'required|array',
            'message_ids.*' => 'integer|exists:messages,id',
        ]);

        // Delete only messages that belong to the authenticated user
        Message::whereIn('id', $request->message_ids)
            ->where('sender_id', Auth::id())
            ->delete();

        return response()->json(['success' => true]);
    }
}
