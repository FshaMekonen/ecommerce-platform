/* NexShop Global State Store */

const store = {
    // 1. Initial State
    user: JSON.parse(localStorage.getItem("nexshop_user") || "null"),
    token: localStorage.getItem("nexshop_token") || null,
    cart: { items: [], total_price: 0.0 },
    
    // Observers to notify when user state changes
    listeners: [],
    
    // 2. State Actions
    setUser(user, token) {
        this.user = user;
        this.token = token;
        
        if (user) {
            localStorage.setItem("nexshop_user", JSON.stringify(user));
        } else {
            localStorage.removeItem("nexshop_user");
        }
        
        if (token) {
            localStorage.setItem("nexshop_token", token);
        } else {
            localStorage.removeItem("nexshop_token");
        }
        
        this.notify();
    },
    
    clearUser() {
        this.setUser(null, null);
        this.cart = { items: [], total_price: 0.0 };
        this.notify();
    },
    
    setCart(cartData) {
        this.cart = cartData || { items: [], total_price: 0.0 };
        this.notify();
    },
    
    // 3. Observer Hooks
    subscribe(callback) {
        this.listeners.push(callback);
        // Execute immediately with current state for initialization
        callback(this);
        return () => {
            this.listeners = this.listeners.filter(l => l !== callback);
        };
    },
    
    notify() {
        for (const listener of this.listeners) {
            try {
                listener(this);
            } catch (err) {
                console.error("Store listener error:", err);
            }
        }
    },
    
    // 4. Utility Getters
    isLoggedIn() {
        return !!this.token;
    },
    
    isAdmin() {
        return this.user && this.user.role && this.user.role.name === "admin";
    }
};

window.store = store;
