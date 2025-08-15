<template>
  <div class="stock-transactions-log-view">
    <div v-if="hasPermission">
      <h2 class="section-title">Stock Transactions Log</h2>
      <p class="subtitle">A chronological record of all inventory movements within the clinic.</p>

      <div class="search-and-actions">
        <div class="form-group search-group">
          <input type="text" v-model="searchTerm" @input="debounceSearch" class="form-control search-input" placeholder="Search by item, batch, or staff" />
          <font-awesome-icon :icon="['fas', 'search']" class="search-icon" />
        </div>
      </div>

      <div v-if="loading" class="loading-message">
        <font-awesome-icon :icon="['fas', 'spinner']" spin /> Loading transactions...
      </div>
      <div v-else-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>

      <div v-else-if="filteredTransactions.length === 0" class="no-records-message">
        No transactions found matching your search.
      </div>
      
      <div v-else class="transactions-table-container card">
        <table class="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Item Name</th>
              <th>Batch Number</th>
              <th>Transaction Type</th>
              <th>Quantity</th>
              <th>Staff</th>
              <th>Patient</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="trans in filteredTransactions" :key="trans.transactionId">
              <td>{{ formatDateTime(trans.transactionDate) }}</td>
              <td>{{ trans.batch?.inventoryItem?.itemName || 'N/A' }}</td>
              <td>{{ trans.batch?.batchNumber || 'N/A' }}</td>
              <td>
                <span :class="['transaction-badge', `transaction-${trans.transactionType?.toLowerCase()}`]">
                  {{ trans.transactionType || 'N/A' }}
                </span>
              </td>
              <td>{{ trans.quantity }}</td>
              <td>
                <router-link v-if="trans.staff" :to="{ name: 'staff-profile', params: { staffId: trans.staff.staffId } }">
                  {{ trans.staff.fullName || 'N/A' }}
                </router-link>
                <span v-else>N/A</span>
              </td>
              <td>
                <router-link v-if="trans.patient" :to="{ name: 'patient-history', params: { patientId: trans.patient.patientId } }">
                  {{ trans.patient.fullName || 'N/A' }}
                </router-link>
                <span v-else>N/A</span>
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
import apiClient from '../../api/authApi';
import { authStore } from '../../stores/auth';

const transactions = ref([]);
const filteredTransactions = ref([]);
const searchTerm = ref('');
const loading = ref(true);
const errorMessage = ref('');
let searchTimeout = null;

// --- Computed property for role-based permissions
const hasPermission = computed(() => {
  const roles = authStore.userRoles;
  return roles.includes('Admin') || roles.includes('InventoryManager');
});

// --- Data Fetching
const fetchTransactions = async () => {
  loading.value = true;
  errorMessage.value = '';
  try {
    const response = await apiClient.get('/api/StockTransactions');
    transactions.value = response.data;
    filteredTransactions.value = response.data;
  } catch (error) {
    console.error('Error fetching stock transactions:', error);
    errorMessage.value = `Failed to load transactions: ${error.response?.data?.detail || error.message || error.response?.statusText}`;
  } finally {
    loading.value = false;
  }
};

// --- Search Logic
const search = () => {
  if (!searchTerm.value) {
    filteredTransactions.value = transactions.value;
    return;
  }
  const lowerCaseSearchTerm = searchTerm.value.toLowerCase();
  filteredTransactions.value = transactions.value.filter(trans => 
    (trans.batch?.inventoryItem?.itemName?.toLowerCase().includes(lowerCaseSearchTerm)) ||
    (trans.batch?.batchNumber?.toLowerCase().includes(lowerCaseSearchTerm)) ||
    (trans.staff?.fullName?.toLowerCase().includes(lowerCaseSearchTerm))
  );
};
const debounceSearch = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(search, 300);
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
onMounted(async () => {
  if (!hasPermission.value) {
    loading.value = false;
    return;
  }
  await fetchTransactions();
});
</script>

<style lang="scss" scoped>
@import "../../assets/styles/_variables.scss";

.stock-transactions-log-view {
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

.search-and-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-bottom: $spacing-md;

  .search-group {
    position: relative;
    width: 300px;
  }
}

.transactions-table-container {
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

    .transaction-badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: bold;
      color: $color-bg-white;

      &.transaction-add { background-color: $color-confirm-green; }
      &.transaction-remove { background-color: $color-error; }
      &.transaction-reorder { background-color: $color-info; }
    }

    a {
      color: $color-primary-blue;
      text-decoration: none;
      &:hover { text-decoration: underline; }
    }
  }

  tr:hover {
    background-color: $color-bg-light;
  }
}

.loading-message, .error-message, .no-records-message {
  text-align: center;
  padding: $spacing-md;
  margin-top: $spacing-lg;
  border-radius: $border-radius-sm;
  font-weight: bold;
}
.error-message {
  color: $color-error;
  background-color: lighten($color-error, 40%);
  border: 1px solid $color-error;
}
.no-records-message {
  color: $color-secondary-grey;
}
.loading-message {
  color: $color-info;
}
</style>