<template>
  <div class="medical-record-create-view page-container">
    <h2>Create New Medical Record</h2>
    <div class="card">
      <p>This is where the form for creating a new medical record will go.</p>
      <p v-if="patientId">For Patient ID: {{ patientId }}</p>
      <p v-if="appointmentId">Linked to Appointment ID: {{ appointmentId }}</p>
      <p>You can build a form here to capture diagnosis, treatment, prescription, etc.</p>
    </div>
    <router-link :to="{ name: 'patient-history', params: { patientId: patientId } }" class="btn btn-secondary mt-3">
      Back to Patient History
    </router-link>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const patientId = ref(null);
const appointmentId = ref(null);

watch(() => route.params, (newParams) => {
  if (newParams.patientId) {
    patientId.value = parseInt(newParams.patientId);
  }
  if (newParams.appointmentId) {
    appointmentId.value = parseInt(newParams.appointmentId);
  }
}, { immediate: true });
</script>

<style lang="scss" scoped>
@import '../assets/styles/_variables.scss';

.page-container {
  padding: $spacing-lg;
}

.card {
  margin-top: $spacing-lg;
}

.mt-3 {
  margin-top: $spacing-md;
}
</style>