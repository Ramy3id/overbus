// File: assets/js/e-commerce.js
// Description: Core application logic (Products, Cart, Rendering, and Persistence).

// Carousel Globals
let currentIndex = 0;
let totalImages = 0;
let autoScrollInterval;
let slideWidth = 0;
let slides = [];

// Application State
let appStateCommerce = {
    view: new URLSearchParams(window.location.search).get('view') || 'home',
    selectedProduct: parseInt(new URLSearchParams(window.location.search).get('product')) || null,
    currentFilter: 'Tutti',
    currentSearch: '',
    cart: [], // Loaded from storage on init
    products: [] 
};

// --- Cart Persistence Logic ---
function saveCartToStorage() {
    localStorage.setItem('projectLabCart', JSON.stringify(appStateCommerce.cart));
}

function loadCartFromStorage() {
    const storedCart = localStorage.getItem('projectLabCart');
    if (storedCart) {
        appStateCommerce.cart = JSON.parse(storedCart);
    }
}

// --- Search Toggle ---
function initSearchToggle() {
    const searchIconToggle = document.getElementById('searchIconToggle');
    const searchInputWrapper = document.getElementById('searchInputWrapper');
    if (searchIconToggle && searchInputWrapper) {
        searchIconToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            searchInputWrapper.classList.toggle('hidden');
            if (!searchInputWrapper.classList.contains('hidden')) {
                const searchInput = document.getElementById('searchInput');
                if (searchInput) searchInput.focus();
            }
        });
        document.addEventListener('click', (event) => {
            if (!searchIconToggle.contains(event.target) && !searchInputWrapper.contains(event.target)) {
                searchInputWrapper.classList.add('hidden');
            }
        });
    }
}

// --- Data Fetching ---
async function fetchProductsData() {
    try {
        const response = await fetch('api/products.php');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        appStateCommerce.products = await response.json();
        renderApp();
    } catch (error) {
        console.error("Error fetching product data:", error);
        const container = document.getElementById('appContainer');
        if (container) {
            container.innerHTML = renderError('Impossibile caricare i prodotti dal database. Controlla la connessione.');
        }
    }
}

// --- View Management ---
function changeView(newView, productId = null, filter = null) {
    appStateCommerce.view = newView;
    appStateCommerce.selectedProduct = productId;
    if (filter) appStateCommerce.currentFilter = filter;
    
    // Clear search when switching categories explicitly via clicks (optional preference)
    // appStateCommerce.currentSearch = ''; 
    // document.getElementById('searchInput').value = '';

    const url = new URL(window.location.href);
    url.searchParams.set('view', newView);
    if (productId) url.searchParams.set('product', productId);
    else url.searchParams.delete('product');
    
    window.history.pushState({}, '', url);
    renderApp();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// --- Cart Logic ---
function addToCart(productId) {
    const product = appStateCommerce.products.find(p => p.id === productId);
    if (!product) {
        showMessage('Prodotto non trovato!', 'error');
        return;
    }
    const existingItem = appStateCommerce.cart.find(item => item.id === productId);
    if (existingItem) {
        existingItem.quantity += 1;
        showMessage(`Quantità aggiornata: ${product.name}`, 'info');
    } else {
        const cartId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
        const image = Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : 'assets/img/placeholder.png';
        
        appStateCommerce.cart.push({ ...product, cartId: cartId, quantity: 1, images: [image] });
        showMessage(`${product.name} aggiunto al carrello!`, 'success');
    }
    saveCartToStorage();
    updateCartCounter();
}

function removeFromCart(cartId) {
    const initialLength = appStateCommerce.cart.length;
    appStateCommerce.cart = appStateCommerce.cart.filter(item => item.cartId !== cartId);
    if (appStateCommerce.cart.length < initialLength) {
        saveCartToStorage();
        updateCartCounter();
        showMessage('Prodotto rimosso.', 'info');
        renderApp();
    }
}

function updateQuantity(cartId, change) {
    const item = appStateCommerce.cart.find(i => i.cartId === cartId);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            removeFromCart(cartId);
        } else {
            saveCartToStorage();
            updateCartCounter();
            renderApp();
        }
    }
}

