<template>
  <div class="patient-documents-view">
    <div v-if="patient">
      <h2 class="section-title">Documents for {{ patient.firstName + ' ' + patient.lastName}} (ID: {{ patient.patientId }})</h2>
      <div class="patient-info-card card">
        <p><strong>Date of Birth:</strong> {{ formatDate(patient.dateOfBirth) }}</p>
        <p><strong>Contact:</strong> {{ patient.contactNumber }}</p>
        <p><strong>Email:</strong> {{ patient.email }}</p>
        <router-link :to="{ name: 'patient-history', params: { patientId: patient.patientId } }" class="btn btn-primary btn-sm mt-3">
          <font-awesome-icon :icon="['fas', 'file-medical']" class="icon" /> View Medical History
        </router-link>
        <router-link :to="{ name: 'clinic-visits', params: { patientId: patient.patientId } }" class="btn btn-secondary btn-sm mt-3 ml-2">
          <font-awesome-icon :icon="['fas', 'calendar-alt']" class="icon" /> View Visit History
        </router-link>
        <router-link :to="{ name: 'triage-records', params: { patientId: patient.patientId } }" class="btn btn-info btn-sm mt-3 ml-2">
          <font-awesome-icon :icon="['fas', 'heartbeat']" class="icon" /> View Triage Records
        </router-link>
        <router-link :to="{ name: 'patient-lab-results', params: { patientId: patient.patientId } }" class="btn btn-success btn-sm mt-3 ml-2">
          <font-awesome-icon :icon="['fas', 'vials']" class="icon" /> View Lab Results
        </router-link>
      </div>

      <h3 class="subsection-title">Uploaded Documents</h3>
      <div v-if="loadingDocuments" class="loading-message">
        <font-awesome-icon :icon="['fas', 'spinner']" spin class="icon" /> Loading documents...
      </div>
      <div v-else-if="documentsError" class="error-message">
        {{ documentsError }}
      </div>
      <div v-else-if="patientDocuments.length === 0" class="no-records-message">
        No documents found for this patient.
        <button v-if="canAddDocument" @click="openAddForm" class="btn btn-primary mt-3">
          <font-awesome-icon :icon="['fas', 'plus']" class="icon" /> Add New Document
        </button>
      </div>
      <div v-else class="document-list">
        <div v-for="document in patientDocuments" :key="document.documentId" class="document-card card">
          <div class="document-header">
            <h4><font-awesome-icon :icon="['fas', 'file-alt']" class="icon" /> {{ document.documentName }} ({{ document.documentType || 'Document' }})</h4>
            <span class="document-date">Uploaded: {{ formatDate(document.uploadDate) }}</span>
          </div>
          <div class="document-details-grid">
            <div class="detail-item full-width">
              <strong>Path/URL:</strong>
              <a :href="document.filePathOrUrl" target="_blank" rel="noopener noreferrer" class="document-link">
                {{ document.filePathOrUrl }} <font-awesome-icon :icon="['fas', 'external-link-alt']" class="icon-sm" />
              </a>
            </div>
            <div class="detail-item full-width">
              <strong>Notes:</strong> {{ document.notes || 'No notes.' }}
            </div>
            <div class="detail-item">
              <strong>Uploaded By:</strong> {{ document.uploadedByStaff?.firstName + ' ' + document.uploadedByStaff?.lastName || 'N/A' }}
            </div>
          </div>
          <div class="document-actions" v-if="canEditDocument">
            <button @click="editDocument(document)" class="btn btn-info btn-sm">
              <font-awesome-icon :icon="['fas', 'edit']" class="icon" /> Edit
            </button>
            <button @click="deleteDocument(document.documentId)" class="btn btn-danger btn-sm ml-2">
              <font-awesome-icon :icon="['fas', 'trash']" class="icon" /> Delete
            </button>
          </div>
        </div>
        <button v-if="!showAddForm && canAddDocument" @click="openAddForm" class="btn btn-primary mt-3">
          <font-awesome-icon :icon="['fas', 'plus']" class="icon" /> Add New Document
        </button>
      </div>
    </div>
    <div v-else-if="loadingPatient" class="loading-message">
      <font-awesome-icon :icon="['fas', 'spinner']" spin class="icon" /> Loading patient details...
    </div>
    <div v-else-if="patientError" class="error-message">
      {{ patientError }}
    </div>

    <div v-if="showAddForm || editingDocument" class="add-edit-form card mt-4">
      <h3>{{ editingDocument ? 'Edit Document' : 'Add New Document' }}</h3>
      <form @submit.prevent="saveDocument">
        <div class="form-group-grid">
          <div class="form-group">
            <label for="documentName">Document Name:</label>
            <input type="text" id="documentName" v-model="currentDocument.documentName" class="form-control" required />
          </div>
          <div class="form-group">
            <label for="documentType">Document Type:</label>
            <input type="text" id="documentType" v-model="currentDocument.documentType" class="form-control" />
          </div>
          <div class="form-group full-width">
            <label for="filePathOrUrl">File Path/URL:</label>
            <input type="url" id="filePathOrUrl" v-model="currentDocument.filePathOrUrl" class="form-control" required />
          </div>
          <div class="form-group full-width">
            <label for="notes">Notes:</label>
            <textarea id="notes" v-model="currentDocument.notes" class="form-control"></textarea>
          </div>
          <div class="form-group">
            <label for="uploadedByStaffId">Uploaded By Staff ID (Optional):</label>
            <input type="number" id="uploadedByStaffId" v-model.number="currentDocument.uploadedByStaffId" class="form-control" />
          </div>
        </div>
        <div class="form-actions">
          <button type="submit" class="btn btn-success">
            <font-awesome-icon :icon="['fas', 'save']" class="icon" /> Save Document
          </button>
          <button type="button" @click="cancelForm" class="btn btn-secondary ml-2">
            <font-awesome-icon :icon="['fas', 'times']" class="icon" /> Cancel
          </button>
        </div>
        <div v-if="formError" class="error-message mt-3">{{ formError }}</div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import { useRoute } from 'vue-router';
