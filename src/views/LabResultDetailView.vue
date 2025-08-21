<template>
  <div class="lab-result-detail-view">
    <div v-if="hasPermission">
      <h2 class="section-title">Lab Result Details</h2>
      
      <div v-if="loading" class="loading-message">
        <font-awesome-icon :icon="['fas', 'spinner']" spin /> Loading lab result...
      </div>
      <div v-else-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>

      <div v-else-if="!labResult" class="no-records-message">
        Lab result not found.
      </div>

      <div v-else class="lab-result-details card">
        <div class="card-header">
          <h3><font-awesome-icon :icon="['fas', 'vials']" /> {{ labResult.testName }}</h3>
          <p class="result-value">{{ labResult.resultValue }} {{ labResult.unit }}</p>
        </div>
        <div class="card-body">
          <div class="details-grid">
            <div class="detail-item">
              <strong>Patient:</strong>
              <router-link :to="{ name: 'patient-lab-results', params: { patientId: labResult.patient?.patientId } }">
                {{ labResult.patient?.firstName + ' ' + labResult.patient?.lastName || 'N/A' }}
              </router-link>
            </div>
            <div class="detail-item">
              <strong>Result Date:</strong> {{ formatDate(labResult.resultDate) }}
            </div>
            <div class="detail-item">
              <strong>Ordered By:</strong> {{ labResult.orderedByStaff?.firstName + ' ' + labResult.orderedByStaff?.lastName || 'N/A' }}
            </div>
            <div class="detail-item">
              <strong>Reference Range:</strong> {{ labResult.referenceRange || 'N/A' }}
            </div>
            <div class="detail-item">
              <strong>Linked Appointment ID:</strong> {{ labResult.appointmentId || 'N/A' }}
            </div>
            <div class="detail-item">
              <strong>Linked Medical Record ID:</strong> {{ labResult.medicalRecordId || 'N/A' }}
            </div>
            <div class="detail-item full-width">
              <strong>Interpretation:</strong>
              <p>{{ labResult.interpretation || 'No interpretation provided.' }}</p>
            </div>
          </div>
        </div>
        <div class="card-actions">
          <button @click="goBack" class="btn btn-secondary">
            <font-awesome-icon :icon="['fas', 'arrow-left']" /> Back to Patient Lab Results
          </button>
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
const labResultId = ref(null);

const labResult = ref(null);
const loading = ref(true);
const errorMessage = ref('');

const hasPermission = computed(() => {
  const roles = authStore.userRoles;
  return roles.includes('Admin') || roles.includes('Doctor') || roles.includes('Nurse') || roles.includes('LabTech');
});

const fetchLabResult = async (id) => {
  loading.value = true;
  errorMessage.value = '';
  try {
    const response = await apiClient.get(`/api/LabResults/${id}`);
    labResult.value = response.data;
  } catch (error) {
    console.error('Error fetching lab result:', error);
    errorMessage.value = `Failed to load lab result: ${error.response?.data?.detail || error.message || error.response?.statusText}`;
  } finally {
    loading.value = false;
  }
};

const goBack = () => {
  if (labResult.value?.patient?.patientId) {
    router.push({ name: 'all-lab-results' });
  } else {
    router.go(-1); // Fallback to go back in history
  }
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Invalid Date';
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return date.toLocaleDateString(undefined, options);
};

watch(() => route.params.id, (newId) => {
  if (newId) {
    const parsedId = parseInt(newId);
    if (!isNaN(parsedId)) {
      labResultId.value = parsedId;
      if (hasPermission.value) {
        fetchLabResult(parsedId);
      } else {
        loading.value = false;
      }
    } else {
      errorMessage.value = "Invalid lab result ID provided in URL.";
    }
  }
}, { immediate: true });

onMounted(() => {
  if (!hasPermission.value) {
    loading.value = false;
  }
});
</script>

<style lang="scss" scoped>
@import '../assets/styles/_variables.scss';

.lab-result-detail-view {
  padding: $spacing-lg;
  max-width: 900px;
  margin: 0 auto;
}

.section-title {
  color: $color-primary-blue;
  margin-bottom: $spacing-lg;
  text-align: center;
  font-size: 2rem;
}

.lab-result-details {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid $color-border-medium;
    padding-bottom: $spacing-sm;
    margin-bottom: $spacing-md;
  }

  h3 {
    margin: 0;
    color: $color-text-dark;
  }

  .result-value {
    font-weight: bold;
    color: $color-primary-blue;
    font-size: 1.2rem;
  }

  .card-body {
    padding: $spacing-md 0;
  }
  
  .details-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: $spacing-md;

    .detail-item {
      p { margin: 0; }
      strong {
        display: block;
        color: $color-secondary-grey;
        margin-bottom: $spacing-xs;
      }
      .full-width {
        grid-column: 1 / -1;
      }
    }
  }

  .card-actions {
    margin-top: $spacing-lg;
    text-align: right;
  }
}
</style>