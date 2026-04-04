<?php

namespace App\Events;

use App\Models\Message;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessageSent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public Message $message) {}

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('chat.'.$this->message->receiver_id),
        ];
    }

    public function broadcastWith(): array
    {
        $attachmentPaths = $this->message->attachment ? (json_decode($this->message->attachment, true) ?: []) : [];

        return [
            'id' => $this->message->id,
            'sender_id' => $this->message->sender_id,
            'receiver_id' => $this->message->receiver_id,
            'body' => $this->message->body,
            'attachment' => $this->message->attachment,
            'attachment_paths' => $attachmentPaths,
            'attachment_urls' => array_map(static fn (string $path) => asset('storage/'.$path), $attachmentPaths),
            'type' => $this->message->type,
            'is_read' => $this->message->is_read,
            'created_at' => $this->message->created_at->utc()->toIso8601String(),
            'sender' => [
                'id' => $this->message->sender->id,
                'name' => $this->message->sender->name,
                'avatar' => $this->message->sender->avatar
                    ? asset('storage/'.$this->message->sender->avatar)
                    : null,
            ],
        ];
    }
}
