<template>
  <div class="patients-list-view">
    <h2 class="section-title">All Patients</h2>

    <div v-if="loading" class="loading-message">
      <i class="fas fa-spinner icon" spin></i> Loading patient data...
    </div>
    <div v-else-if="errorMessage" class="error-message">
      {{ errorMessage }}
    </div>

    <div v-else class="content-container">
      <div class="search-and-actions">
        <div class="form-group">
          <input type="text" v-model="searchTerm" @input="debouncePatientSearch" class="form-control search-input" placeholder="Search by name, contact, or email" />
          <i class="fas fa-search search-icon"></i>
        </div>
        </div>

      <div v-if="loadingSearch" class="loading-message-small">Searching...</div>
      <div v-else-if="filteredPatients.length === 0" class="no-records-message">
        No patients found.
      </div>
      
      <div v-else class="patients-table-container card">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Full Name</th>
              <th>Contact Number</th>
              <th>Email</th>
              <th>Date of Birth</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="patient in filteredPatients" :key="patient.patientId">
              <td>{{ patient.patientId }}</td>
              <td>{{ patient.firstName }} {{ patient.lastName }}</td>
              <td>{{ patient.contactNumber }}</td>
              <td>{{ patient.email }}</td>
              <td>{{ formatDate(patient.dateOfBirth) }}</td>
              <td>
                <router-link :to="{ name: 'patient-history', params: { patientId: patient.patientId } }" class="btn btn-sm btn-info">
                  <i class="fas fa-file-medical"></i> History
                </router-link>
                <router-link :to="{ name: 'triage-records', params: { patientId: patient.patientId } }" class="btn btn-sm btn-secondary ml-1">
                  <i class="fas fa-heartbeat"></i> Triage
                </router-link>
                <router-link :to="{ name: 'patient-lab-results', params: { patientId: patient.patientId } }" class="btn btn-sm btn-success ml-1">
                  <i class="fas fa-vials"></i> Labs
                </router-link>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import apiClient from '../api/authApi.js';
import { useRouter } from 'vue-router';
import { authStore } from '../stores/auth.js';

const router = useRouter();

const allPatients = ref([]);
const filteredPatients = ref([]);
const loading = ref(true);
const errorMessage = ref('');
const searchTerm = ref('');
const loadingSearch = ref(false);
let searchTimeout = null;

const fetchAllPatients = async () => {
  loading.value = true;
  errorMessage.value = '';
  try {
  const response = await apiClient.get('/api/Patients');
    allPatients.value = response.data;
    filteredPatients.value = response.data;
  } catch (error) {
    console.error('Failed to fetch all patients:', error);
    errorMessage.value = `Failed to load patient data: ${error.response?.data?.detail || error.message || error.response?.statusText}`;
  } finally {
    loading.value = false;
  }
};

const searchPatients = () => {
  loadingSearch.value = true;
  if (!searchTerm.value) {
    filteredPatients.value = allPatients.value;
    loadingSearch.value = false;
    return;
  }
  
  const lowerCaseSearchTerm = searchTerm.value.toLowerCase();
  filteredPatients.value = allPatients.value.filter(patient =>
    (patient.firstName && patient.firstName.toLowerCase().includes(lowerCaseSearchTerm)) ||
    (patient.lastName && patient.lastName.toLowerCase().includes(lowerCaseSearchTerm)) ||
    (patient.contactNumber && patient.contactNumber.toLowerCase().includes(lowerCaseSearchTerm)) ||
    (patient.email && patient.email.toLowerCase().includes(lowerCaseSearchTerm))
  );
  loadingSearch.value = false;
};

const debouncePatientSearch = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(searchPatients, 300);
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Invalid Date';
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return date.toLocaleDateString(undefined, options);
};

onMounted(async () => {
  const allowedRoles = ['Admin', 'Receptionist', 'Doctor', 'Nurse', 'LabTech'];
  const hasPermission = authStore.userRoles.some(role => allowedRoles.includes(role));

  if (!hasPermission) {
    errorMessage.value = "Access Denied: You do not have permission to view the patient list.";
    loading.value = false;
    return;
  }

  await fetchAllPatients();
});
</script>

<style lang="scss" scoped>
@import '../assets/styles/_variables.scss';

.patients-list-view {
  padding: $spacing-lg;
}

.section-title {
  color: $color-primary-blue;
  margin-bottom: $spacing-lg;
  text-align: center;
  font-size: 2rem;
}

.loading-message, .error-message {
  text-align: center;
  padding: $spacing-md;
  margin-top: $spacing-lg;
  border-radius: $border-radius-sm;
  font-weight: bold;
}

.loading-message-small, .no-records-message {
  font-size: 0.9em;
  color: $color-text-medium-grey;
  text-align: center;
  padding: $spacing-sm;
}

.content-container {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.search-and-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: $spacing-md;
  margin-bottom: $spacing-lg;

  .form-group {
    position: relative;
    flex-grow: 1;
    .search-input {
      padding-right: 40px; /* Make space for the icon */
    }
    .search-icon {
      position: absolute;
      right: $spacing-md;
      top: 50%;
      transform: translateY(-50%);
      color: $color-secondary-grey;
    }
  }
}

.patients-table-container {
  overflow-x: auto;
  background-color: $color-bg-white;
  border: 1px solid $color-border-medium;
  border-radius: $border-radius-md;
  box-shadow: $box-shadow-sm;
  padding: $spacing-md;

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
    }

    tr:hover {
      background-color: $color-bg-light;
    }
    .btn {
      margin-left: $spacing-xs;
    }
    .btn-sm {
      padding: 0.25rem 0.5rem;
      font-size: 0.8rem;
    }
    .ml-1 {
      margin-left: $spacing-xs;
    }
  }
}

.form-control {
  width: 100%;
  padding: $spacing-sm;
  border: 1px solid $color-border-medium;
  border-radius: $border-radius-sm;
  box-sizing: border-box;
  font-size: 1rem;
  transition: border-color 0.3s;

  &:focus {
    outline: none;
    border-color: $color-primary-blue;
    box-shadow: 0 0 0 0.2rem rgba($color-primary-blue, 0.25);
  }
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: $spacing-xs;
  padding: $spacing-sm $spacing-md;
  font-size: 1rem;
  font-weight: bold;
  text-decoration: none;
  border-radius: $border-radius-sm;
  transition: background-color 0.3s ease;
  cursor: pointer;
  border: 1px solid transparent;

  &.btn-primary {
    background-color: $color-primary-blue;
    color: $color-bg-white;
    &:hover { background-color: $color-primary-blue-darker; }
  }
  &.btn-info {
    background-color: $color-info;
    color: $color-bg-white;
    &:hover { background-color: darken($color-info, 10%); }
  }
  &.btn-secondary {
    background-color: $color-secondary-grey;
    color: $color-bg-white;
    &:hover { background-color: $color-secondary-grey-darker; }
  }
  &.btn-success {
    background-color: $color-confirm-green;
    color: $color-bg-white;
    &:hover { background-color: $color-confirm-green-darker; }
  }
  &.btn-danger {
    background-color: $color-error;
    color: $color-bg-white;
    &:hover { background-color: darken($color-error, 10%); }
  }
}
</style>