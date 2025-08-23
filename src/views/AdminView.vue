<template>
  <div class="admin-view">
    <h2 class="section-title">Admin Dashboard</h2>

    <div v-if="loading" class="loading-message">
      <i class="fas fa-spinner icon" spin></i> Loading dashboard...
    </div>
    <div v-else-if="errorMessage" class="error-message">
      {{ errorMessage }}
    </div>

    <div v-else class="admin-grid">
      <div class="card grid-item grid-item-full-width">
        <div class="card-header">
          <h3><i class="fas fa-clinic-medical"></i> Clinic Information</h3>
        </div>
        <div class="card-body metrics-grid">
          <div class="metric-box">
            <h4>Total Patients</h4>
            <p class="metric-value">{{ dashboardData.totalPatientsCount }}</p>
          </div>
          <div class="metric-box">
            <h4>Total Staff</h4>
            <p class="metric-value">{{ dashboardData.totalStaffCount }}</p>
          </div>
          <div class="metric-box">
            <h4>Upcoming Appointments</h4>
            <p class="metric-value">{{ dashboardData.upcomingAppointmentsCount }}</p>
          </div>
          <div class="metric-box">
            <h4>Open Medical Records</h4>
            <p class="metric-value">{{ dashboardData.openMedicalRecordsCount }}</p>
          </div>
        </div>
      </div>

      <div class="card grid-item">
        <div class="card-header">
          <h3><i class="fas fa-users-cog"></i>User & Role Management</h3>
        </div>
        <div class="card-body">
          <ul class="admin-quick-links">
            <li><router-link to="/users"><i class="fas fa-user-shield"></i> Manage Staff Accounts</router-link></li>
            <li><router-link to="/roles"><i class="fas fa-user-tag"></i> Manage Roles (Future)</router-link></li>
          </ul>
        </div>
      </div>

      <div class="card grid-item">
        <div class="card-header">
          <h3><i class="fas fa-database"></i> Data Access & Reports</h3>
        </div>
        <div class="card-body">
          <ul class="admin-quick-links">
            <li><router-link to="/patients"><i class="fas fa-user-injured"></i> All Patient Records</router-link></li>
            <li><router-link to="/appointments/all"><i class="fas fa-calendar-check"></i> All Appointments</router-link></li>
            <li><router-link to="/medical-records/all"><i class="fas fa-file-medical"></i> All Medical Records</router-link></li>
            <li><router-link to="/inventory"><i class="fas fa-boxes-stacked"></i> Inventory Management</router-link></li>
          </ul>
        </div>
      </div>

      <div class="card grid-item">
        <div class="card-header">
          <h3><i class="fas fa-cog"></i> Clinic Settings</h3>
        </div>
        <div class="card-body">
          <ul class="admin-quick-links">
            <li><router-link to="/clinic-settings"><i class="fas fa-clock"></i> Manage Clinic Hours (Future)</router-link></li>
            <li><router-link to="/system-logs"><i class="fas fa-scroll"></i> View System Logs (Future)</router-link></li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import apiClient from '../api/authApi.js';
import { authStore } from '../stores/auth.js';
import { useRouter } from 'vue-router';

const router = useRouter();
const loading = ref(true);
const errorMessage = ref('');

const dashboardData = ref({
  totalPatientsCount: 0,
  totalStaffCount: 0,
  upcomingAppointmentsCount: 0,
  openMedicalRecordsCount: 0,
});

const fetchAdminDashboardData = async () => {
  loading.value = true;
  errorMessage.value = '';
  try {
    // Fetch total patients
  const patientsResponse = await apiClient.get('/api/Patients');
    dashboardData.value.totalPatientsCount = patientsResponse.data.length;

    // Fetch total staff
  const staffResponse = await apiClient.get('/api/StaffDetails'); // Assuming this endpoint returns all staff
    dashboardData.value.totalStaffCount = staffResponse.data.length;

    // Fetch upcoming appointments (e.g., Scheduled or Confirmed)
  const upcomingAppointmentsResponse = await apiClient.get('/api/Appointments/Staff', {
      params: { status: 'Scheduled,Confirmed' } // Assuming your backend can take comma-separated statuses
    });
    dashboardData.value.upcomingAppointmentsCount = upcomingAppointmentsResponse.data.length;

    // Fetch open medical records (e.g., those without a "Completed" status or specific flag)
    // For now, let's just count all non-deleted medical records
  const medicalRecordsResponse = await apiClient.get('/api/MedicalRecords');
    dashboardData.value.openMedicalRecordsCount = medicalRecordsResponse.data.length;


  } catch (error) {
    console.error('Failed to fetch admin dashboard data:', error);
    errorMessage.value = `Failed to load admin dashboard data: ${error.response?.data?.detail || error.message || error.response?.statusText}`;
  } finally {
    loading.value = false;
  }
};


onMounted(async () => {
  // Only Admin can access this dashboard
  if (!authStore.userRoles.includes('Admin')) {
    errorMessage.value = "Access Denied: You do not have permission to view the Admin Dashboard.";
    loading.value = false;
    return;
  }

  await fetchAdminDashboardData();
});
</script>

<style lang="scss" scoped>
@import '../assets/styles/_common.scss';

.admin-view {
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

.admin-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: $spacing-lg;

  @media (min-width: 768px) {
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  }
  @media (min-width: 1200px) {
    grid-template-columns: 2fr 1fr 1fr;
    grid-template-areas:
      "overview overview overview"
      "users-roles data-reports settings";
  }
}

.grid-item {
  background-color: $color-bg-white;
  border: 1px solid $color-border-medium;
  border-radius: $border-radius-md;
  box-shadow: $box-shadow-sm;
  padding: $spacing-md;

  &.grid-item-full-width {
    @media (min-width: 1200px) {
      grid-area: overview;
      grid-column: span 3; // Occupy all 3 columns
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

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: $spacing-md;
  text-align: center;

  .metric-box {
    padding: $spacing-sm;
    background-color: $color-bg-light;
    border-radius: $border-radius-sm;
    h4 {
      margin: 0;
      font-size: 1rem;
      color: $color-text-medium-grey;
    }
    .metric-value {
      font-size: 2.2rem;
      font-weight: bold;
      color: $color-primary-blue;
      margin: $spacing-xs 0 0;
    }
  }
}

.admin-quick-links {
  list-style: none;
  padding: 0;
  margin: 0;

  li {
    margin-bottom: $spacing-sm;
    &:last-child {
      margin-bottom: 0;
    }

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

.ml-2 {
  margin-left: $spacing-sm;
}
.mt-3 {
  margin-top: $spacing-md;
}
</style>