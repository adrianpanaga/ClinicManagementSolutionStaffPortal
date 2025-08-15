<template>
  <div class="triage-records-view">
    <div v-if="patient">
      <h2 class="section-title">Triage Records for {{ patient.fullName }} (ID: {{ patient.patientId }})</h2>
      <div class="patient-info-card card">
        <p><strong>Date of Birth:</strong> {{ formatDate(patient.dateOfBirth) }}</p>
        <p><strong>Contact:</strong> {{ patient.contactNumber }}</p>
        <p><strong>Email:</strong> {{ patient.email }}</p>
        <router-link :to="{ name: 'patient-history', params: { patientId: patient.patientId } }" class="btn btn-primary btn-sm mt-3">
          <font-awesome-icon :icon="['fas', 'file-medical']" class="icon" /> View Medical History
        </router-link>
        <router-link :to="{ name: 'lab-results', params: { patientId: patient.patientId } }" class="btn btn-success btn-sm mt-3 ml-2">
          <font-awesome-icon :icon="['fas', 'vials']" class="icon" /> View Lab Results
        </router-link>
        <router-link :to="{ name: 'patient-documents', params: { patientId: patient.patientId } }" class="btn btn-dark btn-sm mt-3 ml-2">
          <font-awesome-icon :icon="['fas', 'file-alt']" class="icon" /> View Documents
        </router-link>
      </div>

      <h3 class="subsection-title">Triage Entries</h3>
      <div v-if="loadingTriage" class="loading-message">
        <font-awesome-icon :icon="['fas', 'spinner']" spin class="icon" /> Loading triage records...
      </div>
      <div v-else-if="triageError" class="error-message">
        {{ triageError }}
      </div>
      <div v-else-if="triageRecords.length === 0" class="no-records-message">
        No triage records found for this patient.
        <button v-if="canAddTriage" @click="openAddForm" class="btn btn-primary mt-3">
          <font-awesome-icon :icon="['fas', 'plus']" class="icon" /> Add New Triage Record
        </button>
      </div>
      <div v-else class="triage-records-list">
        <div v-for="record in triageRecords" :key="record.recordId" class="triage-record-card card">
          <div class="record-header">
            <h4><font-awesome-icon :icon="['fas', 'heartbeat']" class="icon" /> Triage Date: {{ formatDateTime(record.createdAt) }}</h4>
          </div>
          <div class="record-details-grid">
            <div class="detail-item">
              <strong>Temperature:</strong> {{ record.temperature || 'N/A' }} °C
            </div>
            <div class="detail-item">
              <strong>Blood Pressure:</strong> {{ record.bloodPressure || 'N/A' }} mmHg
            </div>
            <div class="detail-item">
              <strong>Pulse Rate:</strong> {{ record.pulseRate || 'N/A' }} bpm
            </div>
            <div class="detail-item">
              <strong>Respiration Rate:</strong> {{ record.respirationRate || 'N/A' }} rpm
            </div>
            <div class="detail-item">
              <strong>Weight:</strong> {{ record.weight || 'N/A' }} kg
            </div>
            <div class="detail-item">
              <strong>Height:</strong> {{ record.height || 'N/A' }} cm
            </div>
            <div class="detail-item full-width">
              <strong>Chief Complaint:</strong> {{ record.chiefComplaint || 'N/A' }}
            </div>
            <div class="detail-item full-width">
              <strong>Notes:</strong> {{ record.notes || 'No notes.' }}
            </div>
          </div>
          <div class="record-actions" v-if="canEditTriage">
            <button @click="editTriageRecord(record)" class="btn btn-info btn-sm">
              <font-awesome-icon :icon="['fas', 'edit']" class="icon" /> Edit
            </button>
            <button @click="deleteTriageRecord(record.recordId)" class="btn btn-danger btn-sm ml-2">
              <font-awesome-icon :icon="['fas', 'trash']" class="icon" /> Delete
            </button>
          </div>
        </div>
        <button v-if="!showAddForm && canAddTriage" @click="openAddForm" class="btn btn-primary mt-3">
          <font-awesome-icon :icon="['fas', 'plus']" class="icon" /> Add New Triage Record
        </button>
      </div>
    </div>
    <div v-else-if="loadingPatient" class="loading-message">
      <font-awesome-icon :icon="['fas', 'spinner']" spin class="icon" /> Loading patient details...
    </div>
    <div v-else-if="patientError" class="error-message">
      {{ patientError }}
    </div>

    <div v-if="showAddForm || editingTriage" class="modal-overlay">
      <div class="modal-content card">
        <h3>{{ editingTriage ? 'Edit Triage Record' : 'Add New Triage Record' }}</h3>
        <form @submit.prevent="saveTriageRecord">
          <div class="form-group-grid">
            <div class="form-group">
              <label for="temperature">Temperature (°C):</label>
              <input type="number" step="0.1" id="temperature" v-model.number="currentTriageRecord.temperature" class="form-control" />
            </div>
            <div class="form-group">
              <label for="bloodPressure">Blood Pressure (mmHg):</label>
              <input type="text" id="bloodPressure" v-model="currentTriageRecord.bloodPressure" class="form-control" placeholder="e.g., 120/80" />
            </div>
            <div class="form-group">
              <label for="pulseRate">Pulse Rate (bpm):</label>
              <input type="number" id="pulseRate" v-model.number="currentTriageRecord.pulseRate" class="form-control" />
            </div>
            <div class="form-group">
              <label for="respirationRate">Respiration Rate (rpm):</label>
              <input type="number" id="respirationRate" v-model.number="currentTriageRecord.respirationRate" class="form-control" />
            </div>
            <div class="form-group">
              <label for="weight">Weight (kg):</label>
              <input type="number" step="0.1" id="weight" v-model.number="currentTriageRecord.weight" class="form-control" />
            </div>
            <div class="form-group">
              <label for="height">Height (cm):</label>
              <input type="number" step="0.1" id="height" v-model.number="currentTriageRecord.height" class="form-control" />
            </div>
            <div class="form-group full-width">
              <label for="chiefComplaint">Chief Complaint:</label>
              <textarea id="chiefComplaint" v-model="currentTriageRecord.chiefComplaint" class="form-control" required></textarea>
            </div>
            <div class="form-group full-width">
              <label for="notes">Notes:</label>
              <textarea id="notes" v-model="currentTriageRecord.notes" class="form-control"></textarea>
            </div>
          </div>
          <div class="form-actions">
            <button type="submit" class="btn btn-success">
              <font-awesome-icon :icon="['fas', 'save']" class="icon" /> Save Record
            </button>
            <button type="button" @click="cancelForm" class="btn btn-secondary ml-2">
              <font-awesome-icon :icon="['fas', 'times']" class="icon" /> Cancel
            </button>
          </div>
          <div v-if="formError" class="error-message mt-3">{{ formError }}</div>
        </form>
      </div>
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
const triageRecords = ref([]);

