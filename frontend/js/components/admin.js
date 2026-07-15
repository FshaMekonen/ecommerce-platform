/* NexShop Administrative Dashboard & Management Page Views */

if (!window.views) window.views = {};

// 1. ADMIN STATS & CHARTS VIEW
window.views.adminDashboard = async () => {
    const viewport = document.getElementById("main-content");
    viewport.innerHTML = `<div>Calculating dashboard statistics...</div>`;

    try {
        const stats = await window.api.get("/api/admin/stats");

        const lowStockHTML = stats.low_stock_alerts.length === 0 
            ? `<p style="color: var(--text-secondary); font-size: 14px; font-style: italic;">No low-stock alerts. Inventory levels healthy!</p>`
            : stats.low_stock_alerts.map(item => `
                <div class="alert-item">
                    <i data-lucide="alert-triangle"></i>
                    <div>
                        <strong>${item.name}</strong> - Stock left: <strong style="color: var(--danger);">${item.stock}</strong> (Alert threshold: ${item.reorder_level})
                    </div>
                </div>
            `).join("");

        const recentOrdersHTML = stats.recent_orders.length === 0
            ? `<p style="color: var(--text-secondary); font-size: 14px; font-style: italic;">No orders placed yet.</p>`
            : stats.recent_orders.map(o => `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px dashed var(--border-color); font-size: 13px;">
                    <div>
                        <span style="font-weight: 600;">#ORD-${o.id}</span> by <span style="color: var(--text-secondary);">${o.customer_name}</span>
                        <div style="font-size: 11px; color: var(--text-secondary); margin-top: 2px;">${new Date(o.created_at).toLocaleDateString()}</div>
                    </div>
                    <div style="text-align: right;">
                        <span style="font-weight: 700; color: var(--accent);">$${o.total_amount.toFixed(2)}</span>
                        <div style="margin-top: 2px;"><span class="badge ${o.status === 'paid' || o.status === 'delivered' ? 'badge-success' : 'badge-warning'}" style="font-size: 9px; text-transform: uppercase;">${o.status}</span></div>
                    </div>
                </div>
            `).join("");

        viewport.innerHTML = `
            <h2 style="font-size: 32px; margin-bottom: 8px;">Admin Control Center</h2>
            <p style="color: var(--text-secondary); margin-bottom: 32px;">Overview of store metrics, inventory alerts, and recent sales trends.</p>

            <!-- Stats grid counters -->
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-info">
                        <span class="stat-title">Total Revenue</span>
                        <span class="stat-value">$${stats.total_revenue.toFixed(2)}</span>
                    </div>
                    <div class="stat-icon-wrapper"><i data-lucide="dollar-sign"></i></div>
                </div>
                <div class="stat-card">
                    <div class="stat-info">
                        <span class="stat-title">Total Orders</span>
                        <span class="stat-value">${stats.total_orders}</span>
                    </div>
                    <div class="stat-icon-wrapper"><i data-lucide="shopping-cart"></i></div>
                </div>
                <div class="stat-card">
                    <div class="stat-info">
                        <span class="stat-title">Listed Products</span>
                        <span class="stat-value">${stats.total_products}</span>
                    </div>
                    <div class="stat-icon-wrapper"><i data-lucide="boxes"></i></div>
                </div>
                <div class="stat-card">
                    <div class="stat-info">
                        <span class="stat-title">Registered Users</span>
                        <span class="stat-value">${stats.total_users}</span>
                    </div>
                    <div class="stat-icon-wrapper"><i data-lucide="users"></i></div>
                </div>
            </div>

            <!-- Graph and Split layout -->
            <div class="dashboard-layout">
                <!-- Sales Trend Graph -->
                <div class="dashboard-card" style="margin-bottom: 0;">
                    <h3 class="dashboard-card-title">Recent Weekly Revenue</h3>
                    <div class="chart-container">
                        <svg id="sales-trend-svg" class="chart-svg" viewBox="0 0 600 250">
                            <!-- Gradient background definition -->
                            <defs>
                                <linearGradient id="chart-gradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stop-color="var(--accent)" stop-opacity="0.4"/>
                                    <stop offset="100%" stop-color="var(--accent)" stop-opacity="0.0"/>
                                </linearGradient>
                            </defs>
                        </svg>
                    </div>
                </div>
                
                <!-- Side panels for notifications -->
                <div>
                    <!-- Low stock alerts -->
                    <div class="dashboard-card">
                        <h3 class="dashboard-card-title" style="color: var(--danger);"><i data-lucide="alert-octagon"></i> Inventory Alerts</h3>
                        ${lowStockHTML}
                    </div>
                    <!-- Recent Orders list -->
                    <div class="dashboard-card" style="margin-bottom: 0;">
                        <h3 class="dashboard-card-title"><i data-lucide="receipt"></i> Recent Orders</h3>
                        ${recentOrdersHTML}
                    </div>
                </div>
            </div>
        `;

        if (window.lucide) window.lucide.createIcons();

        // Render dynamic SVG Line Chart
        renderSalesTrendChart(stats.sales_trend);

    } catch (err) {
        viewport.innerHTML = `<p style="color: var(--danger); text-align: center; padding: 40px;">Failed loading dashboard stats: ${err.message}</p>`;
    }
};

