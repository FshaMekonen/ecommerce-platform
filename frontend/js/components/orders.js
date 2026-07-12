/* NexShop Customer Orders History View */

if (!window.views) window.views = {};

// 1. MAIN ORDERS LOG VIEW
window.views.orders = async () => {
    const viewport = document.getElementById("main-content");
    viewport.innerHTML = `<div>Refreshing order logs...</div>`;

    try {
        const orders = await window.api.get("/api/orders");

        if (orders.length === 0) {
            viewport.innerHTML = `
                <div style="text-align: center; padding: 80px 20px;">
                    <i data-lucide="package" style="width: 80px; height: 80px; color: var(--text-secondary); margin-bottom: 24px; stroke-width: 1.5px;"></i>
                    <h2 style="font-size: 24px; margin-bottom: 12px;">No Orders Placed Yet</h2>
                    <p style="color: var(--text-secondary); margin-bottom: 32px; max-width: 420px; margin-inline: auto;">You haven't checked out any orders. Browse the catalog to place your first order!</p>
                    <a href="#products" class="btn btn-primary"><i data-lucide="shopping-bag"></i> Shop Now</a>
                </div>
            `;
            if (window.lucide) window.lucide.createIcons();
            return;
        }

        const tableRowsHTML = orders.map(ord => {
            const dateStr = new Date(ord.created_at).toLocaleDateString(undefined, {
                year: 'numeric', month: 'short', day: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });
            
            // Resolve payment status / method
            const payment = ord.payments[0] || {};
            const payMethod = payment.payment_method === 'credit_card' ? 'Visa/MC' : 'PayPal';
            
            // Style order status badges
            let badgeClass = "badge-warning";
            if (ord.status === "paid" || ord.status === "delivered") badgeClass = "badge-success";
            if (ord.status === "shipped") badgeClass = "badge-accent";
            if (ord.status === "cancelled") badgeClass = "badge-danger";
            
            return `
                <tr>
                    <td style="font-family: var(--font-heading); font-weight: 700; color: var(--accent);">#ORD-${ord.id}</td>
                    <td style="color: var(--text-secondary);">${dateStr}</td>
                    <td style="font-weight: 600;">$${parseFloat(ord.total_amount).toFixed(2)}</td>
                    <td style="text-transform: capitalize;">${payMethod}</td>
                    <td>
                        <span class="badge ${badgeClass}" style="text-transform: uppercase; font-size: 10px;">${ord.status}</span>
                    </td>
                    <td>
                        <button class="view-order-details-btn btn btn-secondary btn-sm" data-id="${ord.id}">
                            <i data-lucide="eye" style="width: 14px; height: 14px;"></i> Details
                        </button>
                    </td>
                </tr>
            `;
        }).join("");

        viewport.innerHTML = `
            <h2 style="font-size: 32px; margin-bottom: 8px;">Order History</h2>
            <p style="color: var(--text-secondary); margin-bottom: 32px;">Track shipment updates and review historical purchase details.</p>

            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Order ID</th>
                            <th>Date / Time</th>
                            <th>Total Amount</th>
                            <th>Payment Method</th>
                            <th>Order Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRowsHTML}
                    </tbody>
                </table>
            </div>
        `;

        if (window.lucide) window.lucide.createIcons();

        // Bind View Details button clicks
        document.querySelectorAll(".view-order-details-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                const orderId = btn.dataset.id;
                showOrderDetailsModal(orderId);
            });
        });

    } catch (err) {
        viewport.innerHTML = `<p style="color: var(--danger); text-align: center; padding: 40px;">Failed to fetch order history: ${err.message}</p>`;
    }
};

