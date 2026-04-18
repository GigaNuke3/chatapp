@extends('layouts.app')

@section('title', 'Chat - ' . $user->name)

@section('content')
<div class="chat-container">
    <!-- Icon Sidebar - Menu Toggle -->
    <div class="icon-sidebar">
        <button id="sidebarToggle" class="sidebar-toggle-btn" title="Toggle sidebar" aria-label="Toggle sidebar menu">
            <i class="fas fa-bars"></i>
        </button>
    </div>

    <!-- Sidebar - Users List -->
    <div class="chat-sidebar">
        <!-- Sidebar Header -->
        <div class="sidebar-header">
            <div class="sidebar-header-top">
                <h5>
                    <i class="fas fa-comments"></i>
                    Messages
                </h5>

                <a href="{{ route('profile.edit') }}" class="sidebar-profile-link" title="My Profile" aria-label="Open my profile settings">
                    <x-avatar :user="auth()->user()" size="sidebar" />
                </a>
            </div>
        </div>

        <!-- Search Box -->
        <div class="search-box">
            <div class="input-group">
                <span class="input-group-text">
                    <i class="fas fa-search"></i>
                </span>
                <input type="text" class="form-control search-users" id="searchUsers" placeholder="Search users...">
            </div>
        </div>

        <!-- Users List -->
        <div class="users-list">
            @forelse($users as $u)
                <a href="{{ route('chat.show', $u->id) }}" 
                   class="user-item {{ $u->id == $user->id ? 'active' : '' }}"
                   data-user-name="{{ $u->name }}">
                    
                    <div class="avatar-container">
                        <x-avatar :user="$u" size="md" :showStatus="true" :statusOnline="in_array($u->id, $onlineUserIds ?? [], true)" />
                    </div>

                    <div class="user-info">
                        <h6>{{ $u->name }}</h6>
                        <p>{{ in_array($u->id, $onlineUserIds ?? [], true) ? 'Active now' : 'Offline' }}</p>
                    </div>
                </a>
            @empty
                <div class="no-users-container">
                    <i class="fas fa-users"></i>
                    <p>No users available</p>
                </div>
            @endforelse
        </div>
    </div>

    <!-- Chat Area -->
    <div class="chat-main">
        <!-- Chat Header -->
        <div class="chat-header">
            <div class="chat-header-user">
                <x-avatar :user="$user" size="lg" />
                <div class="chat-header-user-info">
                    <h5>{{ $user->name }}</h5>
                    <p>
                        <i class="fas fa-circle status-indicator {{ ($isSelectedUserOnline ?? false) ? 'online' : 'offline' }}"></i>
                        {{ ($isSelectedUserOnline ?? false) ? 'Active now' : 'Offline' }}
                    </p>
                </div>
            </div>
        </div>

        <!-- Messages Area -->
        <div class="messages-container" id="messagesContainer" data-current-user-id="{{ auth()->id() }}" data-chat-user-id="{{ $user->id }}">
            @forelse($messages as $message)
                @php
                    $isOwn = $message->sender_id === auth()->id();
                    $sideClass = $isOwn ? 'sent' : 'received';
                    $attachments = $message->attachment ? json_decode($message->attachment, true) : [];
                    $imageCount = count($attachments);
                @endphp
                <div class="message-row {{ $sideClass }}" id="message-{{ $message->id }}" data-message-id="{{ $message->id }}">
                    <div class="message-wrapper {{ $sideClass }}">
                        @if(!$isOwn)
                            <x-avatar :user="$message->sender" size="md" />
                        @endif
                        
                        <div class="message-content {{ $sideClass }}">
                            @if($message->body)
                                <div class="message-bubble {{ $sideClass }}">{{ trim($message->body) }}</div>
                            @endif
                            
                            @if($attachments)
                                <div class="message-attachments {{ $sideClass }} {{ $imageCount > 1 ? 'multi-image' : 'single-image' }}">
                                    @foreach($attachments as $attachment)
                                        <div class="attachment-image-wrapper">
                                            <img src="{{ asset('storage/' . $attachment) }}" alt="Shared image" class="attachment-image" loading="lazy">
                                        </div>
                                    @endforeach
                                </div>
                                @if($imageCount > 1)
                                    <div class="image-count-label">
                                        {{ $imageCount }} images
                                    </div>
                                @endif
                            @endif
                            
                            <div class="message-time" data-utc-time="{{ $message->created_at->utc()->toIso8601String() }}">
                                {{ $message->created_at->format('g:i A') }}
                                @if($isOwn)
                                    <span class="message-status" data-message-status-id="{{ $message->id }}">{{ $message->is_read ? 'Seen' : 'Delivered' }}</span>
                                @endif
                            </div>
                        </div>
                    </div>
                </div>
            @empty
                <div class="empty-messages">
                    <i class="fas fa-comments"></i>
                    <p style="font-size: 16px;">No messages yet</p>
                    <p style="font-size: 12px;">Start a conversation with {{ $user->name }}</p>
                </div>
            @endforelse
        </div>

        <!-- Message Input Form -->
        <div class="message-input-area">
            <form id="messageForm">
                @csrf
                <input type="hidden" name="receiver_id" value="{{ $user->id }}">
                
                <div class="message-input-wrapper">
                    <input type="text" id="messageInput" name="body" placeholder="Type a message..." autocomplete="off">

                    <input type="file" id="fileInput" style="display: none;" multiple accept="image/*">
                    <button type="button" class="action-btn" id="attachmentBtn" title="Attach media">
                        <i class="fas fa-photo-film"></i>
                    </button>
                    <button type="button" class="action-btn" id="gifBtn" title="Attach GIF">
                        GIF
                    </button>
                </div>

                <div id="preview-container" aria-live="polite">
                    <div id="preview-images"></div>
                    <button type="button" class="clear-attachments-btn" id="clearAttachmentsBtn">Clear selected media</button>
                </div>
                
                <button type="submit" class="btn btn-primary send-btn">
                    <i class="fas fa-paper-plane"></i>
                </button>
            </form>
        </div>
    </div>
</div>
@endsection
