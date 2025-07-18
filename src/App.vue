<template>
  <div id="app-container">
    <header class="app-header">
      <router-link to="/dashboard" class="app-title-link">
        <h1>Clinic Staff Portal</h1>
      </router-link>
      <nav v-if="authStore.isAuthenticated">
        <router-link to="/dashboard">Dashboard</router-link>
        <router-link v-if="authStore.userRoles.includes('Admin')"
                     to="/admin">Admin</router-link>
        <router-link v-if="authStore.userRoles.includes('Receptionist')"
                     to="/receptionist">Receptionist</router-link>
        <router-link v-if="authStore.userRoles.includes('Nurse')"
                     to="/nurse">Nurse</router-link>
        <router-link v-if="authStore.userRoles.includes('Doctor')"
                     to="/doctor">Doctor</router-link>
        <router-link v-if="authStore.userRoles.includes('LabTech')"
                     to="/lab-tech">Lab Tech</router-link>
        <button @click="handleLogout" class="btn btn-secondary logout-btn">
          <font-awesome-icon :icon="['fas', 'right-from-bracket']" class="icon" />
          Logout
        </button>
      </nav>
    </header>
    <main class="app-main">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { ref, watchEffect } from 'vue';
import { useRouter } from 'vue-router';
import { authStore } from './stores/auth.js'; // Import the auth store

const router = useRouter();

// Add a watchEffect to see what roles App.vue is reacting to
watchEffect(() => {
  console.log("App.vue: Current roles from authStore:", authStore.userRoles);
});

const handleLogout = () => {
  authStore.clearAuth(); // Use the authStore to clear state
  setTimeout(() => {
    router.push({ name: 'login' });
  }, 50); // A small delay, e.g., 50 milliseconds
  router.push({ name: 'login' });
};
</script>

<style lang="scss">
@import './assets/styles/_variables.scss';

#app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.app-header {
  background-color: $color-bg-white;
  padding: 1rem $spacing-lg; // Add horizontal padding
  border-bottom: 1px solid $color-border-darker;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: $box-shadow-sm; // Subtle shadow for header

  .app-title-link {
    text-decoration: none; // Remove underline from link
  }

  h1 {
    margin: 0;
    color: $color-primary-blue;
    font-size: 1.5rem;
  }

  nav a {
    margin-left: 1rem;
    text-decoration: none;
    color: $color-primary-blue;
    font-weight: bold;
    padding: 0.5rem 0.75rem;
    border-radius: $border-radius-sm;
    transition: background-color 0.2s ease;

    &:hover {
      background-color: lighten($color-primary-blue, 40%);
    }

    &.router-link-active {
      background-color: $color-primary-blue;
      color: $color-bg-white;
    }
  }

  .logout-btn {
    margin-left: 1rem;
    background-color: $color-secondary-grey; // Use secondary grey for logout
    color: $color-bg-white;

    &:hover {
      background-color: $color-secondary-grey-darker;
    }
  }
}

.app-main {
  flex-grow: 1;
  padding: $spacing-lg;
  background-color: $color-bg-light;
}
</style>