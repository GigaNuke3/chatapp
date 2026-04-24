/**
 * Chat Application - Main JavaScript
 * Handles message sending, user search, and auto-scroll functionality
 */

/**
 * Update CSS variables for dark/light mode
 * isDarkMode: true = dark mode (frequency 0), false = light mode (frequency 100)
 */
function updateThemeVariables(isDarkMode) {
    const root = document.documentElement;
    const body = document.body;
    
    // Define dark mode colors (RGB)
    const darkColors = {
        bgPrimary: [26, 26, 26],           // #1a1a1a
        bgSecondary: [45, 45, 45],         // #2d2d2d
        bgTertiary: [61, 61, 61],          // #3d3d3d
        bgQuaternary: [37, 37, 37],        // #252525
        textPrimary: [255, 255, 255],      // #ffffff
        textSecondary: [204, 204, 204],    // #cccccc
        textTertiary: [153, 153, 153],     // #999999
        borderColor: [200, 200, 200],      // #c8c8c8 - light borders for dark backgrounds
    };
    
    // Define light mode colors (RGB)
    const lightColors = {
        bgPrimary: [248, 249, 250],        // #f8f9fa
        bgSecondary: [255, 255, 255],      // #ffffff
        bgTertiary: [233, 236, 239],       // #e9ecef
        bgQuaternary: [241, 243, 245],     // #f1f3f5
        textPrimary: [26, 26, 26],         // #1a1a1a
        textSecondary: [51, 51, 51],       // #333333
        textTertiary: [102, 102, 102],     // #666666
        borderColor: [50, 50, 50],         // #323232 - dark borders for light backgrounds
    };
    
    // Adjust brightness based on mode
    // Dark mode: brightness = 0.85 (dimmed)
    // Light mode: brightness = 1.5 (bright)
    const brightness = isDarkMode ? 0.85 : 1.5;
    
    const interpolateColor = (colorName) => {
        const color = isDarkMode ? darkColors[colorName] : lightColors[colorName];
        return [color[0], color[1], color[2]];
    };
    
    const interpolateColorWithBrightness = (colorName) => {
        const color = isDarkMode ? darkColors[colorName] : lightColors[colorName];
        
        // Apply brightness adjustment ONLY to backgrounds
        return [
            Math.round(Math.min(255, color[0] * brightness)),
            Math.round(Math.min(255, color[1] * brightness)),
            Math.round(Math.min(255, color[2] * brightness)),
        ];
    };
    
    const interpolateBorderColor = () => {
        // Borders are opposite of mode for contrast
        // Dark mode: use light borders (#c8c8c8)
        // Light mode: use dark borders (#323232)
        const color = isDarkMode ? darkColors.borderColor : lightColors.borderColor;
        
        // Apply brightness to borders too for consistency
        return [
            Math.round(Math.min(255, color[0] * brightness)),
            Math.round(Math.min(255, color[1] * brightness)),
            Math.round(Math.min(255, color[2] * brightness)),
        ];
    };
    
    // Apply interpolated colors to CSS variables
    // TEXT: No brightness adjustment - stays crisp and readable
    // BACKGROUNDS: Brightness adjustment applied
    // BORDERS: Inverted with brightness adjustment
    const colors = {
        '--bg-primary': interpolateColorWithBrightness('bgPrimary'),
        '--bg-secondary': interpolateColorWithBrightness('bgSecondary'),
        '--bg-tertiary': interpolateColorWithBrightness('bgTertiary'),
        '--bg-quaternary': interpolateColorWithBrightness('bgQuaternary'),
        '--text-primary': interpolateColor('textPrimary'),
        '--text-secondary': interpolateColor('textSecondary'),
        '--text-tertiary': interpolateColor('textTertiary'),
        '--border-color': interpolateBorderColor(),
    };
    
    // Set variables on root for global access
    for (const [key, rgb] of Object.entries(colors)) {
        const rgbValue = `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
        root.style.setProperty(key, rgbValue);
        // Also set on body as fallback
        body.style.setProperty(key, rgbValue);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Apply saved theme immediately on page load
    const savedIsDarkMode = localStorage.getItem('chat-dark-mode') !== 'false';
    applyDarkMode(savedIsDarkMode);
    
    initializeChat();
});

let selectedAttachmentFiles = [];
const MAX_ATTACHMENTS_PER_MESSAGE = 10;
let activeChatChannelName = null;
let messageLightboxState = {
    images: [],
    currentIndex: 0,
    touchStartX: null,
    touchStartY: null,
};

/**
 * Initialize all chat functionality
 */
function initializeChat() {
    localizeMessageTimes();
    autoScrollMessages();
    setupMessageForm();
    setupUserSearch();
    setupAttachmentButton();
    setupAttachmentPreviewControls();
    setupMessageImageLightbox();
    setupRealtimeMessages();
    markConversationAsRead();
    setupSidebarToggle();
    setupThemeToggle();
}

/**
 * Subscribe to realtime chat events for the logged-in user
 */
function setupRealtimeMessages() {
    const messagesContainer = document.getElementById('messagesContainer');
    if (!messagesContainer || !window.Echo) return;

    const currentUserId = Number(messagesContainer.dataset.currentUserId);
    const activeChatUserId = Number(messagesContainer.dataset.chatUserId);
    if (!currentUserId || !activeChatUserId) return;

    const channelName = `chat.${currentUserId}`;
    if (activeChatChannelName === channelName) return;

    if (activeChatChannelName) {
        window.Echo.leave(activeChatChannelName);
    }

    activeChatChannelName = channelName;

    window.Echo.private(channelName)
        .listen('MessageSent', (event) => {
            if (Number(event.sender_id) !== activeChatUserId) return;
            appendMessageToChat(event, false);
            markConversationAsRead();
        })
        .listen('.MessageRead', (event) => {
            if (Number(event.reader_id) !== activeChatUserId) return;
            if (!Array.isArray(event.message_ids)) return;

            event.message_ids.forEach((messageId) => {
                updateMessageReadStatus(messageId, true);
            });
        });
}

/**
 * Mark all incoming messages in the active conversation as read
 */
async function markConversationAsRead() {
    const messagesContainer = document.getElementById('messagesContainer');
    if (!messagesContainer) return;

    const chatUserId = messagesContainer.dataset.chatUserId;
    if (!chatUserId) return;

    const csrfToken = document.querySelector('input[name="_token"]')?.value;
    if (!csrfToken) return;

    const headers = {
        'X-CSRF-TOKEN': csrfToken,
    };

    const socketId = window.Echo?.socketId?.();
    if (socketId) {
        headers['X-Socket-ID'] = socketId;
    }

    try {
        await fetch(route('message.read', { userId: chatUserId }), {
            method: 'POST',
            headers,
        });
    } catch (_) {
        // Fail silently; read status will sync on next successful request.
    }
}

/**
 * Build full attachment URLs from message payload variants
 */
function getAttachmentUrlsFromMessage(message) {
    if (Array.isArray(message.attachment_urls)) {
        return message.attachment_urls;
    }

    let attachmentPaths = [];

    if (Array.isArray(message.attachment_paths)) {
        attachmentPaths = message.attachment_paths;
    } else if (Array.isArray(message.attachment)) {
        attachmentPaths = message.attachment;
    } else if (typeof message.attachment === 'string' && message.attachment.length > 0) {
        try {
            const parsed = JSON.parse(message.attachment);
            if (Array.isArray(parsed)) {
                attachmentPaths = parsed;
            }
        } catch (_) {
            if (message.attachment.startsWith('http')) {
                return [message.attachment];
            }
            attachmentPaths = [message.attachment];
        }
    }

    return attachmentPaths.map(path => path.startsWith('http') ? path : `/storage/${path}`);
}

/**
 * Escape raw text before inserting into HTML
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Format timestamp to local 12-hour display
 */
function formatMessageTime(createdAt) {
    const parsedDate = new Date(createdAt);
    if (Number.isNaN(parsedDate.getTime())) return '';

    return new Intl.DateTimeFormat(undefined, {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    }).format(parsedDate);
}

/**
 * Append a single message to the current chat thread
 */
function appendMessageToChat(message, isOwnMessage) {
    const messagesContainer = document.getElementById('messagesContainer');
    if (!messagesContainer) return;

    const existingMessage = document.getElementById(`message-${message.id}`);
    if (existingMessage) return;

    const sideClass = isOwnMessage ? 'sent' : 'received';
    const attachmentUrls = getAttachmentUrlsFromMessage(message);
    const safeBody = typeof message.body === 'string' ? message.body.trim() : '';
    const imageCount = attachmentUrls.length;
    const createdAt = message.created_at || new Date().toISOString();
    const statusLabel = isOwnMessage && message.is_read ? 'Seen' : 'Delivered';

    const avatarHtml = !isOwnMessage
        ? (message.sender?.avatar
            ? `<img src="${message.sender.avatar}" alt="${escapeHtml(message.sender?.name || 'User')}" class="message-sender-avatar">`
            : `<div class="message-sender-placeholder">${escapeHtml((message.sender?.name || 'U').charAt(0).toUpperCase())}</div>`)
        : '';

    const bodyHtml = safeBody
        ? `<div class="message-bubble ${sideClass}">${escapeHtml(safeBody)}</div>`
        : '';

    const attachmentsHtml = imageCount > 0
        ? `<div class="message-attachments ${sideClass} ${imageCount > 1 ? 'multi-image' : 'single-image'}">
                ${attachmentUrls.map((url) => `
                    <div class="attachment-image-wrapper">
                        <img src="${url}" alt="Shared image" class="attachment-image" loading="lazy">
                    </div>
                `).join('')}
           </div>
           ${imageCount > 1 ? `<div class="image-count-label">${imageCount} images</div>` : ''}`
        : '';

    const messageRow = document.createElement('div');
    messageRow.id = `message-${message.id}`;
    messageRow.className = `message-row ${sideClass}`;
    messageRow.dataset.messageId = String(message.id);
    messageRow.innerHTML = `
        <div class="message-wrapper ${sideClass}">
            ${avatarHtml}
            <div class="message-content ${sideClass}">
                ${bodyHtml}
                ${attachmentsHtml}
                <div class="message-time" data-utc-time="${createdAt}">
                    ${formatMessageTime(createdAt)}
                    ${isOwnMessage ? `<span class="message-status" data-message-status-id="${message.id}">${statusLabel}</span>` : ''}
                </div>
            </div>
        </div>
    `;

    const emptyMessages = messagesContainer.querySelector('.empty-messages');
    if (emptyMessages) {
        emptyMessages.remove();
    }

    messagesContainer.appendChild(messageRow);
    autoScrollMessages();
}

/**
 * Update delivered/seen status label for a specific sent message
 */
function updateMessageReadStatus(messageId, isRead) {
    const statusElement = document.querySelector(`[data-message-status-id="${messageId}"]`);
    if (!statusElement) return;

    statusElement.textContent = isRead ? 'Seen' : 'Delivered';
}

/**
 * Format message times in the viewer's local timezone automatically
 */
function localizeMessageTimes() {
    const messageTimes = document.querySelectorAll('.message-time[data-utc-time]');
    if (messageTimes.length === 0) return;

    const timeFormatter = new Intl.DateTimeFormat(undefined, {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });

    const tooltipFormatter = new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
    });

    messageTimes.forEach((element) => {
        const utcTime = element.dataset.utcTime;
        if (!utcTime) return;

        const parsedDate = new Date(utcTime);
        if (Number.isNaN(parsedDate.getTime())) return;

        element.textContent = timeFormatter.format(parsedDate);
        element.title = tooltipFormatter.format(parsedDate);
    });
}

/**
 * Setup click-to-open lightbox for message attachments
 */
function setupMessageImageLightbox() {
    ensureMessageLightbox();

    document.addEventListener('click', function(event) {
        const image = event.target.closest('.message-attachments .attachment-image');
        if (!image) return;

        const attachmentsContainer = image.closest('.message-attachments');
        if (!attachmentsContainer) return;

        const images = Array.from(attachmentsContainer.querySelectorAll('.attachment-image')).map(img => img.src);
        const currentIndex = images.indexOf(image.src);
        if (images.length === 0 || currentIndex < 0) return;

        openMessageLightbox(images, currentIndex);
    });

    document.addEventListener('keydown', function(event) {
        const overlay = document.getElementById('messageLightbox');
        if (!overlay || !overlay.classList.contains('open')) return;

        if (event.key === 'Escape') {
            closeMessageLightbox();
            return;
        }

        if (event.key === 'ArrowLeft') {
            navigateMessageLightbox(-1);
            return;
        }

        if (event.key === 'ArrowRight') {
            navigateMessageLightbox(1);
        }
    });
}

/**
 * Create lightbox DOM once and bind controls
 */
function ensureMessageLightbox() {
    if (document.getElementById('messageLightbox')) return;

    const overlay = document.createElement('div');
    overlay.id = 'messageLightbox';
    overlay.className = 'message-lightbox';
    overlay.innerHTML = `
        <div class="message-lightbox-content">
            <button type="button" class="message-lightbox-close" id="messageLightboxClose" aria-label="Close image viewer">&times;</button>
            <button type="button" class="message-lightbox-nav message-lightbox-prev" id="messageLightboxPrev" aria-label="Previous image">&#8249;</button>
            <img id="messageLightboxImage" class="message-lightbox-image" alt="Message attachment preview" />
            <button type="button" class="message-lightbox-nav message-lightbox-next" id="messageLightboxNext" aria-label="Next image">&#8250;</button>
        </div>
    `;

    document.body.appendChild(overlay);

    const lightboxContent = overlay.querySelector('.message-lightbox-content');

    overlay.addEventListener('click', function(event) {
        if (event.target === overlay) {
            closeMessageLightbox();
        }
    });

    lightboxContent.addEventListener('touchstart', function(event) {
        const firstTouch = event.changedTouches[0];
        messageLightboxState.touchStartX = firstTouch.clientX;
        messageLightboxState.touchStartY = firstTouch.clientY;
    }, { passive: true });

    lightboxContent.addEventListener('touchend', function(event) {
        const firstTouch = event.changedTouches[0];
        handleLightboxSwipe(firstTouch.clientX, firstTouch.clientY);
    }, { passive: true });

    document.getElementById('messageLightboxClose').addEventListener('click', closeMessageLightbox);
    document.getElementById('messageLightboxPrev').addEventListener('click', function() {
        navigateMessageLightbox(-1);
    });
    document.getElementById('messageLightboxNext').addEventListener('click', function() {
        navigateMessageLightbox(1);
    });
}

/**
 * Handle horizontal swipe navigation inside the image lightbox
 */
function handleLightboxSwipe(endX, endY) {
    if (messageLightboxState.touchStartX === null || messageLightboxState.touchStartY === null) {
        return;
    }

    const deltaX = endX - messageLightboxState.touchStartX;
    const deltaY = endY - messageLightboxState.touchStartY;

    messageLightboxState.touchStartX = null;
    messageLightboxState.touchStartY = null;

    if (Math.abs(deltaY) > Math.abs(deltaX) || Math.abs(deltaX) < 40) {
        return;
    }

    if (deltaX < 0) {
        navigateMessageLightbox(1);
    } else {
        navigateMessageLightbox(-1);
    }
}

/**
 * Open lightbox with a set of image URLs
 */
function openMessageLightbox(images, startIndex) {
    const overlay = document.getElementById('messageLightbox');
    if (!overlay) return;

    messageLightboxState.images = images;
    messageLightboxState.currentIndex = startIndex;

    updateMessageLightboxImage();
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
}

/**
 * Close the image lightbox
 */
function closeMessageLightbox() {
    const overlay = document.getElementById('messageLightbox');
    if (!overlay) return;

    overlay.classList.remove('open');
    document.body.style.overflow = '';
    messageLightboxState.touchStartX = null;
    messageLightboxState.touchStartY = null;
}

/**
 * Move to previous/next image in lightbox
 */
function navigateMessageLightbox(direction) {
    const total = messageLightboxState.images.length;
    if (total === 0) return;

    messageLightboxState.currentIndex = (messageLightboxState.currentIndex + direction + total) % total;
    updateMessageLightboxImage();
}

/**
 * Update rendered image and arrow visibility
 */
function updateMessageLightboxImage() {
    const imageElement = document.getElementById('messageLightboxImage');
    const prevButton = document.getElementById('messageLightboxPrev');
    const nextButton = document.getElementById('messageLightboxNext');
    if (!imageElement || !prevButton || !nextButton) return;

    const images = messageLightboxState.images;
    if (images.length === 0) return;

    imageElement.src = images[messageLightboxState.currentIndex];
    const showNav = images.length > 1;
    prevButton.style.display = showNav ? 'flex' : 'none';
    nextButton.style.display = showNav ? 'flex' : 'none';
}

/**
 * Auto-scroll to bottom of messages container
 */
function autoScrollMessages() {
    const messagesContainer = document.getElementById('messagesContainer');
    if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
}

/**
 * Setup message form submission handler
 */
function setupMessageForm() {
    const messageForm = document.getElementById('messageForm');
    if (!messageForm) return;

    messageForm.addEventListener('submit', handleMessageSubmit);
}

/**
 * Handle message form submission
 * @param {Event} e - Submit event
 */
async function handleMessageSubmit(e) {
    e.preventDefault();

    const messageInput = document.getElementById('messageInput');
    const fileInput = document.getElementById('fileInput');
    const message = messageInput.value.trim();
    const hasFiles = selectedAttachmentFiles.length > 0;

    if (selectedAttachmentFiles.length > MAX_ATTACHMENTS_PER_MESSAGE) {
        showNotification(`You can send up to ${MAX_ATTACHMENTS_PER_MESSAGE} images per message.`, 'error');
        return;
    }

    if (!message && !hasFiles) return;

    try {
        const csrfToken = document.querySelector('input[name="_token"]').value;
        const receiverId = document.querySelector('input[name="receiver_id"]').value;

        const formData = new FormData();
        formData.append('receiver_id', receiverId);
        if (message) {
            formData.append('body', message);
        }

        if (selectedAttachmentFiles.length > 0) {
            for (let file of selectedAttachmentFiles) {
                formData.append('attachments[]', file);
            }
        }

        console.log('Attachment counts before fetch', {
            fileInputCount: fileInput ? fileInput.files.length : 0,
            selectedAttachmentFilesCount: selectedAttachmentFiles.length
        });

        const response = await fetch(route('message.send'), {
            method: 'POST',
            headers: {
                'X-CSRF-TOKEN': csrfToken
            },
            body: formData
        });

        if (response.ok) {
            const sentMessage = await response.json();
            appendMessageToChat(sentMessage, true);

            messageInput.value = '';
            messageInput.placeholder = 'Type a message...';
            messageInput.dataset.hasFiles = 'false';
            messageInput.dataset.fileCount = '0';
            if (fileInput) fileInput.value = '';
            selectedAttachmentFiles = [];
            renderAttachmentPreviews();
            messageInput.focus();
        } else {
            let errorMessage = 'Failed to send message';

            try {
                const errorData = await response.json();
                if (errorData?.message) {
                    errorMessage = errorData.message;
                }
                if (errorData?.errors?.attachments) {
                    errorMessage = errorData.errors.attachments[0];
                }
            } catch (_) {
            }

            console.error('Failed to send message:', response.statusText);
            showNotification(errorMessage, 'error');
        }
    } catch (error) {
        console.error('Error sending message:', error);
        showNotification('Error sending message', 'error');
    }
}

/**
 * Setup user search functionality
 */
function setupUserSearch() {
    const searchInput = document.getElementById('searchUsers');
    if (!searchInput) return;

    searchInput.addEventListener('keyup', handleUserSearch);
}

/**
 * Setup attachment button functionality
 */
function setupAttachmentButton() {
    const attachmentBtn = document.getElementById('attachmentBtn');
    const gifBtn = document.getElementById('gifBtn');
    const fileInput = document.getElementById('fileInput');

    if (!attachmentBtn || !fileInput) return;

    attachmentBtn.addEventListener('click', function(e) {
        e.preventDefault();
        fileInput.accept = 'image/*';
        fileInput.click();
    });

    if (gifBtn) {
        gifBtn.addEventListener('click', function(e) {
            e.preventDefault();
            fileInput.accept = 'image/gif';
            fileInput.click();
        });
    }

    fileInput.addEventListener('change', function(event) {
        handleFileSelection(event);
        fileInput.accept = 'image/*';
    });
}

/**
 * Setup preview controls for selected attachments
 */
function setupAttachmentPreviewControls() {
    const previewContainer = document.getElementById('preview-container');
    if (!previewContainer) return;

    previewContainer.addEventListener('click', function(event) {
        const removeButton = event.target.closest('[data-preview-index]');
        if (removeButton) {
            const index = Number(removeButton.dataset.previewIndex);
            removeAttachmentAtIndex(index);
            return;
        }

        const clearButton = event.target.closest('#clearAttachmentsBtn');
        if (clearButton) {
            clearAttachmentSelection();
        }
    });
}

/**
 * Handle file selection from input
 * @param {Event} event - Change event from file input
 */
function handleFileSelection(event) {
    const files = event.target.files;
    if (files.length === 0) {
        return;
    }

    const messageInput = document.getElementById('messageInput');
    const fileInput = document.getElementById('fileInput');

    const availableSlots = MAX_ATTACHMENTS_PER_MESSAGE - selectedAttachmentFiles.length;

    if (availableSlots <= 0) {
        showNotification(`You can send up to ${MAX_ATTACHMENTS_PER_MESSAGE} images per message.`, 'error');
        if (fileInput) fileInput.value = '';
        return;
    }

    const incomingFiles = Array.from(files);
    const acceptedFiles = incomingFiles.slice(0, availableSlots);

    selectedAttachmentFiles = selectedAttachmentFiles.concat(acceptedFiles);

    if (incomingFiles.length > acceptedFiles.length) {
        showNotification(`Only the first ${MAX_ATTACHMENTS_PER_MESSAGE} images were selected.`, 'error');
    }

    syncFileInputFiles(fileInput);
    renderAttachmentPreviews();

    messageInput.dataset.hasFiles = 'true';
    messageInput.dataset.fileCount = selectedAttachmentFiles.length;

    messageInput.focus();
}

/**
 * Render preview thumbnails for the currently selected attachments
 */
function renderAttachmentPreviews() {
    const previewContainer = document.getElementById('preview-container');
    const previewImages = document.getElementById('preview-images');
    const fileInput = document.getElementById('fileInput');

    if (!previewContainer || !previewImages) return;

    previewImages.innerHTML = '';

    if (selectedAttachmentFiles.length === 0) {
        previewContainer.style.display = 'none';
        if (fileInput) fileInput.value = '';
        return;
    }

    selectedAttachmentFiles.forEach((file, index) => {
        const previewItem = document.createElement('div');
        previewItem.className = 'preview-item';

        const previewImage = document.createElement('img');
        previewImage.className = 'preview-image';
        previewImage.alt = file.name;
        previewImage.src = URL.createObjectURL(file);
        previewImage.onload = () => URL.revokeObjectURL(previewImage.src);

        const removeButton = document.createElement('button');
        removeButton.type = 'button';
        removeButton.className = 'remove-preview-btn';
        removeButton.dataset.previewIndex = String(index);
        removeButton.setAttribute('aria-label', 'Remove selected image');
        removeButton.innerHTML = '&times;';

        previewItem.appendChild(previewImage);
        previewItem.appendChild(removeButton);
        previewImages.appendChild(previewItem);
    });

    previewContainer.style.display = 'block';
}

/**
 * Sync the hidden file input with the selected file list
 */
function syncFileInputFiles(fileInput) {
    if (!fileInput) return;

    const dataTransfer = new DataTransfer();
    selectedAttachmentFiles.forEach(file => dataTransfer.items.add(file));
    fileInput.files = dataTransfer.files;
}

/**
 * Remove a single attachment from the selection
 */
function removeAttachmentAtIndex(index) {
    if (index < 0 || index >= selectedAttachmentFiles.length) return;

    selectedAttachmentFiles.splice(index, 1);
    const fileInput = document.getElementById('fileInput');
    const messageInput = document.getElementById('messageInput');

    syncFileInputFiles(fileInput);
    renderAttachmentPreviews();

    if (messageInput) {
        messageInput.dataset.fileCount = selectedAttachmentFiles.length;
        messageInput.dataset.hasFiles = selectedAttachmentFiles.length > 0 ? 'true' : 'false';
    }
}

/**
 * Clear all selected attachments
 */
function clearAttachmentSelection() {
    selectedAttachmentFiles = [];

    const fileInput = document.getElementById('fileInput');
    const messageInput = document.getElementById('messageInput');

    if (fileInput) fileInput.value = '';
    if (messageInput) {
        messageInput.dataset.hasFiles = 'false';
        messageInput.dataset.fileCount = '0';
        messageInput.placeholder = 'Type a message...';
    }

    renderAttachmentPreviews();
}

/**
 * Handle user search input
 * @param {Event} event - Keyup event
 */
function handleUserSearch(event) {
    const searchTerm = event.target.value.toLowerCase();
    const userItems = document.querySelectorAll('.user-item');

    userItems.forEach(item => {
        const userName = item.getAttribute('data-user-name').toLowerCase();
        item.style.display = userName.includes(searchTerm) ? 'flex' : 'none';
    });
}

/**
 * Show notification message
 * @param {string} message - Message to display
 * @param {string} type - Type of notification ('success', 'error', 'info')
 */
function showNotification(message, type = 'info') {
    console.log(`[${type.toUpperCase()}] ${message}`);
}

/**
 * Helper function to get route URL
 * @param {string} routeName - Route name
 * @returns {string} - Route URL
 */
function route(routeName) {
    const routes = {
        'message.send': '/api/messages',
        'message.read': '/api/messages/{userId}/read',
    };

    let url = routes[routeName] || '/';
    const params = arguments[1] || {};

    Object.entries(params).forEach(([key, value]) => {
        url = url.replace(`{${key}}`, encodeURIComponent(String(value)));
    });

    return url;
}

/**
 * Setup sidebar toggle functionality
 */
function setupSidebarToggle() {
    const toggleBtn = document.getElementById('sidebarToggle');
    const sidebar = document.querySelector('.chat-sidebar');
    
    if (!toggleBtn || !sidebar) return;
    
    // Function to determine if we're on a mobile/tablet view
    function isMobileView() {
        return window.innerWidth <= 768;
    }
    
    // Function to update sidebar visibility based on screen size
    function updateSidebarForScreenSize() {
        const savedState = localStorage.getItem('sidebar-hidden');
        
        if (isMobileView()) {
            // On mobile/tablet, respect saved state
            if (savedState === 'true') {
                sidebar.classList.add('hidden');
            } else {
                sidebar.classList.remove('hidden');
            }
        } else {
            // On desktop, always show sidebar
            sidebar.classList.remove('hidden');
            localStorage.setItem('sidebar-hidden', 'false');
        }
    }
    
    // Initialize on page load
    updateSidebarForScreenSize();
    
    // Handle toggle button click
    toggleBtn.addEventListener('click', function(e) {
        e.preventDefault();
        
        if (isMobileView()) {
            sidebar.classList.toggle('hidden');
            const isHidden = sidebar.classList.contains('hidden');
            localStorage.setItem('sidebar-hidden', isHidden);
        }
    });
    
    // Handle window resize
    let resizeTimer;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function() {
            updateSidebarForScreenSize();
        }, 250);
    });
    
    // Auto-close sidebar on mobile when user is clicked
    const userItems = sidebar.querySelectorAll('.user-item');
    userItems.forEach(item => {
        item.addEventListener('click', function() {
            setTimeout(() => {
                if (isMobileView()) {
                    sidebar.classList.add('hidden');
                    localStorage.setItem('sidebar-hidden', 'true');
                }
            }, 100);
        });
    });
}

/**
 * Setup theme frequency slider functionality
 */
function setupThemeToggle() {
    setupDarkModeToggle();
    setupAppSettingsMenu();
}


/**
 * Apply dark or light mode
 */
function applyDarkMode(isDarkMode) {
    const body = document.body;
    
    // Update class for consistency
    body.classList.remove('light-mode', 'dark-mode');
    body.classList.add(isDarkMode ? 'dark-mode' : 'light-mode');
    
    // Apply the theme
    updateThemeVariables(isDarkMode);
}

/**
 * Setup dark/light mode toggle
 */
function setupDarkModeToggle() {
    const toggleBtn = document.getElementById('darkModeToggle');
    if (!toggleBtn) return;
    
    // Load saved preference or default to dark mode
    const savedIsDarkMode = localStorage.getItem('chat-dark-mode') !== 'false';
    
    // Apply saved theme on load
    applyDarkMode(savedIsDarkMode);
    updateToggleButtonIcon(savedIsDarkMode, toggleBtn);
    
    // Add click listener
    toggleBtn.addEventListener('click', () => {
        // Get current state from body class
        const isDarkMode = document.body.classList.contains('dark-mode');
        const newIsDarkMode = !isDarkMode;
        
        // Apply new theme
        applyDarkMode(newIsDarkMode);
        updateToggleButtonIcon(newIsDarkMode, toggleBtn);
        
        // Save preference
        localStorage.setItem('chat-dark-mode', newIsDarkMode);
    });
}

/**
 * Update toggle button icon based on mode
 */
function updateToggleButtonIcon(isDarkMode, btn) {
    if (!btn) return;
    const icon = btn.querySelector('i');
    if (icon) {
        icon.className = isDarkMode ? 'fas fa-moon' : 'fas fa-sun';
    }
    btn.setAttribute('aria-pressed', isDarkMode);
}

/**
 * Setup app settings menu (gear icon)
 */
function setupAppSettingsMenu() {
    const settingsToggle = document.getElementById('appSettingsToggle');
    const settingsMenu = document.getElementById('appSettingsMenu');
    const darkThemeBtn = document.querySelector('.dark-theme-btn');
    const lightThemeBtn = document.querySelector('.light-theme-btn');
    
    if (!settingsToggle || !settingsMenu) return;
    
    // Get current theme
    const isDarkMode = localStorage.getItem('chat-dark-mode') !== 'false';
    updateThemeButtons(isDarkMode, darkThemeBtn, lightThemeBtn);
    
    // Toggle menu on gear icon click
    settingsToggle.addEventListener('click', function(e) {
        e.stopPropagation();
        const isHidden = settingsMenu.style.display === 'none';
        settingsMenu.style.display = isHidden ? 'block' : 'none';
        settingsToggle.setAttribute('aria-expanded', isHidden);
    });
    
    // Handle theme button clicks
    if (darkThemeBtn) {
        darkThemeBtn.addEventListener('click', () => {
            applyDarkMode(true);
            localStorage.setItem('chat-dark-mode', 'true');
            updateThemeButtons(true, darkThemeBtn, lightThemeBtn);
            const toggleBtn = document.getElementById('darkModeToggle');
            updateToggleButtonIcon(true, toggleBtn);
        });
    }
    
    if (lightThemeBtn) {
        lightThemeBtn.addEventListener('click', () => {
            applyDarkMode(false);
            localStorage.setItem('chat-dark-mode', 'false');
            updateThemeButtons(false, darkThemeBtn, lightThemeBtn);
            const toggleBtn = document.getElementById('darkModeToggle');
            updateToggleButtonIcon(false, toggleBtn);
        });
    }
    
    // Close menu when clicking outside
    document.addEventListener('click', function(e) {
        if (!settingsToggle.contains(e.target) && !settingsMenu.contains(e.target)) {
            settingsMenu.style.display = 'none';
            settingsToggle.setAttribute('aria-expanded', 'false');
        }
    });
}

/**
 * Update theme button active states
 */
function updateThemeButtons(isDarkMode, darkBtn, lightBtn) {
    if (darkBtn) {
        darkBtn.classList.toggle('active', isDarkMode);
    }
    if (lightBtn) {
        lightBtn.classList.toggle('active', !isDarkMode);
    }
}
