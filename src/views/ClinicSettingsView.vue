<template>
  <div class="clinic-settings-view">
    <div v-if="hasPermission">
      <h2 class="section-title">Clinic Settings</h2>
      <p class="subtitle">Manage the clinic's operational hours and other global settings.</p>

      <div v-if="loading" class="loading-message">
        <i class="fas fa-spinner icon" spin></i> Loading settings...
      </div>
      <div v-else-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>

      <div v-else class="settings-form-container card">
        <form @submit.prevent="saveSettings">
          <div class="form-group-grid">
            <div class="form-group">
              <label for="openTime">Open Time:</label>
              <input type="time" id="openTime" v-model="settings.openTime" class="form-control" required />
            </div>
            <div class="form-group">
              <label for="closeTime">Close Time:</label>
              <input type="time" id="closeTime" v-model="settings.closeTime" class="form-control" required />
            </div>
            <div class="form-group">
              <label for="lunchStartTime">Lunch Start Time:</label>
              <input type="time" id="lunchStartTime" v-model="settings.lunchStartTime" class="form-control" />
            </div>
            <div class="form-group">
              <label for="lunchEndTime">Lunch End Time:</label>
              <input type="time" id="lunchEndTime" v-model="settings.lunchEndTime" class="form-control" />
            </div>
          </div>
          <div class="form-group full-width">
            <label for="cancellationPolicy">Cancellation Policy:</label>
            <textarea id="cancellationPolicy" v-model="settings.cancellationPolicy" class="form-control"></textarea>
          </div>

          <div v-if="formMessage" :class="['form-message', formMessageType]">
            {{ formMessage }}
          </div>
          
          <div class="form-actions">
            <button type="submit" class="btn btn-success" :disabled="loadingSave">
              <i class="fas fa-save"></i> Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
    <div v-else class="error-message">
      Access Denied: You do not have permission to view this page.
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import apiClient from '../api/authApi';
import { authStore } from '../stores/auth';

const settings = ref({});
const loading = ref(true);
const loadingSave = ref(false);
const errorMessage = ref('');
const formMessage = ref('');
const formMessageType = ref('');

// Assume a fixed ID for the single clinic settings record
const CLINIC_SETTINGS_ID = 1;

// --- Computed property for role-based permissions
const hasPermission = computed(() => {
  const roles = authStore.userRoles;
  return roles.includes('Admin') || roles.includes('HR');
});

// --- Data Fetching
const fetchSettings = async () => {
  loading.value = true;
  errorMessage.value = '';
  try {
    const response = await apiClient.get(`/api/ClinicSettings/${CLINIC_SETTINGS_ID}`);
    settings.value = response.data;
  } catch (error) {
    console.error('Error fetching clinic settings:', error);
    errorMessage.value = `Failed to load settings: ${error.response?.data?.detail || error.message || error.response?.statusText}`;
  } finally {
    loading.value = false;
  }
};

// --- Form Submission
const saveSettings = async () => {
  loadingSave.value = true;
  formMessage.value = '';
  try {
    await apiClient.put(`/api/ClinicSettings/${CLINIC_SETTINGS_ID}`, settings.value);
    formMessage.value = 'Settings updated successfully!';
    formMessageType.value = 'success';
  } catch (error) {
    console.error('Error saving clinic settings:', error);
    formMessage.value = `Failed to save settings: ${error.response?.data?.detail || error.message || error.response?.statusText}`;
    formMessageType.value = 'error';
  } finally {
    loadingSave.value = false;
    setTimeout(() => {
      formMessage.value = '';
    }, 5000);
  }
};

// --- Lifecycle Hook
onMounted(async () => {
  if (!hasPermission.value) {
    loading.value = false;
    return;
  }
  await fetchSettings();
});
</script>

<style lang="scss" scoped>
@import "../assets/styles/_variables.scss";

.clinic-settings-view {
  padding: $spacing-lg;
  max-width: 800px;
  margin: 0 auto;
}

.section-title {
  color: $color-primary-blue;
  margin-bottom: $spacing-xs;
  text-align: center;
  font-size: 2rem;
}

.subtitle {
  text-align: center;
  color: $color-text-medium-grey;
  margin-bottom: $spacing-lg;
}

.loading-message, .error-message, .no-records-message {
  text-align: center;
  padding: $spacing-md;
  margin-top: $spacing-lg;
  border-radius: $border-radius-sm;
  font-weight: bold;
}
.error-message {
  color: $color-error;
  background-color: lighten($color-error, 40%);
  border: 1px solid $color-error;
}
.loading-message {
  color: $color-info;
}

.settings-form-container {
  background-color: $color-bg-white;
  border: 1px solid $color-border-medium;
  border-radius: $border-radius-md;
  box-shadow: $box-shadow-sm;
  padding: $spacing-xl;
}

.form-group-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: $spacing-md;
}

.form-group {
  margin-bottom: $spacing-md;

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
    box-sizing: border-box;
    font-size: 1rem;
    
    &:focus {
      border-color: $color-primary-blue;
      outline: none;
      box-shadow: 0 0 0 3px rgba($color-primary-blue, 0.2);
    }
  }
  
  textarea.form-control {
    min-height: 100px;
    resize: vertical;
  }
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: $spacing-lg;
}

.btn {
  padding: $spacing-sm $spacing-md;
  font-weight: bold;
  cursor: pointer;
  border-radius: $border-radius-sm;
  transition: background-color 0.3s ease;

  &-success {
    background-color: $color-confirm-green;
    color: $color-bg-white;
    border: none;
    &:hover { background-color: darken($color-confirm-green, 8%); }
    &:disabled {
      background-color: lighten($color-confirm-green, 20%);
      cursor: not-allowed;
    }
  }
}

.form-message {
  padding: $spacing-sm;
  border-radius: $border-radius-sm;
  margin-bottom: $spacing-md;
  font-weight: bold;
  text-align: center;
  
  &.success {
    background-color: lighten($color-confirm-green, 40%);
    color: $color-confirm-green;
  }
  &.error {
    background-color: lighten($color-error, 40%);
    color: $color-error;
  }
}
</style>