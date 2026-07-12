/* NexShop Cart Management & Checkout Page Views */

if (!window.views) window.views = {};

// 1. SHOPPING CART VIEW
window.views.cart = async () => {
    const viewport = document.getElementById("main-content");
    viewport.innerHTML = `<div>Refreshing cart items...</div>`;

    try {
        const cart = await window.api.get("/api/cart");
        window.store.setCart(cart); // Update global store

        if (cart.items.length === 0) {
            viewport.innerHTML = `
                <div style="text-align: center; padding: 80px 20px;">
                    <i data-lucide="shopping-cart" style="width: 80px; height: 80px; color: var(--text-secondary); margin-bottom: 24px; stroke-width: 1.5px;"></i>
                    <h2 style="font-size: 24px; margin-bottom: 12px;">Your Cart is Empty</h2>
                    <p style="color: var(--text-secondary); margin-bottom: 32px; max-width: 420px; margin-inline: auto;">Browse our store for top-tier tech gear and add products to your cart to checkout.</p>
                    <a href="#products" class="btn btn-primary"><i data-lucide="arrow-left"></i> Start Shopping</a>
                </div>
            `;
            if (window.lucide) window.lucide.createIcons();
            return;
        }

        const itemsHTML = cart.items.map(item => {
            const product = item.product;
            const primaryImage = product.images.find(img => img.is_primary) || product.images[0];
            const imageSrc = primaryImage ? primaryImage.image_url : "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=150";
            const subtotal = parseFloat(product.price) * item.quantity;
            const stockQty = product.inventory ? product.inventory.stock_quantity : 0;
            
            return `
                <div style="display: flex; gap: 20px; align-items: center; padding: 20px; border-bottom: 1px solid var(--border-color); flex-wrap: wrap;">
                    <img src="${imageSrc}" style="width: 80px; height: 80px; border-radius: var(--radius-md); object-fit: cover; border: 1px solid var(--border-color);" alt="${product.name}">
                    <div style="flex: 1; min-width: 200px;">
                        <a href="#product-details?id=${product.id}" style="font-weight: 600; font-size: 16px;" onmouseover="this.style.color='var(--accent)'" onmouseout="this.style.color='inherit'">${product.name}</a>
                        <p style="color: var(--text-secondary); font-size: 12px; margin-top: 2px;">Category: ${product.category.name}</p>
                        <p style="font-weight: 500; margin-top: 4px;">$${parseFloat(product.price).toFixed(2)} each</p>
                    </div>
                    
                    <!-- Qty Modifier -->
                    <div style="display: flex; align-items: center; border: 1px solid var(--border-color); border-radius: var(--radius-md); background-color: var(--bg-primary);">
                        <button class="qty-btn-minus btn btn-secondary btn-sm" data-id="${item.id}" data-qty="${item.quantity}" style="padding: 6px 12px; border: none; border-radius: 0; background: none;">-</button>
                        <span style="font-weight: 600; padding: 0 12px; font-size: 14px;">${item.quantity}</span>
                        <button class="qty-btn-plus btn btn-secondary btn-sm" data-id="${item.id}" data-qty="${item.quantity}" data-stock="${stockQty}" style="padding: 6px 12px; border: none; border-radius: 0; background: none;">+</button>
                    </div>
                    
                    <!-- Subtotal -->
                    <div style="min-width: 100px; text-align: right;">
                        <span style="font-weight: 700; font-size: 16px;">$${subtotal.toFixed(2)}</span>
                    </div>

                    <!-- Remove -->
                    <button class="remove-cart-item-btn btn btn-secondary btn-sm" data-id="${item.id}" style="color: var(--danger); border-color: transparent; background: none; padding: 8px;" title="Remove Item">
                        <i data-lucide="trash-2" style="width: 18px; height: 18px;"></i>
                    </button>
                </div>
            `;
        }).join("");

        viewport.innerHTML = `
            <h2 style="font-size: 32px; margin-bottom: 8px;">Shopping Cart</h2>
            <p style="color: var(--text-secondary); margin-bottom: 32px;">Review items and modify quantities before checking out.</p>

            <div class="checkout-grid">
                <!-- Cart Items List -->
                <div class="dashboard-card" style="padding: 0;">
                    ${itemsHTML}
                </div>

                <!-- Order Summary Panel -->
                <div class="order-summary-card">
                    <h3 style="font-size: 18px; font-weight: 700; margin-bottom: 20px;">Cart Summary</h3>
                    
                    <div class="summary-row">
                        <span style="color: var(--text-secondary);">Subtotal</span>
                        <span style="font-weight: 600;">$${parseFloat(cart.total_price).toFixed(2)}</span>
                    </div>
                    <div class="summary-row">
                        <span style="color: var(--text-secondary);">Shipping</span>
                        <span style="color: var(--success); font-weight: 600;">FREE</span>
                    </div>
                    <div class="summary-row">
                        <span style="color: var(--text-secondary);">Estimated Tax</span>
                        <span style="font-weight: 600;">$0.00</span>
                    </div>
                    
                    <div class="summary-row total">
                        <span>Total Price</span>
                        <span>$${parseFloat(cart.total_price).toFixed(2)}</span>
                    </div>

                    <a href="#checkout" class="btn btn-primary w-full" style="margin-top: 24px; height: 46px;">
                        Proceed to Checkout <i data-lucide="arrow-right"></i>
                    </a>
                </div>
            </div>
        `;

        if (window.lucide) window.lucide.createIcons();

        // Bind Quantities & Delete click listeners
        document.querySelectorAll(".qty-btn-minus").forEach(btn => {
            btn.addEventListener("click", async () => {
                const itemId = btn.dataset.id;
                const currentQty = parseInt(btn.dataset.qty);
                if (currentQty <= 1) return;
                
                try {
                    const cart = await window.api.put(`/api/cart/items/${itemId}`, {
                        quantity: currentQty - 1
                    });
                    window.store.setCart(cart);
                    window.views.cart(); // Refresh view
                } catch (err) {
                    window.ui.toast("Update Failed", err.message, "error");
                }
            });
        });

        document.querySelectorAll(".qty-btn-plus").forEach(btn => {
            btn.addEventListener("click", async () => {
                const itemId = btn.dataset.id;
                const currentQty = parseInt(btn.dataset.qty);
                const stockLimit = parseInt(btn.dataset.stock);
                
                if (currentQty >= stockLimit) {
                    window.ui.toast("Stock limit reached", `Only ${stockLimit} units available.`, "warning");
                    return;
                }
                
                try {
                    const cart = await window.api.put(`/api/cart/items/${itemId}`, {
                        quantity: currentQty + 1
                    });
                    window.store.setCart(cart);
                    window.views.cart(); // Refresh view
                } catch (err) {
                    window.ui.toast("Update Failed", err.message, "error");
                }
            });
        });

        document.querySelectorAll(".remove-cart-item-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                const itemId = btn.dataset.id;
                window.ui.confirm(
                    "Remove Item?",
                    "Are you sure you want to remove this product from your cart?",
                    async () => {
                        try {
                            const cart = await window.api.delete(`/api/cart/items/${itemId}`);
                            window.store.setCart(cart);
                            window.ui.toast("Item Removed", "Product was removed from your cart.", "success");
                            window.views.cart(); // Refresh view
                        } catch (err) {
                            window.ui.toast("Deletion Failed", err.message, "error");
                        }
                    }
                );
            });
        });

    } catch (err) {
        viewport.innerHTML = `<p style="color: var(--danger); text-align: center; padding: 40px;">Failed to load cart details: ${err.message}</p>`;
    }
};