import apiClient from '../api/authApi.js';
import { authStore } from '../stores/auth.js';

const route = useRoute();
const patientId = ref(null);

const patient = ref(null);
const patientDocuments = ref([]);

const loadingPatient = ref(true);
const loadingDocuments = ref(true);
const patientError = ref('');
const documentsError = ref('');
const formError = ref('');

const showAddForm = ref(false);
const editingDocument = ref(null);
const currentDocument = ref({});

// Computed properties for role-based permissions
const canAddDocument = computed(() => {
  const roles = authStore.userRoles;
  return roles.includes('Admin') || roles.includes('Receptionist') || roles.includes('HR');
});

const canEditDocument = computed(() => {
  const roles = authStore.userRoles;
  return roles.includes('Admin') || roles.includes('Receptionist') || roles.includes('HR');
});


const fetchPatientData = async (id) => {
  loadingPatient.value = true;
  patientError.value = '';
  try {
  const response = await apiClient.get(`/api/Patients/${id}`);
    patient.value = response.data;
  } catch (error) {
    console.error(`Failed to fetch patient with ID ${id}:`, error);
    patientError.value = `Failed to load patient details. ${error.response?.data?.detail || error.message || error.response?.statusText}`;
  } finally {
    loadingPatient.value = false;
  }
};

const fetchPatientDocuments = async (id) => {
  loadingDocuments.value = true;
  documentsError.value = '';
  try {
    const response = await apiClient.get(`/api/PatientDocuments/patient/${id}`);
    patientDocuments.value = response.data;
  } catch (error) {
    console.error(`Failed to fetch patient documents for patient ID ${id}:`, error);
    if (error.response && error.response.status === 404) {
      documentsError.value = 'No documents found for this patient.';
    } else if (error.response && error.response.status === 403) {
      documentsError.value = 'Access Denied: You do not have permission to view these documents.';
    } else {
      documentsError.value = `Failed to load documents. ${error.response?.data?.detail || error.message || error.response?.statusText}`;
    }
    patientDocuments.value = [];
  } finally {
    loadingDocuments.value = false;
  }
};

const openAddForm = () => {
  editingDocument.value = null;
  currentDocument.value = { PatientId: patientId.value };
  showAddForm.value = true;
  formError.value = '';
};

const editDocument = (document) => {
  showAddForm.value = false;
  editingDocument.value = { ...document };
  currentDocument.value = { ...document };
  formError.value = '';
};

const cancelForm = () => {
  showAddForm.value = false;
  editingDocument.value = null;
  currentDocument.value = {};
  formError.value = '';
};

const saveDocument = async () => {
  formError.value = '';
  try {
    const payload = { ...currentDocument.value };
    payload.UploadedByStaffId = payload.UploadedByStaffId ? parseInt(payload.UploadedByStaffId) : null;

    if (editingDocument.value) {
      await apiClient.put(`/api/PatientDocuments/${payload.documentId}`, payload);
    } else {
      await apiClient.post('/api/PatientDocuments', payload);
    }
    cancelForm();
    fetchPatientDocuments(patientId.value);
  } catch (error) {
    console.error('Failed to save document:', error);
    formError.value = `Failed to save document: ${error.response?.data?.detail || error.message || error.response?.statusText}`;
  }
};

const deleteDocument = async (id) => {
  if (confirm('Are you sure you want to delete this document?')) {
    try {
      await apiClient.delete(`/api/PatientDocuments/${id}`);
      fetchPatientDocuments(patientId.value);
    } catch (error) {
      console.error('Failed to delete document:', error);
      alert(`Failed to delete document: ${error.response?.data?.detail || error.message || error.response?.statusText}`);
    }
  }
};


// Helper functions for date formatting
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Invalid Date';
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return date.toLocaleDateString(undefined, options);
};

