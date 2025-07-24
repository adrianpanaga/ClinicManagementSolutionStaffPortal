<!-- src/App.vue -->
<template>
  <div id="app" class="app-layout" v-if="authStore.isAuthenticated">
    <!-- Left Navigation Pane (Sidebar) -->
    <aside class="sidebar">
      <div class="app-branding">
        <i class="fas fa-laptop-medical app-icon"></i>
        <span class="app-name">MedVerse Pro</span>
      </div>

      <nav class="main-nav">
        <!-- Dashboard links - prioritize highest role or show relevant ones -->
        <router-link v-if="hasRole(['Admin'])" to="/admin">
          <i class="fas fa-tachometer-alt"></i> Admin Dashboard
        </router-link>
        <router-link v-if="hasRole(['Receptionist'])" to="/receptionist">
          <i class="fas fa-calendar-alt"></i> Receptionist Dashboard
        </router-link>
        <router-link v-if="hasRole(['Nurse'])" to="/nurse">
          <i class="fas fa-user-md"></i> Nurse Dashboard
        </router-link>
        <router-link v-if="hasRole(['Doctor'])" to="/doctor">
          <i class="fas fa-stethoscope"></i> Doctor Dashboard
        </router-link>
        <router-link v-if="hasRole(['LabTechnician'])" to="/lab-tech">
          <i class="fas fa-flask"></i> Lab Technician Dashboard
        </router-link>
        <router-link v-if="hasRole(['InventoryManager', 'Admin'])" to="/inventory">
          <i class="fas fa-boxes"></i> Inventory Manager Dashboard
        </router-link>

        <hr class="nav-divider" v-if="hasAnyRole(['Admin', 'Receptionist', 'Doctor', 'Nurse', 'LabTechnician', 'InventoryManager'])" />

        <!-- General Module Links - accessible by multiple roles -->
        <router-link v-if="hasRole(['Admin', 'Receptionist', 'Doctor', 'Nurse', 'LabTechnician'])" to="/patients">
          <i class="fas fa-users"></i> Patients
        </router-link>
        <router-link v-if="hasRole(['Admin', 'Receptionist', 'Doctor', 'Nurse'])" to="/appointments">
          <i class="fas fa-calendar-check"></i> Appointments
        </router-link>
        <router-link v-if="hasRole(['Admin', 'Doctor', 'Nurse'])" to="/medical-records">
          <i class="fas fa-file-medical"></i> Medical Records
        </router-link>
        <router-link v-if="hasRole(['Admin', 'LabTechnician', 'Doctor'])" to="/lab-results">
          <i class="fas fa-vial"></i> Lab Results
        </router-link>
        <router-link v-if="hasRole(['Admin', 'InventoryManager'])" to="/inventory/items">
          <i class="fas fa-warehouse"></i> All Inventory Items
        </router-link>
        <router-link v-if="hasRole(['Admin', 'InventoryManager'])" to="/inventory/transactions">
          <i class="fas fa-exchange-alt"></i> Stock Log
        </router-link>
        <router-link v-if="hasRole(['Admin'])" to="/users">
          <i class="fas fa-users-cog"></i> User Management
        </router-link>
        <!-- Add more links as needed for other sections -->
      </nav>

      <!-- Updated User Profile Section with Dropdown -->
      <div class="user-profile-wrapper">
        <div class="user-profile-summary">
          <div class="user-avatar">{{ authStore.username ? authStore.username.charAt(0).toUpperCase() : '?' }}</div>
          <div class="user-details-summary">
            <div class="username-summary">{{ authStore.username || 'Staff User' }}</div>
            <div class="email-summary">{{ authStore.userEmail || 'N/A' }}</div>
          </div>
          <button @click.stop="toggleDropdown" class="settings-cog">
            <i class="fas fa-cog"></i>
          </button>
        </div>

        <div v-if="showDropdown" class="profile-dropdown">
          <div class="dropdown-user-info">
            <div class="username-full">{{ authStore.username || 'Staff User' }}</div>
            <div class="email-full">{{ authStore.userEmail || 'N/A' }}</div>
          </div>
          <router-link to="/profile" class="dropdown-item" @click="hideDropdown">
            <i class="fas fa-user"></i> Profile
          </router-link>
          <router-link to="/settings" class="dropdown-item" @click="hideDropdown">
            <i class="fas fa-cog"></i> Settings
          </router-link>
          <div class="dropdown-divider"></div>
          <a @click="logout" class="dropdown-item logout-item">
            <i class="fas fa-sign-out-alt"></i> Log out
            </a>
        </div>
      </div>
    </aside>

    <!-- Right Content Area -->
    <div class="main-content-wrapper">
      <!-- Top Search Bar -->
      <header class="top-bar">
        <div class="search-bar-container">
          <input type="text" placeholder="Global Search (Patients, Appointments, Items...)" class="global-search-input" />
          <i class="fas fa-search search-icon"></i>
        </div>
      </header>
      <!-- Main Content Area (Router View) -->
      <main class="content-area">
        <router-view />
      </main>
    </div>
  </div>
  <!-- Render only router-view for login page when not authenticated -->
  <div v-else class="login-view-container">
    <router-view />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { authStore } from './stores/auth'; // Ensure this path is correct based on your file structure