// 2. CHECKOUT VIEW
window.views.checkout = async () => {
    const viewport = document.getElementById("main-content");
    viewport.innerHTML = `<div>Validating checkout session...</div>`;

    try {
        const cart = await window.api.get("/api/cart");
        window.store.setCart(cart);

        if (cart.items.length === 0) {
            window.location.hash = "#cart";
            return;
        }

        const itemsSummaryHTML = cart.items.map(item => `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; font-size: 13px;">
                <span style="color: var(--text-secondary); max-width: 75%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    ${item.product.name} <strong style="color: var(--text-primary);">x ${item.quantity}</strong>
                </span>
                <span style="font-weight: 500;">$${(parseFloat(item.product.price) * item.quantity).toFixed(2)}</span>
            </div>
        `).join("");

        viewport.innerHTML = `
            <h2 style="font-size: 32px; margin-bottom: 8px;">Order Checkout</h2>
            <p style="color: var(--text-secondary); margin-bottom: 32px;">Please fill in your shipping information to complete checkout.</p>

            <div class="checkout-grid">
                <!-- Shipping and billing forms -->
                <div class="dashboard-card">
                    <h3 style="font-size: 18px; font-weight: 700; margin-bottom: 20px;">Shipping Details</h3>
                    <form id="checkout-form">
                        <div class="form-group">
                            <label for="ship-address">Shipping Address</label>
                            <input type="text" id="ship-address" placeholder="123 Main St, City, Country" minlength="5" required>
                        </div>
                        <div class="form-group">
                            <label for="bill-address">Billing Address</label>
                            <input type="text" id="bill-address" placeholder="123 Main St, City, Country" minlength="5" required>
                            <div style="margin-top: 8px; font-size: 12px; color: var(--text-secondary); display: flex; align-items: center; gap: 6px; cursor: pointer;">
                                <input type="checkbox" id="sync-billing-checkbox" style="width: 14px; height: 14px; cursor: pointer;">
                                <label for="sync-billing-checkbox" style="margin-bottom: 0; cursor: pointer;">Same as Shipping Address</label>
                            </div>
                        </div>

                        <h3 style="font-size: 18px; font-weight: 700; margin: 32px 0 20px;">Payment Simulation</h3>
                        <div class="form-group">
                            <label>Simulated Gateway Method</label>
                            <select id="checkout-payment-method" required>
                                <option value="credit_card">Simulated Visa/MasterCard</option>
                                <option value="paypal">Simulated PayPal Wallet</option>
                            </select>
                        </div>
                        <div style="background-color: var(--bg-primary); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 16px; margin-bottom: 10px; display: flex; align-items: center; gap: 10px; color: var(--text-secondary); font-size: 13px;">
                            <i data-lucide="shield-check" style="color: var(--success); flex-shrink:0;"></i>
                            <span>This is a simulated transaction. Checking out will automatically clear your cart, deduct inventory, and mark the order as paid.</span>
                        </div>
                    </form>
                </div>

                <!-- Right Side Summary -->
                <div class="order-summary-card">
                    <h3 style="font-size: 18px; font-weight: 700; margin-bottom: 20px;">Order Summary</h3>
                    
                    <!-- Items sub-grid -->
                    <div style="border-bottom: 1px dashed var(--border-color); padding-bottom: 14px; margin-bottom: 14px;">
                        ${itemsSummaryHTML}
                    </div>
                    
                    <div class="summary-row">
                        <span style="color: var(--text-secondary);">Subtotal</span>
                        <span style="font-weight: 600;">$${parseFloat(cart.total_price).toFixed(2)}</span>
                    </div>
                    <div class="summary-row">
                        <span style="color: var(--text-secondary);">Shipping Cost</span>
                        <span style="color: var(--success); font-weight: 600;">FREE</span>
                    </div>
                    <div class="summary-row total" style="padding-top: 14px;">
                        <span>Total Price</span>
                        <span>$${parseFloat(cart.total_price).toFixed(2)}</span>
                    </div>

                    <button type="submit" form="checkout-form" class="btn btn-primary w-full" style="margin-top: 24px; height: 46px;">
                        <i data-lucide="check-square"></i> Confirm Purchase
                    </button>
                </div>
            </div>
        `;

        if (window.lucide) window.lucide.createIcons();

        // Bind address syncing check
        const shipInput = document.getElementById("ship-address");
        const billInput = document.getElementById("bill-address");
        const syncCheck = document.getElementById("sync-billing-checkbox");

        syncCheck.addEventListener("change", () => {
            if (syncCheck.checked) {
                billInput.value = shipInput.value;
                billInput.setAttribute("disabled", "true");
            } else {
                billInput.removeAttribute("disabled");
            }
        });

        // Sync inputs if user types after checkbox checked
        shipInput.addEventListener("input", () => {
            if (syncCheck.checked) {
                billInput.value = shipInput.value;
            }
        });

        // Checkout submit
        const form = document.getElementById("checkout-form");
        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            const shipping_address = shipInput.value.trim();
            // Use shipping address if billing disabled/synced
            const billing_address = syncCheck.checked ? shipping_address : billInput.value.trim();
            const payment_method = document.getElementById("checkout-payment-method").value;

            try {
                const order = await window.api.post("/api/orders", {
                    shipping_address,
                    billing_address,
                    payment_method
                });

                // Clear shopping cart state locally
                window.store.setCart({ items: [], total_price: 0.0 });
                window.ui.toast("Order Confirmed!", `Thank you for your purchase. Transaction ID: ${order.payments[0].transaction_id}`, "success");
                
                // Redirect to orders log
                window.location.hash = "#orders";
            } catch (err) {
                window.ui.toast("Checkout Failed", err.message, "error");
            }
        });

    } catch (err) {
        viewport.innerHTML = `<p style="color: var(--danger); text-align: center; padding: 40px;">Failed to compile checkout details: ${err.message}</p>`;
    }
};
