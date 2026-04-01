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
            new PrivateChannel('chat.' . $this->message->receiver_id),
        ];
    }

    public function broadcastWith(): array
    {
        return [
            'id'          => $this->message->id,
            'sender_id'   => $this->message->sender_id,
            'receiver_id' => $this->message->receiver_id,
            'body'        => $this->message->body,
            'attachment'  => $this->message->attachment
                                ? asset('storage/' . $this->message->attachment)
                                : null,
            'type'        => $this->message->type,
            'is_read'     => $this->message->is_read,
            'created_at'  => $this->message->created_at->toDateTimeString(),
            'sender'      => [
                'id'   => $this->message->sender->id,
                'name' => $this->message->sender->name,
            ],
        ];
    }
}