// HELPER TO GENERATE SVG SALES GRAPH
function renderSalesTrendChart(trendData) {
    const svg = document.getElementById("sales-trend-svg");
    if (!svg) return;

    // Default trend mock-data if database has no entries
    const data = trendData && trendData.length >= 2 ? trendData : [
        { date: "Day 1", revenue: 0 },
        { date: "Day 2", revenue: 120 },
        { date: "Day 3", revenue: 350 },
        { date: "Day 4", revenue: 200 },
        { date: "Day 5", revenue: 450 },
        { date: "Day 6", revenue: 600 },
        { date: "Day 7", revenue: 800 }
    ];

    const padding = { top: 20, right: 30, bottom: 40, left: 50 };
    const width = 600;
    const height = 250;
    const graphWidth = width - padding.left - padding.right;
    const graphHeight = height - padding.top - padding.bottom;

    const maxVal = Math.max(...data.map(d => d.revenue), 100) * 1.15; // padding peak
    const minVal = 0;

    // Helper conversion mappings
    const getX = (index) => padding.left + (index / (data.length - 1)) * graphWidth;
    const getY = (value) => padding.top + graphHeight - ((value - minVal) / (maxVal - minVal)) * graphHeight;

    // 1. Draw Grid Lines & Y Axis Labels
    const gridLinesCount = 4;
    for (let i = 0; i <= gridLinesCount; i++) {
        const yVal = minVal + (i / gridLinesCount) * (maxVal - minVal);
        const yPos = getY(yVal);
        
        // Grid Line
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", padding.left);
        line.setAttribute("y1", yPos);
        line.setAttribute("x2", width - padding.right);
        line.setAttribute("y2", yPos);
        line.setAttribute("class", "chart-grid-line");
        svg.appendChild(line);

        // Y Label
        const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
        label.setAttribute("x", padding.left - 10);
        label.setAttribute("y", yPos + 4);
        label.setAttribute("text-anchor", "end");
        label.setAttribute("class", "chart-axis-text");
        label.textContent = `$${Math.round(yVal)}`;
        svg.appendChild(label);
    }

    // 2. Plot Points & Areas
    let pathD = "";
    let areaPoints = `${getX(0)},${padding.top + graphHeight} `;

    data.forEach((d, idx) => {
        const cx = getX(idx);
        const cy = getY(d.revenue);

        // Path definitions
        if (idx === 0) {
            pathD = `M ${cx} ${cy}`;
        } else {
            pathD += ` L ${cx} ${cy}`;
        }

        areaPoints += `${cx},${cy} `;

        // X Axis labels (formatted dates)
        const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
        label.setAttribute("x", cx);
        label.setAttribute("y", height - padding.bottom + 20);
        label.setAttribute("text-anchor", "middle");
        label.setAttribute("class", "chart-axis-text");
        
        // Shorten ISO date to Mon-Day
        let shortDate = d.date;
        if (d.date.includes("-")) {
            const dateParts = d.date.split("-");
            shortDate = `${dateParts[1]}/${dateParts[2]}`;
        }
        label.textContent = shortDate;
        svg.appendChild(label);
    });

    areaPoints += `${getX(data.length - 1)},${padding.top + graphHeight}`;

    // 3. Render Area Path (filled with gradient)
    const area = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    area.setAttribute("points", areaPoints);
    area.setAttribute("class", "chart-area");
    svg.appendChild(area);

    // 4. Render Main Line Path
    const linePath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    linePath.setAttribute("d", pathD);
    linePath.setAttribute("class", "chart-line");
    svg.appendChild(linePath);

    // 5. Draw Interactive Circular Nodes
    data.forEach((d, idx) => {
        const cx = getX(idx);
        const cy = getY(d.revenue);

        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("cx", cx);
        circle.setAttribute("cy", cy);
        circle.setAttribute("r", 5);
        circle.setAttribute("class", "chart-point");
        
        // Dynamic tooltip display on mouse over
        circle.addEventListener("mouseenter", () => {
            window.ui.toast(`${d.date}`, `Daily Revenue: $${d.revenue.toFixed(2)}`, "info");
        });
        
        svg.appendChild(circle);
    });
}

