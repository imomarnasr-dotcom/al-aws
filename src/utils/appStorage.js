/**
 * AppStorage: A completely synchronous, in-memory drop-in replacement for localStorage.
 * It bypasses the 5MB browser limit by storing data in RAM.
 * CloudSyncV3 will be responsible for syncing this memory to Firebase Collections.
 */

const originalLocalStorage = window.localStorage;

class AppStorage {
  constructor() {
    this.data = {};
    // Fallback for non-synced items (like theme, local settings)
    this.localFallbackKeys = [
      'moo_theme_color', 
      'moo_compact_mode', 
      'moo_last_login',
      'moo_local_preferences',
      'moo_auto_attendance_enabled'
    ];

    // Preload everything from the real localStorage to prevent data loss on first migration
    try {
      for (let i = 0; i < originalLocalStorage.length; i++) {
        const key = originalLocalStorage.key(i);
        if (key && !this.localFallbackKeys.includes(key)) {
          this.data[key] = originalLocalStorage.getItem(key);
        }
      }
    } catch (e) {
      console.warn("Failed to preload from localStorage", e);
    }
  }

  getItem(key) {
    if (this.localFallbackKeys.includes(key)) {
      return originalLocalStorage.getItem(key);
    }
    const val = this.data[key];
    return val === undefined ? null : val;
  }

  setItem(key, value, silent = false) {
    if (this.localFallbackKeys.includes(key)) {
      originalLocalStorage.setItem(key, value);
      return;
    }
    
    // Convert to string to perfectly emulate localStorage behavior
    this.data[key] = String(value);
    
    // Emulate window 'storage' event which components might rely on
    if (!silent) {
      window.dispatchEvent(new Event('storage'));
      // Custom event for our app to force syncs
      window.dispatchEvent(new CustomEvent('appStorage-updated', { detail: { key, value } }));
    }
  }

  removeItem(key, silent = false) {
    if (this.localFallbackKeys.includes(key)) {
      originalLocalStorage.removeItem(key);
      return;
    }
    delete this.data[key];
    if (!silent) {
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('appStorage-updated', { detail: { key, value: null } }));
    }
  }

  clear() {
    this.data = {};
    window.dispatchEvent(new Event('storage'));
  }

  // Utility for CloudSyncV3 to populate memory during startup without triggering events
  seed(key, value) {
    this.setItem(key, value, true);
  }
}

const appStorage = new AppStorage();

// Safely override the global localStorage object so components don't need code changes
try {
  Object.defineProperty(window, 'localStorage', {
    value: appStorage,
    configurable: true,
    enumerable: true,
    writable: false
  });
} catch (e) {
  console.warn("Could not redefine window.localStorage. Components might need explicit appStorage imports.");
}

export default appStorage;
