<template>
  <div class="user-detail-view">
    <div v-if="loading" class="loading-message">
      <i class="fas fa-spinner icon" spin></i> Loading user data...
    </div>
    <div v-else-if="errorMessage" class="error-message">
      {{ errorMessage }}
    </div>

    <div v-else-if="user" class="content-container">
      <h2 class="section-title">
        <router-link to="/users" class="back-link">&lt; Back to Users</router-link>
        User Profile: {{ user.username }}
      </h2>

      <div class="user-info-card card">
        <h3 class="card-header">Basic Information</h3>
        <div class="card-body">
          <p><strong>Full Name:</strong> {{ user.staffDetail?.firstName }} {{ user.staffDetail?.lastName }}</p>
          <p><strong>Job Title:</strong> {{ user.staffDetail?.jobTitle || 'N/A' }}</p>
          <p><strong>Specialization:</strong> {{ user.staffDetail?.specialization || 'N/A' }}</p>
          <p><strong>Contact Number:</strong> {{ user.staffDetail?.contactNumber || 'N/A' }}</p>
          <p><strong>Email:</strong> {{ user.email }}</p>
        </div>
      </div>

      <div v-if="canManageRoles" class="role-form-card card mt-3">
        <h3 class="card-header">Manage Roles</h3>
        <form @submit.prevent="updateRoles">
          <div class="form-group">
            <label>Roles</label>
            <div class="role-checkboxes">
              <label v-for="role in availableRoles" :key="role" class="checkbox-container">
                <input type="checkbox" :value="role" v-model="selectedRoles" :disabled="userHasAdminRole" />
                <span class="checkmark"></span>
                {{ role }}
              </label>
            </div>
          </div>
          <button type="submit" class="btn btn-secondary">
            <i class="fas fa-user-tag"></i> Update Roles
          </button>
          <div v-if="roleError" class="error-message mt-2">{{ roleError }}</div>
          <div v-if="roleSuccess" class="success-message mt-2">{{ roleSuccess }}</div>
        </form>
      </div>

      </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import apiClient from '../api/authApi.js';
import { authStore } from '../stores/auth.js';

const route = useRoute();
const user = ref(null);
const loading = ref(true);
const errorMessage = ref('');
const roleError = ref('');
const roleSuccess = ref('');
const selectedRoles = ref([]);

const availableRoles = [
  'Admin', 'Receptionist', 'Doctor', 'Nurse', 'LabTech', 'InventoryManager', 'HR'
];

// Permission Computeds
const canManageRoles = computed(() => {
  return authStore.userRoles.includes('Admin');
});

const userHasAdminRole = computed(() => {
  return selectedRoles.value.includes('Admin');
});

// Fetch user data
const fetchUser = async (id) => {
  loading.value = true;
  errorMessage.value = '';
  try {
    const response = await apiClient.get(`/api/Users/${id}`);
    user.value = response.data;
    selectedRoles.value = user.value.roles || [];
  } catch (error) {
    console.error('Failed to fetch user:', error);
    errorMessage.value = `Failed to load user data: ${error.response?.data?.detail || error.message || error.response?.statusText}`;
  } finally {
    loading.value = false;
  }
};

// Update user roles
const updateRoles = async () => {
  roleError.value = '';
  roleSuccess.value = '';
  try {
    const payload = { roleNames: selectedRoles.value }; // Changed to 'roleNames'
    await apiClient.put(`/api/Users/${user.value.userId}/roles`, payload); // Changed endpoint
    roleSuccess.value = 'Roles updated successfully!';
    await fetchUser(user.value.userId); // Refresh data
  } catch (error) {
    console.error('Failed to update roles:', error);
    roleError.value = `Failed to update roles: ${error.response?.data?.detail || error.message || error.response?.statusText}`;
  }
};

onMounted(() => {
  const userId = route.params.userId;
  if (userId) {
    fetchUser(userId);
  } else {
    errorMessage.value = "User ID not provided.";
    loading.value = false;
  }
});
</script>