<template>
  <div class="add-edit-medical-record-view">
    <div v-if="hasPermission">
      <h2 class="section-title">
        <font-awesome-icon :icon="['fas', isEditMode ? 'edit' : 'plus-circle']" />
        {{ isEditMode ? 'Edit Medical Record' : 'Create New Medical Record' }}
      </h2>
      <p class="subtitle" v-if="patient">For patient: <strong>{{ patient.fullName }}</strong> (ID: {{ patient.patientId }})</p>

      <div v-if="loading" class="loading-message">
        <font-awesome-icon :icon="['fas', 'spinner']" spin /> Loading record data...
      </div>
      <div v-else-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>

      <div v-else class="form-container card">
        <form @submit.prevent="saveRecord">
          <div class="form-group-grid">
            <div class="form-group">
              <label for="service">Service:</label>
              <select id="service" v-model.number="record.serviceId" class="form-control" required>
                <option value="">Select Service</option>
                <option v-for="service in services" :key="service.serviceId" :value="service.serviceId">
                  {{ service.serviceName }}
                </option>
              </select>
            </div>
            <div class="form-group">
              <label for="doctor">Doctor:</label>
              <select id="doctor" v-model.number="record.staffId" class="form-control" required>
                <option value="">Select Doctor</option>
                <option v-for="staff in doctors" :key="staff.staffId" :value="staff.staffId">
                  {{ staff.fullName }}
                </option>
              </select>
            </div>
            <div class="form-group full-width">
              <label for="diagnosis">Diagnosis:</label>
              <textarea id="diagnosis" v-model="record.diagnosis" class="form-control" required></textarea>
            </div>
            <div class="form-group full-width">
              <label for="treatment">Treatment:</label>
              <textarea id="treatment" v-model="record.treatment" class="form-control" required></textarea>
            </div>
            <div class="form-group full-width">
              <label for="prescription">Prescription:</label>
              <textarea id="prescription" v-model="record.prescription" class="form-control"></textarea>
            </div>
          </div>
          
          <div v-if="formMessage" :class="['form-message', formMessageType]">
            {{ formMessage }}
          </div>

          <div class="form-actions">
            <button type="submit" class="btn btn-success" :disabled="loadingSave">
              <font-awesome-icon :icon="['fas', 'save']" /> Save Record
            </button>
            <button type="button" @click="cancel" class="btn btn-secondary ml-1" :disabled="loadingSave">
              <font-awesome-icon :icon="['fas', 'times']" /> Cancel
            </button>
          </div>
        </form>
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

const isEditMode = ref(false);
const loading = ref(true);
const loadingSave = ref(false);
const errorMessage = ref('');
const formMessage = ref('');
const formMessageType = ref('');

const patient = ref(null);
const services = ref([]);
const doctors = ref([]);
const record = ref({
  recordId: null,
  patientId: null,
  appointmentId: null,
  staffId: null,
  serviceId: null,
  diagnosis: '',
  treatment: '',
  prescription: '',
});

// --- Computed property for role-based permissions
const hasPermission = computed(() => {
  const roles = authStore.userRoles;
  return roles.includes('Admin') || roles.includes('Doctor') || roles.includes('Nurse');
});

// --- Data Fetching
const fetchData = async () => {
  loading.value = true;
  errorMessage.value = '';
  try {
    const patientId = route.params.patientId;
    const recordId = route.params.medicalRecordId;

    if (!patientId) {
      errorMessage.value = "Patient ID is required to create a medical record.";
      loading.value = false;
      return;
    }

    const [patientRes, servicesRes, staffRes] = await Promise.all([
      apiClient.get(`/Patients/${patientId}`),
      apiClient.get('/Services'),
      apiClient.get('/StaffDetails/ForBooking') // Only fetch doctors for now
    ]);

    patient.value = patientRes.data;
    services.value = servicesRes.data;
    doctors.value = staffRes.data;

    record.value.patientId = patient.value.patientId;
    record.value.appointmentId = route.params.appointmentId ? parseInt(route.params.appointmentId) : null;
    record.value.staffId = authStore.userId; // Default to logged-in user

    if (recordId) {
      isEditMode.value = true;
      const recordRes = await apiClient.get(`/MedicalRecords/${recordId}`);
      record.value = { ...record.value, ...recordRes.data };
    }
  } catch (error) {
    console.error('Error fetching data:', error);
    errorMessage.value = `Failed to load data: ${error.response?.data?.detail || error.message || error.response?.statusText}`;
  } finally {
    loading.value = false;
  }
};

// --- Form Submission
const saveRecord = async () => {
  loadingSave.value = true;
  formMessage.value = '';
  try {
    const payload = { ...record.value };

    if (isEditMode.value) {
      await apiClient.put(`/MedicalRecords/${payload.recordId}`, payload);
      window.notify('Medical record updated successfully!', 'success');
    } else {
      await apiClient.post('/MedicalRecords', payload);
      window.notify('Medical record created successfully!', 'success');
    }
    // Redirect to patient history after save
    router.push({ name: 'patient-history', params: { patientId: record.value.patientId } });
  } catch (error) {
    console.error('Error saving record:', error);
    formMessage.value = `Failed to save record: ${error.response?.data?.detail || error.message || error.response?.statusText}`;
    formMessageType.value = 'error';
  } finally {
    loadingSave.value = false;
  }
};

const cancel = () => {
  // Redirect back to patient history
  router.push({ name: 'patient-history', params: { patientId: record.value.patientId } });
};

// --- Lifecycle Hook
onMounted(() => {
  if (!hasPermission.value) {
    loading.value = false;
    return;
  }
  fetchData();
});
</script>

<style lang="scss" scoped>
@import '../assets/styles/_variables.scss';

.add-edit-medical-record-view {
  padding: $spacing-lg;
  max-width: 900px;
  margin: 0 auto;
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

.form-container {
  background-color: $color-bg-white;
  border: 1px solid $color-border-medium;
  border-radius: $border-radius-md;
  box-shadow: $box-shadow-sm;
  padding: $spacing-xl;
}

.form-group-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: $spacing-md;

  .full-width {
    grid-column: 1 / -1;
  }
}

.form-group {
  margin-bottom: $spacing-md;

  label {
    display: block;
    margin-bottom: $spacing-xs;
    font-weight: bold;
    color: $color-text-dark;
  }

  textarea {
    min-height: 100px;
    resize: vertical;
  }
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: $spacing-xl;
}
.ml-1 { margin-left: $spacing-xs; }
</style>