const loadingPatient = ref(true);
const loadingTriage = ref(true);
const patientError = ref('');
const triageError = ref('');
const formError = ref('');

const showAddForm = ref(false);
const editingTriage = ref(null);
const currentTriageRecord = ref({});

// --- Role-based permissions
const canAddTriage = computed(() => {
  const roles = authStore.userRoles;
  return roles.includes('Admin') || roles.includes('Nurse');
});
const canEditTriage = computed(() => {
  const roles = authStore.userRoles;
  return roles.includes('Admin') || roles.includes('Nurse');
});

// --- API calls
const fetchPatientData = async (id) => {
  loadingPatient.value = true;
  patientError.value = '';
  try {
  const response = await apiClient.get(`/api/Patients/${id}`);
    patient.value = response.data;
  } catch (error) {
    console.error(`Failed to fetch patient with ID ${id}:`, error);
    patientError.value = `Failed to load patient details. ${error.response?.data?.detail || error.message || error.response?.statusText}`;
  } finally {
    loadingPatient.value = false;
  }
};

const fetchTriageRecords = async (id) => {
  loadingTriage.value = true;
  triageError.value = '';
  try {
    const response = await apiClient.get(`/TriageRecords/patient/${id}`);
    triageRecords.value = response.data;
  } catch (error) {
    console.error(`Failed to fetch triage records for patient ID ${id}:`, error);
    if (error.response && error.response.status === 404) {
      triageError.value = 'No triage records found for this patient.';
    } else if (error.response && error.response.status === 403) {
      triageError.value = 'Access Denied: You do not have permission to view these records.';
    } else {
      triageError.value = `Failed to load triage records. ${error.response?.data?.detail || error.message || error.response?.statusText}`;
    }
    triageRecords.value = [];
  } finally {
    loadingTriage.value = false;
  }
};

