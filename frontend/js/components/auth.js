/* NexShop Authentication & Profile Component Views */

if (!window.views) window.views = {};

window.views.login = () => {
    const viewport = document.getElementById("main-content");
    viewport.innerHTML = `
        <div style="max-width: 420px; margin: 40px auto; padding: 32px; background-color: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: var(--radius-lg); box-shadow: var(--shadow-lg);">
            <div style="text-align: center; margin-bottom: 24px;">
                <h2 style="font-size: 28px; margin-bottom: 8px;">Welcome Back</h2>
                <p style="color: var(--text-secondary); font-size: 14px;">Sign in to your account to continue shopping.</p>
            </div>
            
            <form id="login-form">
                <div class="form-group">
                    <label for="login-email">Email Address</label>
                    <input type="email" id="login-email" placeholder="name@domain.com" required>
                </div>
                <div class="form-group">
                    <label for="login-password">Password</label>
                    <input type="password" id="login-password" placeholder="••••••••" required>
                </div>
                <button type="submit" class="btn btn-primary w-full" style="margin-top: 12px; height: 46px;">
                    <i data-lucide="log-in"></i> Sign In
                </button>
            </form>
            
            <div style="text-align: center; margin-top: 24px; font-size: 14px; color: var(--text-secondary);">
                Don't have an account? <a href="#register" style="color: var(--accent); font-weight: 600;">Register here</a>
            </div>
        </div>
    `;
    
    if (window.lucide) window.lucide.createIcons();
    
    const form = document.getElementById("login-form");
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = document.getElementById("login-email").value.trim();
        const password = document.getElementById("login-password").value;
        
        try {
            const data = await window.api.post("/api/auth/login", {
                email,
                password,
                full_name: "placeholder"  // To pass UserCreate validation on JSON endpoint
            });
            
            window.store.setUser(data.user, data.access_token);
            
            // Sync cart
            const cart = await window.api.get("/api/cart", { showLoader: false });
            window.store.setCart(cart);
            
            window.ui.toast("Success", "Welcome back to NexShop!", "success");
            
            // Redirect based on role
            if (window.store.isAdmin()) {
                window.location.hash = "#admin-dashboard";
            } else {
                window.location.hash = "#home";
            }
        } catch (err) {
            window.ui.toast("Login Failed", err.message, "error");
        }
    });
};

window.views.register = () => {
    const viewport = document.getElementById("main-content");
    viewport.innerHTML = `
        <div style="max-width: 440px; margin: 40px auto; padding: 32px; background-color: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: var(--radius-lg); box-shadow: var(--shadow-lg);">
            <div style="text-align: center; margin-bottom: 24px;">
                <h2 style="font-size: 28px; margin-bottom: 8px;">Create Account</h2>
                <p style="color: var(--text-secondary); font-size: 14px;">Sign up today for a premium shopping experience.</p>
            </div>
            
            <form id="register-form">
                <div class="form-group">
                    <label for="reg-name">Full Name</label>
                    <input type="text" id="reg-name" placeholder="John Doe" required>
                </div>
                <div class="form-group">
                    <label for="reg-email">Email Address</label>
                    <input type="email" id="reg-email" placeholder="john@example.com" required>
                </div>
                <div class="form-group">
                    <label for="reg-password">Password</label>
                    <input type="password" id="reg-password" placeholder="At least 6 characters" minlength="6" required>
                </div>
                <button type="submit" class="btn btn-primary w-full" style="margin-top: 12px; height: 46px;">
                    <i data-lucide="user-plus"></i> Create Account
                </button>
            </form>
            
            <div style="text-align: center; margin-top: 24px; font-size: 14px; color: var(--text-secondary);">
                Already have an account? <a href="#login" style="color: var(--accent); font-weight: 600;">Sign In</a>
            </div>
        </div>
    `;
    
    if (window.lucide) window.lucide.createIcons();
    
    const form = document.getElementById("register-form");
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const full_name = document.getElementById("reg-name").value.trim();
        const email = document.getElementById("reg-email").value.trim();
        const password = document.getElementById("reg-password").value;
        
        try {
            await window.api.post("/api/auth/register", {
                email,
                full_name,
                password
            });
            
            window.ui.toast("Registered!", "Your account has been created. Please log in.", "success");
            window.location.hash = "#login";
        } catch (err) {
            window.ui.toast("Registration Failed", err.message, "error");
        }
    });
};

