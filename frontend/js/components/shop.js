/* NexShop Storefront & Product Browsing Views */

if (!window.views) window.views = {};

// 1. HOME VIEW
window.views.home = async () => {
    const viewport = document.getElementById("main-content");
    viewport.innerHTML = `
        <!-- Hero Section -->
        <div style="background: linear-gradient(135deg, var(--bg-secondary), var(--bg-tertiary)); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 60px 40px; margin-bottom: 40px; position: relative; overflow: hidden; display: flex; align-items: center; justify-content: space-between;">
            <div style="max-width: 600px; z-index: 2;">
                <h1 style="font-size: 42px; font-weight: 800; margin-bottom: 16px; background: var(--accent-gradient); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Discover NexGen Shopping</h1>
                <p style="color: var(--text-secondary); font-size: 16px; margin-bottom: 30px;">Explore premium high-tech inventory, secure checkout processes, and real-time inventory tracking on our state-of-the-art e-commerce platform.</p>
                <div style="display: flex; gap: 16px;">
                    <a href="#products" class="btn btn-primary"><i data-lucide="shopping-bag"></i> Browse Products</a>
                    <a href="#register" class="btn btn-secondary"><i data-lucide="user-plus"></i> Join Us</a>
                </div>
            </div>
            <div class="mobile-hidden" style="opacity: 0.85; z-index: 1;">
                <i data-lucide="sparkles" style="width: 140px; height: 140px; color: var(--accent); opacity: 0.25;"></i>
            </div>
        </div>

        <!-- Categories Section -->
        <h3 style="font-size: 22px; margin-bottom: 20px;">Shop by Category</h3>
        <div id="home-categories-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 48px;">
            <!-- Categories will be rendered here -->
            <div style="color: var(--text-secondary);">Loading categories...</div>
        </div>

        <!-- New Arrivals Section -->
        <h3 style="font-size: 22px; margin-bottom: 20px;">New Arrivals</h3>
        <div id="home-products-grid" class="products-grid">
            <!-- New products will be rendered here -->
            <div style="color: var(--text-secondary);">Loading products...</div>
        </div>
    `;

    if (window.lucide) window.lucide.createIcons();

    try {
        // Fetch categories and newest products in parallel
        const [categories, products] = await Promise.all([
            window.api.get("/api/categories"),
            window.api.get("/api/products?sort_by=newest")
        ]);

        // Render categories
        const catGrid = document.getElementById("home-categories-grid");
        if (categories.length === 0) {
            catGrid.innerHTML = `<p style="color: var(--text-secondary);">No categories found.</p>`;
        } else {
            catGrid.innerHTML = categories.map(cat => `
                <a href="#products?category_id=${cat.id}" style="background-color: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 24px; text-align: center; transition: all var(--transition-fast);" onmouseover="this.style.borderColor='var(--accent)'" onmouseout="this.style.borderColor='var(--border-color)'">
                    <i data-lucide="tag" style="color: var(--accent); margin-bottom: 12px; width: 28px; height: 28px;"></i>
                    <h4 style="font-size: 16px; font-weight: 600;">${cat.name}</h4>
                    <p style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">${cat.description || 'View details'}</p>
                </a>
            `).join("");
        }

        // Render newest products (limit to 4)
        const prodGrid = document.getElementById("home-products-grid");
        const limitProducts = products.slice(0, 4);
        if (limitProducts.length === 0) {
            prodGrid.innerHTML = `<p style="color: var(--text-secondary);">No products available.</p>`;
        } else {
            prodGrid.innerHTML = limitProducts.map(prod => {
                const primaryImage = prod.images.find(img => img.is_primary) || prod.images[0];
                const imageSrc = primaryImage ? primaryImage.image_url : "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400";
                
                const isOutOfStock = !prod.inventory || prod.inventory.stock_quantity <= 0;
                const stockBadge = isOutOfStock ? `<span class="badge badge-danger product-card-badge">Out of Stock</span>` : "";
                
                return `
                    <div class="product-card" onclick="window.location.hash='#product-details?id=${prod.id}'" style="cursor: pointer;">
                        ${stockBadge}
                        <div class="product-card-img-container">
                            <img class="product-card-img" src="${imageSrc}" alt="${prod.name}">
                        </div>
                        <div class="product-card-content">
                            <span class="product-card-cat">${prod.category.name}</span>
                            <h4 class="product-card-title">${prod.name}</h4>
                            <div class="product-rating">
                                ${window.ui.renderStars(prod.rating_avg, prod.rating_count)}
                            </div>
                            <div class="product-card-footer">
                                <span class="product-card-price">$${parseFloat(prod.price).toFixed(2)}</span>
                                <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation(); window.location.hash='#product-details?id=${prod.id}'">
                                    View
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }).join("");
        }

        if (window.lucide) window.lucide.createIcons();

    } catch (err) {
        window.ui.toast("Error Loading Homepage", err.message, "error");
    }
};

// 2. PRODUCTS VIEW (CATALOG WITH SEARCH & FILTERS)
window.views.products = async () => {
    // Parse current filters from query hash
    const parts = (window.location.hash || "").split("?");
    const queryParams = new URLSearchParams(parts[1] || "");
    const searchParam = queryParams.get("search") || "";
    const categoryParam = queryParams.get("category_id") || "";

    const viewport = document.getElementById("main-content");
    viewport.innerHTML = `
        <h2 style="font-size: 32px; margin-bottom: 8px;">Explore Products</h2>
        <p style="color: var(--text-secondary); margin-bottom: 32px;">Search, sort and filter items to find exactly what you need.</p>

        <div style="display: grid; grid-template-columns: 240px 1fr; gap: 32px; align-items: start;">
            <!-- Filters Sidebar -->
            <aside style="background-color: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 24px;">
                <h3 style="font-size: 18px; margin-bottom: 20px;">Filters</h3>
                
                <!-- Category Select -->
                <div class="form-group" style="margin-bottom: 24px;">
                    <label>Category</label>
                    <select id="filter-category" style="width: 100%;">
                        <option value="">All Categories</option>
                    </select>
                </div>

                <!-- Price Range Inputs -->
                <div class="form-group" style="margin-bottom: 24px;">
                    <label>Price Range ($)</label>
                    <div style="display: flex; gap: 8px; align-items: center;">
                        <input type="number" id="filter-min-price" placeholder="Min" style="width: 100%; padding: 8px 12px; font-size: 13px;">
                        <span style="color: var(--text-secondary); font-size: 12px;">to</span>
                        <input type="number" id="filter-max-price" placeholder="Max" style="width: 100%; padding: 8px 12px; font-size: 13px;">
                    </div>
                </div>

                <!-- Rating -->
                <div class="form-group" style="margin-bottom: 24px;">
                    <label>Minimum Rating</label>
                    <select id="filter-rating" style="width: 100%;">
                        <option value="">Any Rating</option>
                        <option value="4">4★ & above</option>
                        <option value="3">3★ & above</option>
                        <option value="2">2★ & above</option>
                    </select>
                </div>

                <!-- Availability -->
                <div class="form-group" style="margin-bottom: 24px; flex-direction: row; align-items: center; gap: 10px; cursor: pointer;">
                    <input type="checkbox" id="filter-available" style="cursor: pointer; width: 16px; height: 16px;">
                    <label for="filter-available" style="cursor: pointer; margin-bottom: 0;">In Stock Only</label>
                </div>

                <!-- Sort By -->
                <div class="form-group" style="margin-bottom: 24px;">
                    <label>Sort By</label>
                    <select id="filter-sort" style="width: 100%;">
                        <option value="newest">Newest First</option>
                        <option value="name">Name (A-Z)</option>
                        <option value="price_asc">Price (Low to High)</option>
                        <option value="price_desc">Price (High to Low)</option>
                    </select>
                </div>

                <button id="apply-filters-btn" class="btn btn-primary w-full">
                    <i data-lucide="sliders"></i> Apply Filters
                </button>
            </aside>

            <!-- Products List Section -->
            <div>
                <!-- Search feedback & Results stats -->
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <span id="results-count" style="color: var(--text-secondary); font-size: 14px;">Finding products...</span>
                </div>

                <!-- Grid View -->
                <div id="catalog-products-grid" class="products-grid">
                    <!-- Products rendered dynamically -->
                </div>
            </div>
        </div>
    `;

    if (window.lucide) window.lucide.createIcons();

    // Fetch categories to populate dropdown
    const catSelect = document.getElementById("filter-category");
    try {
        const categories = await window.api.get("/api/categories");
        categories.forEach(cat => {
            const opt = document.createElement("option");
            opt.value = cat.id;
            opt.textContent = cat.name;
            if (categoryParam == cat.id) opt.selected = true;
            catSelect.appendChild(opt);
        });
    } catch (err) {
        console.error("Failed loading filters:", err);
    }

    // Set search values if pre-searched
    const searchInput = document.getElementById("global-search-input");
    if (searchInput && searchParam) {
        searchInput.value = searchParam;
    }

    // Function to run query based on controls
    const fetchFilteredProducts = async () => {
        const search = searchInput ? searchInput.value.trim() : "";
        const category_id = catSelect.value;
        const min_price = document.getElementById("filter-min-price").value;
        const max_price = document.getElementById("filter-max-price").value;
        const min_rating = document.getElementById("filter-rating").value;
        const in_stock_only = document.getElementById("filter-available").checked;
        const sort_by = document.getElementById("filter-sort").value;

        // Build API query string
        const params = new URLSearchParams();
        if (search) params.append("search", search);
        if (category_id) params.append("category_id", category_id);
        if (min_price) params.append("min_price", min_price);
        if (max_price) params.append("max_price", max_price);
        if (min_rating) params.append("min_rating", min_rating);
        if (in_stock_only) params.append("is_available", "true");
        if (sort_by) params.append("sort_by", sort_by);

        const grid = document.getElementById("catalog-products-grid");
        const countText = document.getElementById("results-count");
        grid.innerHTML = `<div style="color: var(--text-secondary);">Filtering products...</div>`;

        try {
            const products = await window.api.get(`/api/products?${params.toString()}`);
            countText.textContent = `${products.length} product(s) found`;
            
            if (products.length === 0) {
                grid.innerHTML = `<p style="grid-column: 1/-1; color: var(--text-secondary); text-align: center; padding: 40px;">No products match your filters.</p>`;
            } else {
                grid.innerHTML = products.map(prod => {
                    const primaryImage = prod.images.find(img => img.is_primary) || prod.images[0];
                    const imageSrc = primaryImage ? primaryImage.image_url : "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400";
                    
                    const isOutOfStock = !prod.inventory || prod.inventory.stock_quantity <= 0;
                    const stockBadge = isOutOfStock ? `<span class="badge badge-danger product-card-badge">Out of Stock</span>` : "";
                    
                    return `
                        <div class="product-card" onclick="window.location.hash='#product-details?id=${prod.id}'" style="cursor: pointer;">
                            ${stockBadge}
                            <div class="product-card-img-container">
                                <img class="product-card-img" src="${imageSrc}" alt="${prod.name}">
                            </div>
                            <div class="product-card-content">
                                <span class="product-card-cat">${prod.category.name}</span>
                                <h4 class="product-card-title">${prod.name}</h4>
                                <div class="product-rating">
                                    ${window.ui.renderStars(prod.rating_avg, prod.rating_count)}
                                </div>
                                <div class="product-card-footer">
                                    <span class="product-card-price">$${parseFloat(prod.price).toFixed(2)}</span>
                                    <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation(); window.location.hash='#product-details?id=${prod.id}'">
                                        Details
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
                }).join("");
            }
            if (window.lucide) window.lucide.createIcons();
        } catch (err) {
            window.ui.toast("Failed fetching products", err.message, "error");
        }
    };

    // Bind Apply Button click
    document.getElementById("apply-filters-btn").addEventListener("click", fetchFilteredProducts);

    // Run query immediately
    fetchFilteredProducts();
};

