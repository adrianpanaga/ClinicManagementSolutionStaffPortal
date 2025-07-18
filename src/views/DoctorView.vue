<template>
  <div class="doctor-view">
    <h2 class="section-title">Doctor's Dashboard</h2>

    <div v-if="loading" class="loading-message">
      <font-awesome-icon :icon="['fas', 'spinner']" spin class="icon" /> Loading dashboard...
    </div>
    <div v-else-if="errorMessage" class="error-message">
      {{ errorMessage }}
    </div>

    <div v-else class="doctor-grid">
      <div class="card grid-item grid-item-full-width">
        <div class="card-header">
          <h3><font-awesome-icon :icon="['fas', 'user-doctor']" class="icon" /> My Upcoming Appointments ({{ formatDate(today) }})</h3>
        </div>
        <div class="card-body">
          <div v-if="loadingAppointments" class="loading-message-small">Loading appointments...</div>
          <div v-else-if="myTodaysAppointments.length === 0" class="no-records-message">
            No appointments assigned to you for today.
          </div>
          <div v-else class="appointments-table">
            <table>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Patient</th>
                  <th>Service</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="appt in myTodaysAppointments" :key="appt.id">
                  <td>{{ appt.appointmentTime }}</td>
                  <td>
                    <router-link :to="{ name: 'patient-history', params: { patientId: appt.patient.patientId } }">
                      {{ appt.patient.fullName }}
                    </router-link>
                  </td>
                  <td>{{ appt.service.serviceName }}</td>
                  <td>
                    <span :class="['status-badge', `status-${appt.status?.toLowerCase().replace(/\s/g, '-')}`]">
                      {{ appt.status || 'Unknown' }}
                    </span>
                  </td>
                  <td>
                    <router-link :to="{ name: 'patient-history', params: { patientId: appt.patient.patientId } }" class="btn btn-sm btn-primary">Chart</router-link>
                    <router-link :to="{ name: 'medical-record-create', params: { patientId: appt.patient.patientId, appointmentId: appt.id } }" class="btn btn-sm btn-success ml-1">New MR</router-link>
                    </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="card grid-item">
        <div class="card-header">
          <h3><font-awesome-icon :icon="['fas', 'magnifying-glass']" class="icon" /> Patient Lookup</h3>
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
                  {{ patient.fullName }} ({{ patient.contactNumber }})
                </router-link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div class="card grid-item">
        <div class="card-header">
          <h3><font-awesome-icon :icon="['fas', 'stethoscope']" class="icon" /> Quick Access</h3>
        </div>
        <div class="card-body">
          <ul class="quick-links">
            <li><router-link to="/patients"><font-awesome-icon :icon="['fas', 'users']" class="icon" /> Browse All Patients</router-link></li>
            <li><router-link to="/medical-records"><font-awesome-icon :icon="['fas', 'file-lines']" class="icon" /> All Medical Records</router-link></li>
            </ul>
        </div>
      </div>
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
const myTodaysAppointments = ref([]);
const loadingAppointments = ref(true);

const patientSearchTerm = ref('');
const patientSearchResults = ref([]);
const loadingPatientSearch = ref(false);
let searchTimeout = null;

const today = ref(new Date());

// Fetch today's appointments assigned to the current Doctor
const fetchMyTodaysAppointments = async () => {
  loadingAppointments.value = true;
  try {
    const todayISO = today.value.toISOString().split('T')[0];
    const currentUserId = authStore.userId;
    let currentDoctorStaffId = null;

    if (!currentUserId) {
        errorMessage.value = "User ID not found in authentication store.";
        loadingAppointments.value = false;
        return;
    }

    // Get current doctor's StaffId
    const staffResponse = await apiClient.get(`/StaffDetails/ByUserId/${currentUserId}`);
    currentDoctorStaffId = staffResponse.data.staffId;

    if (currentDoctorStaffId) {
      const response = await apiClient.get('/Appointments/Staff', {
        params: {
          date: todayISO,
          doctorId: currentDoctorStaffId // Filter by the doctor's StaffId
        }
      });
      myTodaysAppointments.value = response.data;
    } else {
      myTodaysAppointments.value = [];
      errorMessage.value = "Your doctor profile could not be found or is not linked. Please ensure your user is linked to a StaffDetail with 'Doctor' job title.";
    }

  } catch (error) {
    console.error('Failed to fetch my today\'s appointments:', error);
    errorMessage.value = `Failed to load your appointments: ${error.response?.data?.detail || error.message || error.response?.statusText}`;
  } finally {
    loadingAppointments.value = false;
    loading.value = false; // Ensure overall loading state is cleared
  }
};

const searchPatients = async () => { /* ... existing code ... */ };
const debouncePatientSearch = () => { /* ... existing code ... */ };
const formatDate = (dateString) => { /* ... existing code ... */ };

// On component mount, check roles and fetch data
onMounted(async () => {
  if (!authStore.userRoles.includes('Doctor') && !authStore.userRoles.includes('Admin')) {
    errorMessage.value = "Access Denied: You do not have permission to view the Doctor's Dashboard.";
    loading.value = false;
    return;
  }

  if (authStore.userId) {
      await fetchMyTodaysAppointments();
  } else {
      errorMessage.value = "Error: User ID not available for fetching staff details.";
      loading.value = false;
  }
});
</script>

<style lang="scss" scoped>
@import '../assets/styles/_variables.scss';

.doctor-view {
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

.doctor-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: $spacing-lg;

  @media (min-width: 992px) { // Adjust for larger screens
    grid-template-columns: 2fr 1fr;
    grid-template-areas:
      "appointments search"
      "appointments quick-links";
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
      grid-area: appointments;
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

.appointments-table {
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

    .status-badge {
      padding: $spacing-xs $spacing-sm;
      border-radius: $border-radius-sm;
      font-size: 0.75rem;
      font-weight: bold;
      color: $color-bg-white;

      &.status-scheduled { background-color: $color-info; }
      &.status-confirmed { background-color: $color-primary-blue; }
      &.status-completed { background-color: $color-confirm-green; }
      &.status-cancelled { background-color: $color-error; }
      &.status-noshow { background-color: $color-secondary-grey; }
      &.status-rescheduled { background-color: mix($color-primary-blue, $color-confirm-green, 50%); }
    }

    .btn-sm {
      padding: 0.25rem 0.5rem;
      font-size: 0.8rem;
    }
    .ml-1 {
      margin-left: $spacing-xs;
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
</style>