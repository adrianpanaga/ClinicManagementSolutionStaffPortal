<template>
  <div class="receptionist-view">
    <h2 class="section-title">Receptionist Dashboard</h2>

    <div v-if="loading" class="loading-message">
      <i class="fas fa-spinner" spin ></i> Loading dashboard...
    </div>
    <div v-else-if="errorMessage" class="error-message">
      {{ errorMessage }}
    </div>

    <div v-else class="receptionist-grid">
      <div class="card grid-item grid-item-full-width">
        <div class="card-header">
          <h3><i class="fas fa-calendar-day"></i> Today's Appointments ({{ formatDate(today) }})</h3>
        </div>
        <div class="card-body">
          <div v-if="loadingAppointments" class="loading-message-small">Loading appointments...</div>
          <div v-else-if="todaysAppointments.length === 0" class="no-records-message">
            No appointments scheduled for today.
          </div>
          <div v-else class="appointments-table">
            <table>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Patient</th>
                  <th>Service</th>
                  <th>Doctor</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="appt in todaysAppointments" :key="appt.id">
                  <td>{{ appt.appointmentTime }}</td>
                  <td>
                    <router-link :to="{ name: 'patient-history', params: { patientId: appt.patient.patientId } }">
                      {{ appt.patient.firstName + ' ' + appt.patient.lastName }}
                    </router-link>
                  </td>
                  <td>{{ appt.service.serviceName }}</td>
                  <td>{{ appt.doctor?.firstName + ' ' + appt.doctor?.lastName || 'Any' }}</td>
                  <td>
                    <span :class="['status-badge', `status-${appt.status?.toLowerCase().replace(/\s/g, '-')}`]">
                      {{ appt.status || 'Unknown' }}
                    </span>
                  </td>
                  <td>
                    <button v-if="appt.status === 'Scheduled'" @click="updateAppointmentStatus(appt.id, 'Confirmed')" class="btn btn-sm btn-confirm">Confirm</button>
                    <button v-if="appt.status === 'Scheduled' || appt.status === 'Confirmed'" @click="updateAppointmentStatus(appt.id, 'Completed')" class="btn btn-sm btn-success ml-1">Check-in</button>
                    <button @click="updateAppointmentStatus(appt.id, 'Cancelled')" class="btn btn-sm btn-danger ml-1">Cancel</button>
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
                  {{ patient.firstName }} {{ patient.lastName }} ({{ patient.contactNumber }})
                </router-link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div class="card grid-item">
        <div class="card-header">
          <h3><i class="fas fa-chart-line"></i> Daily Summary</h3>
        </div>
        <div class="card-body">
          <p>Upcoming appointments: {{ todaysAppointments.filter(a => a.status === 'Scheduled' || a.status === 'Confirmed').length }}</p>
          <p>Checked-in today: {{ todaysAppointments.filter(a => a.status === 'Completed').length }}</p>
          <p>Cancellations today: {{ todaysAppointments.filter(a => a.status === 'Cancelled').length }}</p>
          </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import apiClient from '../api/authApi.js';
import { authStore } from '../stores/auth.js'; // For role checks
import { useRouter } from 'vue-router'; // For patient links

const router = useRouter();
const loading = ref(true);
const errorMessage = ref('');
const todaysAppointments = ref([]);
const loadingAppointments = ref(true);

const patientSearchTerm = ref('');
const patientSearchResults = ref([]);
const loadingPatientSearch = ref(false);
let searchTimeout = null;

const today = ref(new Date()); // Reactive date for display

// Fetch today's appointments for the dashboard
const fetchTodaysAppointments = async () => {
  loadingAppointments.value = true;
  try {
    const todayISO = today.value.toISOString().split('T')[0]; // Format to YYYY-MM-DD for API
  const response = await apiClient.get('/api/Appointments/Staff', {
      params: { date: todayISO } // Use the enhanced API with date filter
    });
    todaysAppointments.value = response.data;
  } catch (error) {
    console.error('Failed to fetch today\'s appointments:', error);
    errorMessage.value = `Failed to load today's appointments: ${error.response?.data?.detail || error.message || error.response?.statusText}`;
  } finally {
    loadingAppointments.value = false;
  }
};

// Debounced patient search
const searchPatients = async () => {
  if (patientSearchTerm.value.length < 3) { // Only search if 3 or more characters
    patientSearchResults.value = [];
    return;
  }
  loadingPatientSearch.value = true;
  try {
  const response = await apiClient.get('/api/Patients', {
      params: { searchTerm: patientSearchTerm.value } // Use the enhanced API with search term
    });
    patientSearchResults.value = response.data;
  } catch (error) {
    console.error('Failed to search patients:', error);
    patientSearchResults.value = [];
  } finally {
    loadingPatientSearch.value = false;
  }
};

const debouncePatientSearch = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(searchPatients, 300); // 300ms debounce
};

// Update appointment status (e.g., Check-in, Cancel)
const updateAppointmentStatus = async (appointmentId, newStatus) => {
  if (!confirm(`Are you sure you want to set this appointment to ${newStatus}?`)) {
    return;
  }
  try {
  await apiClient.put(`/api/Appointments/${appointmentId}/status`, null, { // null for body if not needed
      params: { status: newStatus } // Pass status as query parameter as per backend
    });
    // Refresh appointments after successful update
    await fetchTodaysAppointments();
    alert(`Appointment ${appointmentId} status updated to ${newStatus}.`);
  } catch (error) {
    console.error(`Failed to update appointment ${appointmentId} status to ${newStatus}:`, error);
    alert(`Failed to update appointment status: ${error.response?.data?.detail || error.message || error.response?.statusText}`);
  }
};

// Helper functions for date formatting (re-use from other views)
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Invalid Date';
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return date.toLocaleDateString(undefined, options);
};


onMounted(async () => {
  // Check if current user has 'Receptionist' role to view this dashboard
  if (!authStore.userRoles.includes('Receptionist') && !authStore.userRoles.includes('Admin')) {
    errorMessage.value = "Access Denied: You do not have permission to view the Receptionist Dashboard.";
    loading.value = false;
    return;
  }

  await fetchTodaysAppointments();
  loading.value = false;
});
</script>

<style lang="scss" scoped>
@import '../assets/styles/_variables.scss';

.receptionist-view {
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

.receptionist-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: $spacing-lg;

  @media (min-width: 992px) { // Adjust for larger screens
    grid-template-columns: 2fr 1fr; // Main content (appointments) wider than side (search/stats)
    grid-template-areas:
      "appointments search"
      "appointments summary";
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
      &.status-rescheduled { background-color: mix($color-primary-blue, $color-confirm-green, 50%); } // A blend
    }

    .btn-sm {
      padding: 0.25rem 0.5rem;
      font-size: 0.8rem;
    }
    .btn-confirm {
      background-color: $color-primary-blue;
      color: white;
      &:hover { background-color: $color-primary-blue-darker; }
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
    max-height: 200px; // Limit height for scroll
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

.ml-1 {
  margin-left: $spacing-xs;
}

.mt-3 {
  margin-top: $spacing-md;
}
</style>