// 2. HELPER TO SHOW SPECIFIC ORDER BREAKDOWN IN MODAL
async function showOrderDetailsModal(orderId) {
    try {
        const order = await window.api.get(`/api/orders/${orderId}`);
        const payment = order.payments[0] || {};
        
        const itemsHTML = order.items.map(item => {
            const product = item.product || { name: 'Deleted Product', images: [] };
            const primaryImage = product.images.find(img => img.is_primary) || product.images[0];
            const imageSrc = primaryImage ? primaryImage.image_url : "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100";
            
            return `
                <div style="display: flex; gap: 14px; align-items: center; padding: 12px 0; border-bottom: 1px dashed var(--border-color);">
                    <img src="${imageSrc}" style="width: 50px; height: 50px; border-radius: var(--radius-sm); object-fit: cover; border: 1px solid var(--border-color);" alt="${product.name}">
                    <div style="flex: 1;">
                        <span style="font-weight: 600; font-size: 14px;">${product.name}</span>
                        <div style="color: var(--text-secondary); font-size: 12px; margin-top: 2px;">
                            $${parseFloat(item.price_at_purchase).toFixed(2)} each x ${item.quantity}
                        </div>
                    </div>
                    <div style="font-weight: 700;">
                        $${(parseFloat(item.price_at_purchase) * item.quantity).toFixed(2)}
                    </div>
                </div>
            `;
        }).join("");

        const modalOverlay = document.createElement("div");
        modalOverlay.className = "modal-overlay";
        modalOverlay.innerHTML = `
            <div class="modal modal-lg">
                <div class="modal-header">
                    <h3 class="modal-title" style="display: flex; align-items: center; gap: 8px;">
                        <i data-lucide="receipt" style="color: var(--accent);"></i>
                        Order Breakdown #ORD-${order.id}
                    </h3>
                    <button class="modal-close-btn" id="close-order-modal"><i data-lucide="x"></i></button>
                </div>
                <div class="modal-body" style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; align-items: start; max-height: 75vh;">
                    <!-- Left: Purchased items list -->
                    <div>
                        <h4 style="font-size: 15px; font-weight: 700; margin-bottom: 12px; color: var(--text-primary); text-transform: uppercase;">Items Ordered</h4>
                        <div style="border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 0 16px; background-color: var(--bg-primary);">
                            ${itemsHTML}
                        </div>
                        <div style="display: flex; justify-content: space-between; font-weight: 700; font-size: 16px; margin-top: 16px; padding: 0 4px;">
                            <span>Grand Total:</span>
                            <span style="color: var(--accent);">$${parseFloat(order.total_amount).toFixed(2)}</span>
                        </div>
                    </div>
                    
                    <!-- Right: Address and payment logs -->
                    <div style="display: flex; flex-direction: column; gap: 20px;">
                        <div>
                            <h4 style="font-size: 14px; font-weight: 700; margin-bottom: 6px; color: var(--text-secondary); text-transform: uppercase;">Shipping Destination</h4>
                            <p style="background-color: var(--bg-primary); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 12px; font-size: 13px;">${order.shipping_address}</p>
                        </div>
                        <div>
                            <h4 style="font-size: 14px; font-weight: 700; margin-bottom: 6px; color: var(--text-secondary); text-transform: uppercase;">Billing Address</h4>
                            <p style="background-color: var(--bg-primary); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 12px; font-size: 13px;">${order.billing_address}</p>
                        </div>
                        <div>
                            <h4 style="font-size: 14px; font-weight: 700; margin-bottom: 6px; color: var(--text-secondary); text-transform: uppercase;">Transaction Info</h4>
                            <div style="background-color: var(--bg-primary); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 12px; font-size: 13px; display: flex; flex-direction: column; gap: 4px;">
                                <div><strong>Transaction ID:</strong> <span style="font-family: monospace; color: var(--accent);">${payment.transaction_id || 'N/A'}</span></div>
                                <div><strong>Method:</strong> <span style="text-transform: capitalize;">${payment.payment_method || 'Simulation'}</span></div>
                                <div><strong>Payment Status:</strong> <span class="badge badge-success" style="text-transform: uppercase; font-size: 9px; padding: 2px 6px;">${payment.status || 'Completed'}</span></div>
                                <div style="margin-top: 4px; font-size: 11px; color: var(--text-secondary);">Processed: ${new Date(payment.created_at || order.created_at).toLocaleString()}</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary" id="order-modal-ok">Close</button>
                </div>
            </div>
        `;

        document.body.appendChild(modalOverlay);
        if (window.lucide) window.lucide.createIcons();

        const cleanUp = () => modalOverlay.remove();
        document.getElementById("close-order-modal").addEventListener("click", cleanUp);
        document.getElementById("order-modal-ok").addEventListener("click", cleanUp);

    } catch (err) {
        window.ui.toast("Error details loading", err.message, "error");
    }
}
