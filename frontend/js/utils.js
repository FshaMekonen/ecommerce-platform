/* NexShop UI Utility Helpers (Toasts, Loaders, Dialogs, Ratings, Offline SVGs) */

const ui = {
    // 1. Offline SVG Icon Library
    icon(name, className = "", size = 20) {
        const icons = {
            "shopping-bag": `<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>`,
            "shopping-cart": `<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>`,
            "home": `<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>`,
            "grid": `<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>`,
            "package": `<path d="M16.5 9.4 7.55 4.24a1.79 1.79 0 0 0-1.78 0L2.5 6.07a1.79 1.79 0 0 0-.89 1.56v5.27c0 .64.34 1.22.89 1.55l3.27 1.83a1.79 1.79 0 0 0 1.78 0L21.5 12.3c.55-.33.89-.91.89-1.55V5.5c0-.64-.34-1.22-.89-1.55L18.28 2.1c-.55-.33-1.18-.33-1.78 0L12.5 4.5"/><path d="M2.5 7.6 12 12.9l9.5-5.3"/><path d="M12 22v-9.1"/>`,
            "user": `<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>`,
            "bar-chart-2": `<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>`,
            "boxes": `<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="M3.27 6.96 12 12.01l8.73-5.05"/><path d="M12 22.08V12"/>`,
            "tags": `<path d="M9 5H2v7l9 9a2.5 2.5 0 0 0 3.5 0l5-5a2.5 2.5 0 0 0 0-3.5z"/><path d="m22 9-9-9"/><path d="M6 8h.01"/>`,
            "receipt": `<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M6 8h12"/><path d="M6 12h12"/><path d="M6 16h10"/>`,
            "users": `<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>`,
            "message-square": `<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>`,
            "log-in": `<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>`,
            "log-out": `<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>`,
            "settings": `<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>`,
            "clipboard-list": `<rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/>`,
            "sun": `<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>`,
            "moon": `<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>`,
            "edit": `<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>`,
            "image": `<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>`,
            "trash-2": `<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>`,
            "search": `<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>`,
            "plus": `<path d="M5 12h14"/><path d="M12 5v14"/>`,
            "x": `<path d="M18 6 6 18"/><path d="M6 6 18 18"/>`,
            "eye": `<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0z"/><circle cx="12" cy="12" r="3"/>`,
            "arrow-left": `<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>`,
            "arrow-right": `<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>`,
            "star": `<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>`,
            "sliders": `<line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="2" y1="14" x2="6" y2="14"/><line x1="10" y1="8" x2="14" y2="8"/><line x1="18" y1="16" x2="22" y2="16"/>`,
            "shield-check": `<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>`,
            "check-circle": `<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>`,
            "alert-circle": `<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>`,
            "alert-triangle": `<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>`,
            "alert-octagon": `<polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>`,
            "sparkles": `<path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275Z"/><path d="m5 3 1 2.5L8.5 6 6 7 5 9.5 4 7 1.5 6 4 5Z"/><path d="m19 17 1 2.5 2.5.5-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1Z"/>`,
            "tag": `<path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"/><path d="M7 7h.01"/>`,
            "check-square": `<polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>`,
            "send": `<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>`,
            "plus-circle": `<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>`
        };
        const path = icons[name] || "";
        if (!path) return "";
        return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-${name} ${className}">${path}</svg>`;
    },

    // 2. Toast Notification System
    toast(title, desc, type = "info") {
        const container = document.getElementById("toast-container");
        if (!container) return;
        
        const toast = document.createElement("div");
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            ${this.icon(type === "success" ? "check-circle" : type === "error" ? "alert-circle" : type === "warning" ? "alert-triangle" : "info", "toast-icon")}
            <div class="toast-body">
                <div class="toast-title">${title}</div>
                <div class="toast-desc">${desc}</div>
            </div>
            <button class="toast-close">${this.icon("x")}</button>
        `;
        
        container.appendChild(toast);
        
        // Setup close button click
        toast.querySelector(".toast-close").addEventListener("click", () => {
            toast.style.opacity = "0";
            toast.style.transform = "translateX(24px) scale(0.95)";
            setTimeout(() => toast.remove(), 200);
        });
        
        // Autoclose after 4 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.style.opacity = "0";
                toast.style.transform = "translateX(24px) scale(0.95)";
                setTimeout(() => toast.remove(), 200);
            }
        }, 4000);
    },
    
    // 3. Global Loading Spinner Controls
    showLoader() {
        const loader = document.getElementById("loading-overlay");
        if (loader) loader.classList.remove("hidden");
    },
    
    hideLoader() {
        const loader = document.getElementById("loading-overlay");
        if (loader) loader.classList.add("hidden");
    },
    
    // 4. Custom Confirmation Modal Dialog
    confirm(title, message, onConfirm, onCancel = null) {
        const overlay = document.createElement("div");
        overlay.className = "modal-overlay";
        overlay.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h3 class="modal-title">${title}</h3>
                    <button class="btn-icon modal-cancel" style="background:none; border:none; color:var(--text-secondary); cursor:pointer;">${this.icon("x")}</button>
                </div>
                <div class="modal-body">
                    <p style="color: var(--text-secondary);">${message}</p>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary modal-cancel">Cancel</button>
                    <button class="btn btn-primary modal-confirm">Confirm</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        const closeModal = () => overlay.remove();
        
        overlay.querySelectorAll(".modal-cancel").forEach(btn => {
            btn.addEventListener("click", () => {
                closeModal();
                if (onCancel) onCancel();
            });
        });
        
        overlay.querySelector(".modal-confirm").addEventListener("click", () => {
            closeModal();
            onConfirm();
        });
    },
    
    // 5. Rating Star Renderer (returns string HTML)
    renderStars(rating = 0, count = 0) {
        const activeRating = rating || 0;
        let starsHTML = '<div class="stars-container">';
        
        for (let i = 1; i <= 5; i++) {
            const isFilled = i <= Math.round(activeRating);
            starsHTML += `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="${isFilled ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="star-icon ${isFilled ? 'filled' : ''}"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
        }
        starsHTML += "</div>";
        
        if (count !== undefined && count !== null) {
            starsHTML += `<span class="rating-count">(${count})</span>`;
        }
        
        return starsHTML;
    }
};

// 6. OVERRIDE LUCIDE TO RUN OFFLINE-FIRST
const createIcons = (options = {}) => {
    const elements = document.querySelectorAll("[data-lucide]");
    elements.forEach(el => {
        const name = el.getAttribute("data-lucide");
        const className = el.getAttribute("class") || "";
        const size = el.getAttribute("width") || el.getAttribute("height") || (el.tagName === "I" ? 20 : 24);
        
        const svgString = ui.icon(name, className, size);
        if (svgString) {
            const tempDiv = document.createElement("div");
            tempDiv.innerHTML = svgString;
            const svgEl = tempDiv.firstChild;
            
            // Transfer other attributes (like id, title, style, etc.)
            for (let i = 0; i < el.attributes.length; i++) {
                const attr = el.attributes[i];
                if (attr.name !== "data-lucide" && attr.name !== "class" && attr.name !== "width" && attr.name !== "height") {
                    svgEl.setAttribute(attr.name, attr.value);
                }
            }
            
            el.parentNode.replaceChild(svgEl, el);
        }
    });
};

window.lucide = { createIcons };
window.ui = ui;
