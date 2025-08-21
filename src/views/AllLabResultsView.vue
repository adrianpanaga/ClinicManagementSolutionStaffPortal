<template>
  <div class="all-lab-results-view">
    <div v-if="hasPermission">
      <h2 class="section-title">All Lab Results</h2>
      <p class="subtitle">A comprehensive list of all lab tests conducted for every patient.</p>

      <div class="search-and-actions">
        <div class="form-group search-group">
          <input type="text" v-model="searchTerm" @input="debounceSearch" class="form-control search-input" placeholder="Search by patient name, test name..." />
          <font-awesome-icon :icon="['fas', 'search']" class="search-icon" />
        </div>
      </div>

      <div v-if="loading" class="loading-message">
        <font-awesome-icon :icon="['fas', 'spinner']" spin /> Loading all lab results...
      </div>
      <div v-else-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>

      <div v-else-if="filteredResults.length === 0" class="no-records-message">
        No lab results found.
      </div>
      
      <div v-else class="lab-results-table-container card">
        <table class="data-table">
          <thead>
            <tr>
              <th>Test Name</th>
              <th>Patient</th>
              <th>Result</th>
              <th>Date</th>
              <th>Ordered By</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="result in filteredResults" :key="result.labResultId">
              <td>{{ result.testName }}</td>
              <td>
                <router-link :to="{ name: 'patient-lab-results', params: { patientId: result.patientId } }">
                  {{ result.patient.firstName }} {{ result.patient.lastName }}
                </router-link>
              </td>
              <td>{{ result.resultValue }} {{ result.unit }}</td>
              <td>{{ formatDate(result.resultDate) }}</td>
              <td>
                {{ result.orderedByStaff?.firstName }} {{ result.orderedByStaff?.lastName }}
              </td>
              <td>
                <router-link :to="{ name: 'lab-result-detail', params: { id: result.labResultId } }">
                  <font-awesome-icon :icon="['fas', 'vials']" /> View Lab Result
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
import { debounce } from 'lodash';

const labResults = ref([]);
const filteredResults = ref([]);
const searchTerm = ref('');
const loading = ref(true);
const errorMessage = ref('');
let searchTimeout = null;

// --- Computed property for role-based permissions
const hasPermission = computed(() => {
  const roles = authStore.userRoles;
  return roles.includes('Admin') || roles.includes('Doctor') || roles.includes('Nurse') || roles.includes('LabTech');
});

// --- Data Fetching
const fetchAllLabResults = async () => {
  loading.value = true;
  errorMessage.value = '';
  try {
    const response = await apiClient.get('/api/LabResults');
    labResults.value = response.data;
    // Update the filtered results to also reflect the change
    filteredResults.value = response.data;
  } catch (error) {
    console.error('Error fetching all lab results:', error);
    errorMessage.value = `Failed to load lab results: ${error.response?.data?.detail || error.message || error.response?.statusText}`;
  } finally {
    loading.value = false;
  }
};

// --- Search Logic
const search = () => {
  if (!searchTerm.value) {
    filteredResults.value = labResults.value;
    return;
  }
  const lowerCaseSearchTerm = searchTerm.value.toLowerCase();
  filteredResults.value = labResults.value.filter(result => 
    (result.patient && `${result.patient.firstName} ${result.patient.lastName}`.toLowerCase().includes(lowerCaseSearchTerm)) ||
    (result.testName?.toLowerCase().includes(lowerCaseSearchTerm)) ||
    (result.orderedByStaff && `${result.orderedByStaff.firstName} ${result.orderedByStaff.lastName}`.toLowerCase().includes(lowerCaseSearchTerm))
  );
};
const debounceSearch = debounce(search, 300);

// --- Helper functions
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Invalid Date';
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return date.toLocaleDateString(undefined, options);
};

// --- Lifecycle Hook
onMounted(async () => {
  if (!hasPermission.value) {
    loading.value = false;
    return;
  }
  await fetchAllLabResults();
});
</script>

<style lang="scss" scoped>
@import '../assets/styles/_variables.scss';

.all-lab-results-view {
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

.lab-results-table-container {
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