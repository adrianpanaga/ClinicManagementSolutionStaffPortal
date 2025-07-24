// src/stores/auth.js
import { reactive, watchEffect } from 'vue';

export const authStore = reactive({
  isAuthenticated: false,
  userId: null,
  username: null,
  userRoles: [], // Always initialize as an empty array

  setAuth(token, userId, username, roles) {
    localStorage.setItem('jwtToken', token);
    localStorage.setItem('userId', userId);
    localStorage.setItem('username', username);
    // Ensure roles is always an array before stringifying. If null/undefined, default to empty array.
    localStorage.setItem('userRoles', JSON.stringify(roles || []));

    this.isAuthenticated = true;
    this.userId = userId;
    this.username = username;
    this.userRoles = roles || []; // Ensure it's set as an array here too
    console.log("authStore.setAuth: Roles being stored:", roles); // ADD THIS LOG
    console.log("authStore setAuth called. isAuthenticated:", this.isAuthenticated, "Roles:", this.userRoles);
  },

  setUserProfile(email) {
    this.userEmail = email;
    localStorage.setItem('userEmail', email); // Store email in local storage
    console.log("authStore.setUserProfile: Email updated:", email);
  },

  clearAuth() {
    localStorage.removeItem('jwtToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    localStorage.removeItem('userRoles');
     localStorage.removeItem('userEmail'); // Clear email on logout

    this.isAuthenticated = false;
    this.userId = null;
    this.username = null;
    this.userRoles = []; // Ensure it's an empty array on clear
  },

  initAuth() {
    const token = localStorage.getItem('jwtToken');
    const storedUserId = localStorage.getItem('userId');
    const storedUsername = localStorage.getItem('username');
    const storedRoles = localStorage.getItem('userRoles'); // Get the string from localStorage
    const storedUserEmail = localStorage.getItem('userEmail'); // Retrieve email


    console.log("authStore.initAuth: Raw storedRoles from localStorage:", storedRoles); // ADD THIS LOG

    if (token && storedUserId && storedUsername) { // Only proceed if core info is present
      this.isAuthenticated = true;
      this.userId = storedUserId;
      this.username = storedUsername;
      this.userEmail = storedUserEmail || null; // Set email, default to null if not found
      try {
        // Parse, but if storedRoles is null/undefined/invalid, default to empty array
        this.userRoles = storedRoles ? JSON.parse(storedRoles) : [];
        console.log("authStore.initAuth: Parsed userRoles:", this.userRoles); // ADD THIS LOG
      } catch (e) {
        console.error("Error parsing user roles from localStorage (caught in initAuth):", e);

        this.userRoles = []; // Fallback to empty array on parse error
      }
    } else {
      // If token or other core info is missing/invalid, clear everything.
      this.clearAuth();
    }
    console.log("authStore initialized. isAuthenticated:", this.isAuthenticated, "Roles:", this.userRoles);
  }
});

// Immediately initialize when the module is loaded
authStore.initAuth();