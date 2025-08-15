<template>
  <div class="user-management-view">
    <h2 class="section-title">User Management</h2>

    <div v-if="loading" class="loading-message">
      <font-awesome-icon :icon="['fas', 'spinner']" spin class="icon" /> Loading user data...
    </div>
    <div v-else-if="errorMessage" class="error-message">
      {{ errorMessage }}
    </div>

    <div v-else class="content-container">
      <div class="header-actions">
        <div class="form-group search-group">
          <input type="text" v-model="searchTerm" @input="debounceSearch" class="form-control search-input" placeholder="Search users" />
          <font-awesome-icon :icon="['fas', 'search']" class="search-icon" />
        </div>
        <button v-if="canCreateUser" @click="openCreateForm" class="btn btn-primary">
          <font-awesome-icon :icon="['fas', 'user-plus']" class="icon" /> Add New Staff
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
            <tr v-for="user in filteredUsers" :key="user.userId" :class="{ 'deleted-user': user.isDeleted }">
              <td>{{ user.userId }}</td>
              <td>{{ user.userName }}</td>
              <td>{{ user.email }}</td>
              <td>{{ user.staffDetail?.jobTitle || 'N/A' }}</td>
              <td>
                <span v-for="role in user.roles" :key="role" class="role-badge">
                  {{ role }}
                </span>
                <span v-if="!user.roles || user.roles.length === 0" class="role-badge no-role">
                  No Role
                </span>
              </td>
              <td class="actions">
                <button v-if="canEditUser" @click="openEditForm(user)" class="btn btn-sm btn-info">
                  <font-awesome-icon :icon="['fas', 'edit']" />
                </button>
                <button v-if="canManageRoles" @click="openRoleForm(user)" class="btn btn-sm btn-secondary ml-1">
                  <font-awesome-icon :icon="['fas', 'user-tag']" />
                </button>
                <button v-if="canDeleteUser && !user.isDeleted" @click="softDeleteUser(user.userId)" class="btn btn-sm btn-danger ml-1">
                  <font-awesome-icon :icon="['fas', 'trash-alt']" />
                </button>
                <!-- <button v-if="canRestoreUser && user.isDeleted" @click="restoreUser(user.userId)" class="btn btn-sm btn-success ml-1">
                  <font-awesome-icon :icon="['fas', 'undo']" />
                </button> -->
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="showUserForm" class="modal-overlay">
      <div class="modal-content card">
        <h3>{{ editingUser ? 'Edit User' : 'Create New User' }}</h3>
        <form @submit.prevent="saveUser">
          <div class="form-group">
            <label for="username">Username</label>
            <input type="text" id="username" v-model="currentUser.userName" class="form-control" required :disabled="editingUser" />
          </div>
          <div class="form-group">
            <label for="email">Email</label>
            <input type="email" id="email" v-model="currentUser.email" class="form-control" required />
          </div>
          <div class="form-group" v-if="!editingUser">
            <label for="password">Password</label>
            <input type="password" id="password" v-model="currentUser.password" class="form-control" required />
          </div>
          <div class="form-actions">
            <button type="submit" class="btn btn-success">
              <font-awesome-icon :icon="['fas', 'save']" /> Save User
            </button>
            <button type="button" @click="closeForm" class="btn btn-secondary ml-1">
              <font-awesome-icon :icon="['fas', 'times']" /> Cancel
            </button>
          </div>
          <div v-if="formError" class="error-message mt-2">{{ formError }}</div>
        </form>
      </div>
    </div>

    <div v-if="showRoleForm" class="modal-overlay">
      <div class="modal-content card">
        <h3>Manage Roles for {{ editingUser?.userName }}</h3>
        <form @submit.prevent="saveRoles">
          <div class="form-group">
            <label>Roles</label>
            <div class="role-checkboxes">
              <label v-for="role in availableRoles" :key="role" class="checkbox-container">
                <input type="checkbox" :value="role" v-model="selectedRoles" />
                <span class="checkmark"></span>
                {{ role }}
              </label>
            </div>
          </div>
          <div class="form-actions">
            <button type="submit" class="btn btn-success">
              <font-awesome-icon :icon="['fas', 'save']" /> Update Roles
            </button>
            <button type="button" @click="closeForm" class="btn btn-secondary ml-1">
              <font-awesome-icon :icon="['fas', 'times']" /> Cancel
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
const showUserForm = ref(false);
const showRoleForm = ref(false);
const editingUser = ref(null);
const currentUser = ref({});
const formError = ref('');
const selectedRoles = ref([]);

const availableRoles = [
  'Admin', 'Receptionist', 'Doctor', 'Nurse', 'LabTechnician', 'InventoryManager', 'HR'
];

