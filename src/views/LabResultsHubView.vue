<template>
  <div class="lab-results-hub-view">
    <div v-if="hasPermission">
      <h2 class="section-title">Lab Results Hub</h2>
      <p class="subtitle">Select a patient to view their lab results, or view all results across the clinic.</p>

      <div v-if="loading" class="loading-message">
        <i class="fas fa-spinner icon" spin></i> Loading patient data...
      </div>
      <div v-else-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>

      <div v-else class="hub-container card">
        <div class="action-card">
          <div class="action-header">
            <i class="fas fa-user"></i>
            <h3>View Patient Lab Results</h3>
          </div>
          <div class="action-body">
            <p>Select a patient from the list below to view their complete lab history.</p>
            <div class="form-group">
              <label for="patient-select">Choose a Patient:</label>
              <select id="patient-select" v-model="selectedPatientId" class="form-control">
                <option value="">-- Select a Patient --</option>
                <option v-for="patient in patients" :key="patient.patientId" :value="patient.patientId">
                  {{ patient.firstName + ' ' + patient.lastName }} (ID: {{ patient.patientId }})
                </option>
              </select>
            </div>
            <div class="action-footer">
              <router-link
                v-if="selectedPatientId"
                :to="{ name: 'patient-lab-results', params: { patientId: selectedPatientId } }"
                class="btn btn-primary">
                <i class="fas fa-vials"></i> View Results
              </router-link>
              <button
                v-else
                class="btn btn-primary btn-disabled"
                disabled>
                <i class="fas fa-vials"></i> View Results
              </button>
            </div>
          </div>
        </div>

        <div class="divider"></div>

        <div class="action-card">
          <div class="action-header">
            <i class="fas fa-clipboard-list"></i>
            <h3>View All Lab Results</h3>
          </div>
          <div class="action-body">
            <p>Access a searchable, comprehensive list of all lab results for all patients in the clinic.</p>
          </div>
          <div class="action-footer">
            <router-link :to="{ name: 'all-lab-results' }" class="btn btn-secondary">
              <i class="fas fa-search search-icon"></i> Browse All Results
            </router-link>
          </div>
        </div>
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

const patients = ref([]);
const selectedPatientId = ref('');
const loading = ref(true);
const errorMessage = ref('');

const hasPermission = computed(() => {
  const roles = authStore.userRoles;
  return roles.includes('Admin') || roles.includes('Doctor') || roles.includes('Nurse') || roles.includes('LabTech');
});

const fetchPatients = async () => {
  loading.value = true;
  errorMessage.value = '';
  try {
    const response = await apiClient.get('/api/Patients');
    patients.value = response.data;
  } catch (error) {
    console.error('Error fetching patients:', error);
    errorMessage.value = `Failed to load patients: ${error.response?.data?.detail || error.message || error.response?.statusText}`;
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  if (hasPermission.value) {
    fetchPatients();
  } else {
    loading.value = false;
  }
});
</script>

<style lang="scss" scoped>
@import '../assets/styles/_variables.scss';

.lab-results-hub-view {
  padding: $spacing-lg;
  max-width: 900px;
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
  margin-bottom: $spacing-xl;
}

.hub-container {
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;
  padding: $spacing-xl;
  background-color: $color-bg-white;
  border: 1px solid $color-border-medium;
  border-radius: $border-radius-md;
  box-shadow: $box-shadow-sm;

  @media (min-width: 768px) {
    flex-direction: row;
    justify-content: space-between;
  }
}

.action-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  text-align: center;
  background-color: lighten($color-bg-light, 2%);
  border: 1px solid $color-border-light;
  border-radius: $border-radius-md;
  padding: $spacing-lg;
  box-shadow: $box-shadow-sm;
}

.action-header {
  margin-bottom: $spacing-md;
  .icon {
    font-size: 2em;
    color: $color-primary-blue;
    margin-bottom: $spacing-xs;
  }
  h3 {
    margin: 0;
    color: $color-text-dark;
  }
}

.action-body {
  flex-grow: 1;
  p {
    color: $color-text-medium-grey;
    margin-bottom: $spacing-md;
  }
}
.action-footer {
  margin-top: auto;
}
.divider {
  width: 1px;
  background-color: $color-border-light;
  margin: 0 $spacing-lg;

  @media (max-width: 767px) {
    width: 100%;
    height: 1px;
    margin: $spacing-lg 0;
  }
}

.form-group {
  text-align: left;
  margin-bottom: $spacing-md;
}

.form-control {
  width: 100%;
  padding: $spacing-sm;
  border: 1px solid $color-border-medium;
  border-radius: $border-radius-sm;
  box-sizing: border-box;
}

.btn {
  padding: $spacing-sm $spacing-md;
  font-weight: bold;
  border-radius: $border-radius-sm;
  transition: background-color 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: $spacing-xs;

  &.btn-primary {
    background-color: $color-primary-blue;
    color: $color-bg-white;
    border: none;
    &:hover { background-color: darken($color-primary-blue, 10%); }
    &.btn-disabled {
      background-color: $color-secondary-grey;
      cursor: not-allowed;
    }
  }

  &.btn-secondary {
    background-color: $color-secondary-grey;
    color: $color-bg-white;
    border: none;
    &:hover { background-color: darken($color-secondary-grey, 10%); }
  }
}

.loading-message, .error-message, .no-records-message {
  text-align: center;
  padding: $spacing-md;
  margin-top: $spacing-lg;
  border-radius: $border-radius-sm;
  font-weight: bold;
}
</style>