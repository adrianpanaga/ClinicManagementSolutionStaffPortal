<template>
  <div class="clinic-visit-history-view">
    <div v-if="patient">
      <h2 class="section-title">Visit History for {{ patient.firstName }} {{ patient.lastName }} (ID: {{ patient.patientId }})</h2>
      <div class="patient-info-card card">
        <p><strong>Date of Birth:</strong> {{ formatDate(patient.dateOfBirth) }}</p>
        <p><strong>Contact:</strong> {{ patient.contactNumber }}</p>
        <p><strong>Email:</strong> {{ patient.email }}</p>
        
        <div class="patient-actions mt-3">
          <router-link :to="{ name: 'patient-history', params: { patientId: patient.patientId } }" class="btn btn-primary btn-sm">
            <font-awesome-icon :icon="['fas', 'file-medical']" class="icon" /> View Full Medical History
          </router-link>
          <router-link :to="{ name: 'triage-records', params: { patientId: patient.patientId } }" class="btn btn-info btn-sm ml-2">
            <font-awesome-icon :icon="['fas', 'heartbeat']" class="icon" /> View Triage Records
          </router-link>
          <router-link :to="{ name: 'patient-lab-results', params: { patientId: patient.patientId } }" class="btn btn-success btn-sm ml-2">
            <font-awesome-icon :icon="['fas', 'vials']" class="icon" /> View Lab Results
          </router-link>
        </div>
      </div>

      <h3 class="subsection-title">Appointments (Visits)</h3>
      <div v-if="loadingAppointments" class="loading-message">
        <font-awesome-icon :icon="['fas', 'spinner']" spin class="icon" /> Loading appointments...
      </div>
      <div v-else-if="appointmentsError" class="error-message">
        {{ appointmentsError }}
      </div>
      <div v-else-if="appointments.length === 0" class="no-records-message">
        No appointments found for this patient.
      </div>
      <div v-else class="appointments-list">
        <div v-for="appt in appointments" :key="appt.id" class="appointment-card card">
          <div class="appointment-header">
            <h4><font-awesome-icon :icon="['fas', 'calendar-alt']" class="icon" /> {{ formatDateTime(appt.appointmentDate) }} {{ appt.appointmentTime }}</h4>
            <span :class="['status-badge', `status-${appt.status?.toLowerCase().replace(/\s/g, '-')}`]">
              {{ appt.status || 'Unknown' }}
            </span>
          </div>
          <div class="appointment-details">
            <p><strong>Service:</strong> {{ appt.service?.serviceName || 'N/A' }}</p>
            <p><strong>Doctor:</strong> {{ appt.doctor?.firstName + ' ' + appt.doctor?.lastName || 'Any Available' }}</p>
            <p><strong>Reason for Visit:</strong> {{ appt.reasonForVisit || 'N/A' }}</p>
            <p v-if="appt.notes"><strong>Notes:</strong> {{ appt.notes }}</p>
            
            <router-link v-if="appt.medicalRecordId" :to="{ name: 'patient-history', params: { patientId: patientId, medicalRecordId: appt.medicalRecordId } }" class="btn btn-info btn-sm">
              View Associated Medical Record
            </router-link>
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
import { authStore } from '../stores/auth.js';

const route = useRoute();
const patientId = ref(null);

const patient = ref(null);
const appointments = ref([]);

const loadingPatient = ref(true);
const loadingAppointments = ref(true);
const patientError = ref('');
const appointmentsError = ref('');

// Helper function to format dates
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Invalid Date';
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return date.toLocaleDateString(undefined, options);
};

// Helper function to format date-time
const formatDateTime = (dateTimeString) => {
  if (!dateTimeString) return 'N/A';
  const date = new Date(dateTimeString);
  if (isNaN(date.getTime())) return 'Invalid Date';
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return date.toLocaleDateString(undefined, options);
};

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

const fetchAppointments = async (id) => {
  loadingAppointments.value = true;
  appointmentsError.value = '';
  try {
    const response = await apiClient.get(`/api/Appointments/ByPatientId/${id}`);
    appointments.value = response.data;
  } catch (error) {
    console.error(`Failed to fetch appointments for patient ID ${id}:`, error);
    if (error.response && error.response.status === 404) {
      appointmentsError.value = 'No appointments found for this patient.';
    } else if (error.response && error.response.status === 403) {
      appointmentsError.value = 'Access Denied: You do not have permission to view these appointments.';
    } else {
      appointmentsError.value = `Failed to load appointments. ${error.response?.data?.detail || error.message || error.response?.statusText}`;
    }
    appointments.value = [];
  } finally {
    loadingAppointments.value = false;
  }
};

// Watch for changes in route.params.id
watch(() => route.params.patientId, async (newId) => {
  // Check if the user is authorized to view patient records (Admin, Doctor, Nurse, Receptionist)
  const allowedRoles = ['Admin', 'Receptionist', 'Doctor', 'Nurse'];
  const hasPermission = authStore.userRoles.some(role => allowedRoles.includes(role));
  
  if (!hasPermission) {
    appointmentsError.value = "Access Denied: You do not have permission to view this page.";
    loadingPatient.value = false;
    loadingAppointments.value = false;
    return;
  }

  if (newId) {
    const parsedId = parseInt(newId);
    if (!isNaN(parsedId)) {
      patientId.value = parsedId;
      await fetchPatientData(parsedId);
      await fetchAppointments(parsedId);
    } else {
      console.error("Invalid patient ID received:", newId);
      patientError.value = "Invalid patient ID provided in URL.";
    }
  }
}, { immediate: true });
</script>

<style lang="scss" scoped>
@import '../assets/styles/_variables.scss';

.clinic-visit-history-view {
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
  }
}

.patient-actions {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-sm;
  .ml-2 { margin-left: 0; }
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

.appointments-list {
  display: grid;
  gap: $spacing-lg;
}

.appointment-card {
  background-color: $color-bg-white;
  padding: $spacing-lg;
  border-radius: $border-radius-md;
  box-shadow: $box-shadow-md;
  display: flex;
  flex-direction: column;

  .appointment-header {
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

    .status-badge {
      padding: $spacing-xs $spacing-sm;
      border-radius: $border-radius-sm;
      font-size: 0.8rem;
      font-weight: bold;
      color: $color-bg-white;

      &.status-scheduled { background-color: $color-info; }
      &.status-completed { background-color: $color-confirm-green; }
      &.status-cancelled { background-color: $color-error; }
      &.status-pending { background-color: $color-secondary-grey; }
    }
  }

  .appointment-details {
    p {
      margin: $spacing-xs 0;
      color: $color-text-dark;
      font-size: 0.95rem;
    }

    strong {
      color: $color-secondary-grey;
      margin-right: $spacing-xs;
    }

    .btn {
      margin-top: $spacing-md;
      align-self: flex-end;
    }
  }
}
.ml-2 { margin-left: $spacing-sm; }
</style>