// No formatDateTime needed as UploadDate is just a date in display

// Watch for changes in route.params.patientId
watch(() => route.params.patientId, (newId) => {
  if (newId) {
    const parsedId = parseInt(newId);
    if (!isNaN(parsedId)) {
      patientId.value = parsedId;
      fetchPatientData(parsedId);
      fetchPatientDocuments(parsedId);
      cancelForm();
    } else {
      console.error("Invalid patient ID received:", newId);
      patientError.value = "Invalid patient ID provided in URL.";
    }
  }
}, { immediate: true });
</script>

<style lang="scss" scoped>
@import '../assets/styles/_variables.scss';

.patient-documents-view {
  padding: $spacing-lg;
}

.section-title {
  color: $color-primary-blue;
  margin-bottom: $spacing-lg;
  text-align: center;
}

.subsection-title {
  color: $color-text-dark;
  margin-top: $spacing-xl;
  margin-bottom: $spacing-md;
  border-bottom: 1px solid $color-border-darker;
  padding-bottom: $spacing-xs;
}

.patient-info-card {
  text-align: left;
  padding: $spacing-md $spacing-lg;
  background-color: $color-bg-white;
  border-radius: $border-radius-md;
  box-shadow: $box-shadow-sm;
  margin-bottom: $spacing-xl;

  p {
    margin: $spacing-xs 0;
    color: $color-text-medium-grey;
  }

  strong {
    color: $color-text-dark;
  }

  .btn {
    display: inline-flex;
    align-items: center;
    gap: $spacing-xs;
    margin-top: $spacing-md;
  }

  .ml-2 {
    margin-left: $spacing-sm;
  }
}

.loading-message, .error-message, .no-records-message {
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

.no-records-message {
  color: $color-secondary-grey;
  background-color: lighten($color-secondary-grey, 40%);
}

.document-list {
  display: grid;
  gap: $spacing-lg;
}

.document-card {
  background-color: $color-bg-white;
  padding: $spacing-lg;
  border-radius: $border-radius-md;
  box-shadow: $box-shadow-md;
  overflow: hidden;

  .document-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $spacing-md;
    padding-bottom: $spacing-xs;
    border-bottom: 1px dashed $color-border-medium;

    h4 {
      margin: 0;
      color: $color-primary-blue;
      font-size: 1.2rem;

      .icon {
        margin-right: $spacing-xs;
      }
    }

    .document-date {
      font-size: 0.95rem;
      color: $color-text-medium-grey;
    }
  }

  .document-details-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: $spacing-sm $spacing-md;

    .detail-item {
      padding: $spacing-xs 0;
      word-break: break-word;
      color: $color-text-dark;
      font-size: 0.95rem;

      strong {
        display: block;
        color: $color-secondary-grey;
        margin-bottom: $spacing-xs;
      }

      &.full-width {
        grid-column: 1 / -1;
      }
    }

    .document-link {
      color: $color-primary-blue;
      text-decoration: none;
      word-break: break-all; // Break long URLs
      &:hover {
        text-decoration: underline;
        color: $color-primary-blue-darker;
      }
      .icon-sm {
        font-size: 0.8em;
        margin-left: $spacing-xs;
      }
    }
  }

  .document-actions {
    margin-top: $spacing-md;
    text-align: right;

    .btn {
      margin-left: $spacing-sm; // Space between buttons
    }
  }
}

/* Form Styles */
.add-edit-form {
  padding: $spacing-lg;
  background-color: $color-bg-white;
  border-radius: $border-radius-lg;
  box-shadow: $box-shadow-md;

  h3 {
    color: $color-primary-blue;
    margin-bottom: $spacing-lg;
    text-align: center;
    border-bottom: 1px solid $color-border-darker;
    padding-bottom: $spacing-md;
  }

  .form-group {
    margin-bottom: $spacing-md;
    text-align: left;
  }

  .form-group-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: $spacing-md;
    margin-bottom: $spacing-md;

    .full-width {
      grid-column: 1 / -1;
    }
  }

  label {
    display: block;
    margin-bottom: $spacing-xs;
    font-weight: bold;
    color: $color-text-dark;
  }

  .form-control {
    width: 100%;
    padding: $spacing-sm;
    border: 1px solid $color-border-medium;
    border-radius: $border-radius-sm;
    box-sizing: border-box;

    &:focus {
      outline: none;
      border-color: $color-primary-blue;
      box-shadow: 0 0 0 0.2rem rgba($color-primary-blue, 0.25);
    }
  }

  textarea.form-control {
    min-height: 80px;
    resize: vertical;
  }

  .form-actions {
    text-align: right;
    margin-top: $spacing-lg;

    .btn {
      min-width: 120px;
      padding: $spacing-sm $spacing-md;
      font-size: 1rem;
      margin-left: $spacing-sm; // Space between action buttons
    }
  }
}
</style>