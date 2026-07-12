/* NexShop Master Router, Route Guards & Application Shell Lifecycle */

const app = {
    // 1. Route Map definitions (maps hash route to view functions)
    routes: {
        "": () => window.views.home(),
        "#home": () => window.views.home(),
        "#products": () => window.views.products(),
        "#product-details": (params) => window.views.productDetails(params.id),
        "#cart": () => window.views.cart(),
        "#checkout": () => window.views.checkout(),
        "#orders": () => window.views.orders(),
        "#profile": () => window.views.profile(),
        "#login": () => window.views.login(),
        "#register": () => window.views.register(),
        
        // Admin Protected Routes
        "#admin-dashboard": () => window.views.adminDashboard(),
        "#admin-products": () => window.views.adminProducts(),
        "#admin-categories": () => window.views.adminCategories(),
        "#admin-orders": () => window.views.adminOrders(),
        "#admin-users": () => window.views.adminUsers(),
        "#admin-reviews": () => window.views.adminReviews()
    },
    
    // 2. Initializer
    init() {
        // Bind navigation events
        window.addEventListener("hashchange", () => this.handleRouting());
        window.addEventListener("DOMContentLoaded", () => {
            this.setupUI();
            this.handleRouting();
            this.syncCartOnStartup();
        });
        
        // Subscribe store to keep UI reactive
        window.store.subscribe((state) => this.updateUIPerState(state));
    },
    
    // 3. UI Shell Interactions (Sidebar toggle, profile dropdowns)
    setupUI() {
        const sidebar = document.getElementById("sidebar");
        const toggleBtn = document.getElementById("sidebar-toggle");
        const closeBtn = document.getElementById("sidebar-close");
        const profileBtn = document.getElementById("profile-avatar-btn");
        const profileDropdown = document.getElementById("profile-dropdown");
        const themeBtn = document.getElementById("theme-toggle");
        const logoutBtn = document.getElementById("logout-btn");
        
        // Mobile Sidebar controls
        if (toggleBtn && sidebar) {
            toggleBtn.addEventListener("click", () => sidebar.classList.add("open"));
        }
        if (closeBtn && sidebar) {
            closeBtn.addEventListener("click", () => sidebar.classList.remove("open"));
        }
        
        // Close sidebar on navigation click on mobile
        document.querySelectorAll(".nav-link").forEach(link => {
            link.addEventListener("click", () => {
                if (sidebar) sidebar.classList.remove("open");
            });
        });
        
        // Profile dropdown menu toggle
        if (profileBtn && profileDropdown) {
            profileBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                profileDropdown.classList.toggle("show");
            });
            document.addEventListener("click", () => {
                profileDropdown.classList.remove("show");
            });
        }
        
        // Light / Dark Theme toggle
        if (themeBtn) {
            themeBtn.addEventListener("click", () => {
                const currentTheme = document.documentElement.getAttribute("data-theme");
                const targetTheme = currentTheme === "light" ? "dark" : "light";
                document.documentElement.setAttribute("data-theme", targetTheme);
                localStorage.setItem("nexshop_theme", targetTheme);
                
                // Toggle sun/moon icons
                themeBtn.querySelector(".sun-icon").classList.toggle("hidden", targetTheme !== "light");
                themeBtn.querySelector(".moon-icon").classList.toggle("hidden", targetTheme === "light");
            });
            
            // Sync theme preference on startup
            const savedTheme = localStorage.getItem("nexshop_theme") || "dark";
            document.documentElement.setAttribute("data-theme", savedTheme);
            themeBtn.querySelector(".sun-icon").classList.toggle("hidden", savedTheme !== "light");
            themeBtn.querySelector(".moon-icon").classList.toggle("hidden", savedTheme === "light");
        }
        
        // Logout trigger
        if (logoutBtn) {
            logoutBtn.addEventListener("click", () => {
                window.store.clearUser();
                window.ui.toast("Logged Out", "You have been logged out successfully.", "success");
                window.location.hash = "#home";
            });
        }
        
        // Bind search input Enter event
        const searchInput = document.getElementById("global-search-input");
        if (searchInput) {
            searchInput.addEventListener("keypress", (e) => {
                if (e.key === "Enter") {
                    const term = searchInput.value.trim();
                    window.location.hash = `#products?search=${encodeURIComponent(term)}`;
                }
            });
        }
    },
    
    // 4. Synchronize Cart badge on page load if logged in
    async syncCartOnStartup() {
        if (window.store.isLoggedIn()) {
            try {
                const cart = await window.api.get("/api/cart", { showLoader: false });
                window.store.setCart(cart);
            } catch (err) {
                console.error("Cart sync failed:", err);
            }
        }
    },
    
    // 5. Reactive UI Refresher
    updateUIPerState(state) {
        const authSection = document.getElementById("sidebar-auth-section");
        const profileDropdownContainer = document.getElementById("profile-dropdown-container");
        const cartBadge = document.getElementById("cart-count-badge");
        const customerLinks = document.querySelectorAll(".customer-only");
        const adminLinks = document.querySelectorAll(".admin-only");
        const adminHeader = document.querySelector(".admin-header");
        
        // Render Cart Badge count
        const itemCount = state.cart.items.reduce((acc, item) => acc + item.quantity, 0);
        if (cartBadge) {
            cartBadge.textContent = itemCount;
            cartBadge.classList.toggle("hidden", itemCount === 0);
        }
        
        if (state.isLoggedIn()) {
            // Update profile images, user names in dropdown
            const dropdownName = document.getElementById("dropdown-user-name");
            const dropdownRole = document.getElementById("dropdown-user-role");
            const avatarImg = document.getElementById("header-profile-img");
            
            if (dropdownName) dropdownName.textContent = state.user.full_name;
            if (dropdownRole) {
                dropdownRole.textContent = state.user.role.name;
                dropdownRole.className = `user-role badge ${state.user.role.name === 'admin' ? 'badge-danger' : 'badge-accent'}`;
            }
            if (avatarImg) {
                avatarImg.src = state.user.profile_image || "/uploads/profiles/default-avatar.png";
                avatarImg.onerror = () => {
                    avatarImg.src = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150";
                };
            }
            
            // Toggle Visibility
            if (authSection) authSection.classList.add("hidden");
            if (profileDropdownContainer) profileDropdownContainer.classList.remove("hidden");
            
            customerLinks.forEach(el => el.classList.remove("hidden"));
            
            if (state.isAdmin()) {
                adminLinks.forEach(el => el.classList.remove("hidden"));
                if (adminHeader) adminHeader.classList.remove("hidden");
            } else {
                adminLinks.forEach(el => el.classList.add("hidden"));
                if (adminHeader) adminHeader.classList.add("hidden");
            }
        } else {
            // Logged Out UI state
            if (authSection) {
                authSection.innerHTML = `
                    <a href="#login" class="btn btn-primary w-full text-center" style="display: flex; justify-content: center; gap: 8px;">
                        <i data-lucide="log-in" style="width: 18px; height: 18px;"></i> Login
                    </a>
                `;
                authSection.classList.remove("hidden");
            }
            if (profileDropdownContainer) profileDropdownContainer.classList.add("hidden");
            
            customerLinks.forEach(el => el.classList.add("hidden"));
            adminLinks.forEach(el => el.classList.add("hidden"));
            if (adminHeader) adminHeader.classList.add("hidden");
        }
        if (window.lucide) window.lucide.createIcons();
    },
    
    // 6. Router Engine
    handleRouting() {
        const hash = window.location.hash || "#home";
        
        // Parse Route and Query parameters (e.g. #products?category=2&search=shoes)
        const parts = hash.split("?");
        const route = parts[0];
        const params = {};
        
        if (parts[1]) {
            const queryParams = new URLSearchParams(parts[1]);
            for (const [key, value] of queryParams.entries()) {
                params[key] = value;
            }
        }
        
        // 7. Route Guards
        const requiresAuth = ["#cart", "#checkout", "#orders", "#profile"];
        const isAdminRoute = route.startsWith("#admin");
        
        if (requiresAuth.includes(route) && !window.store.isLoggedIn()) {
            window.ui.toast("Access Denied", "Please login to access this page.", "warning");
            window.location.hash = "#login";
            return;
        }
        
        if (isAdminRoute && !window.store.isAdmin()) {
            window.ui.toast("Access Denied", "You must be an administrator to view this page.", "error");
            window.location.hash = "#home";
            return;
        }
        
        // Highlight active link in sidebar
        document.querySelectorAll(".nav-link").forEach(link => {
            const targetHash = link.getAttribute("href");
            if (targetHash === route || (route === "#home" && targetHash === "#") || (route === "" && targetHash === "#home")) {
                link.classList.add("active");
            } else {
                link.classList.remove("active");
            }
        });
        
        // Handle global search container visibility
        const searchContainer = document.getElementById("header-search-container");
        if (searchContainer) {
            // Only show search input on storefront and product browsing lists
            const showSearch = ["#home", "#products"].includes(route) || route === "";
            searchContainer.style.display = showSearch ? "block" : "none";
        }
        
        // 8. Resolve Route Handlers
        const routeHandler = this.routes[route];
        if (routeHandler) {
            try {
                routeHandler(params);
            } catch (err) {
                console.error("Route execution failure:", err);
                const viewport = document.getElementById("main-content");
                if (viewport) {
                    viewport.innerHTML = `
                        <div style="text-align: center; padding: 60px 20px;">
                            <h2 style="font-size: 32px; margin-bottom: 12px; color: var(--danger);">View Rendering Error</h2>
                            <p style="color: var(--text-secondary); margin-bottom: 24px;">Failed to load view details: ${err.message}</p>
                            <a href="#home" class="btn btn-primary">Return Home</a>
                        </div>
                    `;
                }
            }
        } else {
            // Custom 404 Error page display
            const viewport = document.getElementById("main-content");
            if (viewport) {
                viewport.innerHTML = `
                    <div style="text-align: center; padding: 80px 20px;">
                        <h1 style="font-size: 72px; font-weight: 800; color: var(--accent); margin-bottom: 16px;">404</h1>
                        <h2 style="font-size: 24px; margin-bottom: 12px;">Oops! Page Not Found</h2>
                        <p style="color: var(--text-secondary); margin-bottom: 32px; max-width: 480px; margin-inline: auto;">The page you are looking for does not exist, has been removed, or is temporarily unavailable.</p>
                        <a href="#home" class="btn btn-primary"><i data-lucide="home"></i> Go Back Home</a>
                    </div>
                `;
                if (window.lucide) window.lucide.createIcons();
            }
        }
    }
};

window.app = app;
app.init();
