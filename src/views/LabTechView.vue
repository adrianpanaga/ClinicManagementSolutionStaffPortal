<template>
  <div class="lab-tech-view">
    <h2 class="section-title">Lab Technician Dashboard</h2>

    <div v-if="loading" class="loading-message">
      <i class="fas fa-spinner icon" spin></i> Loading dashboard...
    </div>
    <div v-else-if="errorMessage" class="error-message">
      {{ errorMessage }}
    </div>

    <div v-else class="lab-tech-grid">
      <div class="card grid-item grid-item-full-width">
        <div class="card-header">
          <h3><i class="fas fa-flask"></i> Pending Lab Orders ({{ formatDate(today) }})</h3>
        </div>
        <div class="card-body">
          <div v-if="loadingLabOrders" class="loading-message-small">Loading orders...</div>
          <div v-else-if="pendingLabOrders.length === 0" class="no-records-message">
            No pending lab orders for today.
          </div>
          <div v-else class="lab-orders-table">
            <table>
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Test Name</th>
                  <th>Ordered Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="order in pendingLabOrders" :key="order.labResultId">
                  <td>
                    <router-link :to="{ name: 'patient-history', params: { patientId: order.patient.patientId } }">
                      {{ order.patient.firstName + ' ' + order.patient.lastName }}
                    </router-link>
                  </td>
                  <td>{{ order.testName }}</td>
                  <td>{{ formatDate(order.createdAt) }}</td>
                  <td>
                    <button @click="openEnterResultForm(order)" class="btn btn-sm btn-primary">Enter Result</button>
                    <router-link :to="{ name: 'patient-lab-results', params: { patientId: order.patient.patientId } }" class="btn btn-sm btn-info ml-1">View All</router-link>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="card grid-item">
        <div class="card-header">
          <h3><i class="fas fa-magnifying-glass"></i> Patient Lookup</h3>
        </div>
        <div class="card-body">
          <div class="form-group">
            <input type="text" v-model="patientSearchTerm" @input="debouncePatientSearch" class="form-control" placeholder="Search by name, contact, or email" />
          </div>
          <div v-if="loadingPatientSearch" class="loading-message-small">Searching...</div>
          <div v-else-if="patientSearchResults.length === 0 && patientSearchTerm.length > 2" class="no-records-message">
            No patients found matching "{{ patientSearchTerm }}".
          </div>
          <div v-else-if="patientSearchResults.length > 0" class="search-results-list">
            <ul>
              <li v-for="patient in patientSearchResults" :key="patient.patientId">
                <router-link :to="{ name: 'patient-history', params: { patientId: patient.patientId } }">
                  {{ patient.firstName + ' ' + patient.lastName }} ({{ patient.contactNumber }})
                </router-link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div class="card grid-item">
        <div class="card-header">
          <h3><i class="fas fa-plus-circle"></i> Quick Entry</h3>
        </div>
        <div class="card-body">
          <button @click="openQuickAddResultForm" class="btn btn-primary btn-block">Add New Lab Result</button>
          <ul class="quick-links mt-3">
            <li><router-link to="/lab-results/all"><i class="fas fa-vials"></i> All Lab Results</router-link></li>
            <li><router-link to="/inventory"><i class="fas fa-boxes-stacked"></i> Check Lab Supplies</router-link></li>
          </ul>
        </div>
      </div>
    </div>

    <div v-if="showQuickAddForm || editingLabResult" class="add-edit-form card mt-4">
      <h3>{{ editingLabResult ? 'Update Lab Result' : 'Add New Lab Result' }}</h3>
      <form @submit.prevent="saveLabResult">
        <div class="form-group">
          <label for="formPatientId">Patient ID:</label>
          <input type="number" id="formPatientId" v-model.number="currentLabResult.patientId" class="form-control" required :disabled="editingLabResult" />
        </div>
        <div class="form-group">
          <label for="testName">Test Name:</label>
          <input type="text" id="testName" v-model="currentLabResult.testName" class="form-control" required />
        </div>
        <div class="form-group">
          <label for="resultValue">Result Value:</label>
          <input type="text" id="resultValue" v-model="currentLabResult.resultValue" class="form-control" required />
        </div>
        <div class="form-group-grid">
          <div class="form-group">
            <label for="unit">Unit:</label>
            <input type="text" id="unit" v-model="currentLabResult.unit" class="form-control" />
          </div>
          <div class="form-group">
            <label for="referenceRange">Reference Range:</label>
            <input type="text" id="referenceRange" v-model="currentLabResult.referenceRange" class="form-control" />
          </div>
          <div class="form-group">
            <label for="resultDate">Result Date:</label>
            <input type="date" id="resultDate" v-model="currentLabResult.resultDate" class="form-control" required />
          </div>
          <div class="form-group">
            <label for="interpretation">Interpretation:</label>
            <textarea id="interpretation" v-model="currentLabResult.interpretation" class="form-control"></textarea>
          </div>
        </div>
        <div class="form-actions">
          <button type="submit" class="btn btn-success">
            <i class="fas fa-save"></i> Save Result
          </button>
          <button type="button" @click="cancelForm" class="btn btn-secondary ml-2">
            <i class="fas fa-times"></i> Cancel
          </button>
        </div>
        <div v-if="formError" class="error-message mt-3">{{ formError }}</div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import apiClient from '../api/authApi.js';
