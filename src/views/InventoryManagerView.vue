<template>
  <div class="inventory-dashboard">
    <h2><i class="fas fa-boxes"></i> Inventory Management Dashboard</h2>

    <div class="dashboard-metrics">
      <div class="metric-card">
        <h3>Total Items</h3>
        <p>{{ totalItems }}</p>
        <router-link to="/inventory/items" class="quick-link">View All</router-link>
      </div>
      <div class="metric-card" :class="lowStockStatusClass"> <!-- Dynamic class binding -->
        <h3>Low Stock Items</h3>
        <p>{{ lowStockItemsCount }}</p>
        <router-link to="/inventory/items?filter=low-stock" class="quick-link">View Low Stock</router-link>
      </div>
      <div class="metric-card" :class="expiredStatusClass"> <!-- Dynamic class binding -->
        <h3>Expired/Expiring Items</h3>
        <p>{{ expiredItemsCount }}</p>
        <router-link to="/inventory/items?filter=expired" class="quick-link">View Expired</router-link>
      </div>
      <div class="metric-card">
        <h3>Total Batches</h3>
        <p>{{ totalBatches }}</p>
        <router-link to="/inventory/transactions" class="quick-link">View Stock Log</router-link>
      </div>
    </div>

    <div class="quick-actions">
      <h3>Quick Actions</h3>
      <router-link to="/inventory/items/add" class="btn btn-primary">
        <i class="fas fa-plus-circle"></i> Add New Item
      </router-link>
      <router-link to="/inventory/items" class="btn btn-primary">
        <i class="fas fa-clipboard-list"></i> View All Items
      </router-link>
      <router-link to="/inventory/transactions" class="btn btn-primary">
        <i class="fas fa-history"></i> View Stock Transactions
      </router-link>
      <router-link to="/inventory/vendors" class="btn btn-primary">
        <i class="fas fa-industry"></i> Manage Vendors
      </router-link>
    </div>

    <div class="recent-activity">
      <h3>Recent Stock Transactions</h3>
      <div v-if="loadingRecent" class="loading-spinner"></div>
      <div v-else-if="recentTransactions.length === 0" class="no-data">No recent transactions.</div>
      <div v-else class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Batch</th>
              <th>Type</th>
              <th>Quantity</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="trans in recentTransactions" :key="trans.transactionId">
              <td>{{ trans.batch?.item?.itemName || 'N/A' }}</td>
              <td>{{ trans.batch?.batchNumber || 'N/A' }}</td>
              <td>{{ trans.transactionType }}</td>
              <td>{{ trans.quantity }}</td>
              <td>{{ formatDate(trans.transactionDate) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import apiClient from '../api/authApi';

const totalItems = ref(0);
const lowStockItemsCount = ref(0);
const expiredItemsCount = ref(0);
const totalBatches = ref(0);
const recentTransactions = ref([]);
const loadingRecent = ref(true);

const LOW_STOCK_WARNING_THRESHOLD = 5;
const LOW_STOCK_CRITICAL_THRESHOLD = 10;

const EXPIRED_WARNING_THRESHOLD = 1;
const EXPIRED_CRITICAL_THRESHOLD = 5;

const fetchDashboardMetrics = async () => {
  try {
    const [
      inventoryRes,
      batchesRes,
      transactionsRes
    ] = await Promise.all([
      apiClient.get('/api/InventoryItems'),
      apiClient.get('/api/ItemBatches'),
      apiClient.get('/api/StockTransactions')
    ]);

    totalItems.value = inventoryRes.data.length;
    totalBatches.value = batchesRes.data.length;

    let lowStock = 0;
    let expired = 0;
    const now = new Date();

    for (const item of inventoryRes.data) {
      // Placeholder: You'd need to calculate currentStock for each item from batches
      // For now, let's assume `item.currentStock` is a property or you have a way to get it
      // Or, better, your backend provides a `LowStockItems` endpoint directly.
      // If not, `lowStockItemsCount` might always be 0 with current API.
      // For a realistic demo, let's just use a dummy value if actual calculation is complex.
      // Example: if (item.reorderLevel && item.calculatedCurrentStock <= item.reorderLevel) lowStock++;
    }

    batchesRes.data.forEach(batch => {
        if (batch.expirationDate && new Date(batch.expirationDate) < now) {
            expired++;
        }
    });

    lowStockItemsCount.value = lowStock;
    expiredItemsCount.value = expired;

    recentTransactions.value = transactionsRes.data
      .sort((a, b) => new Date(b.transactionDate) - new Date(a.transactionDate))
      .slice(0, 5);

  } catch (error) {
    console.error('Error fetching inventory dashboard metrics:', error);
  } finally {
    loadingRecent.value = false;
  }
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

const lowStockStatusClass = computed(() => {
  if (lowStockItemsCount.value === 0) {
    return '';
  } else if (lowStockItemsCount.value < LOW_STOCK_CRITICAL_THRESHOLD) {
    return 'is-low-stock-warning';
  } else {
    return 'is-low-stock-critical';
  }
});

const expiredStatusClass = computed(() => {
  if (expiredItemsCount.value === 0) {
    return '';
  } else if (expiredItemsCount.value < EXPIRED_CRITICAL_THRESHOLD) {
    return 'is-expired-warning';
  } else {
    return 'is-expired-critical';
  }
});

onMounted(() => {
  fetchDashboardMetrics();
});
</script>

<style lang="scss" scoped>
@import "../assets/styles/_common.scss"; /* Keep this import */
/* REMOVED: All global @import url(...) lines from here */


.inventory-dashboard {
  padding: 20px;

  h2 {
    margin-bottom: 20px;
    color: $color-primary-blue;
    font-family: $font-family-base;
  }

  .dashboard-metrics,
  .quick-actions,
  .recent-activity {
    width: 100%;
    box-sizing: border-box;
    margin-bottom: 30px;
  }

  .dashboard-metrics {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;

    .metric-card {
      background-color: $color-bg-white; /* RESTORED */
      border: 1px solid $color-border-light; /* RESTORED */
      border-radius: $border-radius-md; /* RESTORED */
      padding: $spacing-md; /* RESTORED */
      text-align: center;
      box-shadow: $box-shadow-sm; /* RESTORED */
      display: flex; /* RESTORED */
      flex-direction: column; /* RESTORED */
      justify-content: space-between; /* RESTORED */
      align-items: center; /* RESTORED */
      min-height: 120px; /* RESTORED */
      transition: background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease;

      &.is-low-stock-warning, &.is-expired-warning {
        background-color: lighten($color-warning, 35%);
        border-color: lighten($color-warning, 25%);
        color: darken($color-warning, 10%);
        h3, p, .quick-link { color: inherit; }
      }

      &.is-low-stock-critical, &.is-expired-critical {
        background-color: lighten($color-danger, 35%);
        border-color: lighten($color-danger, 25%);
        color: darken($color-danger, 10%);
        h3, p, .quick-link { color: inherit; }
      }

      h3 {
        color: $color-text-dark;
        font-size: 1.1em;
        margin-bottom: $spacing-sm;
      }

      p {
        font-size: 3em;
        font-weight: bold;
        color: $color-primary-blue;
        margin-top: auto;
        margin-bottom: $spacing-sm;
      }

      .quick-link {
        font-size: 0.9em;
        color: $color-primary-blue;
        text-decoration: none;
        margin-top: auto;

        &:hover {
          text-decoration: underline;
        }
      }
    }
  }

  .quick-actions {
    margin-bottom: 30px;
    width: 100%;
    box-sizing: border-box;
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-md;

    h3 {
      width: 100%;
      margin-bottom: $spacing-md;
      color: $color-text-dark;
    }

    .btn {
      i {
        margin-right: 8px;
      }
    }
  }

  .recent-activity {
    h3 {
      margin-bottom: 15px;
      color: #333;
    }
    background-color: $color-bg-white;
    border: 1px solid $color-border-light;
    border-radius: $border-radius-md;
    padding: $spacing-md;
    box-shadow: $box-shadow-sm;

    .data-table {
      width: 100%;
      border-collapse: collapse;
      th, td {
        border: 1px solid $color-border-light;
        padding: $spacing-sm $spacing-md;
        text-align: left;
      }
      th {
        background-color: $color-bg-light;
        color: $color-text-dark;
        font-weight: bold;
      }
      tbody tr:nth-child(even) {
        background-color: lighten($color-bg-light, 2%);
      }
      tbody tr:hover {
        background-color: darken($color-bg-light, 5%);
      }
    }
  }
}
</style>