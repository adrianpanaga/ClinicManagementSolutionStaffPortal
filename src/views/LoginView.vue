<template>
  <div class="login-container">
    <div class="login-card">
      <h2 class="login-title">Staff Portal Login</h2>
      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label for="username">Username or Email</label>
          <input
            type="text"
            id="username"
            v-model="username"
            class="form-control"
            placeholder="Enter your username or email"
            required
          />
        </div>
        <div class="form-group">
          <label for="password">Password</label>
          <input
            type="password"
            id="password"
            v-model="password"
            class="form-control"
            placeholder="Enter your password"
            required
          />
        </div>
        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>
        <button type="submit" class="btn btn-primary login-btn">
          <font-awesome-icon :icon="['fas', 'right-to-bracket']" class="icon" />
          Login
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';
import { authStore } from '../stores/auth.js'; // Import the auth store

const username = ref('');
const password = ref('');
const errorMessage = ref('');
const router = useRouter();

const API_BASE_URL = 'https://localhost:7215'; // !!! CONFIRM THIS IS YOUR CORRECT BACKEND URL !!!

const handleLogin = async () => {
  errorMessage.value = '';

  try {
    const response = await axios.post(`${API_BASE_URL}/api/Auth/Login`, {
      username: username.value,
      password: password.value,
    });

    if (response.data && response.data.token) {
      // Use the authStore to set the authentication state
      authStore.setAuth(
        response.data.token,
        response.data.userId,
        response.data.username,
        response.data.roles
      );

      router.push({ name: 'dashboard' });
    } else {
      errorMessage.value = 'Login failed: No token received from server.';
    }
  } catch (error) {
    console.error('Login error:', error);
    if (error.response) {
      if (error.response.status === 401) {
        errorMessage.value = 'Invalid username or password.';
      } else if (error.response.data && error.response.data.detail) {
        errorMessage.value = error.response.data.detail;
      } else {
        errorMessage.value = `Server error: ${error.response.status} - ${error.response.statusText}`;
      }
    } else if (error.request) {
      errorMessage.value = 'Network error: Could not connect to the API server.';
    } else {
      errorMessage.value = 'An unexpected client-side error occurred during login.';
    }
  }
};
</script>

<style lang="scss" scoped>
@import '../assets/styles/_variables.scss'; // Import variables for this component

.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 80px); // Adjust based on header height if needed
  background-color: $color-bg-light; // Use a light background for the login page
}

.login-card {
  background-color: $color-bg-white;
  padding: $spacing-xl;
  border-radius: $border-radius-lg;
  box-shadow: $box-shadow-md;
  width: 100%;
  max-width: 400px;
  text-align: center;
}

.login-title {
  color: $color-primary-blue;
  margin-bottom: $spacing-lg;
  font-size: 1.8rem;
}

.login-form {
  display: flex;
  flex-direction: column;
}

.form-group {
  margin-bottom: $spacing-md;
  text-align: left;

  label {
    display: block;
    margin-bottom: $spacing-xs;
    font-weight: bold;
    color: $color-text-dark;
  }

  .form-control {
    width: 100%;
    padding: $spacing-sm;
    border: 1px solid $color-border-medium;
    border-radius: $border-radius-sm;
    box-sizing: border-box; // Ensure padding and border are included in the element's total width and height

    &:focus {
      outline: none;
      border-color: $color-primary-blue;
      box-shadow: 0 0 0 0.2rem rgba($color-primary-blue, 0.25);
    }
  }
}

.error-message {
  color: $color-error;
  background-color: lighten($color-error, 40%);
  border: 1px solid $color-error;
  border-radius: $border-radius-sm;
  padding: $spacing-sm;
  margin-bottom: $spacing-md;
  text-align: center;
}

.login-btn {
  width: 100%;
  padding: $spacing-md;
  font-size: 1.1rem;
  margin-top: $spacing-sm;
}
</style>