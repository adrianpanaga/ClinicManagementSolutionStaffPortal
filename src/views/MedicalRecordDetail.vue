<template>
  <div class="medical-record-detail-view">
    <div v-if="hasPermission">
      <h2 class="section-title">Medical Record #{{ medicalRecordId }}</h2>
      
      <div v-if="loading" class="loading-message">
        <i class="fas fa-spinner icon" spin></i> Loading medical record...
      </div>
      <div v-else-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>

      <div v-else class="record-content">
        <div class="patient-info-card card">
          <div class="card-header">
            <h3><i class="fas fa-user-injured"></i> Patient Information</h3>
          </div>
          <div class="card-body">
            <p><strong>Name:</strong> {{ record.patient?.firstName + ' ' + record.patient?.lastName || 'N/A' }}</p>
            <p><strong>Contact:</strong> {{ record.patient?.contactNumber || 'N/A' }}</p>
            <p><strong>Email:</strong> {{ record.patient?.email || 'N/A' }}</p>
            <router-link :to="{ name: 'patient-history', params: { patientId: record.patient?.patientId } }" class="btn btn-sm btn-info mt-3">
              <i class="fas fa-history"></i> View Full Patient History
            </router-link>
          </div>
        </div>

        <div class="record-details card">
          <div class="card-header">
            <h3><i class="fas fa-file-medical"></i> Record Details</h3>
            <div class="record-actions" v-if="canEditRecord">
              <button @click="editRecord" class="btn btn-sm btn-warning">
                <i class="fas fa-edit"></i> Edit
              </button>
              <button @click="deleteRecord" class="btn btn-sm btn-danger ml-2">
                <i class="fas fa-trash"></i> Delete
              </button>
            </div>
          </div>
          <div class="card-body">
            <p><strong>Date of Visit:</strong> {{ formatDateTime(record.createdAt) }}</p>
            <p><strong>Doctor:</strong> {{ record.staff?.firstName + ' ' + record.staff?.lastName || 'N/A' }}</p>
            <p><strong>Service:</strong> {{ record.service?.serviceName || 'N/A' }}</p>
            <p><strong>Appointment ID:</strong> {{ record.appointmentId || 'N/A' }}</p>
            <hr>
            <h4>Diagnosis:</h4>
            <p>{{ record.diagnosis || 'No diagnosis provided.' }}</p>
            <h4>Treatment:</h4>
            <p>{{ record.treatment || 'No treatment provided.' }}</p>
            <h4>Prescription:</h4>
            <p>{{ record.prescription || 'No prescription provided.' }}</p>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="error-message">
      Access Denied: You do not have permission to view this page.
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import apiClient from '../api/authApi';
import { authStore } from '../stores/auth';

const route = useRoute();
const router = useRouter();

const medicalRecordId = ref(null);
const record = ref({});
const loading = ref(true);
const errorMessage = ref('');

// --- Role-based permissions
const hasPermission = computed(() => {
  const roles = authStore.userRoles;
  return roles.includes('Admin') || roles.includes('Doctor') || roles.includes('Nurse');
});

const canEditRecord = computed(() => {
  const roles = authStore.userRoles;
  return roles.includes('Admin') || roles.includes('Doctor');
});

// --- Data Fetching
const fetchMedicalRecord = async (id) => {
  loading.value = true;
  errorMessage.value = '';
  try {
    const response = await apiClient.get(`/api/MedicalRecords/${id}`);
    record.value = response.data;
  } catch (error) {
    console.error('Error fetching medical record:', error);
    errorMessage.value = `Failed to load medical record: ${error.response?.data?.detail || error.message || error.response?.statusText}`;
  } finally {
    loading.value = false;
  }
};

// --- Actions
const editRecord = () => {
  // Logic to navigate to a form for editing the record
  // This would be a new view, for example, `AddEditMedicalRecord.vue`
  window.notify('Edit functionality not yet implemented.', 'info');
};

const deleteRecord = async () => {
  if (confirm('Are you sure you want to delete this medical record?')) {
    try {
      await apiClient.delete(`/api/MedicalRecords/${medicalRecordId.value}`);
      window.notify('Medical record deleted successfully!', 'success');
      // Redirect back to the patient's full history
      router.push({ name: 'patient-history', params: { patientId: record.value.patientId } });
    } catch (error) {
      console.error('Error deleting medical record:', error);
      window.notify(`Failed to delete record: ${error.response?.data?.detail || error.message}`, 'error');
    }
  }
};

// --- Helper functions
const formatDateTime = (dateTimeString) => {
  if (!dateTimeString) return 'N/A';
  const date = new Date(dateTimeString);
  if (isNaN(date.getTime())) return 'Invalid Date';
  const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  return date.toLocaleDateString(undefined, options);
};

// --- Lifecycle Hook
watch(() => route.params.medicalRecordId, (newId) => {
  if (newId) {
    const parsedId = parseInt(newId);
    if (!isNaN(parsedId)) {
      medicalRecordId.value = parsedId;
      fetchMedicalRecord(parsedId);
    } else {
      errorMessage.value = "Invalid medical record ID provided in URL.";
    }
  }
}, { immediate: true });
</script>

<style lang="scss" scoped>
@import '../assets/styles/_variables.scss';

.medical-record-detail-view {
  padding: $spacing-lg;
}

.section-title {
  color: $color-primary-blue;
  margin-bottom: $spacing-lg;
  text-align: center;
  font-size: 2rem;
}

.record-content {
  display: grid;
  grid-template-columns: 1fr;
  gap: $spacing-lg;

  @media (min-width: 992px) {
    grid-template-columns: 1fr 2fr;
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $spacing-md;
  padding-bottom: $spacing-xs;
  border-bottom: 1px dashed $color-border-medium;

  h3 {
    margin: 0;
    font-size: 1.3rem;
    color: $color-text-dark;
  }

  .record-actions {
    .btn {
      margin-left: $spacing-sm;
    }
  }
}

.card-body {
  p {
    margin: $spacing-xs 0;
    color: $color-text-medium-grey;
  }
  h4 {
    margin-top: $spacing-md;
    margin-bottom: $spacing-xs;
  }
  hr {
    border: none;
    border-top: 1px solid $color-border-medium;
    margin: $spacing-md 0;
  }
}
.ml-2 { margin-left: $spacing-sm; }
</style>