// 2. ADMIN PRODUCT CRUD MANAGEMENT
window.views.adminProducts = async () => {
    const viewport = document.getElementById("main-content");
    viewport.innerHTML = `<div>Refreshing catalog...</div>`;

    try {
        const [products, categories] = await Promise.all([
            window.api.get("/api/products"),
            window.api.get("/api/categories")
        ]);

        const rowsHTML = products.map(p => {
            const primaryImg = p.images.find(img => img.is_primary) || p.images[0];
            const imgPath = primaryImg ? primaryImg.image_url : "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100";
            
            const isLowStock = p.inventory && p.inventory.stock_quantity <= p.inventory.reorder_level;
            const stockColor = isLowStock ? 'var(--danger)' : 'inherit';
            const stockBold = isLowStock ? 'font-weight: 700;' : '';

            return `
                <tr>
                    <td>#${p.id}</td>
                    <td><img class="table-img" src="${imgPath}" alt="${p.name}"></td>
                    <td><strong style="color: var(--text-primary);">${p.name}</strong></td>
                    <td>$${parseFloat(p.price).toFixed(2)}</td>
                    <td>${p.category.name}</td>
                    <td style="color: ${stockColor}; ${stockBold}">${p.inventory ? p.inventory.stock_quantity : 0} units</td>
                    <td>
                        <span class="badge ${p.is_available ? 'badge-success' : 'badge-danger'}">
                            ${p.is_available ? 'Active' : 'Draft'}
                        </span>
                    </td>
                    <td>
                        <div class="actions-cell">
                            <button class="edit-prod-btn btn btn-secondary btn-sm" data-id="${p.id}" title="Edit Product"><i data-lucide="edit"></i></button>
                            <button class="upload-img-btn btn btn-secondary btn-sm" data-id="${p.id}" title="Add Images"><i data-lucide="image"></i></button>
                            <button class="delete-prod-btn btn btn-danger btn-sm" data-id="${p.id}" title="Delete Product"><i data-lucide="trash-2"></i></button>
                        </div>
                    </td>
                </tr>
            `;
        }).join("");

        viewport.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                <div>
                    <h2 style="font-size: 32px; margin-bottom: 8px;">Product Inventory</h2>
                    <p style="color: var(--text-secondary);">Manage product listings, pricing updates, and photos uploads.</p>
                </div>
                <button id="add-product-trigger" class="btn btn-primary"><i data-lucide="plus"></i> Add Product</button>
            </div>

            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th style="width: 60px;">ID</th>
                            <th style="width: 80px;">Image</th>
                            <th>Name</th>
                            <th>Price</th>
                            <th>Category</th>
                            <th>Stock Quantity</th>
                            <th>Status</th>
                            <th style="width: 140px;">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rowsHTML || '<tr><td colspan="8" style="text-align: center; color: var(--text-secondary);">No products created yet.</td></tr>'}
                    </tbody>
                </table>
            </div>
        `;

        if (window.lucide) window.lucide.createIcons();

        // 1. Bind CREATE product trigger
        document.getElementById("add-product-trigger").addEventListener("click", () => {
            showProductModal(null, categories);
        });

        // 2. Bind UPDATE product triggers
        document.querySelectorAll(".edit-prod-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                const prodId = parseInt(btn.dataset.id);
                const target = products.find(p => p.id === prodId);
                showProductModal(target, categories);
            });
        });

        // 3. Bind DELETE product triggers
        document.querySelectorAll(".delete-prod-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                const prodId = btn.dataset.id;
                window.ui.confirm(
                    "Delete Product?",
                    "Are you sure you want to permanently delete this product and all associated reviews and stock listings?",
                    async () => {
                        try {
                            await window.api.delete(`/api/admin/products/${prodId}`);
                            window.ui.toast("Deleted!", "Product has been successfully deleted.", "success");
                            window.views.adminProducts(); // Refresh page
                        } catch (err) {
                            window.ui.toast("Error", err.message, "error");
                        }
                    }
                );
            });
        });

        // 4. Bind Image Upload buttons
        document.querySelectorAll(".upload-img-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                const prodId = btn.dataset.id;
                showImageUploadModal(prodId);
            });
        });

    } catch (err) {
        viewport.innerHTML = `<p style="color: var(--danger); text-align: center; padding: 40px;">Failed to fetch admin products: ${err.message}</p>`;
    }
};

// POPUP DIALOG FORM FOR ADDING / EDITING PRODUCTS
function showProductModal(product = null, categories) {
    const isEdit = !!product;
    const modalOverlay = document.createElement("div");
    modalOverlay.className = "modal-overlay";
    
    // Build category options dropdown list
    const optionsHTML = categories.length === 0
        ? `<option value="">-- PLEASE CREATE A CATEGORY FIRST --</option>`
        : categories.map(cat => `
            <option value="${cat.id}" ${isEdit && product.category_id === cat.id ? 'selected' : ''}>${cat.name}</option>
        `).join("");

    modalOverlay.innerHTML = `
        <div class="modal">
            <div class="modal-header">
                <h3 class="modal-title">${isEdit ? 'Update Details' : 'Add New Product'}</h3>
                <button class="modal-close-btn" id="close-prod-modal"><i data-lucide="x"></i></button>
            </div>
            <div class="modal-body">
                <form id="product-modal-form">
                    <div class="form-group">
                        <label for="m-prod-name">Product Name</label>
                        <input type="text" id="m-prod-name" value="${isEdit ? product.name : ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="m-prod-cat">Category</label>
                        <select id="m-prod-cat" required>
                            ${optionsHTML}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="m-prod-price">Retail Price ($)</label>
                        <input type="number" id="m-prod-price" step="0.01" min="0.01" value="${isEdit ? parseFloat(product.price).toFixed(2) : ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="m-prod-stock">Initial Stock Quantity</label>
                        <input type="number" id="m-prod-stock" min="0" value="${isEdit ? product.inventory.stock_quantity : '0'}" required>
                    </div>
                    <div class="form-group">
                        <label for="m-prod-reorder">Low Stock Alert Threshold</label>
                        <input type="number" id="m-prod-reorder" min="0" value="${isEdit ? product.inventory.reorder_level : '10'}" required>
                    </div>
                    <div class="form-group">
                        <label for="m-prod-desc">Description</label>
                        <textarea id="m-prod-desc" rows="3">${isEdit ? product.description || '' : ''}</textarea>
                    </div>
                    <div class="form-group" style="flex-direction: row; gap: 8px; align-items: center; cursor: pointer;">
                        <input type="checkbox" id="m-prod-active" style="width: 16px; height: 16px; cursor: pointer;" ${!isEdit || product.is_available ? 'checked' : ''}>
                        <label for="m-prod-active" style="margin-bottom: 0; cursor: pointer;">Make listing active immediately</label>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" id="cancel-prod-modal">Cancel</button>
                <button type="submit" form="product-modal-form" class="btn btn-primary">Save Product</button>
            </div>
        </div>
    `;

    document.body.appendChild(modalOverlay);
    if (window.lucide) window.lucide.createIcons();

    const closeModal = () => modalOverlay.remove();
    document.getElementById("close-prod-modal").addEventListener("click", closeModal);
    document.getElementById("cancel-prod-modal").addEventListener("click", closeModal);

    const form = document.getElementById("product-modal-form");
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const payload = {
            name: document.getElementById("m-prod-name").value.trim(),
            category_id: parseInt(document.getElementById("m-prod-cat").value),
            price: parseFloat(document.getElementById("m-prod-price").value),
            stock_quantity: parseInt(document.getElementById("m-prod-stock").value),
            reorder_level: parseInt(document.getElementById("m-prod-reorder").value),
            description: document.getElementById("m-prod-desc").value.trim(),
            is_available: document.getElementById("m-prod-active").checked
        };

        try {
            if (isEdit) {
                await window.api.put(`/api/admin/products/${product.id}`, payload);
                window.ui.toast("Success!", "Product details updated successfully.", "success");
            } else {
                await window.api.post("/api/admin/products", payload);
                window.ui.toast("Created!", "Product added to inventory.", "success");
            }
            closeModal();
            window.views.adminProducts(); // Refresh table view
        } catch (err) {
            window.ui.toast("Save Failed", err.message, "error");
        }
    });
}

// POPUP DIALOG FORM TO UPLOAD PRODUCT IMAGES
function showImageUploadModal(productId) {
    const modalOverlay = document.createElement("div");
    modalOverlay.className = "modal-overlay";
    modalOverlay.innerHTML = `
        <div class="modal">
            <div class="modal-header">
                <h3 class="modal-title">Upload Product Photo</h3>
                <button class="modal-close-btn" id="close-img-modal"><i data-lucide="x"></i></button>
            </div>
            <div class="modal-body">
                <form id="img-upload-form">
                    <div class="form-group">
                        <label>Select Image File</label>
                        <input type="file" id="prod-img-file" accept="image/png, image/jpeg, image/webp" required>
                        <p style="font-size: 11px; color: var(--text-secondary); margin-top: 6px;">JPEG, PNG or WebP. Max 2MB.</p>
                    </div>
                    <div class="form-group" style="flex-direction: row; gap: 8px; align-items: center; cursor: pointer;">
                        <input type="checkbox" id="prod-img-primary" style="width: 16px; height: 16px; cursor: pointer;" checked>
                        <label for="prod-img-primary" style="margin-bottom: 0; cursor: pointer;">Set as primary catalog cover image</label>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" id="cancel-img-modal">Cancel</button>
                <button type="submit" form="img-upload-form" class="btn btn-primary">Upload Photo</button>
            </div>
        </div>
    `;

    document.body.appendChild(modalOverlay);
    if (window.lucide) window.lucide.createIcons();

    const closeModal = () => modalOverlay.remove();
    document.getElementById("close-img-modal").addEventListener("click", closeModal);
    document.getElementById("cancel-img-modal").addEventListener("click", closeModal);

    const form = document.getElementById("img-upload-form");
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const fileInput = document.getElementById("prod-img-file");
        if (fileInput.files.length === 0) return;
        
        const file = fileInput.files[0];
        if (file.size > 2 * 1024 * 1024) {
            window.ui.toast("Error", "File size exceeds 2MB.", "error");
            return;
        }

        const isPrimary = document.getElementById("prod-img-primary").checked;
        const formData = new FormData();
        formData.append("file", file);

        try {
            await window.api.post(`/api/admin/products/${productId}/images?is_primary=${isPrimary}`, formData);
            window.ui.toast("Uploaded!", "Image attached to product catalog.", "success");
            closeModal();
            window.views.adminProducts(); // Refresh list to show new image
        } catch (err) {
            window.ui.toast("Upload Failed", err.message, "error");
        }
    });
}

// 3. ADMIN CATEGORY CRUD
window.views.adminCategories = async () => {
    const viewport = document.getElementById("main-content");
    viewport.innerHTML = `<div>Fetching categories...</div>`;

    try {
        const categories = await window.api.get("/api/categories");

        const rowsHTML = categories.map(cat => `
            <tr>
                <td>#${cat.id}</td>
                <td><strong style="color: var(--text-primary);">${cat.name}</strong></td>
                <td>${cat.description || '<em style="color: var(--text-secondary)">No description</em>'}</td>
                <td>${new Date(cat.created_at).toLocaleDateString()}</td>
                <td>
                    <div class="actions-cell">
                        <button class="edit-cat-btn btn btn-secondary btn-sm" data-id="${cat.id}" data-name="${cat.name}" data-desc="${cat.description || ''}"><i data-lucide="edit"></i></button>
                        <button class="delete-cat-btn btn btn-danger btn-sm" data-id="${cat.id}"><i data-lucide="trash-2"></i></button>
                    </div>
                </td>
            </tr>
        `).join("");

        viewport.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                <div>
                    <h2 style="font-size: 32px; margin-bottom: 8px;">Product Categories</h2>
                    <p style="color: var(--text-secondary);">Add and manage categories to group products in search filters.</p>
                </div>
                <button id="add-category-trigger" class="btn btn-primary"><i data-lucide="plus"></i> Add Category</button>
            </div>

            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th style="width: 80px;">ID</th>
                            <th>Name</th>
                            <th>Description</th>
                            <th>Date Created</th>
                            <th style="width: 100px;">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rowsHTML || '<tr><td colspan="5" style="text-align: center; color: var(--text-secondary);">No categories created yet.</td></tr>'}
                    </tbody>
                </table>
            </div>
        `;

        if (window.lucide) window.lucide.createIcons();

        // Bind creation click
        document.getElementById("add-category-trigger").addEventListener("click", () => showCategoryModal());

        // Bind updates click
        document.querySelectorAll(".edit-cat-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                const cat = {
                    id: parseInt(btn.dataset.id),
                    name: btn.dataset.name,
                    description: btn.dataset.desc
                };
                showCategoryModal(cat);
            });
        });

        // Bind delete click
        document.querySelectorAll(".delete-cat-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                const catId = btn.dataset.id;
                window.ui.confirm(
                    "Delete Category?",
                    "Are you sure? You cannot delete categories that still contain active product listings.",
                    async () => {
                        try {
                            await window.api.delete(`/api/admin/categories/${catId}`);
                            window.ui.toast("Deleted!", "Category removed successfully.", "success");
                            window.views.adminCategories();
                        } catch (err) {
                            window.ui.toast("Error", err.message, "error");
                        }
                    }
                );
            });
        });

    } catch (err) {
        viewport.innerHTML = `<p style="color: var(--danger); text-align: center; padding: 40px;">Failed to fetch categories: ${err.message}</p>`;
    }
};

