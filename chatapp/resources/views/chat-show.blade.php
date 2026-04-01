@extends('layouts.app')

@section('title', 'Chat with ' . $user->name)

@section('content')
<div class="container-fluid" style="background-color: #1a1a1a; height: 100vh;">
    <div class="row" style="height: 100vh;">
        <!-- Users List -->
        <div class="col-md-3" style="background-color: #2d2d2d; border-right: 1px solid #444; overflow-y: auto;">
            <div class="p-3">
                <h5 style="color: #fff;">Users</h5>
                <div class="list-group">
                    @forelse($users as $u)
                        <a href="{{ route('chat.show', $u->id) }}" 
                           class="list-group-item list-group-item-action @if($u->id == $user->id) active @endif"
                           style="background-color: @if($u->id == $user->id)#007bff @else #3d3d3d @endif; color: #fff; border: none;">
                            <div class="d-flex w-100 justify-content-between">
                                <h6 class="mb-1">{{ $u->name }}</h6>
                            </div>
                            <p class="mb-1" style="color: #ccc;">{{ $u->email }}</p>
                        </a>
                    @empty
                        <p style="color: #999;">No users available</p>
                    @endforelse
                </div>
            </div>
        </div>

        <!-- Chat Area -->
        <div class="col-md-9 d-flex flex-column" style="background-color: #1a1a1a;">
            <!-- Header -->
            <div style="background-color: #2d2d2d; padding: 1rem; border-bottom: 1px solid #444;">
                <h5 style="color: #fff; margin: 0;">{{ $user->name }}</h5>
                <small style="color: #999;">{{ $user->email }}</small>
            </div>

            <!-- Messages -->
            <div class="flex-grow-1 p-3" style="overflow-y: auto; background-color: #1a1a1a;" id="messages-container">
                @forelse($messages as $message)
                    <div class="mb-3" data-message-id="{{ $message->id }}" style="text-align: @if($message->sender_id == auth()->id())right @else left @endif;">
                        <div style="display: inline-block; padding: 10px 15px; border-radius: 10px; max-width: 70%; background-color: @if($message->sender_id == auth()->id())#007bff @else #444 @endif; color: #fff; word-wrap: break-word;">
                            {{ $message->body }}
                            @if($message->attachment)
                                @php
                                    $attachments = json_decode($message->attachment, true);
                                    if (!is_array($attachments)) {
                                        $attachments = [$message->attachment];
                                    }
                                @endphp
                                @if(count($attachments) > 1)
                                    <div style="margin-top: 10px; position: relative; width: 300px;">
                                        <div id="carousel-{{ $message->id }}" class="carousel slide" data-bs-ride="false" style="background-color: #1a1a1a; border-radius: 5px;">
                                            <div class="carousel-inner">
                                                @foreach($attachments as $index => $attachment)
                                                    <div class="carousel-item @if($index === 0) active @endif">
                                                        <img src="/storage/{{ $attachment }}" style="width: 100%; height: 300px; object-fit: cover; border-radius: 5px;" alt="Image">
                                                    </div>
                                                @endforeach
                                            </div>
                                            @if(count($attachments) > 1)
                                                <button class="carousel-control-prev" type="button" data-bs-target="#carousel-{{ $message->id }}" data-bs-slide="prev" style="background-color: rgba(0,0,0,0.5); border: none;">
                                                    <span class="carousel-control-prev-icon" aria-hidden="true"></span>
                                                </button>
                                                <button class="carousel-control-next" type="button" data-bs-target="#carousel-{{ $message->id }}" data-bs-slide="next" style="background-color: rgba(0,0,0,0.5); border: none;">
                                                    <span class="carousel-control-next-icon" aria-hidden="true"></span>
                                                </button>
                                            @endif
                                        </div>
                                        <small style="color: #999; display: block; margin-top: 5px; text-align: center;">{{ count($attachments) }} images</small>
                                    </div>
                                @else
                                    <br>
                                    <img src="/storage/{{ $attachments[0] }}" style="max-width: 100%; border-radius: 5px; margin-top: 10px;">
                                @endif
                            @endif
                        </div>
                        <small class="d-block" style="color: #999; margin-top: 5px;">{{ $message->created_at->format('H:i') }}</small>
                    </div>
                @empty
                    <p style="color: #999; text-align: center;" id="no-messages">No messages yet. Start the conversation!</p>
                @endforelse
            </div>

            <!-- Message Input -->
            <div style="background-color: #2d2d2d; border-top: 1px solid #444; padding: 1rem;">
                <form id="message-form">
                    @csrf
                    <div class="input-group">
                        <input type="hidden" id="receiver-id" value="{{ $user->id }}">
                        <input type="file" id="attachment-input" style="display: none;" accept="image/*" multiple>
                        <button type="button" id="attachment-btn" class="btn btn-outline-secondary" title="Attach Image">
                            <i class="fas fa-paperclip"></i>
                        </button>
                        <input type="text" id="message-input" class="form-control" 
                               placeholder="Type a message..." required
                               style="background-color: #3d3d3d; color: #fff; border: 1px solid #555;">
                        <div class="input-group-append">
                            <button class="btn btn-primary" type="submit" id="send-btn">Send</button>
                        </div>
                    </div>
                    <small class="text-danger" id="error-msg" style="display:none;"></small>
                    
                    <!-- Image Preview -->
                    <div id="preview-container" style="display: none; margin-top: 10px; padding: 10px; background-color: #1a1a1a; border-radius: 5px; overflow-x: auto;">
                        <div id="preview-images" style="display: flex; gap: 10px;"></div>
                        <button type="button" id="clear-attachments" class="btn btn-sm btn-danger" style="margin-top: 10px;">Clear</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>

