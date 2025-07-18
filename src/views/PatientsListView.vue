<template>
  <div class="page-container">
    <h2>Patients List</h2>
    <p>This page will display all patient records.</p>
    <div style="margin-top: 20px;">
      <h3>Quick Test: View a Patient's History</h3>
      <p>Enter a Patient ID (e.g., from your database) to view their history:</p>
      <input type="number" v-model="testPatientId" placeholder="Enter Patient ID" class="form-control" style="max-width: 300px; margin-right: 10px;">
      <button @click="navigateToHistory" class="btn btn-primary">Go to Medical History</button>
      <button @click="navigateToVisits" class="btn btn-secondary" style="margin-left: 10px;">Go to Visit History</button>
      <button @click="navigateToTriage" class="btn btn-info" style="margin-left: 10px;">Go to Triage Records</button>
      <button @click="navigateToLabResults" class="btn btn-success" style="margin-left: 10px;">Go to Lab Results</button>
      <button @click="navigateToDocuments" class="btn btn-dark" style="margin-left: 10px;">Go to Documents</button>
      <p style="margin-top: 10px; color: #888;">Example Patient ID: `1` or `2` (replace with real INT ID from your DB)</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const testPatientId = ref(''); // Keep as string for input binding, parseInt in navigateToHistory if needed

const navigateToHistory = () => {
  if (testPatientId.value) {
    // Ensure it's an integer before navigating
    const patientIdInt = parseInt(testPatientId.value);
    if (!isNaN(patientIdInt)) {
      router.push({ name: 'clinic-visits', params: { patientId: patientIdInt } });
    } else {
      alert('Please enter a valid numeric Patient ID.');
    }
  } else {
    alert('Please enter a Patient ID.');
  }
};

const navigateToVisits = () => {
  if (testPatientId.value) {
    const patientIdInt = parseInt(testPatientId.value);
    if (!isNaN(patientIdInt)) {
      router.push({ name: 'clinic-visits', params: { patientId: patientIdInt } });
    } else {
      alert('Please enter a valid numeric Patient ID.');
    }
  } else {
    alert('Please enter a Patient ID.');
  }
};

const navigateToTriage = () => { // Ensure this function is here
  if (testPatientId.value) {
    const patientIdInt = parseInt(testPatientId.value);
    if (!isNaN(patientIdInt)) {
      router.push({ name: 'triage-records', params: { patientId: patientIdInt } });
    } else {
      alert('Please enter a valid numeric Patient ID.');
    }
  } else {
    alert('Please enter a Patient ID.');
  }
};

// New function to navigate to lab results
const navigateToLabResults = () => {
  if (testPatientId.value) {
    const patientIdInt = parseInt(testPatientId.value);
    if (!isNaN(patientIdInt)) {
      router.push({ name: 'lab-results', params: { patientId: patientIdInt } });
    } else {
      alert('Please enter a valid numeric Patient ID.');
    }
  } else {
    alert('Please enter a Patient ID.');
  }
};

// New function to navigate to patient documents
const navigateToDocuments = () => {
  if (testPatientId.value) {
    const patientIdInt = parseInt(testPatientId.value);
    if (!isNaN(patientIdInt)) {
      router.push({ name: 'patient-documents', params: { patientId: patientIdInt } });
    } else {
      alert('Please enter a valid numeric Patient ID.');
    }
  } else {
    alert('Please enter a Patient ID.');
  }
};
</script>

<style lang="scss" scoped>
@import '../assets/styles/_variables.scss';
.page-container {
  padding: $spacing-lg;
}
/** 
.form-control {
  // Use the global form-control styles defined in _common.scss
}

.btn {
  // Use the global btn styles
}
  */
</style>