// POPUP DIALOG FORM FOR CATEGORIES
function showCategoryModal(category = null) {
    const isEdit = !!category;
    const modalOverlay = document.createElement("div");
    modalOverlay.className = "modal-overlay";
    modalOverlay.innerHTML = `
        <div class="modal">
            <div class="modal-header">
                <h3 class="modal-title">${isEdit ? 'Update Category' : 'Add Category'}</h3>
                <button class="modal-close-btn" id="close-cat-modal"><i data-lucide="x"></i></button>
            </div>
            <div class="modal-body">
                <form id="category-modal-form">
                    <div class="form-group">
                        <label for="m-cat-name">Category Name</label>
                        <input type="text" id="m-cat-name" value="${isEdit ? category.name : ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="m-cat-desc">Description</label>
                        <textarea id="m-cat-desc" rows="3">${isEdit ? category.description : ''}</textarea>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" id="cancel-cat-modal">Cancel</button>
                <button type="submit" form="category-modal-form" class="btn btn-primary">Save Category</button>
            </div>
        </div>
    `;

    document.body.appendChild(modalOverlay);
    if (window.lucide) window.lucide.createIcons();

    const closeModal = () => modalOverlay.remove();
    document.getElementById("close-cat-modal").addEventListener("click", closeModal);
    document.getElementById("cancel-cat-modal").addEventListener("click", closeModal);

    const form = document.getElementById("category-modal-form");
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const payload = {
            name: document.getElementById("m-cat-name").value.trim(),
            description: document.getElementById("m-cat-desc").value.trim()
        };

        try {
            if (isEdit) {
                await window.api.put(`/api/admin/categories/${category.id}`, payload);
                window.ui.toast("Success!", "Category updated.", "success");
            } else {
                await window.api.post("/api/admin/categories", payload);
                window.ui.toast("Created!", "Category created successfully.", "success");
            }
            closeModal();
            window.views.adminCategories();
        } catch (err) {
            window.ui.toast("Failed", err.message, "error");
        }
    });
}

