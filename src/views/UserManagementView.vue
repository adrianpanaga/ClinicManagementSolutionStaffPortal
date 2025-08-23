<template>
  <div class="user-management-view">
    <h2 class="section-title">User Management</h2>

    <div v-if="loading" class="loading-message">
      <i class="fas fa-spinner icon" spin></i> Loading user data...
    </div>
    <div v-else-if="errorMessage" class="error-message">
      {{ errorMessage }}
    </div>

    <div v-else class="content-container">
      <div class="header-actions">
        <div class="form-group search-group">
          <input type="text" v-model="searchTerm" @input="debounceSearch" class="form-control search-input" placeholder="Search users" />
          <i class="fas fa-search search-icon"></i>
        </div>
        <button v-if="canCreateUser" @click="openCreateForm" class="btn btn-primary">
          <i class="fas fa-user-plus icon"></i> Add New Staff
        </button>
      </div>

      <div class="user-list-container card mt-3">
        <div v-if="filteredUsers.length === 0" class="no-records-message">
          No users found.
        </div>
        <table v-else class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Username</th>
              <th>Email</th>
              <th>Job Title</th>
              <th>Roles</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in filteredUsers" :key="user.userId" :class="{ 'deleted-user': !user.isActive }">
              <td>{{ user.userId }}</td>
              <td>{{ user.username }}</td>
              <td>{{ user.email }}</td>
              <td>{{ user.jobTitle || 'N/A' }}</td>
              <td>
                <span class="role-badge">
                  {{ user.roleName }}
                </span>
              </td>
              <td class="actions">
                <router-link :to="{ name: 'user-detail', params: { userId: user.userId } }" class="btn btn-sm btn-info">
                  <i class="fas fa-eye"></i>
                </router-link>
                <button v-if="canDeleteUser && user.isActive" @click="softDeleteUser(user.userId)" class="btn btn-sm btn-danger ml-1">
                  <i class="fas fa-trash-alt"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="showUserForm" class="modal-overlay">
      <div class="modal-content card">
        <h3>Create New User</h3>
        <form @submit.prevent="saveUser">
          <div class="form-group">
            <label for="username">Username</label>
            <input type="text" id="username" v-model="currentUser.userName" class="form-control" required />
          </div>
          <div class="form-group">
            <label for="email">Email</label>
            <input type="email" id="email" v-model="currentUser.email" class="form-control" required />
          </div>
          <div class="form-group">
            <label for="password">Password</label>
            <input type="password" id="password" v-model="currentUser.password" class="form-control" required />
          </div>
          <div class="form-actions">
            <button type="submit" class="btn btn-success">
              <i class="fas fa-save"></i> Save User
            </button>
            <button type="button" @click="closeForm" class="btn btn-secondary ml-1">
              <i class="fas fa-times"></i> Cancel
            </button>
          </div>
          <div v-if="formError" class="error-message mt-2">{{ formError }}</div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import apiClient from '../api/authApi.js';
import { authStore } from '../stores/auth.js';

const users = ref([]);
const filteredUsers = ref([]);
const loading = ref(true);
const errorMessage = ref('');
const searchTerm = ref('');
const showUserForm = ref(false); // Only used for the create form
const currentUser = ref({});
const formError = ref('');

// Permission Computeds
const canCreateUser = computed(() => {
  return authStore.userRoles.includes('Admin') || authStore.userRoles.includes('HR');
});

const canDeleteUser = computed(() => {
  return authStore.userRoles.includes('Admin');
});

// Data Fetching Logic
const fetchUsers = async () => {
  loading.value = true;
  errorMessage.value = '';
  try {
    const response = await apiClient.get('/api/Users');
    users.value = response.data;
    filteredUsers.value = response.data;
  } catch (error) {
    console.error('Failed to fetch users:', error);
    errorMessage.value = `Failed to load user data: ${error.response?.data?.detail || error.message || error.response?.statusText}`;
  } finally {
    loading.value = false;
  }
};

// Search Logic
const search = () => {
  if (!searchTerm.value) {
    filteredUsers.value = users.value;
    return;
  }
  const lowerCaseSearchTerm = searchTerm.value.toLowerCase();
  filteredUsers.value = users.value.filter(user =>
    (user.username && user.username.toLowerCase().includes(lowerCaseSearchTerm)) ||
    (user.email && user.email.toLowerCase().includes(lowerCaseSearchTerm)) ||
    (user.jobTitle && user.jobTitle.toLowerCase().includes(lowerCaseSearchTerm)) ||
    (user.roleName && user.roleName.toLowerCase().includes(lowerCaseSearchTerm))
  );
};
let searchTimeout = null;
const debounceSearch = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(search, 300);
};

