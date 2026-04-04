/**
 * Chat Application - Main JavaScript
 * Handles message sending, user search, and auto-scroll functionality
 */

document.addEventListener('DOMContentLoaded', function() {
    initializeChat();
});

let selectedAttachmentFiles = [];
const MAX_ATTACHMENTS_PER_MESSAGE = 10;
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
            messageInput.value = '';
            messageInput.placeholder = 'Type a message...';
            messageInput.dataset.hasFiles = 'false';
            messageInput.dataset.fileCount = '0';
            if (fileInput) fileInput.value = '';
            selectedAttachmentFiles = [];
            renderAttachmentPreviews();
            messageInput.focus();
            window.location.reload();
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
    const fileInput = document.getElementById('fileInput');

    if (!attachmentBtn || !fileInput) return;

    attachmentBtn.addEventListener('click', function(e) {
        e.preventDefault();
        fileInput.click();
    });

    fileInput.addEventListener('change', handleFileSelection);
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
        'message.send': '/api/messages'
    };
    return routes[routeName] || '/';
}