// 4. ADMIN ORDERS SHIPMENT CONTROL
window.views.adminOrders = async () => {
    const viewport = document.getElementById("main-content");
    viewport.innerHTML = `<div style="padding: 40px; text-align: center; color: var(--text-secondary);">Fetching global order logs...</div>`;

    try {
        const orders = await window.api.get("/api/admin/orders");

        let rowsHTML = "";
        if (Array.isArray(orders) && orders.length > 0) {
            rowsHTML = orders.map(ord => {
                const dateStr = new Date(ord.created_at).toLocaleDateString();
                const customerLabel = ord.customer_name || `User #${ord.user_id}`;
                const itemCount = Array.isArray(ord.items) ? ord.items.length : 0;
                
                return `
                    <tr>
                        <td style="font-family: var(--font-heading); font-weight: 700; color: var(--accent);">#ORD-${ord.id}</td>
                        <td>${customerLabel}</td>
                        <td style="text-align: center;">${itemCount}</td>
                        <td style="font-weight: 600;">$${parseFloat(ord.total_amount).toFixed(2)}</td>
                        <td>${dateStr}</td>
                        <td>
                            <select class="order-status-select form-control" data-id="${ord.id}" style="padding: 4px 8px; font-size: 13px; border-radius: var(--radius-sm); background: var(--bg-primary); color: var(--text-primary); border: 1px solid var(--border-color);">
                                <option value="pending" ${ord.status === 'pending' ? 'selected' : ''}>Pending</option>
                                <option value="paid" ${ord.status === 'paid' ? 'selected' : ''}>Paid</option>
                                <option value="shipped" ${ord.status === 'shipped' ? 'selected' : ''}>Shipped</option>
                                <option value="delivered" ${ord.status === 'delivered' ? 'selected' : ''}>Delivered</option>
                                <option value="cancelled" ${ord.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                            </select>
                        </td>
                        <td>
                            <button class="admin-view-ord-btn btn btn-secondary btn-sm" onclick="showOrderDetailsModal(${ord.id})">
                                ${window.ui.icon("eye", "", 14)} Details
                            </button>
                        </td>
                    </tr>
                `;
            }).join("");
        }

        viewport.innerHTML = `
            <h2 style="font-size: 32px; margin-bottom: 8px;">Order Logistics</h2>
            <p style="color: var(--text-secondary); margin-bottom: 24px;">Track orders and alter delivery states (Pending &rarr; Paid &rarr; Shipped &rarr; Delivered).</p>

            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Order ID</th>
                            <th>Customer</th>
                            <th style="text-align:center;">Items</th>
                            <th>Total Amount</th>
                            <th>Date / Time</th>
                            <th>Delivery Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rowsHTML !== "" ? rowsHTML : '<tr><td colspan="7" style="text-align: center; padding: 40px; color: var(--text-secondary);">No orders placed yet.</td></tr>'}
                    </tbody>
                </table>
            </div>
        `;

        if (window.lucide) window.lucide.createIcons();

        // Bind select changes to PUT API
        document.querySelectorAll(".order-status-select").forEach(select => {
            select.addEventListener("change", async () => {
                const orderId = select.dataset.id;
                const status = select.value;
                
                try {
                    await window.api.put(`/api/admin/orders/${orderId}`, { status });
                    window.ui.toast("Order Updated", `Order #${orderId} set to status: ${status}`, "success");
                } catch (err) {
                    window.ui.toast("Update Failed", err.message, "error");
                    // Refresh logs to reset values
                    window.views.adminOrders();
                }
            });
        });

    } catch (err) {
        console.error("Admin orders error:", err);
        viewport.innerHTML = `
            <div style="text-align: center; padding: 60px;">
                <p style="color: var(--danger); font-size: 18px; margin-bottom: 12px;">Failed to load orders</p>
                <p style="color: var(--text-secondary); font-size: 14px;">${err.message}</p>
                <button class="btn btn-primary" onclick="window.views.adminOrders()" style="margin-top: 20px;">Retry</button>
            </div>
        `;
    }
};

