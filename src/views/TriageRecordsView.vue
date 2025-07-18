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
        <router-link :to="{ name: 'clinic-visits', params: { patientId: patient.patientId } }" class="btn btn-secondary btn-sm mt-3 ml-2">
          <font-awesome-icon :icon="['fas', 'calendar-alt']" class="icon" /> View Visit History
        </router-link>
      </div>

      <h3 class="subsection-title">Recorded Triage Entries</h3>
      <div v-if="loadingRecords" class="loading-message">
        <font-awesome-icon :icon="['fas', 'spinner']" spin class="icon" /> Loading triage records...
      </div>
      <div v-else-if="recordsError" class="error-message">
        {{ recordsError }}
      </div>
      <div v-else-if="triageRecords.length === 0" class="no-records-message">
        No triage records found for this patient.
        <button v-if="canAddTriage" @click="openAddForm" class="btn btn-primary mt-3">
          <font-awesome-icon :icon="['fas', 'plus']" class="icon" /> Add New Triage Record
        </button>
      </div>
      <div v-else class="triage-records-list">
        <div v-for="record in triageRecords" :key="record.triageRecordId" class="triage-record-card card">
          <div class="record-header">
            <h4><font-awesome-icon :icon="['fas', 'heartbeat']" class="icon" /> Triage Date: {{ formatDateTime(record.createdAt) }}</h4>
            <span class="record-complaint">{{ record.chiefComplaint || 'No Chief Complaint' }}</span>
          </div>
          <div class="record-details-grid">
            <div class="detail-item"><strong>Temperature:</strong> {{ record.temperature || 'N/A' }} °C</div>
            <div class="detail-item"><strong>BP:</strong> {{ record.bloodPressureSystolic || 'N/A' }}/{{ record.bloodPressureDiastolic || 'N/A' }} mmHg</div>
            <div class="detail-item"><strong>Pulse:</strong> {{ record.pulseRate || 'N/A' }} bpm</div>
            <div class="detail-item"><strong>Respiration:</strong> {{ record.respiratoryRate || 'N/A' }} rpm</div>
            <div class="detail-item"><strong>Weight:</strong> {{ record.weight || 'N/A' }} kg</div>
            <div class="detail-item"><strong>Height:</strong> {{ record.height || 'N/A' }} cm</div>
            <div class="detail-item full-width">
              <strong>Notes:</strong> {{ record.notes || 'No notes.' }}
            </div>
            <div v-if="record.appointment" class="detail-item full-width">
              <strong>Linked Appointment:</strong> {{ formatDateTime(record.appointment.appointmentDate) }} {{ record.appointment.appointmentTime }} - {{ record.appointment.reasonForVisit || 'N/A' }}
            </div>
          </div>
          <div class="record-actions" v-if="canEditTriage">
            <button @click="editRecord(record)" class="btn btn-info btn-sm">
              <font-awesome-icon :icon="['fas', 'edit']" class="icon" /> Edit
            </button>
            <button @click="deleteRecord(record.triageRecordId)" class="btn btn-danger btn-sm ml-2">
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

    <div v-if="showAddForm || editingRecord" class="add-edit-form card mt-4">
      <h3>{{ editingRecord ? 'Edit Triage Record' : 'Add New Triage Record' }}</h3>
      <form @submit.prevent="saveTriageRecord">
        <div class="form-group">
          <label for="chiefComplaint">Chief Complaint:</label>
          <input type="text" id="chiefComplaint" v-model="currentTriage.chiefComplaint" class="form-control" />
        </div>
        <div class="form-group-grid">
          <div class="form-group">
            <label for="temperature">Temperature (°C):</label>
            <input type="number" step="0.1" id="temperature" v-model.number="currentTriage.temperature" class="form-control" />
          </div>
          <div class="form-group">
            <label for="systolicBp">BP (Systolic):</label>
            <input type="number" id="systolicBp" v-model.number="currentTriage.bloodPressureSystolic" class="form-control" />
          </div>
          <div class="form-group">
            <label for="diastolicBp">BP (Diastolic):</label>
            <input type="number" id="diastolicBp" v-model.number="currentTriage.bloodPressureDiastolic" class="form-control" />
          </div>
          <div class="form-group">
            <label for="pulseRate">Pulse Rate (bpm):</label>
            <input type="number" id="pulseRate" v-model.number="currentTriage.pulseRate" class="form-control" />
          </div>
          <div class="form-group">
            <label for="respiratoryRate">Respiratory Rate (rpm):</label>
            <input type="number" id="respiratoryRate" v-model.number="currentTriage.respiratoryRate" class="form-control" />
          </div>
          <div class="form-group">
            <label for="weight">Weight (kg):</label>
            <input type="number" step="0.01" id="weight" v-model.number="currentTriage.weight" class="form-control" />
          </div>
          <div class="form-group">
            <label for="height">Height (cm):</label>
            <input type="number" step="0.01" id="height" v-model.number="currentTriage.height" class="form-control" />
          </div>
          <div class="form-group full-width">
            <label for="notes">Notes:</label>
            <textarea id="notes" v-model="currentTriage.notes" class="form-control"></textarea>
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
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import { useRoute } from 'vue-router';
import apiClient from '../api/authApi.js';
import { authStore } from '../stores/auth.js'; // To check user roles