// 3. PRODUCT DETAILS VIEW
window.views.productDetails = async (id) => {
    if (!id) {
        window.location.hash = "#products";
        return;
    }

    const viewport = document.getElementById("main-content");
    viewport.innerHTML = `<div>Loading product details...</div>`;

    try {
        const product = await window.api.get(`/api/products/${id}`);
        const primaryImage = product.images.find(img => img.is_primary) || product.images[0];
        const primaryImageSrc = primaryImage ? primaryImage.image_url : "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600";
        
        const isOutOfStock = !product.inventory || product.inventory.stock_quantity <= 0;
        const stockQty = product.inventory ? product.inventory.stock_quantity : 0;
        
        // Build image thumbnails HTML
        let thumbnailsHTML = "";
        if (product.images && product.images.length > 1) {
            thumbnailsHTML = `
                <div style="display: flex; gap: 10px; margin-top: 16px; overflow-x: auto;">
                    ${product.images.map(img => `
                        <img class="detail-thumb" src="${img.image_url}" style="width: 70px; height: 70px; border-radius: var(--radius-sm); border: 2px solid ${img.id === (primaryImage ? primaryImage.id : '') ? 'var(--accent)' : 'var(--border-color)'}; object-fit: cover; cursor: pointer;" onclick="document.getElementById('large-preview-img').src=this.src; document.querySelectorAll('.detail-thumb').forEach(el=>el.style.borderColor='var(--border-color)'); this.style.borderColor='var(--accent)';">
                    `).join("")}
                </div>
            `;
        }

        viewport.innerHTML = `
            <!-- Back navigation link -->
            <a href="#products" style="display: inline-flex; align-items: center; gap: 6px; color: var(--text-secondary); font-size: 14px; margin-bottom: 24px;" onmouseover="this.style.color='var(--text-primary)'" onmouseout="this.style.color='var(--text-secondary)'">
                <i data-lucide="arrow-left" style="width: 16px; height: 16px;"></i> Back to Products
            </a>
            
            <div style="display: grid; grid-template-columns: 1fr 1.2fr; gap: 40px; margin-bottom: 48px; align-items: start;">
                <!-- Product Images Column -->
                <div>
                    <div style="width: 100%; aspect-ratio: 1.1; border: 1px solid var(--border-color); border-radius: var(--radius-lg); overflow: hidden; background-color: var(--bg-secondary); display: flex; align-items: center; justify-content: center;">
                        <img id="large-preview-img" src="${primaryImageSrc}" style="max-width: 100%; max-height: 100%; object-fit: contain;" alt="${product.name}">
                    </div>
                    ${thumbnailsHTML}
                </div>

                <!-- Product Specifications Column -->
                <div>
                    <span class="badge badge-accent" style="margin-bottom: 12px;">${product.category.name}</span>
                    <h1 style="font-size: 32px; font-weight: 800; margin-bottom: 12px;">${product.name}</h1>
                    
                    <div class="product-rating" style="font-size: 15px; margin-bottom: 20px;">
                        ${window.ui.renderStars(product.rating_avg, product.rating_count)}
                    </div>

                    <div style="font-size: 32px; font-family: var(--font-heading); font-weight: 800; color: var(--text-primary); margin-bottom: 24px;">
                        $${parseFloat(product.price).toFixed(2)}
                    </div>

                    <p style="color: var(--text-secondary); margin-bottom: 28px; line-height: 1.6; font-size: 15px;">
                        ${product.description || "No description provided for this product."}
                    </p>

                    <!-- Stock Status Banner -->
                    <div style="margin-bottom: 28px;">
                        ${isOutOfStock ? `
                            <span class="badge badge-danger" style="padding: 6px 12px; font-size: 13px;"><i data-lucide="x-circle" style="width: 14px; height: 14px; margin-right: 4px; vertical-align: middle;"></i> Out of stock</span>
                        ` : `
                            <span class="badge badge-success" style="padding: 6px 12px; font-size: 13px;"><i data-lucide="check-circle" style="width: 14px; height: 14px; margin-right: 4px; vertical-align: middle;"></i> In stock (${stockQty} units available)</span>
                        `}
                    </div>

                    <!-- Cart actions -->
                    <div style="display: flex; gap: 16px; align-items: center; max-width: 360px;">
                        ${isOutOfStock ? "" : `
                            <div style="display: flex; align-items: center; border: 1px solid var(--border-color); border-radius: var(--radius-md); background-color: var(--bg-secondary);">
                                <button class="btn btn-secondary btn-sm" id="detail-qty-minus" style="padding: 10px 14px; border: none; border-radius: 0; background: none;">-</button>
                                <span id="detail-qty-value" style="font-weight: 600; padding: 0 16px; font-size: 15px;">1</span>
                                <button class="btn btn-secondary btn-sm" id="detail-qty-plus" style="padding: 10px 14px; border: none; border-radius: 0; background: none;">+</button>
                            </div>
                            <button id="add-to-cart-btn" class="btn btn-primary w-full" style="height: 44px;">
                                <i data-lucide="shopping-cart"></i> Add to Cart
                            </button>
                        `}
                    </div>
                </div>
            </div>

            <!-- Reviews Section -->
            <div class="dashboard-card" style="margin-top: 48px;">
                <h3 class="dashboard-card-title">Reviews & Ratings</h3>
                
                <!-- Review List -->
                <div id="reviews-list-container" style="margin-bottom: 32px;">
                    <!-- Reviews will be loaded here -->
                    <p style="color: var(--text-secondary);">Loading reviews...</p>
                </div>

                <!-- Submit Review form (visible if logged in & bought item) -->
                <div id="review-submission-box" class="hidden" style="border-top: 1px solid var(--border-color); padding-top: 24px;">
                    <h4 style="font-size: 16px; font-weight: 700; margin-bottom: 16px;">Write a Review</h4>
                    <form id="submit-review-form">
                        <div class="form-group">
                            <label>Rating</label>
                            <select id="review-rating" required style="max-width: 150px;">
                                <option value="5">5 Stars</option>
                                <option value="4">4 Stars</option>
                                <option value="3">3 Stars</option>
                                <option value="2">2 Stars</option>
                                <option value="1">1 Star</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Review Comment</label>
                            <textarea id="review-comment" rows="4" placeholder="Share your experience with this product..." required></textarea>
                        </div>
                        <button type="submit" class="btn btn-primary">
                            <i data-lucide="send"></i> Submit Review
                        </button>
                    </form>
                </div>
            </div>
        `;

        if (window.lucide) window.lucide.createIcons();

        // 1. Qty Counter Controls
        if (!isOutOfStock) {
            const minusBtn = document.getElementById("detail-qty-minus");
            const plusBtn = document.getElementById("detail-qty-plus");
            const qtyText = document.getElementById("detail-qty-value");
            
            let qty = 1;
            minusBtn.addEventListener("click", () => {
                if (qty > 1) {
                    qty--;
                    qtyText.textContent = qty;
                }
            });
            
            plusBtn.addEventListener("click", () => {
                if (qty < stockQty) {
                    qty++;
                    qtyText.textContent = qty;
                } else {
                    window.ui.toast("Stock limit reached", `Only ${stockQty} items are available.`, "warning");
                }
            });

            // 2. Add To Cart submission
            const addBtn = document.getElementById("add-to-cart-btn");
            addBtn.addEventListener("click", async () => {
                if (!window.store.isLoggedIn()) {
                    window.ui.toast("Access Denied", "Please sign in to add items to your cart.", "warning");
                    window.location.hash = "#login";
                    return;
                }
                
                try {
                    const cart = await window.api.post("/api/cart/items", {
                        product_id: product.id,
                        quantity: qty
                    });
                    window.store.setCart(cart);
                    window.ui.toast("Added to Cart!", `${qty}x ${product.name} has been added to your shopping cart.`, "success");
                } catch (err) {
                    window.ui.toast("Add to Cart Failed", err.message, "error");
                }
            });
        }

        // 3. Load Reviews
        const reviewsContainer = document.getElementById("reviews-list-container");
        const loadReviewsList = async () => {
            try {
                // reviews are nested in product details reviews or we can fetch reviews
                // Let's render from product.reviews directly
                if (!product.reviews || product.reviews.length === 0) {
                    reviewsContainer.innerHTML = `<p style="color: var(--text-secondary); font-style: italic;">No reviews yet for this product. Be the first to buy and review it!</p>`;
                } else {
                    reviewsContainer.innerHTML = product.reviews.map(rev => `
                        <div style="padding: 16px 0; border-bottom: 1px dashed var(--border-color);">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <span style="font-weight: 600;">${rev.user ? rev.user.full_name : 'Verified Customer'}</span>
                                    <span style="color: var(--text-secondary); font-size: 11px;">${new Date(rev.created_at).toLocaleDateString()}</span>
                                </div>
                                <div style="color: var(--warning);">
                                    ${window.ui.renderStars(rev.rating, null)}
                                </div>
                            </div>
                            <p style="color: var(--text-secondary); font-size: 14px;">${rev.comment || ''}</p>
                        </div>
                    `).join("");
                }
                if (window.lucide) window.lucide.createIcons();
            } catch (err) {
                reviewsContainer.innerHTML = `<p style="color: var(--danger);">Failed to load reviews.</p>`;
            }
        };
        loadReviewsList();

        // 4. Handle Review Form submission visibility
        if (window.store.isLoggedIn()) {
            // Check if user has purchased the item
            try {
                const orders = await window.api.get("/api/orders", { showLoader: false });
                const hasPurchased = orders.some(o => 
                    o.status !== "cancelled" && 
                    o.items.some(item => item.product_id === product.id)
                );
                
                if (hasPurchased) {
                    // Check if they already wrote a review
                    const alreadyReviewed = product.reviews.some(r => r.user_id === window.store.user.id);
                    if (!alreadyReviewed) {
                        const reviewBox = document.getElementById("review-submission-box");
                        reviewBox.classList.remove("hidden");
                        
                        // Bind submit review event
                        const form = document.getElementById("submit-review-form");
                        form.addEventListener("submit", async (e) => {
                            e.preventDefault();
                            const rating = parseInt(document.getElementById("review-rating").value);
                            const comment = document.getElementById("review-comment").value.trim();
                            
                            try {
                                await window.api.post("/api/reviews", {
                                    product_id: product.id,
                                    rating,
                                    comment
                                });
                                window.ui.toast("Thank You!", "Your review was submitted successfully.", "success");
                                
                                // Refresh current product details page to update reviews list
                                window.views.productDetails(product.id);
                            } catch (err) {
                                window.ui.toast("Submission Failed", err.message, "error");
                            }
                        });
                    }
                }
            } catch (err) {
                console.error("Verification checks failed:", err);
            }
        }

    } catch (err) {
        viewport.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <h3 style="color: var(--danger); font-size: 20px; margin-bottom: 8px;">Product Not Found</h3>
                <p style="color: var(--text-secondary); margin-bottom: 20px;">${err.message}</p>
                <a href="#products" class="btn btn-primary">Return to Catalog</a>
            </div>
        `;
    }
};