// 5. ADMIN USER PROMOTIONS & ACTIONS
window.views.adminUsers = async () => {
    const viewport = document.getElementById("main-content");
    viewport.innerHTML = `<div>Fetching profile records...</div>`;

    try {
        const users = await window.api.get("/api/admin/users");

        const rowsHTML = users.map(usr => `
            <tr>
                <td>#${usr.id}</td>
                <td><img class="table-img" src="${usr.profile_image || '/uploads/profiles/default-avatar.png'}" style="border-radius: 50%; width: 40px; height: 40px;" alt=""></td>
                <td><strong style="color: var(--text-primary);">${usr.full_name}</strong></td>
                <td>${usr.email}</td>
                <td>
                    <select class="user-role-select" data-id="${usr.id}" style="padding: 4px 8px; font-size: 13px; border-radius: var(--radius-sm); background: var(--bg-primary); color: var(--text-primary); border: 1px solid var(--border-color);">
                        <option value="customer" ${usr.role.name === 'customer' ? 'selected' : ''}>Customer</option>
                        <option value="admin" ${usr.role.name === 'admin' ? 'selected' : ''}>Administrator</option>
                    </select>
                </td>
                <td>
                    <button class="user-active-toggle btn ${usr.is_active ? 'btn-secondary' : 'btn-danger'} btn-sm" data-id="${usr.id}" data-active="${usr.is_active}">
                        ${usr.is_active ? 'Block User' : 'Unblock'}
                    </button>
                </td>
                <td>
                    <button class="delete-user-btn btn btn-danger btn-sm" data-id="${usr.id}"><i data-lucide="trash-2"></i></button>
                </td>
            </tr>
        `).join("");

        viewport.innerHTML = `
            <h2 style="font-size: 32px; margin-bottom: 8px;">User Access Management</h2>
            <p style="color: var(--text-secondary); margin-bottom: 24px;">Alter user roles, disable/block specific email accounts, and view registered logs.</p>

            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th style="width: 80px;">ID</th>
                            <th style="width: 60px;">Photo</th>
                            <th>Full Name</th>
                            <th>Email Address</th>
                            <th>Role Mode</th>
                            <th>Status control</th>
                            <th style="width: 60px;">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rowsHTML}
                    </tbody>
                </table>
            </div>
        `;

        if (window.lucide) window.lucide.createIcons();

        // 1. Role promotes select
        document.querySelectorAll(".user-role-select").forEach(select => {
            select.addEventListener("change", async () => {
                const userId = select.dataset.id;
                const roleName = select.value;
                
                try {
                    await window.api.put(`/api/admin/users/${userId}/role?role_name=${roleName}`);
                    window.ui.toast("Role Changed", `User role altered to: ${roleName}`, "success");
                } catch (err) {
                    window.ui.toast("Error", err.message, "error");
                    window.views.adminUsers();
                }
            });
        });

        // 2. Block/Unblock toggle
        document.querySelectorAll(".user-active-toggle").forEach(btn => {
            btn.addEventListener("click", async () => {
                const userId = btn.dataset.id;
                const currentActive = btn.dataset.active === "true";
                const targetActive = !currentActive;
                
                try {
                    await window.api.put(`/api/admin/users/${userId}/status?is_active=${targetActive}`);
                    window.ui.toast("Status Altered", `User ${targetActive ? 'activated' : 'deactivated/blocked'}`, "success");
                    window.views.adminUsers();
                } catch (err) {
                    window.ui.toast("Failed", err.message, "error");
                }
            });
        });

        // 3. Delete accounts permanently
        document.querySelectorAll(".delete-user-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                const userId = btn.dataset.id;
                if (parseInt(userId) === window.store.user.id) {
                    window.ui.toast("Blocked Action", "You cannot delete your own session profile.", "warning");
                    return;
                }
                
                window.ui.confirm(
                    "Delete User Account?",
                    "Are you sure? This will delete all order metadata, cart listings, and user credentials permanently.",
                    async () => {
                        try {
                            await window.api.delete(`/api/admin/users/${userId}`);
                            window.ui.toast("Deleted!", "User profile deleted.", "success");
                            window.views.adminUsers();
                        } catch (err) {
                            window.ui.toast("Error", err.message, "error");
                        }
                    }
                );
            });
        });

    } catch (err) {
        viewport.innerHTML = `<p style="color: var(--danger); text-align: center; padding: 40px;">Failed to fetch users list: ${err.message}</p>`;
    }
};