<script>
    const receiverId = document.getElementById('receiver-id').value;
    const messagesContainer = document.getElementById('messages-container');
    const messageForm = document.getElementById('message-form');
    const messageInput = document.getElementById('message-input');
    const sendBtn = document.getElementById('send-btn');
    const errorMsg = document.getElementById('error-msg');
    const attachmentBtn = document.getElementById('attachment-btn');
    const attachmentInput = document.getElementById('attachment-input');
    const previewContainer = document.getElementById('preview-container');
    const previewImages = document.getElementById('preview-images');
    const clearBtn = document.getElementById('clear-attachments');
    
    let selectedFiles = [];

    // Auto-scroll to bottom
    function scrollToBottom() {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // Format time
    function formatTime(dateString) {
        try {
            const date = new Date(dateString);
            return date.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: true
            });
        } catch (e) {
            return 'now';
        }
    }

    // Load messages periodically (polling)
    function loadMessages() {
        fetch(`/api/messages/${receiverId}`, {
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
            }
        })
        .then(response => response.json())
        .then(messages => {
            // Get all existing message IDs
            const existingIds = new Set();
            messagesContainer.querySelectorAll('[data-message-id]').forEach(el => {
                existingIds.add(parseInt(el.dataset.messageId));
            });

            // Only add new messages
            let hasNewMessages = false;
            messages.forEach(message => {
                if (!existingIds.has(message.id)) {
                    addMessageToUI(message);
                    hasNewMessages = true;
                }
            });

            // Only scroll if new messages were added
            if (hasNewMessages) {
                scrollToBottom();
            }
        })
        .catch(error => console.error('Error loading messages:', error));
    }

    // Add message to UI
    function addMessageToUI(message) {
        // Remove "no messages" text if it exists
        const noMessagesText = document.getElementById('no-messages');
        if (noMessagesText) {
            noMessagesText.remove();
        }

        const authId = {{ auth()->id() }};
        const isOwn = parseInt(message.sender_id) === authId;
        const bgColor = isOwn ? '#007bff' : '#444';
        const textAlign = isOwn ? 'right' : 'left';
        
        const messageDiv = document.createElement('div');
        messageDiv.className = 'mb-3';
        messageDiv.dataset.messageId = message.id;
        messageDiv.style.textAlign = textAlign;
        
        // Handle created_at properly
        const timeStr = formatTime(message.created_at);
        const bodyText = escapeHtml(message.body);
        
        let messageContent = `
            <div style="display: inline-block; padding: 10px 15px; border-radius: 10px; max-width: 70%; background-color: ${bgColor}; color: #fff; word-wrap: break-word;">
                ${bodyText}
        `;
        
        // Add images if exist
        if (message.attachment && message.attachment.trim()) {
            try {
                const attachments = JSON.parse(message.attachment);
                const attachmentArray = Array.isArray(attachments) ? attachments : [message.attachment];
                
                if (attachmentArray.length > 1) {
                    // Create carousel for multiple images
                    messageContent += `
                        <div style="margin-top: 10px; position: relative; width: 300px;">
                            <div id="carousel-${message.id}" class="carousel slide" data-bs-ride="false" style="background-color: #1a1a1a; border-radius: 5px;">
                                <div class="carousel-inner">
                    `;
                    
                    attachmentArray.forEach((attachment, index) => {
                        const active = index === 0 ? 'active' : '';
                        messageContent += `
                            <div class="carousel-item ${active}">
                                <img src="/storage/${attachment}" style="width: 100%; height: 300px; object-fit: cover; border-radius: 5px;" alt="Image" onerror="this.style.display='none'">
                            </div>
                        `;
                    });
                    
                    messageContent += `
                                </div>
                                <button class="carousel-control-prev" type="button" data-bs-target="#carousel-${message.id}" data-bs-slide="prev" style="background-color: rgba(0,0,0,0.5); border: none;">
                                    <span class="carousel-control-prev-icon" aria-hidden="true"></span>
                                </button>
                                <button class="carousel-control-next" type="button" data-bs-target="#carousel-${message.id}" data-bs-slide="next" style="background-color: rgba(0,0,0,0.5); border: none;">
                                    <span class="carousel-control-next-icon" aria-hidden="true"></span>
                                </button>
                            </div>
                            <small style="color: #999; display: block; margin-top: 5px; text-align: center;">${attachmentArray.length} images</small>
                        </div>
                    `;
                } else {
                    // Single image
                    const imagePath = attachmentArray[0].startsWith('/storage/') ? attachmentArray[0] : '/storage/' + attachmentArray[0];
                    messageContent += `<br><img src="${imagePath}" style="max-width: 100%; border-radius: 5px; margin-top: 10px;" onerror="this.style.display='none'">`;
                }
            } catch(e) {
                // Fallback for old single attachment format
                const imagePath = message.attachment.startsWith('/storage/') ? message.attachment : '/storage/' + message.attachment;
                messageContent += `<br><img src="${imagePath}" style="max-width: 100%; border-radius: 5px; margin-top: 10px;" onerror="this.style.display='none'">`;
            }
        }
        
        messageContent += `</div>
            <small class="d-block" style="color: #999; margin-top: 5px;">${timeStr}</small>
        `;
        
        messageDiv.innerHTML = messageContent;
        messagesContainer.appendChild(messageDiv);
        
        // Reinitialize Bootstrap carousels if they exist
        const carousels = messageDiv.querySelectorAll('.carousel');
        carousels.forEach(carouselEl => {
            new bootstrap.Carousel(carouselEl, { interval: false });
        });
        
        console.log('Message added:', message.id, message.body, 'attachment:', message.attachment, 'isOwn:', isOwn);
    }

    // Escape HTML
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Handle form submission
    messageForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const body = messageInput.value.trim();
        
        // Don't send if both message and files are empty
        if (!body && selectedFiles.length === 0) return;

        sendBtn.disabled = true;
        
        // Create one request with all files
        const formData = new FormData();
        formData.append('receiver_id', receiverId);
        if (body) {
            formData.append('body', body);
        }
        
        // Add all selected files
        selectedFiles.forEach((file) => {
            formData.append('attachments[]', file);
        });
        
        fetch('/api/messages', {
            method: 'POST',
            headers: {
                'X-CSRF-TOKEN': document.querySelector('input[name="_token"]').value,
            },
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => {
                    throw new Error(err.error || 'Error sending message');
                });
            }
            return response.json();
        })
        .then(message => {
            console.log('Message sent successfully:', message);
            addMessageToUI(message);
            messageInput.value = '';
            errorMsg.style.display = 'none';
            previewContainer.style.display = 'none';
            previewImages.innerHTML = '';
            selectedFiles = [];
            attachmentInput.value = '';
            scrollToBottom();
            sendBtn.disabled = false;
            messageInput.focus();
        })
        .catch(error => {
            console.error('Error:', error);
            errorMsg.textContent = error.message;
            errorMsg.style.display = 'block';
            sendBtn.disabled = false;
        });
    });

    // File input change handler
    attachmentInput.addEventListener('change', function(e) {
        selectedFiles = Array.from(e.target.files);
        
        if (selectedFiles.length > 0) {
            previewImages.innerHTML = '';
            
            selectedFiles.forEach((file, index) => {
                const reader = new FileReader();
                
                reader.onload = function(event) {
                    const previewDiv = document.createElement('div');
                    previewDiv.style.position = 'relative';
                    previewDiv.style.display = 'inline-block';
                    
                    const img = document.createElement('img');
                    img.src = event.target.result;
                    img.style.maxHeight = '80px';
                    img.style.borderRadius = '5px';
                    
                    const removeBtn = document.createElement('button');
                    removeBtn.type = 'button';
                    removeBtn.innerHTML = '<i class="fas fa-times" style="color: white;"></i>';
                    removeBtn.style.position = 'absolute';
                    removeBtn.style.top = '2px';
                    removeBtn.style.right = '2px';
                    removeBtn.style.backgroundColor = '#dc3545';
                    removeBtn.style.border = 'none';
                    removeBtn.style.borderRadius = '50%';
                    removeBtn.style.width = '24px';
                    removeBtn.style.height = '24px';
                    removeBtn.style.cursor = 'pointer';
                    removeBtn.className = 'btn btn-sm';
                    
                    removeBtn.addEventListener('click', function(e) {
                        e.preventDefault();
                        selectedFiles.splice(index, 1);
                        
                        if (selectedFiles.length === 0) {
                            previewContainer.style.display = 'none';
                            previewImages.innerHTML = '';
                            attachmentInput.value = '';
                        } else {
                            // Re-trigger change to refresh preview
                            attachmentInput.dispatchEvent(new Event('change'));
                        }
                    });
                    
                    previewDiv.appendChild(img);
                    previewDiv.appendChild(removeBtn);
                    previewImages.appendChild(previewDiv);
                };
                
                reader.readAsDataURL(file);
            });
            
            previewContainer.style.display = 'block';
        } else {
            previewContainer.style.display = 'none';
            previewImages.innerHTML = '';
        }
    });

    // Attachment button click handler
    attachmentBtn.addEventListener('click', function(e) {
        e.preventDefault();
        attachmentInput.click();
    });

    // Clear attachments button
    clearBtn.addEventListener('click', function(e) {
        e.preventDefault();
        selectedFiles = [];
        attachmentInput.value = '';
        previewContainer.style.display = 'none';
        previewImages.innerHTML = '';
    });

    // Initial load and set up polling
    scrollToBottom();
    setInterval(loadMessages, 2000); // Poll every 2 seconds
</script>
@endsection