function updateCartCounter() {
    const count = appStateCommerce.cart.reduce((total, item) => total + item.quantity, 0);
    const counterElement = document.getElementById('cartCounter');
    if (counterElement) {
        counterElement.textContent = count;
        counterElement.classList.toggle('hidden', count === 0);
    }
}

// --- Search & Helpers (FIXED) ---
function filterProductsBySearch() {
    const input = document.getElementById('searchInput');
    if(input) {
        appStateCommerce.currentSearch = input.value.toLowerCase();
        // Force re-render of grid without full view reload to keep filter state
        if (appStateCommerce.view === 'home') {
             const container = document.getElementById('appContainer');
             if(container) {
                 container.innerHTML = renderProductsGrid();
                 if(window.lucide) lucide.createIcons();
             }
        }
    }
}

function generateRatingStars(rating) {
    const r = parseFloat(rating) || 0;
    const fullStars = '★'.repeat(Math.round(r));
    const emptyStars = '☆'.repeat(5 - Math.round(r));
    return `<span class="text-yellow-500">${fullStars}</span><span class="text-gray-300 dark:text-gray-600">${emptyStars}</span> <span class="text-gray-600 dark:text-gray-400">(${r.toFixed(1)})</span>`;
}

function createProductCard(product) {
    const price = parseFloat(product.price);
    const formattedPrice = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(price);
    const image = (product.images && product.images.length > 0) ? product.images[0] : 'assets/img/placeholder.png';

    return `
        <div class="bg-white dark:bg-gray-800 rounded-xl overflow-hidden card-shadow flex flex-col justify-between">
            <a href="#" onclick="changeView('details', ${product.id}); return false;">
                <img class="w-full h-48 object-cover object-center" src="${image}" alt="${product.name}">
            </a>
            <div class="p-6 flex flex-col flex-grow">
                <span class="text-xs font-medium text-primary-blue uppercase mb-2">${product.category}</span>
                <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">${product.name}</h3>
                <p class="text-gray-600 dark:text-gray-400 text-sm mb-4 flex-grow line-clamp-3">${product.description}</p>
                <div class="flex items-center justify-between mb-4">
                    <p class="text-2xl font-extrabold text-primary-blue">${formattedPrice}</p>
                    <div class="text-sm">
                        ${generateRatingStars(product.rating)}
                    </div>
                </div>
                <div class="flex space-x-3">
                    <button onclick="changeView('details', ${product.id})" class="detail-btn flex-1 py-3 font-semibold rounded-xl text-sm hover:text-white dark:text-white dark:hover:text-black">
                        Dettagli
                    </button>
                    <button onclick="addToCart(${product.id})" class="add-to-cart-btn flex-1 bg-primary-blue hover:bg-blue-600 text-white font-bold py-3 rounded-xl transition duration-300 text-sm">
                        <i data-lucide="shopping-cart" class="w-5 h-5 inline-block mr-1 align-sub"></i> Aggiungi
                    </button>
                </div>
            </div>
        </div>
    `;
}

