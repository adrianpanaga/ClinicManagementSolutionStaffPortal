<template>
  <div class="stock-transactions-log">
    <h2><i class="fas fa-history"></i> Stock Transactions Log</h2>

    <div class="toolbar">
      <select v-model="filterTransactionType" @change="fetchTransactions">
        <option value="">All Types</option>
        <option value="receive">Receive</option>
        <option value="dispense">Dispense</option>
        <option value="return">Return</option>
        <option value="damaged">Damaged/Spoiled</option>
        </select>
      <button @click="clearFilters" class="btn btn-outline-secondary">Clear Filter</button>
      </div>

    <div v-if="loading" class="loading-spinner"></div>
    <div v-else-if="transactions.length === 0" class="no-data">No stock transactions found.</div>
    <div v-else class="table-responsive">
      <table class="data-table">
        <thead>
          <tr>
            <th>Transaction ID</th>
            <th>Item Name</th>
            <th>Batch Number</th>
            <th>Type</th>
            <th>Quantity</th>
            <th>Transaction Date</th>
            <th>Notes</th>
            <th>Staff</th>
            <th>Patient</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="trans in transactions" :key="trans.transactionId">
            <td>{{ trans.transactionId }}</td>
            <td>{{ trans.batch?.item?.itemName || 'N/A' }}</td>
            <td>{{ trans.batch?.batchNumber || 'N/A' }}</td>
            <td>{{ trans.transactionType }}</td>
            <td>{{ trans.quantity }}</td>
            <td>{{ formatDate(trans.transactionDate) }}</td>
            <td>{{ trans.notes || 'N/A' }}</td>
            <td>{{ trans.staff?.fullName || 'N/A' }}</td>
            <td>{{ trans.patient?.firstName }} {{ trans.patient?.lastName || 'N/A' }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import apiClient from '../../api/authApi'; // Corrected path to apiClient

const transactions = ref([]);
const loading = ref(true);
const filterTransactionType = ref('');

const fetchTransactions = async () => {
  loading.value = true;
  try {
    const response = await apiClient.get('/api/StockTransactions', {
      params: { transactionType: filterTransactionType.value || null }
    });
    // The API returns StockTransactionDto which includes batch, staff, and patient details.
    transactions.value = response.data;
  } catch (error) {
    console.error('Error fetching stock transactions:', error);
    alert('Failed to load stock transactions.');
  } finally {
    loading.value = false;
  }
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

const clearFilters = () => {
  filterTransactionType.value = '';
  fetchTransactions();
};

onMounted(() => {
  fetchTransactions();
});
</script>

<style lang="scss" scoped>
@import "../../assets/styles/_common.scss"; // This should contain your color variables

.stock-transactions-log {
  padding: 20px;

  h2 {
    margin-bottom: 20px;
    color: $color-primary-blue; // Using your variable
    font-family: $font-family-base; // Using your variable
  }

  .toolbar {
    display: flex;
    gap: 15px;
    margin-bottom: 20px;
    align-items: center;

    select {
      padding: 8px 12px;
      border: 1px solid #ccc;
      border-radius: 5px;
      font-size: 1em;
    }

    .btn {
      padding: 8px 15px;
      border-radius: 5px;
      cursor: pointer;
      font-weight: bold;
      transition: background-color 0.3s ease;
      display: inline-flex;
      align-items: center;
      white-space: nowrap;

      i {
        margin-right: 5px;
      }
    }

    .btn-outline-secondary {
      background-color: transparent;
      color: $color-secondary-grey; // Using your variable
      border: 1px solid $color-secondary-grey;
      &:hover {
        background-color: $color-secondary-grey;
        color: white;
      }
    }
  }

  .loading-spinner, .no-data {
    text-align: center;
    padding: 50px;
    font-size: 1.2em;
    color: #666;
  }

  .table-responsive {
    overflow-x: auto;
  }

  .data-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 20px;

    th, td {
      border: 1px solid #eee;
      padding: 12px 15px;
      text-align: left;
    }

    th {
      background-color: #f2f2f2;
      font-weight: bold;
      color: #333;
    }

    tbody tr:nth-child(even) {
      background-color: #f9f9f9;
    }

    tbody tr:hover {
      background-color: #e9e9e9;
    }

    .status-badge { /* Not directly used here, but kept for consistency if you add statuses */
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 0.85em;
      font-weight: bold;
      color: white;

      &.pending { background-color: #ffc107; }
      &.ordered { background-color: #17a2b8; }
      &.received { background-color: #28a745; }
      &.cancelled { background-color: #dc3545; }
    }

    .btn {
      padding: 6px 10px;
      font-size: 0.85em;
      margin-left: 5px;
      display: inline-flex;
      align-items: center;
      &.btn-primary { background-color: $color-primary-blue; color: white; border: 1px solid $color-primary-blue; &:hover { background-color: darken($color-primary-blue, 10%); } }
      &.btn-success { background-color: #28a745; color: white; border: 1px solid #28a745; &:hover { background-color: darken(#28a745, 10%); } }
      &.btn-danger { background-color: #dc3545; color: white; border: 1px solid #dc3545; &:hover { background-color: darken(#dc3545, 10%); } }
    }
  }
}
</style>