/**
 * Chat Application - Main JavaScript
 * Handles message sending, user search, and auto-scroll functionality
 */

document.addEventListener('DOMContentLoaded', function() {
    initializeChat();
});

/**
 * Initialize all chat functionality
 */
function initializeChat() {
    autoScrollMessages();
    setupMessageForm();
    setupUserSearch();
    setupAttachmentButton();
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
    const hasFiles = fileInput && fileInput.files.length > 0;

    // Only files are being sent, no text message
    if (!message && !hasFiles) return;

    try {
        const csrfToken = document.querySelector('input[name="_token"]').value;
        const receiverId = document.querySelector('input[name="receiver_id"]').value;

        // Use FormData to support file uploads
        const formData = new FormData();
        formData.append('receiver_id', receiverId);
        // Only append body if there's actual message text (not just file indicator)
        if (message) {
            formData.append('body', message);
        }
        
        // Add files if any
        if (fileInput && fileInput.files.length > 0) {
            for (let file of fileInput.files) {
                formData.append('attachments[]', file);
            }
        }

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
            messageInput.focus();
            // Reload to show new message in the list
            window.location.reload();
        } else {
            console.error('Failed to send message:', response.statusText);
            showNotification('Failed to send message', 'error');
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
 * Handle file selection from input
 * @param {Event} event - Change event from file input
 */
function handleFileSelection(event) {
    const files = event.target.files;
    if (files.length === 0) return;
    
    const messageInput = document.getElementById('messageInput');
    const fileCount = files.length;
    
    // Set a data attribute to track files without modifying the input value
    messageInput.dataset.hasFiles = 'true';
    messageInput.dataset.fileCount = fileCount;
    
    // Show visual indicator in placeholder or as a separate label
    messageInput.placeholder = `${fileCount} file${fileCount > 1 ? 's' : ''} selected - type your message (optional)`;
    
    messageInput.focus();
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
    // This can be enhanced with a toast/notification library later
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
