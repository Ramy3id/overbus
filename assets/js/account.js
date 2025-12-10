/*
 * File: assets/js/account.js
 * Description: Logic specific to the user account page.
 */
document.addEventListener('DOMContentLoaded', function() {
    // Globals
    window.toggleDarkMode = toggleDarkMode;
    window.showMessage = showMessage;
    updateDarkModeIcon();

    // Navigation Logic
    const navButtons = {
        navProfile: document.getElementById('navProfile'),
        navOrders: document.getElementById('navOrders'),
        navSettings: document.getElementById('navSettings'),
        navLogout: document.getElementById('navLogout'),
    };
    const contentSections = {
        profileSection: document.getElementById('profileSection'),
        ordersSection: document.getElementById('ordersSection'),
        settingsSection: document.getElementById('settingsSection'),
    };

    function showSection(sectionId, buttonId) {
        Object.values(contentSections).forEach(section => {
            if (section) {
                section.classList.add('hidden');
                section.classList.remove('active');
            }
        });
        Object.values(navButtons).forEach(button => {
            if (button) button.classList.remove('active', 'bg-primary-blue', 'text-white');
        });

        const activeSection = document.getElementById(sectionId);
        if (activeSection) activeSection.classList.remove('hidden');

        const activeButton = document.getElementById(buttonId);
        if (activeButton) activeButton.classList.add('active', 'bg-primary-blue', 'text-white');
    }

    // Event Listeners
    if (navButtons.navProfile) navButtons.navProfile.addEventListener('click', () => showSection('profileSection', 'navProfile'));
    if (navButtons.navOrders) navButtons.navOrders.addEventListener('click', () => showSection('ordersSection', 'navOrders'));
    if (navButtons.navSettings) navButtons.navSettings.addEventListener('click', () => showSection('settingsSection', 'navSettings'));
    if (navButtons.navLogout) navButtons.navLogout.addEventListener('click', handleLogout);

    showSection('profileSection', 'navProfile');

    // Fetch and Load Real User Data
    loadUserProfile();
});

async function loadUserProfile() {
    try {
        // Simulation of API call to fetch user data
        const res = await fetch('api/auth.php?action=profile');
        if (res.status === 401) {
            window.location.href = 'auth.html';
            return;
        }
        const result = await res.json();
        
        if (result.success) {
            const user = result.data;
            
            // Get Address details from LocalStorage
            const savedAddress = JSON.parse(localStorage.getItem('userAddressDetails')) || {};
            
            // --- 1. Fill Read-Only Profile (Dettagli Account) ---
            document.getElementById('dispName').textContent = `${user.first_name} ${user.last_name}`;
            document.getElementById('dispEmail').textContent = user.email;
            document.getElementById('dispPhone').textContent = user.phone || '-';
            document.getElementById('dispDob').textContent = user.birth_date || '-';

            // Fill new address display fields
            document.getElementById('dispAddress').textContent = savedAddress.address || user.address || 'Non impostato';
            document.getElementById('dispHouseNum').textContent = savedAddress.houseNumber || 'Non impostato';
            document.getElementById('dispCity').textContent = savedAddress.city || 'Non impostato';
            document.getElementById('dispCap').textContent = savedAddress.cap || 'Non impostato';


            // --- 2. Fill Settings Forms (Impostazioni) ---
            if(document.getElementById('settingsName')) document.getElementById('settingsName').value = user.first_name || '';
            if(document.getElementById('settingsSurname')) document.getElementById('settingsSurname').value = user.last_name || '';
            if(document.getElementById('settingsPhone')) document.getElementById('settingsPhone').value = user.phone || '';
            
            // Fill Read-only Email in Settings
            if(document.getElementById('settingsEmail')) document.getElementById('settingsEmail').value = user.email || '';

            // Fill Address Fields in Settings from LocalStorage
            if(document.getElementById('settingsAddress')) document.getElementById('settingsAddress').value = savedAddress.address || user.address || '';
            if(document.getElementById('settingsHouseNum')) document.getElementById('settingsHouseNum').value = savedAddress.houseNumber || '';
            if(document.getElementById('settingsCity')) document.getElementById('settingsCity').value = savedAddress.city || '';
            if(document.getElementById('settingsCap')) document.getElementById('settingsCap').value = savedAddress.cap || '';
        }
    } catch (e) {
        console.error("Error loading profile:", e);
        // showMessage("Errore nel caricamento del profilo", "error"); 
    }
}

async function handleLogout(e) {
    e.preventDefault();
    try {
        await fetch('api/auth.php?action=logout');
        window.location.href = 'auth.html';
    } catch (e) {
        console.error("Logout error", e);
    }
}

// Settings Update Handler
const settingsForm = document.getElementById('settingsForm');
if (settingsForm) {
    settingsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // 1. Save Address Details to LocalStorage 
        const addressData = {
            address: document.getElementById('settingsAddress').value,
            houseNumber: document.getElementById('settingsHouseNum').value,
            city: document.getElementById('settingsCity').value,
            cap: document.getElementById('settingsCap').value
        };
        localStorage.setItem('userAddressDetails', JSON.stringify(addressData));
        
        // 2. Simulate saving other details to server
        // ... (API call simulation here)
        
        showMessage('Impostazioni salvate con successo!', 'success');
        
        // Reload to update the "Dettagli Account" view immediately
        setTimeout(() => loadUserProfile(), 500); 
    });
}