const route = useRoute();
const patientId = ref(null);

const patient = ref(null);
const triageRecords = ref([]);

const loadingPatient = ref(true);
const loadingRecords = ref(true);
const patientError = ref('');
const recordsError = ref('');
const formError = ref('');

const showAddForm = ref(false);
const editingRecord = ref(null); // Holds the record being edited
const currentTriage = ref({}); // Data for the add/edit form

// Computed properties for role-based permissions
const canAddTriage = computed(() => {
  const roles = authStore.userRoles;
  return roles.includes('Admin') || roles.includes('Nurse') || roles.includes('Receptionist');
});

const canEditTriage = computed(() => {
  const roles = authStore.userRoles;
  return roles.includes('Admin') || roles.includes('Nurse') || roles.includes('Doctor');
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

const fetchTriageRecords = async (id) => {
  loadingRecords.value = true;
  recordsError.value = '';
  try {
    const response = await apiClient.get(`/TriageRecords/patient/${id}`);
    triageRecords.value = response.data;
  } catch (error) {
    console.error(`Failed to fetch triage records for patient ID ${id}:`, error);
    if (error.response && error.response.status === 404) {
      recordsError.value = 'No triage records found for this patient.';
    } else if (error.response && error.response.status === 403) {
      recordsError.value = 'Access Denied: You do not have permission to view these records.';
    } else {
      recordsError.value = `Failed to load triage records. ${error.response?.data?.detail || error.message || error.response?.statusText}`;
    }
    triageRecords.value = [];
  } finally {
    loadingRecords.value = false;
  }
};

const openAddForm = () => {
  editingRecord.value = null;
  currentTriage.value = { PatientId: patientId.value }; // Pre-fill PatientId
  showAddForm.value = true;
  formError.value = '';
};

const editRecord = (record) => {
  showAddForm.value = false; // Hide add form if it was open
  editingRecord.value = { ...record }; // Create a copy to avoid direct mutation
  currentTriage.value = { ...record }; // Populate form with existing data
  formError.value = '';
};

const cancelForm = () => {
  showAddForm.value = false;
  editingRecord.value = null;
  currentTriage.value = {};
  formError.value = '';
};

const saveTriageRecord = async () => {
  formError.value = '';
  try {
    if (editingRecord.value) {
      // Update existing record
      await apiClient.put(`/TriageRecords/${currentTriage.value.triageRecordId}`, currentTriage.value);
    } else {
      // Create new record
      await apiClient.post('/TriageRecords', currentTriage.value);
    }
    cancelForm(); // Close form
    fetchTriageRecords(patientId.value); // Refresh list
  } catch (error) {
    console.error('Failed to save triage record:', error);
    formError.value = `Failed to save record: ${error.response?.data?.detail || error.message || error.response?.statusText}`;
  }
};

const deleteRecord = async (id) => {
  if (confirm('Are you sure you want to delete this triage record?')) {
    try {
      await apiClient.delete(`/TriageRecords/${id}`);
      fetchTriageRecords(patientId.value); // Refresh list
    } catch (error) {
      console.error('Failed to delete triage record:', error);
      alert(`Failed to delete record: ${error.response?.data?.detail || error.message || error.response?.statusText}`);
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
      fetchTriageRecords(parsedId);
      cancelForm(); // Close any open forms when patient changes
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

    .record-complaint {
      font-size: 0.95rem;
      color: $color-text-medium-grey;
      font-weight: bold;
    }
  }

  .record-details-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
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