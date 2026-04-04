<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessageRead implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public int $senderId,
        public int $readerId,
        public array $messageIds,
    ) {}

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('chat.'.$this->senderId),
        ];
    }

    public function broadcastAs(): string
    {
        return 'MessageRead';
    }

    public function broadcastWith(): array
    {
        return [
            'sender_id' => $this->senderId,
            'reader_id' => $this->readerId,
            'message_ids' => $this->messageIds,
        ];
    }
}
