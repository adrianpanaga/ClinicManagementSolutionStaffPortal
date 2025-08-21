<template>
  <div class="appointments-list-view">
    <div v-if="hasPermission">
      <h2 class="section-title">Today's Appointments ({{ formatDate(today) }})</h2>
      <p class="subtitle">A list of all scheduled appointments for the clinic today.</p>

      <div v-if="loading" class="loading-message">
        <font-awesome-icon :icon="['fas', 'spinner']" spin /> Loading appointments...
      </div>
      <div v-else-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>

      <div v-else-if="appointments.length === 0" class="no-records-message">
        No appointments scheduled for today.
      </div>
      
      <div v-else class="appointments-table-container card">
        <table class="data-table">
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
            <tr v-for="appt in appointments" :key="appt.id">
              <td>{{ formatTime(appt.appointmentDateTime) }}</td>
              <td>
                <router-link :to="{ name: 'patient-history', params: { patientId: appt.patient.patientId } }">
                  {{ appt.patient.firstName + ' ' + appt.patient.lastName }}
                </router-link>
              </td>
              <td>{{ appt.service?.serviceName || 'N/A' }}</td>
              <td>{{ appt.doctor?.firstName + ' ' + appt.doctor?.lastName || 'Any' }}</td>
              <td>
                <span :class="['status-badge', `status-${appt.status?.toLowerCase().replace(/\s/g, '-')}`]">
                  {{ appt.status || 'Unknown' }}
                </span>
              </td>
              <td>
                <button @click="viewDetails(appt.appointmentId)" class="btn btn-sm btn-info">
                  <font-awesome-icon :icon="['fas', 'eye']" />
                </button>
                <button v-if="canEdit" @click="editAppointment(appt.appointmentId)" class="btn btn-sm btn-warning ml-1">
                  <font-awesome-icon :icon="['fas', 'edit']" />
                </button>
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
import { useRouter } from 'vue-router';
import { authStore } from '../stores/auth';

const router = useRouter();
const appointments = ref([]);
const loading = ref(true);
const errorMessage = ref('');
const today = ref(new Date());

const hasPermission = computed(() => {
  const roles = authStore.userRoles;
  return roles.includes('Admin') || roles.includes('Receptionist') || roles.includes('Doctor') || roles.includes('Nurse');
});

const canEdit = computed(() => {
  const roles = authStore.userRoles;
  return roles.includes('Admin') || roles.includes('Receptionist');
});

const fetchAppointments = async () => {
  loading.value = true;
  errorMessage.value = '';
  try {
    const todayISO = today.value.toISOString().split('T')[0];
    const response = await apiClient.get('/api/Appointments/Staff', {
      params: { date: todayISO }
    });
    appointments.value = response.data;
  } catch (error) {
    console.error('Error fetching appointments:', error);
    errorMessage.value = `Failed to load appointments: ${error.response?.data?.detail || error.message || error.response?.statusText}`;
  } finally {
    loading.value = false;
  }
};

const viewDetails = (id) => {
  window.notify(`Viewing details for appointment ID: ${id}.`, 'info');
  // You would typically navigate to a detail page here
  // Example: router.push({ name: 'appointment-detail', params: { id } });
};

const editAppointment = (id) => {
  window.notify(`Editing appointment ID: ${id}.`, 'info');
  // Example: router.push({ name: 'edit-appointment', params: { id } });
};

const formatDate = (date) => {
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  return date.toLocaleDateString(undefined, options);
};

const formatTime = (dateTimeString) => {
  const date = new Date(dateTimeString);
  const options = { hour: '2-digit', minute: '2-digit' };
  return date.toLocaleTimeString(undefined, options);
};

onMounted(() => {
  if (hasPermission.value) {
    fetchAppointments();
  } else {
    loading.value = false;
  }
});
</script>

<style lang="scss" scoped>
@import '../assets/styles/_variables.scss';

.appointments-list-view {
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

.loading-message, .error-message, .no-records-message {
  text-align: center;
  padding: $spacing-md;
  margin-top: $spacing-lg;
  border-radius: $border-radius-sm;
  font-weight: bold;
}

.appointments-table-container {
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
    .status-badge {
      padding: 4px 8px;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: bold;
      color: white;
      &.status-scheduled { background-color: $color-info; }
      &.status-confirmed { background-color: $color-primary-blue; }
      &.status-completed { background-color: $color-confirm-green; }
      &.status-cancelled { background-color: $color-error; }
    }
  }
}
.ml-1 { margin-left: $spacing-xs; }
</style>