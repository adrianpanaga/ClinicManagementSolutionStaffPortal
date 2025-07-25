<template>
  <div class="lab-results-view">
    <div v-if="patient">
      <h2 class="section-title">Lab Results for {{ patient.fullName }} (ID: {{ patient.patientId }})</h2>
      <div class="patient-info-card card">
        <p><strong>Date of Birth:</strong> {{ formatDate(patient.dateOfBirth) }}</p>
        <p><strong>Contact:</strong> {{ patient.contactNumber }}</p>
        <p><strong>Email:</strong> {{ patient.email }}</p>
        <router-link :to="{ name: 'patient-history', params: { patientId: patient.patientId } }" class="btn btn-primary btn-sm mt-3">
          <font-awesome-icon :icon="['fas', 'file-medical']" class="icon" /> View Medical History
        </router-link>
        <router-link :to="{ name: 'clinic-visits', params: { patientId: patient.patientId } }" class="btn btn-secondary btn-sm mt-3 ml-2">
          <font-awesome-icon :icon="['fas', 'calendar-alt']" class="icon" /> View Visit History
        </router-link>
        <router-link :to="{ name: 'triage-records', params: { patientId: patient.patientId } }" class="btn btn-info btn-sm mt-3 ml-2">
          <font-awesome-icon :icon="['fas', 'heartbeat']" class="icon" /> View Triage Records
        </router-link>
      </div>

      <h3 class="subsection-title">Recorded Lab Results</h3>
      <div v-if="loadingResults" class="loading-message">
        <font-awesome-icon :icon="['fas', 'spinner']" spin class="icon" /> Loading lab results...
      </div>
      <div v-else-if="resultsError" class="error-message">
        {{ resultsError }}
      </div>
      <div v-else-if="labResults.length === 0" class="no-records-message">
        No lab results found for this patient.
        <button v-if="canAddLabResult" @click="openAddForm" class="btn btn-primary mt-3">
          <font-awesome-icon :icon="['fas', 'plus']" class="icon" /> Add New Lab Result
        </button>
      </div>
      <div v-else class="lab-results-list">
        <div v-for="result in labResults" :key="result.labResultId" class="lab-result-card card">
          <div class="result-header">
            <h4><font-awesome-icon :icon="['fas', 'vials']" class="icon" /> {{ result.testName }} ({{ formatDate(result.resultDate) }})</h4>
            <span class="result-value">{{ result.resultValue }} {{ result.unit }}</span>
          </div>
          <div class="result-details-grid">
            <div class="detail-item"><strong>Reference Range:</strong> {{ result.referenceRange || 'N/A' }}</div>
            <div class="detail-item"><strong>Ordered By:</strong> {{ result.orderedByStaff?.fullName || 'N/A' }}</div>
            <div class="detail-item full-width">
              <strong>Interpretation:</strong> {{ result.interpretation || 'No interpretation provided.' }}
            </div>
            <div v-if="result.medicalRecord" class="detail-item">
              <strong>Linked Medical Record:</strong> {{ formatDateTime(result.medicalRecord.createdAt) }} (Diagnosis: {{ result.medicalRecord.diagnosis || 'N/A' }})
            </div>
            <div v-if="result.appointment" class="detail-item">
              <strong>Linked Appointment:</strong> {{ formatDateTime(result.appointment.appointmentDate) }} {{ result.appointment.appointmentTime }}
            </div>
          </div>
          <div class="result-actions" v-if="canEditLabResult">
            <button @click="editResult(result)" class="btn btn-info btn-sm">
              <font-awesome-icon :icon="['fas', 'edit']" class="icon" /> Edit
            </button>
            <button @click="deleteResult(result.labResultId)" class="btn btn-danger btn-sm ml-2">
              <font-awesome-icon :icon="['fas', 'trash']" class="icon" /> Delete
            </button>
          </div>
        </div>
        <button v-if="!showAddForm && canAddLabResult" @click="openAddForm" class="btn btn-primary mt-3">
          <font-awesome-icon :icon="['fas', 'plus']" class="icon" /> Add New Lab Result
        </button>
      </div>
    </div>
    <div v-else-if="loadingPatient" class="loading-message">
      <font-awesome-icon :icon="['fas', 'spinner']" spin class="icon" /> Loading patient details...
    </div>
    <div v-else-if="patientError" class="error-message">
      {{ patientError }}
    </div>

    <div v-if="showAddForm || editingResult" class="add-edit-form card mt-4">
      <h3>{{ editingResult ? 'Edit Lab Result' : 'Add New Lab Result' }}</h3>
      <form @submit.prevent="saveLabResult">
        <div class="form-group-grid">
          <div class="form-group">
            <label for="testName">Test Name:</label>
            <input type="text" id="testName" v-model="currentLabResult.testName" class="form-control" required />
          </div>
          <div class="form-group">
            <label for="resultValue">Result Value:</label>
            <input type="text" id="resultValue" v-model="currentLabResult.resultValue" class="form-control" required />
          </div>
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
            <label for="medicalRecordId">Linked Medical Record ID (Optional):</label>
            <input type="number" id="medicalRecordId" v-model.number="currentLabResult.medicalRecordId" class="form-control" />
          </div>
          <div class="form-group">
            <label for="appointmentId">Linked Appointment ID (Optional):</label>
            <input type="number" id="appointmentId" v-model.number="currentLabResult.appointmentId" class="form-control" />
          </div>
          <div class="form-group">
            <label for="orderedByStaffId">Ordered By Staff ID (Optional):</label>
            <input type="number" id="orderedByStaffId" v-model.number="currentLabResult.orderedByStaffId" class="form-control" />
          </div>
          <div class="form-group full-width">
            <label for="interpretation">Interpretation:</label>
            <textarea id="interpretation" v-model="currentLabResult.interpretation" class="form-control"></textarea>
          </div>
        </div>
        <div class="form-actions">
          <button type="submit" class="btn btn-success">
            <font-awesome-icon :icon="['fas', 'save']" class="icon" /> Save Result
          </button>
          <button type="button" @click="cancelForm" class="btn btn-secondary ml-2">
            <font-awesome-icon :icon="['fas', 'times']" class="icon" /> Cancel
          </button>
        </div>
        <div v-if="formError" class="error-message mt-3">{{ formError }}</div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import { useRoute } from 'vue-router';