window.views.profile = () => {
    const user = window.store.user;
    if (!user) {
        window.location.hash = "#login";
        return;
    }
    
    const viewport = document.getElementById("main-content");
    viewport.innerHTML = `
        <h2 style="font-size: 32px; margin-bottom: 8px;">My Profile</h2>
        <p style="color: var(--text-secondary); margin-bottom: 32px;">Manage your account details and profile picture.</p>
        
        <div class="dashboard-layout">
            <!-- Details Column -->
            <div class="dashboard-card">
                <h3 class="dashboard-card-title">Edit Details</h3>
                <form id="profile-form">
                    <div class="form-group">
                        <label for="prof-name">Full Name</label>
                        <input type="text" id="prof-name" value="${user.full_name}" required>
                    </div>
                    <div class="form-group">
                        <label for="prof-email">Email Address</label>
                        <input type="email" id="prof-email" value="${user.email}" required>
                    </div>
                    <div class="form-group">
                        <label for="prof-password">New Password (leave blank to keep current)</label>
                        <input type="password" id="prof-password" placeholder="••••••••" minlength="6">
                    </div>
                    <button type="submit" class="btn btn-primary" style="margin-top: 10px;">
                        <i data-lucide="save"></i> Save Changes
                    </button>
                </form>
            </div>
            
            <!-- Avatar Column -->
            <div class="dashboard-card" style="text-align: center;">
                <h3 class="dashboard-card-title" style="justify-content: center;">Profile Image</h3>
                <div style="margin-bottom: 20px;">
                    <img id="profile-avatar-large" src="${user.profile_image || "/uploads/profiles/default-avatar.png"}" 
                         style="width: 140px; height: 140px; border-radius: 50%; object-fit: cover; border: 4px solid var(--border-color);" alt="Profile">
                </div>
                <div class="form-group">
                    <input type="file" id="profile-img-file" accept="image/png, image/jpeg, image/webp" style="display: none;">
                    <button class="btn btn-secondary w-full" id="upload-avatar-trigger">
                        <i data-lucide="upload"></i> Select Photo
                    </button>
                    <p style="font-size: 11px; color: var(--text-secondary); margin-top: 6px;">JPEG, PNG or WebP. Max 2MB.</p>
                </div>
            </div>
        </div>
    `;
    
    if (window.lucide) window.lucide.createIcons();
    
    // Bind Details Edit
    const detailsForm = document.getElementById("profile-form");
    detailsForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const full_name = document.getElementById("prof-name").value.trim();
        const email = document.getElementById("prof-email").value.trim();
        const password = document.getElementById("prof-password").value || null;
        
        try {
            const updatedUser = await window.api.put("/api/users/profile", {
                full_name,
                email,
                password
            });
            
            // Retain token in store
            window.store.setUser(updatedUser, window.store.token);
            window.ui.toast("Saved!", "Your profile details have been updated.", "success");
        } catch (err) {
            window.ui.toast("Update Failed", err.message, "error");
        }
    });
    
    // Bind Avatar Upload
    const fileInput = document.getElementById("profile-img-file");
    const uploadTrigger = document.getElementById("upload-avatar-trigger");
    const avatarPreview = document.getElementById("profile-avatar-large");
    const headerAvatar = document.getElementById("header-profile-img");
    
    if (uploadTrigger && fileInput) {
        uploadTrigger.addEventListener("click", () => fileInput.click());
        
        fileInput.addEventListener("change", async () => {
            if (fileInput.files.length === 0) return;
            const file = fileInput.files[0];
            
            // client-side validation
            if (file.size > 2 * 1024 * 1024) {
                window.ui.toast("Error", "File size exceeds 2MB.", "error");
                return;
            }
            
            const formData = new FormData();
            formData.append("file", file);
            
            try {
                const res = await window.api.post("/api/users/profile/image", formData);
                
                // Update local previews
                avatarPreview.src = res.profile_image;
                if (headerAvatar) headerAvatar.src = res.profile_image;
                
                // Update user details in store
                const updatedUser = { ...window.store.user, profile_image: res.profile_image };
                window.store.setUser(updatedUser, window.store.token);
                
                window.ui.toast("Uploaded!", "Your profile image has been changed.", "success");
            } catch (err) {
                window.ui.toast("Upload Failed", err.message, "error");
            }
        });
    }
};