// 6. ADMIN REVIEWS MODERATION
window.views.adminReviews = async () => {
    const viewport = document.getElementById("main-content");
    viewport.innerHTML = `<div>Fetching reviews log...</div>`;

    try {
        const reviews = await window.api.get("/api/admin/reviews");

        const rowsHTML = reviews.map(rev => `
            <tr>
                <td>#${rev.id}</td>
                <td><strong style="color: var(--text-primary);">${rev.product ? rev.product.name : 'Unknown Product'}</strong></td>
                <td>${rev.user ? rev.user.full_name : 'Verified Customer'}</td>
                <td style="color: var(--warning);">${window.ui.renderStars(rev.rating, null)}</td>
                <td style="color: var(--text-secondary); max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${rev.comment || 'No text'}</td>
                <td>${new Date(rev.created_at).toLocaleDateString()}</td>
                <td>
                    <button class="delete-review-btn btn btn-danger btn-sm" data-id="${rev.id}"><i data-lucide="trash-2"></i> Moderate</button>
                </td>
            </tr>
        `).join("");

        viewport.innerHTML = `
            <h2 style="font-size: 32px; margin-bottom: 8px;">Review Moderation</h2>
            <p style="color: var(--text-secondary); margin-bottom: 24px;">Moderate or remove abusive, fake, or inaccurate product feedback comments.</p>

            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th style="width: 80px;">ID</th>
                            <th>Product Name</th>
                            <th>Reviewer Name</th>
                            <th>Rating</th>
                            <th>Comment Text</th>
                            <th>Date Posted</th>
                            <th style="width: 130px;">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rowsHTML || '<tr><td colspan="7" style="text-align: center; color: var(--text-secondary);">No reviews submitted yet.</td></tr>'}
                    </tbody>
                </table>
            </div>
        `;

        if (window.lucide) window.lucide.createIcons();

        // Bind delete/moderation trigger
        document.querySelectorAll(".delete-review-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                const reviewId = btn.dataset.id;
                window.ui.confirm(
                    "Delete Feedback?",
                    "Are you sure you want to permanently delete this customer review comment from display?",
                    async () => {
                        try {
                            await window.api.delete(`/api/admin/reviews/${reviewId}`);
                            window.ui.toast("Moderate Action", "Customer review deleted successfully.", "success");
                            window.views.adminReviews(); // Refresh view
                        } catch (err) {
                            window.ui.toast("Action Failed", err.message, "error");
                        }
                    }
                );
            });
        });

    } catch (err) {
        viewport.innerHTML = `<p style="color: var(--danger); text-align: center; padding: 40px;">Failed to fetch reviews: ${err.message}</p>`;
    }
};

