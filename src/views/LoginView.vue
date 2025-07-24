<template>
  <div class="login-page-wrapper">
    <div class="app-branding-login">
      <i class="fas fa-laptop-medical app-icon"></i>
      <span class="app-name">MedVerse Pro</span>
    </div>

    <div class="login-container">
      <div class="login-card">
        <h2>Log in to your account</h2> <p class="login-card-intro">Welcome back. Please enter your details.</p>
        <form @submit.prevent="handleLogin">
          <div class="form-group">
            <input
              type="text"
              id="username"
              v-model="username"
              placeholder=" "
              required
              autocomplete="new-password"
              name="random_username_field"
              :readonly="usernameReadonly"
              ref="usernameInput"
            />
            <div class="input-label-wrapper">
              <label for="username">Username</label>
            </div>
          </div>
          <div class="form-group">
            <input
              type="password"
              id="password"
              v-model="password"
              placeholder=" "
              required
              autocomplete="new-password"
              name="random_password_field"
              :readonly="passwordReadonly"
              ref="passwordInput"
            />
            <div class="input-label-wrapper">
              <label for="password">Password</label>
            </div>
          </div>
          <button type="submit" class="login-btn">Login</button>
        </form>
        <p v-if="loginError" class="error-message">{{ loginError }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { authStore } from '../stores/auth';
import apiClient from '../api/authApi';

const username = ref('');
const password = ref('');
const loginError = ref(null);
const router = useRouter();

const usernameReadonly = ref(true);
const passwordReadonly = ref(true);
const usernameInput = ref(null);
const passwordInput = ref(null);

onMounted(() => {
  setTimeout(() => {
    usernameReadonly.value = false;
    passwordReadonly.value = false;
  }, 10);
});

const handleLogin = async () => {
  loginError.value = null;
  try {
    const response = await apiClient.post('/api/Auth/Login', {
      username: username.value,
      password: password.value,
    });

    const token = response.data.token;

    if (token) {
      const decodedPayload = JSON.parse(atob(token.split('.')[1]));

      const userId = decodedPayload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];
      const userName = decodedPayload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'];

      let rawRole = decodedPayload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
      const userRoles = rawRole ? [rawRole] : [];

      authStore.setAuth(token, userId, userName, userRoles);

      try {
        const userDetailsResponse = await apiClient.get(`/api/Users/${userId}`);
        const userEmail = userDetailsResponse.data.email;
        authStore.setUserProfile(userEmail);
      } catch (userError) {
        console.error('Error fetching user details:', userError);
      }
      router.push('/dashboard');
    } else {
      loginError.value = 'Login failed: No token received.';
    }
  } catch (error) {
    console.error('Login error:', error);
    if (error.response && error.response.data && error.response.data.detail) {
      loginError.value = error.response.data.detail;
    } else if (error.response && error.response.data) {
      loginError.value = error.response.data.message || 'Login failed. Please check your credentials.';
    } else {
      loginError.value = 'Login failed. Please check your credentials.';
    }
  }
};
</script>

<style lang="scss" scoped>
@import "../assets/styles/_common.scss";

.login-page-wrapper {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  width: 100vw;
  background-color: $color-bg-light;
  position: relative;
}

.app-branding-login {
  position: absolute;
  top: $spacing-lg;
  left: $spacing-lg;
  display: flex;
  align-items: center;
  color: $color-text-dark;
  z-index: 10;

  .app-icon {
    font-size: 2.2em;
    margin-right: $spacing-sm;
    color: $color-primary-blue;
  }
  .app-name {
    font-size: 1.4em;
    font-weight: normal;
    color: $color-text-dark;
  }
}

.login-container {
  flex-grow: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

.login-card {
  background-color: $color-bg-white;
  // --- ADJUSTMENT: Reduce top padding of the card ---
  padding: $spacing-md $spacing-xl $spacing-xl; /* Top padding is now $spacing-md (16px) */
  border-radius: $border-radius-md;
  box-shadow: $box-shadow-md;
  width: 100%;
  max-width: 400px;
  text-align: center;

  h2 {
    color: $color-text-dark;
    // --- ADJUSTMENT: Remove default top margin for h2 ---
    margin-top: $spacing-md; /* $spacing-sm is 8px */
    // --- ADJUSTMENT: Reduce margin-bottom for h2 to bring it closer to intro text ---
    margin-bottom: $spacing-xs; /* $spacing-xs is 4px */
    font-size: 2.2em;
    font-weight: bold;
  }

  // --- ADJUSTMENT: Removed the general 'p' rule ---
  // If you have other 'p' tags in your card that need specific styling,
  // consider adding classes to them or re-evaluating this removal.
  // For the login intro, .login-card-intro is more specific.
  // p {
  //   margin-top: $spacing-sm;
  //   margin-bottom: $spacing-xl;
  //   color: $color-text-medium-grey;
  //   font-size: $spacing-md;
  // }

  .login-card-intro {
    margin-top: $spacing-sm; /* $spacing-xs is 4px */
    margin-bottom: 3rem; /* Keep this large to separate from form groups */
    color: $color-text-medium-grey;
    // --- ADJUSTMENT: Ensure font-size is consistent with $font-size-base ---
    font-size: $font-size-base;
  }

  .form-group {
    margin-bottom: $spacing-md;
    margin-top: $spacing-lg; // Added to ensure spacing between form groups
    position: relative;
    text-align: left;
    padding-bottom: $spacing-xs;
    border-bottom: 1px solid $color-border-light;
    transition: border-bottom-color 0.3s ease;

    &:focus-within {
        border-bottom-color: $color-primary-blue;
    }

    input[type="text"],
    input[type="password"] {
      width: 100%;
      padding: $spacing-xs 0;
      border: none;
      border-radius: 0;
      font-size: 1.1em;
      box-sizing: border-box;
      background-color: transparent;
      z-index: 2;
      color: $color-text-dark;
      height: calc(1.1em + ($spacing-xs * 2));
      line-height: 1.1em;
      padding-left: $spacing-md;
      padding-bottom: 0;

      &:focus {
        outline: none;
        box-shadow: none;
      }
    }

    .input-label-wrapper {
      position: absolute;
      left: $spacing-md;
      top: $spacing-xs;
      transform: translateY(0);
      pointer-events: none;
      transition: all 0.2s ease-out;
      background-color: transparent;
      padding-left: 0;
    }

    .input-label-wrapper label {
      color: $color-text-medium-grey;
      font-size: $font-size-base;
      background-color: transparent;
      white-space: nowrap;
    }

    input:focus + .input-label-wrapper,
    input:not(:placeholder-shown) + .input-label-wrapper {
      top: -$spacing-lg;
      transform: translateY(0) scale(0.8);
      z-index: 3;
      background-color: $color-bg-white;
      padding: 0 4px;
      left: 0.25rem; // Adjusted to align with input
    }

    input:focus + .input-label-wrapper label {
        color: $color-primary-blue;
    }
  }

  .login-btn {
    width: 100%;
    padding: $spacing-md;
    background-color: $color-primary-blue;
    color: $color-bg-white;
    border: none;
    border-radius: 9999px;
    font-size: 1.1em;
    font-weight: bold;
    cursor: pointer;
    transition: background-color 0.3s ease;
    margin-top: $spacing-xl;

    &:hover {
      background-color: $color-primary-blue-darker;
    }
  }

  .error-message {
    color: $color-error;
    margin-top: $spacing-md;
    font-size: 0.9em;
  }
}
</style>