import { authStore } from '../stores/auth.js';
import { useRouter } from 'vue-router';

const router = useRouter();
const loading = ref(true);
const errorMessage = ref('');
const pendingLabOrders = ref([]); // Will represent lab orders (e.g., lab results not yet completed)
const loadingLabOrders = ref(true);

const patientSearchTerm = ref('');
const patientSearchResults = ref([]);
const loadingPatientSearch = ref(false);
let searchTimeout = null;

const today = ref(new Date());

const showQuickAddForm = ref(false);
const editingLabResult = ref(null);
const currentLabResult = ref({});
const formError = ref('');

// Computed properties for role-based permissions
const canAddLabResult = computed(() => {
  const roles = authStore.userRoles;
  return roles.includes('Admin') || roles.includes('LabTech'); // Lab Techs primarily
});

const canEditLabResult = computed(() => {
  const roles = authStore.userRoles;
  return roles.includes('Admin') || roles.includes('LabTech');
});

// Fetch pending lab orders (e.g., lab results that don't have a ResultValue yet, or are IsDeleted=true for "needs review")
const fetchPendingLabOrders = async () => {
  loadingLabOrders.value = true;
  try {
    // For now, let's fetch all lab results and filter them by those that don't have a result value,
    // or simulate "pending" by fetching all and just using a subset.
    // Ideally, you'd have a backend endpoint like /api/LabResults/PendingOrders
    const response = await apiClient.get('/api/LabResults', {
      params: { includeDeleted: false } // Include all non-deleted
    });

    // Simulate "pending" if there's no actual "pending" status in LabResult model
    pendingLabOrders.value = response.data.filter(lr => !lr.resultValue || lr.resultValue.trim() === '');
    // Or, filter by resultDate if you want to show 'today's' pending
    // pendingLabOrders.value = response.data.filter(lr => lr.resultDate === today.value.toISOString().split('T')[0] && (!lr.resultValue || lr.resultValue.trim() === ''));

  } catch (error) {
    console.error('Failed to fetch pending lab orders:', error);
    errorMessage.value = `Failed to load pending lab orders: ${error.response?.data?.detail || error.message || error.response?.statusText}`;
  } finally {
    loadingLabOrders.value = false;
  }
};


const searchPatients = async () => {
  if (patientSearchTerm.value.length < 3) {
    patientSearchResults.value = [];
    return;
  }
  loadingPatientSearch.value = true;
  try {
    const response = await apiClient.get('/api/Patients', {
      params: { searchTerm: patientSearchTerm.value }
    });
    patientSearchResults.value = response.data;
  } catch (error) {
    console.error('Failed to search patients:', error);
    patientSearchResults.value = [];
    errorMessage.value = `Failed to search patients: ${error.response?.data?.detail || error.message || error.response?.statusText}`;
  } finally {
    loadingPatientSearch.value = false;
  }
};

const debouncePatientSearch = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(searchPatients, 300);
};


const openEnterResultForm = (order) => {
  // Populate form with existing order data to enter result
  editingLabResult.value = { ...order };
  currentLabResult.value = {
    ...order,
    ResultDate: order.resultDate ? new Date(order.resultDate).toISOString().split('T')[0] : null
  };
  showQuickAddForm.value = true; // Use same form
  formError.value = '';
};

const openQuickAddResultForm = () => {
  editingLabResult.value = null;
  const todayISO = new Date().toISOString().split('T')[0];
  currentLabResult.value = { PatientId: null, ResultDate: todayISO }; // PatientId will need to be entered
  showQuickAddForm.value = true;
  formError.value = '';
};

const cancelForm = () => {
  showQuickAddForm.value = false;
  editingLabResult.value = null;
  currentLabResult.value = {};
  formError.value = '';
};

const saveLabResult = async () => {
  formError.value = '';
  try {
    const payload = { ...currentLabResult.value };
    payload.PatientId = payload.PatientId ? parseInt(payload.PatientId) : null;
    payload.MedicalRecordId = payload.MedicalRecordId ? parseInt(payload.MedicalRecordId) : null;
    payload.AppointmentId = payload.AppointmentId ? parseInt(payload.AppointmentId) : null;
    payload.OrderedByStaffId = payload.OrderedByStaffId ? parseInt(payload.OrderedByStaffId) : null;

    if (editingLabResult.value) {
      // Update existing result
      await apiClient.put(`/api/LabResults/${payload.labResultId}`, payload);
    } else {
      // Create new result
      await apiClient.post('/api/LabResults', payload);
    }
    cancelForm();
    await fetchPendingLabOrders(); // Refresh the list
  } catch (error) {
    console.error('Failed to save lab result:', error);
    formError.value = `Failed to save result: ${error.response?.data?.detail || error.message || error.response?.statusText}`;
  }
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Invalid Date';
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return date.toLocaleDateString(undefined, options);
};