// --- Renderers (FIXED) ---
function renderProductsGrid() {
    let filteredProducts = appStateCommerce.products.filter(product => {
        // 1. Category Filter
        const categoryMatch = appStateCommerce.currentFilter === 'Tutti' || product.category === appStateCommerce.currentFilter;
        
        // 2. Search Filter
        const searchMatch = appStateCommerce.currentSearch === '' ||
                            product.name.toLowerCase().includes(appStateCommerce.currentSearch) ||
                            (product.description && product.description.toLowerCase().includes(appStateCommerce.currentSearch));
        
        // Combine with AND
        return categoryMatch && searchMatch;
    });

    const categories = ['Tutti', 'Elettronica', 'Accessori', 'Casa & Ufficio'];
    const filterHtml = categories.map(cat => {
        const isActive = appStateCommerce.currentFilter === cat;
        return `
            <button onclick="changeView('home', null, '${cat}')" class="px-6 py-2 text-sm font-${isActive ? 'bold' : 'semibold'} rounded-full ${isActive ? 'bg-primary-blue text-white shadow-lg shadow-primary-blue/30 transform scale-105' : 'bg-white text-gray-700 border border-gray-300 hover:bg-primary-blue/10 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-blue-900/30'} transition duration-300" >
                ${cat}
            </button>
        `;
    }).join('');

    const productHtml = filteredProducts.length > 0
        ? filteredProducts.map(createProductCard).join('')
        : `<div class="col-span-full text-center py-10">
                <i data-lucide="search-x" class="w-12 h-12 text-gray-400 mx-auto mb-3"></i>
                <p class="text-xl text-gray-500 dark:text-gray-400">Nessun prodotto trovato.</p>
           </div>`;

    return `
        <div class="mb-12 text-center">
            <h2 id="prodotti" class="text-5xl font-extrabold text-gray-800 tracking-tight dark:text-white mb-4">I Nostri Prodotti</h2>
            <p class="text-gray-500 dark:text-gray-400 text-lg">Le migliori soluzioni tecnologiche dal nostro database.</p>
        </div>
        <div class="flex flex-wrap justify-center gap-4 mb-12">
            ${filterHtml}
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            ${productHtml}
        </div>
    `;
}

