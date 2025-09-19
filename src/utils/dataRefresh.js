// Global data refresh utility
class DataRefreshManager {
    constructor() {
        this.refreshCallbacks = new Set();
    }

    // Register a component's refresh function
    registerRefreshCallback(callback) {
        this.refreshCallbacks.add(callback);
    }

    // Unregister a component's refresh function
    unregisterRefreshCallback(callback) {
        this.refreshCallbacks.delete(callback);
    }

    // Trigger refresh for all registered components
    refreshAll() {
        this.refreshCallbacks.forEach(callback => {
            try {
                callback();
            } catch (error) {
                console.error('Error refreshing component:', error);
            }
        });
    }

    // Get current timestamp for cache busting
    getCacheBuster() {
        return `?t=${Date.now()}`;
    }
}

// Create singleton instance
const dataRefreshManager = new DataRefreshManager();

export default dataRefreshManager;
