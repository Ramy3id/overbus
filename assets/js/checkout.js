/*
 * File: assets/js/checkout.js
 * Description: Logic specific to the checkout page (checkout.html).
 */

// Initialize utility functions globally
window.toggleDarkMode = toggleDarkMode;
window.showMessage = showMessage;

// Initialize dark mode and icons
updateDarkModeIcon();

const SHIPPING_COST = 9.99;

// --- Load Cart from 'projectLabCart' key ---
const checkoutState = {
    cart: JSON.parse(localStorage.getItem('projectLabCart')) || []
};

/**
 * Checks if the cart is empty and updates the checkout button state.
 */
function checkCartAndButtonState() {
    const cartItems = checkoutState.cart || [];
    const checkoutButton = document.getElementById('checkoutButton');
    
    if (!checkoutButton) return false;

    if (cartItems.length === 0) {
        checkoutButton.disabled = true;
        checkoutButton.textContent = 'Non ci sono ordini da processare.'; 
        checkoutButton.classList.add('bg-red-500', 'hover:bg-red-600', 'cursor-default');
        checkoutButton.classList.remove('bg-primary-blue', 'hover:bg-primary-blue-hover');
        return false;
    } else {
        checkoutButton.disabled = false;
        checkoutButton.textContent = 'Procedi al Pagamento Sicuro';
        checkoutButton.classList.remove('bg-red-500', 'hover:bg-red-600', 'cursor-default');
        checkoutButton.classList.add('bg-primary-blue', 'hover:bg-primary-blue-hover');
        return true;
    }
}

/**
 * Displays the order summary.
 */
function updateOrderSummary() {
    if (!checkoutState.cart || checkoutState.cart.length === 0) {
        checkCartAndButtonState();
        document.getElementById('orderSummaryDetails').innerHTML = '<p class="text-gray-500 dark:text-gray-400 italic">Il carrello è vuoto. Aggiungi prodotti per procedere.</p>';
        document.getElementById('subtotal').textContent = '0,00 €';
        document.getElementById('shippingCost').textContent = '0,00 €';
        document.getElementById('totalPrice').textContent = '0,00 €';
        return;
    }

    const itemsToCalculate = checkoutState.cart; 
    const subtotal = itemsToCalculate.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const total = subtotal + SHIPPING_COST;

    const orderSummaryDetails = document.getElementById('orderSummaryDetails');
    orderSummaryDetails.innerHTML = '';
    
    checkCartAndButtonState();
    
    itemsToCalculate.forEach(item => {
        const itemTotal = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(item.price * item.quantity);
        const itemElement = document.createElement('div');
        itemElement.className = 'flex justify-between items-center mb-2 text-sm';
        itemElement.innerHTML = `
            <span class="text-gray-600 dark:text-gray-300">
                ${item.name} <span class="text-xs text-gray-400"> (x${item.quantity}) </span>
            </span>
            <span class="font-medium text-gray-800 dark:text-gray-100">${itemTotal}</span>
        `;
        orderSummaryDetails.appendChild(itemElement);
    });

    document.getElementById('subtotal').textContent = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(subtotal);
    document.getElementById('shippingCost').textContent = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(SHIPPING_COST);
    document.getElementById('totalPrice').textContent = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(total);
}

/**
 * Fetches user profile data (DB) and extra details (LocalStorage) to pre-fill fields.
 */
async function fetchUserProfileAndPrefill() {
    try {
        // 1. Get Basic Data from DB
        const response = await fetch('api/auth.php?action=profile');
        const data = await response.json();
        
        let user = {};
        if (data.success && data.data) {
            user = data.data;
            // Pre-fill Name & Phone
            const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
            if (fullName) document.getElementById('fullName').value = fullName;
            if (user.phone) document.getElementById('phone').value = user.phone;
        }

        // 2. Get Extended Address Data from LocalStorage (Saved in Account Settings)
        const savedAddress = JSON.parse(localStorage.getItem('userAddressDetails')) || {};

        // Fallback priorities: LocalStorage -> DB -> Empty
        const address = savedAddress.address || user.address || '';
        
        if (address) document.getElementById('address').value = address;
        if (savedAddress.houseNumber) document.getElementById('houseNumber').value = savedAddress.houseNumber;
        if (savedAddress.city) document.getElementById('city').value = savedAddress.city;
        if (savedAddress.cap) document.getElementById('zipCode').value = savedAddress.cap;

    } catch (error) {
        console.error("Error fetching user profile:", error);
    }
}

/**
 * Handles the checkout process.
 */
async function handleCheckout(event) {
    event.preventDefault();
    
    if (!checkCartAndButtonState()) {
        showMessage('Non ci sono ordini da processare.', 'error'); 
        return;
    }

    const shippingForm = document.getElementById('checkoutForm');
    const requiredFields = shippingForm.querySelectorAll('[required]');
    let allFieldsValid = true;
    requiredFields.forEach(field => {
        if (!field.value.trim()) allFieldsValid = false;
    });

    if (!allFieldsValid) {
         showMessage('Per favore, compila tutti i campi richiesti per la spedizione.', 'error');
         return; 
    }

    // Simulate Payment
    const checkoutButton = document.getElementById('checkoutButton');
    checkoutButton.disabled = true;
    checkoutButton.textContent = 'Reindirizzamento al Pagamento...';
    showMessage('Reindirizzamento alla pagina di pagamento sicuro...', 'info');

    setTimeout(() => {
        checkoutState.cart = [];
        localStorage.removeItem('projectLabCart'); 
        
        if (typeof updateCartCounter === 'function') updateCartCounter(0); 
        
        showMessage('Simulazione: Pagamento accettato e Ordine completato!', 'success');
        setTimeout(() => {
            window.location.href = "e-commerce.html";
        }, 3000);
    }, 2500);
}

async function checkLoginStatus() {
    try {
        const response = await fetch('api/auth.php?action=check_session');
        const data = await response.json();
        return data.success;
    } catch (error) {
        return false;
    }
}

async function initializeCheckout() {
    const isLoggedIn = await checkLoginStatus();
    if (!isLoggedIn) {
        showMessage('Devi effettuare il login per procedere al checkout.', 'info');
        setTimeout(() => window.location.href = "auth.html", 1500); 
        return; 
    }

    await fetchUserProfileAndPrefill();
    updateOrderSummary();
    
    const checkoutForm = document.getElementById('checkoutForm');
    if (checkoutForm) {
        if (checkoutState.cart.length > 0) {
            checkoutForm.addEventListener('submit', handleCheckout);
        } else {
            checkoutForm.addEventListener('submit', (e) => {
                e.preventDefault();
                showMessage('Non ci sono ordini da processare.', 'error');
            });
        }
    }
}

window.onload = initializeCheckout;