function renderProductDetails(productId) {
    const product = appStateCommerce.products.find(p => p.id === productId);
    if (!product) return renderError('Prodotto non trovato.');

    const price = parseFloat(product.price);
    const formattedPrice = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(price);
    const images = (product.images && product.images.length > 0) ? product.images : ['assets/img/placeholder.png'];
    
    const carouselSlides = images.map((img, index) => `
        <div class="peek-carousel-slide">
            <div class="peek-carousel-slide-content">
                <img src="${img}" alt="Immagine ${index + 1}" class="transition-all duration-500">
            </div>
        </div>
    `).join('');

    return `
        <div class="max-w-6xl mx-auto bg-white dark:bg-gray-800 rounded-2xl p-6 lg:p-12 shadow-xl border border-gray-100 dark:border-gray-700">
            <a href="#" onclick="changeView('home')" class="inline-flex items-center text-primary-blue hover:underline mb-8">
                <i data-lucide="arrow-left" class="w-5 h-5 mr-2"></i> Torna alla Home
            </a>
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div class="flex flex-col">
                    <div class="peek-carousel-wrapper relative">
                        <div id="peekCarouselContainer" class="peek-carousel-container" data-total-images="${images.length}">
                            ${carouselSlides}
                        </div>
                        <button class="peek-carousel-nav-btn prev" id="carouselPrevBtn"><i data-lucide="chevron-left" class="w-6 h-6"></i></button>
                        <button class="peek-carousel-nav-btn next" id="carouselNextBtn"><i data-lucide="chevron-right" class="w-6 h-6"></i></button>
                    </div>
                    <div id="progressBarContainer" class="progress-bar-container">
                        <div id="progressBarFill" class="progress-bar-fill"></div>
                    </div>
                </div>
                <div class="space-y-6">
                    <h1 class="text-4xl font-extrabold text-gray-900 dark:text-white">${product.name}</h1>
                    <div class="flex items-center space-x-2">
                        ${generateRatingStars(product.rating)}
                        <span class="text-gray-500 dark:text-gray-400">(${product.reviews || 0} recensioni)</span>
                    </div>
                    <p class="text-gray-600 dark:text-gray-300 text-lg">${product.description}</p>
                    <p class="text-5xl font-extrabold text-primary-blue py-4 border-y border-gray-200 dark:border-gray-700">${formattedPrice}</p>
                    <button onclick="addToCart(${product.id}); changeView('cart');" class="add-to-cart-btn w-full bg-primary-blue hover:bg-blue-600 text-white font-bold py-4 rounded-xl transition duration-300 flex items-center justify-center text-xl">
                        <i data-lucide="shopping-cart" class="w-6 h-6 mr-3"></i> Aggiungi al Carrello
                    </button>
                    <div class="pt-4 space-y-4">
                        <h3 class="text-2xl font-semibold mb-3">Descrizione Completa</h3>
                        <p class="text-gray-700 leading-relaxed dark:text-gray-300">${product.fullDetails || product.description}</p>
                        <p class="font-medium">Categoria: <span class="font-bold">${product.category}</span></p>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderCartView() {
    const totalItems = appStateCommerce.cart.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = appStateCommerce.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const formattedSubtotal = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(subtotal);

    const cartItemsHtml = appStateCommerce.cart.map(item => {
        const itemTotal = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(item.price * item.quantity);
        const image = (item.images && item.images.length > 0) ? item.images[0] : 'assets/img/placeholder.png';
        
        return `
            <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg cart-item-container">
                <div class="flex items-center space-x-4">
                    <img class="w-16 h-16 object-cover rounded" src="${image}" alt="${item.name}">
                    <div>
                        <h4 class="font-semibold text-gray-900 dark:text-white">${item.name}</h4>
                        <p class="text-sm text-gray-500 dark:text-gray-400">€${parseFloat(item.price).toFixed(2)}</p>
                    </div>
                </div>
                <div class="flex items-center space-x-4">
                    <div class="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg p-1">
                        <button onclick="updateQuantity('${item.cartId}', -1)" class="p-1"><i data-lucide="minus" class="w-4 h-4"></i></button>
                        <span class="px-3 font-medium">${item.quantity}</span>
                        <button onclick="updateQuantity('${item.cartId}', 1)" class="p-1"><i data-lucide="plus" class="w-4 h-4"></i></button>
                    </div>
                    <p class="font-bold text-lg min-w-[80px] text-right">${itemTotal}</p>
                    <button onclick="removeFromCart('${item.cartId}')" class="text-red-500 hover:text-red-700 p-2"><i data-lucide="x" class="w-5 h-5"></i></button>
                </div>
            </div>
        `;
    }).join('');

    return `
        <h2 class="text-4xl font-extrabold text-gray-900 dark:text-white mb-8 border-b pb-4">Il tuo Carrello (${totalItems} Articoli)</h2>
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div class="lg:col-span-2 space-y-4">
                ${totalItems > 0 ? cartItemsHtml : `<p class="text-center text-xl py-10 bg-white dark:bg-gray-800 rounded-xl">Il carrello è vuoto. <a href="#" onclick="changeView('home')" class="text-primary-blue underline">Inizia lo shopping!</a></p>`}
            </div>
            <div class="lg:col-span-1 sticky top-20">
                <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
                    <h3 class="text-2xl font-bold mb-4 border-b pb-2">Riepilogo</h3>
                    <div class="space-y-3">
                        <div class="flex justify-between"><span>Subtotale</span><span>${formattedSubtotal}</span></div>
                        <div class="flex justify-between"><span>Spedizione</span><span>Gratuita (Checkout)</span></div>
                        <div class="flex justify-between text-xl font-extrabold pt-3 border-t"><span>Totale</span><span class="text-primary-blue">${formattedSubtotal}</span></div>
                    </div>
                    <a href="checkout.html" class="add-to-cart-btn w-full block text-center bg-primary-blue hover:bg-blue-600 text-white font-bold py-3 mt-6 rounded-xl transition duration-300">
                        Procedi al Checkout
                    </a>
                </div>
            </div>
        </div>
    `;
}

function renderError(message) {
    return `
        <div class="text-center py-20">
            <i data-lucide="alert-triangle" class="w-12 h-12 text-red-500 mx-auto mb-4"></i>
            <h2 class="text-3xl font-bold mb-2">Errore</h2>
            <p class="text-gray-600 dark:text-gray-400">${message}</p>
            <a href="#" onclick="changeView('home')" class="mt-4 inline-block text-primary-blue hover:underline">Riprova</a>
        </div>
    `;
}

// --- Carousel Logic (unchanged) ---
function removeCarouselListeners() {
    const slidesContainer = document.getElementById('peekCarouselContainer');
    if (slidesContainer) {
        slidesContainer.removeEventListener('transitionend', handleTransitionEnd);
        slidesContainer.onmouseenter = null;
        slidesContainer.onmouseleave = null;
    }
    const prevBtn = document.getElementById('carouselPrevBtn');
    const nextBtn = document.getElementById('carouselNextBtn');
    if (prevBtn) prevBtn.onclick = null;
    if (nextBtn) nextBtn.onclick = null;
    stopAutoScroll();
}

function handleTransitionEnd() {
    if (totalImages > 0) {
        currentIndex = ((currentIndex % totalImages) + totalImages) % totalImages;
        updateCarousel();
    }
}

function updateCarousel() {
    if (!slides || slides.length === 0 || slideWidth === 0) return;
    const slidesContainer = document.getElementById('peekCarouselContainer');
    if (!slidesContainer) return;
    slidesContainer.style.transform = `translateX(${-currentIndex * slideWidth}px)`;
    updateProgressBar();
}

function updateProgressBar() {
    const progressBarFill = document.getElementById('progressBarFill');
    if (!progressBarFill || totalImages === 0) return;
    const progressPercentage = ((currentIndex + 1) / totalImages) * 100;
    progressBarFill.style.width = `${progressPercentage}%`;
}

function goToSlide(direction) {
    if (totalImages === 0) return;
    currentIndex = ((currentIndex + direction) % totalImages + totalImages) % totalImages;
    updateCarousel();
    resetAutoScroll();
}

function startAutoScroll() {
    stopAutoScroll();
    autoScrollInterval = setInterval(() => goToSlide(1), 5000);
}

function stopAutoScroll() {
    if (autoScrollInterval) {
        clearInterval(autoScrollInterval);
        autoScrollInterval = null;
    }
}

function resetAutoScroll() {
    stopAutoScroll();
    startAutoScroll();
}

function initCarousel() {
    const slidesContainer = document.getElementById('peekCarouselContainer');
    if (!slidesContainer) return;

    removeCarouselListeners();
    currentIndex = 0;
    totalImages = parseInt(slidesContainer.dataset.totalImages) || 0;
    slideWidth = 0;
    slides = [];

    if (totalImages === 0) return;

    slides = slidesContainer.querySelectorAll('.peek-carousel-slide');
    if (slides.length === 0) return;

    requestAnimationFrame(() => {
        if (slides.length > 0) slideWidth = slides[0].offsetWidth;
        slidesContainer.style.width = '100%';
        
        const prev = document.getElementById('carouselPrevBtn');
        const next = document.getElementById('carouselNextBtn');
        if(prev) prev.onclick = () => goToSlide(-1);
        if(next) next.onclick = () => goToSlide(1);

        slidesContainer.onmouseenter = stopAutoScroll;
        slidesContainer.onmouseleave = startAutoScroll;

        updateCarousel();
        updateProgressBar();
        startAutoScroll();
    });
}

function renderApp() {
    removeCarouselListeners();
    const appContainer = document.getElementById('appContainer');
    if (!appContainer) return;

    let content = '';
    const productId = parseInt(appStateCommerce.selectedProduct);

    switch (appStateCommerce.view) {
        case 'home':
            content = renderProductsGrid();
            break;
        case 'details':
            content = !isNaN(productId) ? renderProductDetails(productId) : renderError('Prodotto non trovato.');
            break;
        case 'cart':
            content = renderCartView();
            break;
        default:
            content = renderProductsGrid();
    }
    
    appContainer.innerHTML = content;
    if (window.lucide) lucide.createIcons();

    if (appStateCommerce.view === 'details') initCarousel();
    initSearchToggle();
    updateCartCounter();
}

// Initial Fetch (FIXED)
window.addEventListener('load', () => {
    if (document.getElementById('appContainer')) {
        loadCartFromStorage(); // Load cart on start
        fetchProductsData();
    }
});

// History Handling
window.addEventListener('popstate', () => {
    const params = new URLSearchParams(window.location.search);
    appStateCommerce.view = params.get('view') || 'home';
    appStateCommerce.selectedProduct = parseInt(params.get('product')) || null;
    renderApp();
});