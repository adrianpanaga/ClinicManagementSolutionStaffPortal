<template>
  <div class="all-medical-records-view">
    <div v-if="hasPermission">
      <h2 class="section-title">All Medical Records</h2>
      <p class="subtitle">Browse, search, and manage all patient medical records.</p>

      <div class="search-and-actions">
        <div class="form-group search-group">
          <input type="text" v-model="searchTerm" @input="debounceSearch" class="form-control search-input" placeholder="Search by patient, doctor, or diagnosis" />
          <font-awesome-icon :icon="['fas', 'search']" class="search-icon" />
        </div>
      </div>

      <div v-if="loading" class="loading-message">
        <font-awesome-icon :icon="['fas', 'spinner']" spin /> Loading medical records...
      </div>
      <div v-else-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>

      <div v-else-if="filteredRecords.length === 0" class="no-records-message">
        No medical records found.
      </div>
      
      <div v-else class="medical-records-table-container card">
        <table class="data-table">
          <thead>
            <tr>
              <th>Record ID</th>
              <th>Date and Time</th>
              <th>Patient</th>
              <th>Doctor</th>
              <th>Diagnosis</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="record in filteredRecords" :key="record.recordId">
              <td>{{ record.recordId }}</td>
              <td>{{ formatDateTime(record.createdAt) }}</td>
              <td>
                <router-link :to="{ name: 'patient-history', params: { patientId: record.patient.patientId } }">
                  {{ record.patient.firstName }} {{ record.patient.lastName }}
                </router-link>
              </td>
              <td>
                {{ record.staff && record.staff.firstName ? record.staff.firstName : 'N/A' }}
                {{ record.staff && record.staff.lastName ? record.staff.lastName : '' }}
              </td>
              <td>{{ record.diagnosis || 'N/A' }}</td>
              <td>
                <router-link :to="{ name: 'patient-history', params: { patientId: record.patient.patientId, medicalRecordId: record.recordId } }" class="btn btn-sm btn-info">
                  <font-awesome-icon :icon="['fas', 'eye']" /> View
                </router-link>
                </td>
            </tr>
          </tbody>
        </table>
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

const medicalRecords = ref([]);
const filteredRecords = ref([]);
const searchTerm = ref('');
const loading = ref(true);
const errorMessage = ref('');
let searchTimeout = null;

// --- Computed property for role-based permissions
const hasPermission = computed(() => {
  const roles = authStore.userRoles;
  return roles.includes('Admin') || roles.includes('Doctor') || roles.includes('Nurse');
});

// --- Data Fetching
const fetchMedicalRecords = async () => {
  loading.value = true;
  errorMessage.value = '';
  try {
    const response = await apiClient.get('/api/MedicalRecords');
    medicalRecords.value = response.data;
    filteredRecords.value = response.data;
  } catch (error) {
    console.error('Error fetching medical records:', error);
    errorMessage.value = `Failed to load medical records: ${error.response?.data?.detail || error.message || error.response?.statusText}`;
  } finally {
    loading.value = false;
  }
};

// --- Search Logic
const search = () => {
  if (!searchTerm.value) {
    filteredRecords.value = medicalRecords.value;
    return;
  }
  const lowerCaseSearchTerm = searchTerm.value.toLowerCase();
  filteredRecords.value = medicalRecords.value.filter(record => 
    (record.patient?.firstName?.toLowerCase().includes(lowerCaseSearchTerm)) ||
    (record.patient?.lastName?.toLowerCase().includes(lowerCaseSearchTerm)) ||
    (record.staff?.firstName?.toLowerCase().includes(lowerCaseSearchTerm)) ||
    (record.staff?.lastName?.toLowerCase().includes(lowerCaseSearchTerm)) ||
    (record.diagnosis?.toLowerCase().includes(lowerCaseSearchTerm))
  );
};
const debounceSearch = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(search, 300);
};

// --- Helper functions
const formatDateTime = (dateTimeString) => {
  if (!dateTimeString) return 'N/A';
  const date = new Date(dateTimeString);
  if (isNaN(date.getTime())) return 'Invalid Date';
  const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  return date.toLocaleDateString(undefined, options);
};

// --- Lifecycle Hook
onMounted(async () => {
  if (!hasPermission.value) {
    loading.value = false;
    return;
  }
  await fetchMedicalRecords();
});
</script>

<style lang="scss" scoped>
@import "../assets/styles/_variables.scss";

.all-medical-records-view {
  padding: $spacing-lg;
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

.search-and-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-bottom: $spacing-md;

  .search-group {
    position: relative;
    width: 300px;
  }
}

.medical-records-table-container {
  overflow-x: auto;
  background-color: $color-bg-white;
  border: 1px solid $color-border-medium;
  border-radius: $border-radius-md;
  box-shadow: $box-shadow-sm;
  padding: $spacing-md;
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
    a {
      color: $color-primary-blue;
      text-decoration: none;
      &:hover { text-decoration: underline; }
    }
    .btn-sm {
      padding: 0.25rem 0.5rem;
      font-size: 0.8rem;
    }
  }

  tr:hover {
    background-color: $color-bg-light;
  }
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
.no-records-message {
  color: $color-secondary-grey;
}
.loading-message {
  color: $color-info;
}
</style>