import apiClient from '../api/authApi.js';
import { authStore } from '../stores/auth.js';

const route = useRoute();
const patientId = ref(null);

const patient = ref(null);
const labResults = ref([]);

const loadingPatient = ref(true);
const loadingResults = ref(true);
const patientError = ref('');
const resultsError = ref('');
const formError = ref('');

const showAddForm = ref(false);
const editingResult = ref(null);
const currentLabResult = ref({});

// Computed properties for role-based permissions
const canAddLabResult = computed(() => {
  const roles = authStore.userRoles;
  return roles.includes('Admin') || roles.includes('LabTech') || roles.includes('Doctor') || roles.includes('Nurse');
});

const canEditLabResult = computed(() => {
  const roles = authStore.userRoles;
  return roles.includes('Admin') || roles.includes('LabTech') || roles.includes('Doctor') || roles.includes('Nurse');
});

const fetchPatientData = async (id) => {
  loadingPatient.value = true;
  patientError.value = '';
  try {
    const response = await apiClient.get(`/Patients/${id}`);
    patient.value = response.data;
  } catch (error) {
    console.error(`Failed to fetch patient with ID ${id}:`, error);
    patientError.value = `Failed to load patient details. ${error.response?.data?.detail || error.message || error.response?.statusText}`;
  } finally {
    loadingPatient.value = false;
  }
};

const fetchLabResults = async (id) => {
  loadingResults.value = true;
  resultsError.value = '';
  try {
    const response = await apiClient.get(`/LabResults/patient/${id}`);
    labResults.value = response.data;
  } catch (error) {
    console.error(`Failed to fetch lab results for patient ID ${id}:`, error);
    if (error.response && error.response.status === 404) {
      resultsError.value = 'No lab results found for this patient.';
    } else if (error.response && error.response.status === 403) {
      resultsError.value = 'Access Denied: You do not have permission to view these records.';
    } else {
      resultsError.value = `Failed to load lab results. ${error.response?.data?.detail || error.message || error.response?.statusText}`;
    }
    labResults.value = [];
  } finally {
    loadingResults.value = false;
  }
};

const openAddForm = () => {
  editingResult.value = null;
  // Initialize date field correctly for type="date" input
  const today = new Date().toISOString().split('T')[0];
  currentLabResult.value = { PatientId: patientId.value, ResultDate: today };
  showAddForm.value = true;
  formError.value = '';
};

const editResult = (result) => {
  showAddForm.value = false;
  editingResult.value = { ...result };
  // Convert date string from API (e.g., "YYYY-MM-DDTHH:MM:SS") to "YYYY-MM-DD" for type="date" input
  currentLabResult.value = {
    ...result,
    ResultDate: result.resultDate ? new Date(result.resultDate).toISOString().split('T')[0] : null
  };
  formError.value = '';
};

const cancelForm = () => {
  showAddForm.value = false;
  editingResult.value = null;
  currentLabResult.value = {};
  formError.value = '';
};