// DUMMY SHARED MODAL IMPORT (Resolves circular import context of order breakdown details)
async function showOrderDetailsModal(orderId) {
    // If showOrderDetailsModal is declared globally by orders.js, use that instead.
    if (window.showOrderDetailsModal) {
        return window.showOrderDetailsModal(orderId);
    }
    // Fallback: we import code dynamically or call window.api details
    try {
        const order = await window.api.get(`/api/orders/${orderId}`);
        const payment = order.payments[0] || {};
        
        const itemsHTML = order.items.map(item => {
            const product = item.product || { name: 'Deleted Product', images: [] };
            return `
                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed var(--border-color); font-size: 13px;">
                    <span>${product.name} x ${item.quantity}</span>
                    <span>$${(parseFloat(item.price_at_purchase) * item.quantity).toFixed(2)}</span>
                </div>
            `;
        }).join("");

        const modalOverlay = document.createElement("div");
        modalOverlay.className = "modal-overlay";
        modalOverlay.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h3 class="modal-title">Order #${order.id}</h3>
                    <button class="modal-close-btn" id="close-admin-ord-modal"><i data-lucide="x"></i></button>
                </div>
                <div class="modal-body">
                    <h4 style="font-size: 14px; font-weight: 700; margin-bottom: 8px;">Items Ordered</h4>
                    <div style="background-color: var(--bg-primary); padding: 8px 16px; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
                        ${itemsHTML}
                    </div>
                    <div style="margin-top: 14px; font-size: 13px;"><strong>Destination:</strong> ${order.shipping_address}</div>
                    <div style="margin-top: 6px; font-size: 13px;"><strong>Billing:</strong> ${order.billing_address}</div>
                    <div style="margin-top: 6px; font-size: 13px;"><strong>Transaction ID:</strong> <span style="font-family: monospace; color: var(--accent);">${payment.transaction_id || 'N/A'}</span></div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary" id="admin-ord-modal-ok">Close</button>
                </div>
            </div>
        `;
        document.body.appendChild(modalOverlay);
        if (window.lucide) window.lucide.createIcons();

        const cleanUp = () => modalOverlay.remove();
        document.getElementById("close-admin-ord-modal").addEventListener("click", cleanUp);
        document.getElementById("admin-ord-modal-ok").addEventListener("click", cleanUp);
    } catch (err) {
        window.ui.toast("Error details loading", err.message, "error");
    }
}
window.showOrderDetailsModal = showOrderDetailsModal;