import { computed } from 'vue';

const router = useRouter();
const showDropdown = ref(false);

// Helper function to check if the user has any of the required roles
const hasRole = (roles) => {
  return roles.some(role => authStore.userRoles.includes(role));
};

// Helper function to check if the user has any role at all (for divider)
const hasAnyRole = (roles) => {
  return roles.some(role => authStore.userRoles.includes(role));
};

const toggleDropdown = () => {
  showDropdown.value = !showDropdown.value;
};

const hideDropdown = () => {
  showDropdown.value = false;
};

const logout = () => {
  authStore.clearAuth(); // Use clearAuth action from your store
  router.push('/login');
};

// Close dropdown when clicking outside
const handleClickOutside = (event) => {
  if (showDropdown.value && !event.target.closest('.user-profile-wrapper')) {
    hideDropdown();
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style lang="scss">
@import './assets/styles/_common.scss'; // This now imports _variables.scss, _mixins.scss, and _layout.scss
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'); /* Added Inter font */
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css');


html, body {
  margin: 0;
  padding: 0;
}

// The #app styles, login-view-container, main-content-wrapper, top-bar,
// search-bar-container, global-search-input, search-icon, content-area,
// and all media queries related to these layout elements should be *removed* from here
// as they are now in _layout.scss.

// ONLY KEEP THE SIDEBAR AND USER PROFILE RELATED STYLES IN APP.VUE
// For example:
.sidebar {
  width: 25.2%;
  min-width: 280px;
  max-width: 350px;
  background-color: $color-bg-white;
  color: $color-text-dark;
  display: flex;
  flex-direction: column;
  padding: $spacing-md 0;
  box-shadow: $box-shadow-sm;
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto;
  z-index: $z-index-sticky;
  box-sizing: border-box;
  flex-shrink: 0;

  .app-branding {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: $spacing-md 0 $spacing-lg 0;
    border-bottom: 1px solid $color-border-light;
    margin-bottom: $spacing-md;
    width: 100%;
    box-sizing: border-box;

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

  .main-nav {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    padding: 0 $spacing-md;
    width: 100%;
    box-sizing: border-box;

    .router-link-active, .router-link-exact-active {
      background-color: rgba($color-primary-blue, 0.1);
      border-left: 4px solid $color-primary-blue;
      padding-left: calc($spacing-md - 4px);
      color: $color-primary-blue;
      i {
        color: $color-primary-blue;
      }
    }

    a {
      color: $color-text-dark;
      text-decoration: none;
      padding: 12px $spacing-md;
      margin-bottom: $spacing-xs;
      border-radius: $border-radius-sm;
      transition: background-color 0.3s ease, color 0.3s ease, border-left 0.3s ease;
      display: flex;
      align-items: center;
      font-size: $font-size-base;

      i {
        margin-right: $spacing-sm * 1.5;
        font-size: 1.1em;
        color: $color-text-medium-grey;
      }

      &:hover {
        background-color: $color-bg-light;
        color: $color-primary-blue;
        i {
          color: $color-primary-blue;
        }
      }
    }

    .nav-divider {
      border: none;
      border-top: 1px solid $color-border-light;
      margin: $spacing-md 0;
    }
  }

  // Updated User Profile Wrapper
  .user-profile-wrapper {
    position: relative;
    padding: $spacing-md;
    border-top: 1px solid $color-border-light;
    margin-top: auto;
    width: 100%;
    box-sizing: border-box;

    .user-profile-summary {
      display: flex;
      align-items: center;
      gap: $spacing-sm;
      color: $color-text-dark;
      padding: $spacing-sm 0;
      width: 100%;
      box-sizing: border-box;

      .user-avatar {
        width: 40px;
        height: 40px;
        background-color: $color-primary-blue;
        color: $color-bg-white;
        border-radius: 50%;
        display: flex;
        justify-content: center;
        align-items: center;
        font-weight: bold;
        font-size: 1.2em;
        flex-shrink: 0;
      }

      .user-details-summary {
        flex-grow: 1;
        text-align: left;
        overflow: hidden;
        white-space: nowrap;

        .username-summary {
          font-weight: bold;
          font-size: 1em;
          text-overflow: ellipsis;
          overflow: hidden;
        }
        .email-summary {
          font-size: 0.8em;
          color: $color-text-medium-grey;
        }
      }

      .settings-cog {
        background: none;
        border: none;
        color: $color-text-medium-grey;
        font-size: 1.2em;
        cursor: pointer;
        padding: $spacing-xs;
        border-radius: $border-radius-sm;
        transition: color 0.3s ease, background-color 0.3s ease;

        &:hover {
          color: $color-primary-blue;
          background-color: $color-bg-light;
        }
      }
    }

    .profile-dropdown {
      position: absolute;
      bottom: calc(100% + $spacing-sm);
      left: 0;
      right: 0;
      background-color: $color-bg-white;
      border-radius: $border-radius-md;
      box-shadow: $box-shadow-md;
      overflow: hidden;
      z-index: $z-index-dropdown;
      width: 100%;
      box-sizing: border-box;

      .dropdown-user-info {
        padding: $spacing-md;
        border-bottom: 1px solid $color-border-light;
        text-align: left;
        .username-full {
          font-weight: bold;
          color: $color-text-dark;
          margin-bottom: $spacing-xs;
        }
        .email-full {
          font-size: 0.9em;
          color: $color-text-medium-grey;
        }
      }

      .dropdown-item {
        display: flex;
        align-items: center;
        padding: $spacing-sm $spacing-md;
        color: $color-text-dark;
        text-decoration: none;
        transition: background-color 0.2s ease;
        cursor: pointer;

        i {
          margin-right: $spacing-sm;
          font-size: 1em;
          color: $color-text-medium-grey;
        }

        &:hover {
          background-color: $color-bg-light;
          color: $color-primary-blue;
          i {
            color: $color-primary-blue;
          }
        }

        &.logout-item {
          color: $color-danger;
          i {
            color: $color-danger;
          }
          &:hover {
            background-color: lighten($color-danger, 40%);
            color: darken($color-danger, 10%);
            i {
              color: darken($color-danger, 10%);
            }
          }
        }
      }

      .dropdown-divider {
        border-top: 1px solid $color-border-light;
        margin: $spacing-xs 0;
      }
    }
  }
}
// Also remove the responsive adjustments for sidebar and top-bar from here,
// as they are now in _layout.scss.
</style>