// Form and Modal Logic (for new user creation only)
const openCreateForm = () => {
  currentUser.value = { userName: '', email: '', password: '' };
  formError.value = '';
  showUserForm.value = true;
};

const closeForm = () => {
  showUserForm.value = false;
  currentUser.value = {};
  formError.value = '';
};

const saveUser = async () => {
  formError.value = '';
  try {
    await apiClient.post('/api/Auth/register', currentUser.value);
    closeForm();
    await fetchUsers();
  } catch (error) {
    console.error('Failed to save user:', error);
    formError.value = `Failed to save user: ${error.response?.data?.detail || error.message || error.response?.statusText}`;
  }
};

// User Deactivation Logic
const softDeleteUser = async (userId) => {
  if (confirm('Are you sure you want to deactivate this user? They will not be able to log in.')) {
    try {
      await apiClient.delete(`/api/Users/${userId}`);
      await fetchUsers();
      alert('User deactivated successfully.');
    } catch (error) {
      console.error('Failed to deactivate user:', error);
      alert(`Failed to deactivate user: ${error.response?.data?.detail || error.message || error.response?.statusText}`);
    }
  }
};

// Lifecycle Hook
onMounted(async () => {
  if (!canCreateUser.value) {
    errorMessage.value = "Access Denied: You do not have permission to view the User Management page.";
    loading.value = false;
    return;
  }
  await fetchUsers();
});
</script>

<style lang="scss" scoped>
@import '../assets/styles/_variables.scss';

.user-management-view {
  padding: $spacing-lg;
}

.section-title {
  color: $color-primary-blue;
  margin-bottom: $spacing-lg;
  text-align: center;
  font-size: 2rem;
}

.loading-message, .error-message, .no-records-message {
  text-align: center;
  padding: $spacing-md;
  margin-top: $spacing-lg;
  border-radius: $border-radius-sm;
  font-weight: bold;
}

.content-container {
  display: flex;
  flex-direction: column;
}

.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $spacing-lg;

  .search-group {
    position: relative;
    width: 300px;
    .search-icon {
      position: absolute;
      right: $spacing-md;
      top: 50%;
      transform: translateY(-50%);
      color: $color-secondary-grey;
    }
  }
}

.user-list-container {
  background-color: $color-bg-white;
  border: 1px solid $color-border-medium;
  border-radius: $border-radius-md;
  box-shadow: $box-shadow-sm;
  padding: $spacing-md;
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;

  th, td {
    padding: $spacing-sm $spacing-md;
    text-align: left;
    border-bottom: 1px solid $color-border-light;
    white-space: nowrap;
  }

  th {
    background-color: $color-bg-light;
    font-weight: bold;
    color: $color-text-dark;
  }

  td {
    color: $color-text-medium-grey;

    &.actions {
      text-align: center;
      min-width: 150px;
    }
  }

  tr:hover {
    background-color: $color-bg-light;
  }

  .deleted-user {
    background-color: lighten($color-error, 40%);
    opacity: 0.7;
    color: $color-text-medium-grey;
    text-decoration: line-through;
  }

  .role-badge {
    display: inline-block;
    padding: 4px 8px;
    border-radius: 9999px;
    background-color: lighten($color-primary-blue, 30%);
    color: $color-text-dark;
    font-size: 0.75rem;
    font-weight: bold;
    margin-right: 5px;
    margin-bottom: 3px;
  }

  .btn-sm {
    padding: 0.25rem 0.5rem;
    font-size: 0.8rem;
  }
  .ml-1 {
    margin-left: $spacing-xs;
  }
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: $color-bg-white;
  padding: $spacing-lg;
  border-radius: $border-radius-md;
  box-shadow: $box-shadow-md;
  max-width: 500px;
  width: 90%;

  h3 {
    text-align: center;
    color: $color-primary-blue;
    margin-bottom: $spacing-md;
    border-bottom: 1px solid $color-border-darker;
    padding-bottom: $spacing-sm;
  }

  .form-group {
    margin-bottom: $spacing-md;
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    margin-top: $spacing-lg;
  }
}

.mt-2 {
  margin-top: $spacing-sm;
}
.mt-3 {
  margin-top: $spacing-md;
}
</style>