// --- Permission Computeds based on documentation ---
const canCreateUser = computed(() => {
  return authStore.userRoles.includes('Admin') || authStore.userRoles.includes('HR');
});

const canEditUser = computed(() => {
  // Documentation states HR can't update existing user info, so only Admin can
  // The backend API `PUT /api/Users/{id}` is for updating.
  return authStore.userRoles.includes('Admin');
});

const canManageRoles = computed(() => {
  // Documentation states Admin can update all records. Role management is a key part of this.
  // The backend API `PUT /api/Users/{id}/role` is for this.
  return authStore.userRoles.includes('Admin');
});

const canDeleteUser = computed(() => {
  // HR can't update existing info, so they likely can't delete either. Admin can delete.
  // The backend API `DELETE /api/Users/{id}` is for this.
  return authStore.userRoles.includes('Admin');
});

// const canRestoreUser = computed(() => {
//   // As with deletion, this is an Admin-only function
//   return authStore.userRoles.includes('Admin');
// });
// --------------------------------------------------

// --- Data Fetching Logic ---
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

// --- Search Logic ---
const search = () => {
  if (!searchTerm.value) {
    filteredUsers.value = users.value;
    return;
  }
  const lowerCaseSearchTerm = searchTerm.value.toLowerCase();
  filteredUsers.value = users.value.filter(user =>
    (user.userName && user.userName.toLowerCase().includes(lowerCaseSearchTerm)) ||
    (user.email && user.email.toLowerCase().includes(lowerCaseSearchTerm)) ||
    (user.staffDetail?.jobTitle && user.staffDetail.jobTitle.toLowerCase().includes(lowerCaseSearchTerm))
  );
};
let searchTimeout = null;
const debounceSearch = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(search, 300);
};

// --- Form and Modal Logic ---
const openCreateForm = () => {
  editingUser.value = null;
  currentUser.value = { userName: '', email: '', password: '' };
  formError.value = '';
  showUserForm.value = true;
};

const openEditForm = (user) => {
  editingUser.value = user;
  currentUser.value = { ...user };
  formError.value = '';
  showUserForm.value = true;
};

const openRoleForm = (user) => {
  editingUser.value = user;
  selectedRoles.value = user.roles || [];
  formError.value = '';
  showRoleForm.value = true;
};

const closeForm = () => {
  showUserForm.value = false;
  showRoleForm.value = false;
  editingUser.value = null;
  currentUser.value = {};
  selectedRoles.value = [];
  formError.value = '';
};

const saveUser = async () => {
  formError.value = '';
  try {
    if (editingUser.value) {
      // Update existing user via PUT /api/Users/{id}
      await apiClient.put(`/api/Users/${editingUser.value.userId}`, currentUser.value);
    } else {
      // Create new user via POST /api/Auth/register
      await apiClient.post('/api/Auth/register', currentUser.value);
    }
    closeForm();
    await fetchUsers(); // Refresh the user list
  } catch (error) {
    console.error('Failed to save user:', error);
    formError.value = `Failed to save user: ${error.response?.data?.detail || error.message || error.response?.statusText}`;
  }
};

const saveRoles = async () => {
  formError.value = '';
  try {
    if (editingUser.value) {
      // Update roles via PUT /api/Users/{id}/role
      await apiClient.put(`/api/Users/${editingUser.value.userId}/role`, { roles: selectedRoles.value });
    }
    closeForm();
    await fetchUsers(); // Refresh the user list
  } catch (error) {
    console.error('Failed to save roles:', error);
    formError.value = `Failed to save roles: ${error.response?.data?.detail || error.message || error.response?.statusText}`;
  }
};

// --- User Deletion/Restoration Logic ---
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

// const restoreUser = async (userId) => {
//   if (confirm('Are you sure you want to restore this user?')) {
//     try {
//       // The backend API `POST /api/Users/restore/{id}` is for this.
//       await apiClient.post(`/api/Users/restore/${userId}`);
//       await fetchUsers();
//       alert('User restored successfully.');
//     } catch (error) {
//       console.error('Failed to restore user:', error);
//       alert(`Failed to restore user: ${error.response?.data?.detail || error.message || error.response?.statusText}`);
//     }
//   }
// };

// --- Lifecycle Hook ---
onMounted(async () => {
  // Check if current user has 'Admin' or 'HR' role to view this dashboard
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

    &.no-role {
      background-color: $color-secondary-grey;
      color: white;
    }
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
    .role-checkboxes {
      display: flex;
      flex-wrap: wrap;
      gap: $spacing-sm;
    }
    .checkbox-container {
      display: flex;
      align-items: center;
      cursor: pointer;
      user-select: none;
      
      input {
        margin-right: 5px;
      }
    }
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