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
    const message = messageInput.value.trim();

    if (!message) return;

    try {
        const csrfToken = document.querySelector('input[name="_token"]').value;
        const receiverId = document.querySelector('input[name="receiver_id"]').value;

        const response = await fetch(route('message.send'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfToken
            },
            body: JSON.stringify({
                receiver_id: receiverId,
                body: message
            })
        });

        if (response.ok) {
            messageInput.value = '';
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
