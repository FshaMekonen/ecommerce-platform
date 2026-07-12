/* NexShop REST API Client Wrapper */

const api = {
    // Helper to extract clean error message from API response
    async getErrorMessage(response) {
        try {
            const data = await response.json();
            return data.detail || "Something went wrong. Please try again.";
        } catch {
            return `HTTP Error ${response.status}: ${response.statusText}`;
        }
    },

    async request(method, path, body = null, options = {}) {
        // Build URL
        const url = path.startsWith("http") ? path : `${window.location.origin}${path}`;
        
        // Prepare default headers
        const headers = { ...options.headers };
        
        // Inject token if user is authenticated
        if (window.store && window.store.token) {
            headers["Authorization"] = `Bearer ${window.store.token}`;
        }
        
        // Prepare request body
        let requestBody = body;
        
        // Auto-configure content-type and body encoding
        if (body && !(body instanceof FormData)) {
            headers["Content-Type"] = "application/json";
            requestBody = JSON.stringify(body);
        }
        
        const fetchOptions = {
            method,
            headers,
            body: requestBody,
            ...options
        };
        
        // Trigger show loading indicator unless explicit false passed
        if (options.showLoader !== false && window.ui) {
            window.ui.showLoader();
        }
        
        try {
            const response = await fetch(url, fetchOptions);
            
            // Check session expiration
            if (response.status === 401) {
                if (window.store && window.store.token) {
                    window.store.clearUser();
                    if (window.ui) window.ui.toast("Session Expired", "Please log in again.", "warning");
                    window.location.hash = "#login";
                }
                throw new Error("Unauthorized");
            }
            
            if (!response.ok) {
                const errMsg = await this.getErrorMessage(response);
                throw new Error(errMsg);
            }
            
            // Return JSON if present, otherwise text
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                return await response.json();
            }
            return await response.text();
            
        } catch (err) {
            console.error(`API Request Error [${method} ${path}]:`, err);
            throw err;
        } finally {
            if (options.showLoader !== false && window.ui) {
                window.ui.hideLoader();
            }
        }
    },
    
    get(path, options = {}) {
        return this.request("GET", path, null, options);
    },
    
    post(path, body, options = {}) {
        return this.request("POST", path, body, options);
    },
    
    put(path, body, options = {}) {
        return this.request("PUT", path, body, options);
    },
    
    delete(path, options = {}) {
        return this.request("DELETE", path, null, options);
    }
};

window.api = api;
