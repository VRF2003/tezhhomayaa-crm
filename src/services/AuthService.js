/**
 * AuthService - Placeholder
 * This service will manage User Authentication (Firebase Auth) and role permissions.
 */

export const AuthService = {
  async login(email, password) {
    // throw new Error("Not implemented");
  },
  
  async logout() {
    // throw new Error("Not implemented");
  },
  
  getCurrentUser() {
    return null;
  },
  
  hasPermission(role) {
    return true; // default true for now
  }
};
