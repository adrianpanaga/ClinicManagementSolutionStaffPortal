<template>
  <div class="dashboard-view">
    <h2 class="section-title">Dashboard Overview <span v-if="authStore.username">for {{ authStore.username }}</span></h2>

    <div v-if="loading" class="loading-message">
      <font-awesome-icon :icon="['fas', 'spinner']" spin class="icon" /> Loading dashboard data...
    </div>

    <div v-if="errorMessage" class="error-message">
      {{ errorMessage }}
    </div>

    <div v-if="!loading && !errorMessage" class="dashboard-grid">
      <div class="card dashboard-card">
        <h3><font-awesome-icon :icon="['fas', 'calendar-check']" class="icon" /> Today's Appointments</h3>
        <p class="metric-value">{{ dashboardData.todayAppointmentsCount }}</p>
        <router-link to="/appointments" class="card-link btn btn-primary">View Appointments</router-link>
      </div>

      <div class="card dashboard-card">
        <h3><font-awesome-icon :icon="['fas', 'user-injured']" class="icon" /> Total Active Patients</h3>
        <p class="metric-value">{{ dashboardData.totalPatientsCount }}</p>
        <router-link to="/patients" class="card-link btn btn-primary">View Patients</router-link>
      </div>

      <div class="card dashboard-card">
        <h3><font-awesome-icon :icon="['fas', 'clipboard-list']" class="icon" /> Pending Tasks</h3>
        <p class="metric-value">0</p> <router-link to="/tasks" class="card-link btn btn-secondary">Manage Tasks</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import apiClient from '../api/authApi.js'; // Use our configured Axios instance
import { authStore } from '../stores/auth.js'; // Access the auth store for username

const loading = ref(true);
const errorMessage = ref('');
const dashboardData = ref({
  todayAppointmentsCount: 0,
  totalPatientsCount: 0,
  // ... other dashboard metrics
});

const fetchDashboardData = async () => {
  loading.value = true;
  errorMessage.value = '';
  try {
    // Fetch all appointments (assuming this endpoint is now protected and returns all appts for staff)
    const appointmentsResponse = await apiClient.get('/Appointments/Staff'); // *** CHANGED ENDPOINT HERE ***
    const allAppointments = appointmentsResponse.data;

    // Filter appointments for today
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time for comparison
    const todayAppointments = allAppointments.filter(app => {
      const appDate = new Date(app.appointmentDate);
      appDate.setHours(0, 0, 0, 0);
      return appDate.getTime() === today.getTime();
    });

    dashboardData.value.todayAppointmentsCount = todayAppointments.length;

    // Fetch total active patients
    const patientsResponse = await apiClient.get('/Patients'); // Assuming this returns all patients
    dashboardData.value.totalPatientsCount = patientsResponse.data.length;

  } catch (error) {
    console.error('Failed to fetch dashboard data:', error);
    if (error.response && error.response.status === 403) {
      errorMessage.value = "Access Denied: You don't have permission to view this data.";
    } else {
      errorMessage.value = 'Failed to load dashboard data. Please try again later.';
    }
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchDashboardData();
});
</script>

<style lang="scss" scoped>
@import '../assets/styles/_variables.scss';

.dashboard-view {
  padding: $spacing-lg;
}

.section-title {
  color: $color-text-dark;
  margin-bottom: $spacing-xl;
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

.loading-message {
  color: $color-info;
  background-color: lighten($color-info, 30%);
}

.error-message {
  color: $color-error;
  background-color: lighten($color-error, 40%);
  border: 1px solid $color-error;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: $spacing-lg;
}

.dashboard-card {
  text-align: center;
  padding: $spacing-xl;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;

  h3 {
    color: $color-primary-blue;
    margin-top: 0;
    margin-bottom: $spacing-lg;
    font-size: 1.5rem;

    .icon {
      margin-right: $spacing-sm;
      color: $color-secondary-grey; // Adjust icon color within cards
    }
  }

  .metric-value {
    font-size: 3rem;
    font-weight: bold;
    color: $color-text-dark;
    margin-bottom: $spacing-lg;
  }

  .card-link {
    text-decoration: none;
    margin-top: $spacing-md; // Space above the button
  }
}
</style>