const saveLabResult = async () => {
  formError.value = '';
  try {
    const payload = { ...currentLabResult.value };
    // Ensure numeric fields are correctly parsed as numbers
    payload.MedicalRecordId = payload.MedicalRecordId ? parseInt(payload.MedicalRecordId) : null;
    payload.AppointmentId = payload.AppointmentId ? parseInt(payload.AppointmentId) : null;
    payload.OrderedByStaffId = payload.OrderedByStaffId ? parseInt(payload.OrderedByStaffId) : null;

    if (editingResult.value) {
      await apiClient.put(`/LabResults/${payload.labResultId}`, payload);
    } else {
      await apiClient.post('/LabResults', payload);
    }
    cancelForm();
    fetchLabResults(patientId.value);
  } catch (error) {
    console.error('Failed to save lab result:', error);
    formError.value = `Failed to save result: ${error.response?.data?.detail || error.message || error.response?.statusText}`;
  }
};

const deleteResult = async (id) => {
  if (confirm('Are you sure you want to delete this lab result?')) {
    try {
      await apiClient.delete(`/LabResults/${id}`);
      fetchLabResults(patientId.value);
    } catch (error) {
      console.error('Failed to delete lab result:', error);
      alert(`Failed to delete result: ${error.response?.data?.detail || error.message || error.response?.statusText}`);
    }
  }
};


// Helper functions for date formatting (copied from PatientHistoryView)
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Invalid Date';
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return date.toLocaleDateString(undefined, options);
};

const formatDateTime = (dateTimeString) => {
  if (!dateTimeString) return 'N/A';
  const date = new Date(dateTimeString);
  if (isNaN(date.getTime())) return 'Invalid Date';
  const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  return date.toLocaleDateString(undefined, options);
};

// Watch for changes in route.params.patientId
watch(() => route.params.patientId, (newId) => {
  if (newId) {
    const parsedId = parseInt(newId);
    if (!isNaN(parsedId)) {
      patientId.value = parsedId;
      fetchPatientData(parsedId);
      fetchLabResults(parsedId);
      cancelForm();
    } else {
      console.error("Invalid patient ID received:", newId);
      patientError.value = "Invalid patient ID provided in URL.";
    }
  }
}, { immediate: true });
</script>

<style lang="scss" scoped>
@import '../assets/styles/_variables.scss';

.lab-results-view {
  padding: $spacing-lg;
}

.section-title {
  color: $color-primary-blue;
  margin-bottom: $spacing-lg;
  text-align: center;
}

.subsection-title {
  color: $color-text-dark;
  margin-top: $spacing-xl;
  margin-bottom: $spacing-md;
  border-bottom: 1px solid $color-border-darker;
  padding-bottom: $spacing-xs;
}

.patient-info-card {
  text-align: left;
  padding: $spacing-md $spacing-lg;
  background-color: $color-bg-white;
  border-radius: $border-radius-md;
  box-shadow: $box-shadow-sm;
  margin-bottom: $spacing-xl;

  p {
    margin: $spacing-xs 0;
    color: $color-text-medium-grey;
  }

  strong {
    color: $color-text-dark;
  }

  .btn {
    display: inline-flex;
    align-items: center;
    gap: $spacing-xs;
    margin-top: $spacing-md;
  }

  .ml-2 {
    margin-left: $spacing-sm;
  }
}

.loading-message, .error-message, .no-records-message {
  text-align: center;
  padding: $spacing-md;
  margin-top: $spacing-lg;
  border-radius: $border-radius-sm;
  font-weight: bold;
}

.loading-message {
  color: $color-info;
  background-color: lighten($color-info, 30%);
}

.error-message {
  color: $color-error;
  background-color: lighten($color-error, 40%);
  border: 1px solid $color-error;
}

.no-records-message {
  color: $color-secondary-grey;
  background-color: lighten($color-secondary-grey, 40%);
}

.lab-results-list {
  display: grid;
  gap: $spacing-lg;
}

.lab-result-card {
  background-color: $color-bg-white;
  padding: $spacing-lg;
  border-radius: $border-radius-md;
  box-shadow: $box-shadow-md;
  overflow: hidden;

  .result-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $spacing-md;
    padding-bottom: $spacing-xs;
    border-bottom: 1px dashed $color-border-medium;

    h4 {
      margin: 0;
      color: $color-primary-blue;
      font-size: 1.2rem;

      .icon {
        margin-right: $spacing-xs;
      }
    }

    .result-value {
      font-size: 0.95rem;
      color: $color-text-dark;
      font-weight: bold;
    }
  }

  .result-details-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: $spacing-sm $spacing-md;

    .detail-item {
      padding: $spacing-xs 0;
      word-break: break-word;
      color: $color-text-dark;
      font-size: 0.95rem;

      strong {
        display: block;
        color: $color-secondary-grey;
        margin-bottom: $spacing-xs;
      }

      &.full-width {
        grid-column: 1 / -1;
      }
    }
  }

  .result-actions {
    margin-top: $spacing-md;
    text-align: right;

    .btn {
      margin-left: $spacing-sm; // Space between buttons
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