// --- Form and Modal Logic
const openAddForm = () => {
  editingTriage.value = null;
  currentTriageRecord.value = { PatientId: patientId.value };
  showAddForm.value = true;
  formError.value = '';
};

const editTriageRecord = (record) => {
  showAddForm.value = false;
  editingTriage.value = { ...record };
  currentTriageRecord.value = { ...record };
  showAddForm.value = true;
  formError.value = '';
};

const cancelForm = () => {
  showAddForm.value = false;
  editingTriage.value = null;
  currentTriageRecord.value = {};
  formError.value = '';
};

const saveTriageRecord = async () => {
  formError.value = '';
  try {
    const payload = { ...currentTriageRecord.value };
    payload.PatientId = payload.patientId; // Correct property name
    
    // Convert numeric inputs to numbers if they exist
    ['temperature', 'pulseRate', 'respirationRate', 'weight', 'height'].forEach(field => {
      if (payload[field] !== null && payload[field] !== undefined) {
        payload[field] = Number(payload[field]);
      }
    });

    if (editingTriage.value) {
      await apiClient.put(`/TriageRecords/${payload.recordId}`, payload);
    } else {
      await apiClient.post('/TriageRecords', payload);
    }
    cancelForm();
    await fetchTriageRecords(patientId.value);
  } catch (error) {
    console.error('Failed to save triage record:', error);
    formError.value = `Failed to save record: ${error.response?.data?.detail || error.message || error.response?.statusText}`;
  }
};

const deleteTriageRecord = async (id) => {
  if (confirm('Are you sure you want to delete this triage record? This action cannot be undone.')) {
    try {
      await apiClient.delete(`/TriageRecords/${id}`);
      await fetchTriageRecords(patientId.value);
    } catch (error) {
      console.error('Failed to delete triage record:', error);
      alert(`Failed to delete record: ${error.response?.data?.detail || error.message || error.response?.statusText}`);
    }
  }
};

// --- Helper functions
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

// --- Lifecycle Hook
watch(() => route.params.patientId, async (newId) => {
  if (newId) {
    const parsedId = parseInt(newId);
    if (!isNaN(parsedId)) {
      patientId.value = parsedId;
      await fetchPatientData(parsedId);
      await fetchTriageRecords(parsedId);
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

.triage-records-view {
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

.triage-records-list {
  display: grid;
  gap: $spacing-lg;
}

.triage-record-card {
  background-color: $color-bg-white;
  padding: $spacing-lg;
  border-radius: $border-radius-md;
  box-shadow: $box-shadow-md;
  overflow: hidden;

  .record-header {
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
  }

  .record-details-grid {
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

  .record-actions {
    margin-top: $spacing-md;
    text-align: right;
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
  max-width: 700px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;

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

  .form-group-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: $spacing-md;
    margin-bottom: $spacing-md;
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
  }
}
.ml-2 { margin-left: $spacing-sm; }
.mt-3 { margin-top: $spacing-md; }
</style>