// File: assets/js/main.js
// Description: Shared utility functions and Global State (Dark Mode & Auth).

// Application State for shared utilities
const appState = {
    darkMode: localStorage.getItem('darkMode') === 'enabled',
    user: null // Store user info if logged in
};

// Initialize dark mode
if (appState.darkMode) {
    document.documentElement.classList.add('dark-mode');
}

/**
 * Toggles the dark mode setting.
 */
function toggleDarkMode() {
    appState.darkMode = !appState.darkMode;
    if (appState.darkMode) {
        document.documentElement.classList.add('dark-mode');
        localStorage.setItem('darkMode', 'enabled');
    } else {
        document.documentElement.classList.remove('dark-mode');
        localStorage.setItem('darkMode', 'disabled');
    }
    updateDarkModeIcon();
}

/**
 * Updates the dark mode icon.
 */
function updateDarkModeIcon() {
    const iconElement = document.getElementById('darkModeIcon');
    if (iconElement && window.lucide) {
        iconElement.setAttribute('data-lucide', appState.darkMode ? 'sun' : 'moon');
        lucide.createIcons();
    }
}

/**
 * Displays a toast notification.
 */
function showMessage(text, type = 'success') {
    const messageBox = document.getElementById('messageBox');
    if (!messageBox) return;

    messageBox.innerHTML = '';
    messageBox.classList.remove('hidden', 'bg-green-600', 'bg-red-600', 'bg-blue-600', 'dark:bg-green-800', 'dark:bg-red-800', 'dark:bg-blue-800');
    
    let iconName = 'check-circle';
    let bgColor = 'bg-green-600';

    if (type === 'error') {
        iconName = 'alert-triangle';
        bgColor = 'bg-red-600';
    } else if (type === 'info') {
        iconName = 'info';
        bgColor = 'bg-blue-600';
    }

    messageBox.classList.add(bgColor, 'show');
    messageBox.innerHTML = `<i data-lucide="${iconName}" class="w-5 h-5 mr-2 inline"></i> ${text}`;
    
    if (window.lucide) lucide.createIcons();

    setTimeout(() => {
        messageBox.classList.remove('show');
        setTimeout(() => messageBox.classList.add('hidden'), 500);
    }, 4000);
}

/**
 * Checks if the user is logged in via PHP API.
 */
async function checkUserSession() {
    try {
        const res = await fetch('api/auth.php?action=check_session');
        const data = await res.json();
        if (data.success) {
            appState.user = data.user;
            updateNavbarAuth(true);
        } else {
            appState.user = null;
            updateNavbarAuth(false);
        }
    } catch (e) {
        console.error("Session check failed:", e);
        appState.user = null;
        updateNavbarAuth(false);
    }
}

/**
 * Updates the Navbar User Icon link based on auth status.
 */
function updateNavbarAuth(isLoggedIn) {
    // Select the anchor tag containing the user icon
    // We look for the link that points to account.html or auth.html
    const userLinks = document.querySelectorAll('a[href*="account.html"], a[href*="auth.html"]');
    
    userLinks.forEach(link => {
        // If it's the specific user icon link (usually has the user icon inside)
        if (link.querySelector('[data-lucide="user"]')) {
            if (isLoggedIn) {
                link.href = "account.html";
                link.title = `Ciao, ${appState.user.name}`;
            } else {
                link.href = "auth.html";
                link.title = "Accedi / Registrati";
            }
        }
    });
}

// Global initialization
window.addEventListener('load', () => {
    updateDarkModeIcon();
    if (window.lucide) lucide.createIcons();
    
    // Check session on every page load
    checkUserSession();

    // Expose globals
    window.toggleDarkMode = toggleDarkMode;
    window.showMessage = showMessage;
});