onMounted(async () => {
  if (!authStore.userRoles.includes('LabTech') && !authStore.userRoles.includes('Admin')) {
    errorMessage.value = "Access Denied: You do not have permission to view the Lab Technician Dashboard.";
    loading.value = false;
    return;
  }

  await fetchPendingLabOrders();
  loading.value = false;
});
</script>

<style lang="scss" scoped>
@import '../assets/styles/_variables.scss';

.lab-tech-view {
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

.lab-tech-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: $spacing-lg;

  @media (min-width: 992px) {
    grid-template-columns: 2fr 1fr;
    grid-template-areas:
      "orders search"
      "orders quick-entry";
  }
}

.grid-item {
  background-color: $color-bg-white;
  border: 1px solid $color-border-medium;
  border-radius: $border-radius-md;
  box-shadow: $box-shadow-sm;
  padding: $spacing-md;

  &.grid-item-full-width {
    @media (min-width: 992px) {
      grid-area: orders;
    }
  }

  .card-header {
    padding-bottom: $spacing-xs;
    margin-bottom: $spacing-md;
    border-bottom: 1px solid $color-border-light;

    h3 {
      margin: 0;
      font-size: 1.3rem;
      color: $color-text-dark;

      .icon {
        margin-right: $spacing-sm;
        color: $color-primary-blue;
      }
    }
  }

  .card-body {
    padding-top: $spacing-xs;
  }
}

.lab-orders-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;

  th, td {
    padding: $spacing-sm;
    text-align: left;
    border-bottom: 1px solid $color-border-light;
  }

  th {
    background-color: $color-bg-light;
    font-weight: bold;
    color: $color-text-dark;
  }

  td {
    color: $color-text-medium-grey;

    .btn-sm {
      padding: 0.25rem 0.5rem;
      font-size: 0.8rem;
    }
    .ml-1 {
      margin-left: $spacing-xs;
    }
    a {
      color: $color-primary-blue;
      text-decoration: none;
      &:hover { text-decoration: underline; }
    }
  }

  tr:hover {
    background-color: $color-bg-light;
  }
}

.search-results-list {
  ul {
    list-style: none;
    padding: 0;
    margin: 0;
    max-height: 200px;
    overflow-y: auto;
    border: 1px solid $color-border-light;
    border-radius: $border-radius-sm;
  }

  li {
    padding: $spacing-sm $spacing-md;
    border-bottom: 1px dashed $color-border-light;
    &:last-child {
      border-bottom: none;
    }
    a {
      text-decoration: none;
      color: $color-primary-blue;
      &:hover {
        text-decoration: underline;
        color: $color-primary-blue-darker;
      }
    }
  }
}

.quick-links {
  list-style: none;
  padding: 0;

  li {
    margin-bottom: $spacing-sm;

    a {
      display: flex;
      align-items: center;
      text-decoration: none;
      color: $color-primary-blue;
      font-weight: bold;
      padding: $spacing-xs 0;
      transition: color 0.2s ease;

      .icon {
        margin-right: $spacing-sm;
        color: $color-secondary-grey;
      }

      &:hover {
        color: $color-primary-blue-darker;
      }
    }
  }
}

/* Form Styles */
.add-edit-form {
  padding: $spacing-lg;
  background-color: $color-bg-white;
  border-radius: $border-radius-lg;
  box-shadow: $box-shadow-md;

  h3 {
    color: $color-primary-blue;
    margin-bottom: $spacing-lg;
    text-align: center;
    border-bottom: 1px solid $color-border-darker;
    padding-bottom: $spacing-md;
  }

  .form-group {
    margin-bottom: $spacing-md;
    text-align: left;
  }

  .form-group-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: $spacing-md;
    margin-bottom: $spacing-md;

    .full-width {
      grid-column: 1 / -1;
    }
  }

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

    &:focus {
      outline: none;
      border-color: $color-primary-blue;
      box-shadow: 0 0 0 0.2rem rgba($color-primary-blue, 0.25);
    }
  }

  textarea.form-control {
    min-height: 80px;
    resize: vertical;
  }

  .form-actions {
    text-align: right;
    margin-top: $spacing-lg;

    .btn {
      min-width: 120px;
      padding: $spacing-sm $spacing-md;
      font-size: 1rem;
      margin-left: $spacing-sm; // Space between action buttons
    }
  }
}
</style>