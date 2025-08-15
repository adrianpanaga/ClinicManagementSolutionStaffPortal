<template>
  <div class="patient-history-view">
    <div v-if="patient">
      <h2 class="section-title">Patient History for {{ patient.fullName }} (ID: {{ patient.patientId }})</h2>
      <div class="patient-info-card card">
        <p><strong>Date of Birth:</strong> {{ formatDate(patient.dateOfBirth) }}</p>
        <p><strong>Contact:</strong> {{ patient.contactNumber }}</p>
        <p><strong>Email:</strong> {{ patient.email }}</p>
        <p v-if="patient.bloodType"><strong>Blood Type:</strong> {{ patient.bloodType }}</p>
        <router-link :to="{ name: 'clinic-visits', params: { patientId: patient.patientId } }" class="btn btn-secondary btn-sm mt-3">
          <font-awesome-icon :icon="['fas', 'calendar-alt']" class="icon" /> View Visit History
        </router-link>
        <router-link :to="{ name: 'triage-records', params: { patientId: patient.patientId } }" class="btn btn-info btn-sm mt-3 ml-2">
          <font-awesome-icon :icon="['fas', 'heartbeat']" class="icon" /> View Triage Records
        </router-link>
        </div>

      <h3 class="subsection-title">Medical Records</h3>
      <div v-if="loadingRecords" class="loading-message">
        <font-awesome-icon :icon="['fas', 'spinner']" spin class="icon" /> Loading medical records...
      </div>
      <div v-else-if="recordsError" class="error-message">
        {{ recordsError }}
      </div>
      <div v-else-if="medicalRecords.length === 0" class="no-records-message">
        No medical records found for this patient.
      </div>
      <div v-else class="medical-records-list">
        <div v-for="record in medicalRecords" :key="record.recordId" class="medical-record-card card">
          <div class="record-header">
            <h4><font-awesome-icon :icon="['fas', 'file-medical']" class="icon" /> Record Date: {{ formatDateTime(record.createdAt) }}</h4>
            <span class="record-staff">
              <font-awesome-icon :icon="['fas', 'user-doctor']" class="icon" /> {{ record.staff?.fullName || 'N/A' }} ({{ record.staff?.jobTitle || 'Staff' }})
            </span>
          </div>
          <div class="record-details-grid">
            <div class="detail-item">
              <strong>Service:</strong> {{ record.service?.serviceName || 'N/A' }}
            </div>
            <div class="detail-item">
              <strong>Appointment:</strong>
              <span v-if="record.appointment">
                {{ formatDateTime(record.appointment.appointmentDate) }} {{ record.appointment.appointmentTime }}
              </span>
              <span v-else>N/A</span>
            </div>
            <div class="detail-item full-width">
              <strong>Diagnosis:</strong> {{ record.diagnosis || 'N/A' }}
            </div>
            <div class="detail-item full-width">
              <strong>Treatment:</strong> {{ record.treatment || 'N/A' }}
            </div>
            <div class="detail-item full-width">
              <strong>Prescription:</strong> {{ record.prescription || 'N/A' }}
            </div>
            </div>
        </div>
      </div>
    </div>
    <div v-else-if="loadingPatient" class="loading-message">
      <font-awesome-icon :icon="['fas', 'spinner']" spin class="icon" /> Loading patient details...
    </div>
    <div v-else-if="patientError" class="error-message">
      {{ patientError }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import apiClient from '../api/authApi.js';

const route = useRoute();
const patientId = ref(null); // This will hold the integer patient ID

const patient = ref(null);
const medicalRecords = ref([]);

const loadingPatient = ref(true);
const loadingRecords = ref(true);
const patientError = ref('');
const recordsError = ref('');

const fetchPatientData = async (id) => {
  loadingPatient.value = true;
  patientError.value = '';
  try {
    // Assuming you have a GET /api/Patients/{id} endpoint that returns a single patient
  const response = await apiClient.get(`/api/Patients/${id}`);
    patient.value = response.data;
  } catch (error) {
    console.error(`Failed to fetch patient with ID ${id}:`, error);
    patientError.value = `Failed to load patient details. ${error.response?.data?.detail || error.message || error.response?.statusText}`;
  } finally {
    loadingPatient.value = false;
  }
};

const fetchMedicalRecords = async (id) => {
  loadingRecords.value = true;
  recordsError.value = '';
  try {
    // Your backend GetMedicalRecordsByPatient uses /MedicalRecords/patient/{patientId}
    const response = await apiClient.get(`/api/MedicalRecords/patient/${id}`);
    medicalRecords.value = response.data;
  } catch (error) {
    console.error(`Failed to fetch medical records for patient ID ${id}:`, error);
    if (error.response && error.response.status === 404) {
      recordsError.value = 'No medical records found for this patient.';
    } else if (error.response && error.response.status === 403) {
      recordsError.value = 'Access Denied: You do not have permission to view these records.';
    }
    else {
      recordsError.value = `Failed to load medical records. ${error.response?.data?.detail || error.message || error.response?.statusText}`;
    }
    medicalRecords.value = []; // Clear records on error or no records found
  } finally {
    loadingRecords.value = false;
  }
};

// Helper function to format dates
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  // Check if the date is valid
  if (isNaN(date.getTime())) return 'Invalid Date';
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return date.toLocaleDateString(undefined, options);
};

// Helper function to format date-time
const formatDateTime = (dateTimeString) => {
  if (!dateTimeString) return 'N/A';
  const date = new Date(dateTimeString);
  // Check if the date is valid
  if (isNaN(date.getTime())) return 'Invalid Date';
  const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  return date.toLocaleDateString(undefined, options);
};

// Watch for changes in route.params.id (if navigating between patient histories)
watch(() => route.params.patientId, (newId) => {
  if (newId) {
    // Parse the ID as an integer
    const parsedId = parseInt(newId);
    if (!isNaN(parsedId)) {
      patientId.value = parsedId;
      fetchPatientData(parsedId);
      fetchMedicalRecords(parsedId);
    } else {
      console.error("Invalid patient ID received:", newId);
      patientError.value = "Invalid patient ID provided in URL.";
    }
  }
}, { immediate: true }); // immediate: true fetches data on initial component mount
</script>

<style lang="scss" scoped>
@import '../assets/styles/_variables.scss';

.page-container { padding: $spacing-lg; }

.ml-2 { // Ensure this margin-left class is defined in your SCSS
  margin-left: $spacing-sm;
}
</style>