<template>
  <div class="inventory-items-list-view">
    <div v-if="hasPermission">
      <h2 class="section-title">All Inventory Items</h2>

      <div class="toolbar card">
        <div class="search-group">
          <input type="text" v-model="searchQuery" placeholder="Search by item, category..." @input="debouncedFetchItems" class="form-control" />
          <i class="fas fa-search search-icon"></i>
        </div>
        <div class="filter-group">
          <input type="text" v-model="filterCategory" placeholder="Filter by Category" @input="debouncedFetchItems" class="form-control" />
        </div>
        <button @click="clearFilters" class="btn btn-secondary">
          <i class="fas fa-eraser"></i> Clear Filters
        </button>
        <router-link to="/inventory/items/add" class="btn btn-primary ml-auto">
          <i class="fas fa-plus-circle"></i> Add New Item
        </router-link>
      </div>

      <div v-if="loading" class="loading-message">
        <i class="fas fa-spinner icon" spin></i> Loading inventory items...
      </div>
      <div v-else-if="items.length === 0" class="no-records-message">
        No inventory items found.
      </div>
      <div v-else class="items-table-container card">
        <table class="data-table">
          <thead>
            <tr>
              <th>Item Name</th>
              <th>Category</th>
              <th>Unit</th>
              <th>Purchase Price</th>
              <th>Selling Price</th>
              <th>Reorder Level</th>
              <th>Lead Time (Days)</th>
              <th>Vendor</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in items" :key="item.itemId" :class="{ 'low-stock': item.currentStockCalculated <= item.reorderLevel }">
              <td>{{ item.itemName }}</td>
              <td>{{ item.category || 'N/A' }}</td>
              <td>{{ item.unitOfMeasure || 'N/A' }}</td>
              <td>{{ item.purchasePrice ? `$${item.purchasePrice.toFixed(2)}` : 'N/A' }}</td>
              <td>{{ item.sellingPrice ? `$${item.sellingPrice.toFixed(2)}` : 'N/A' }}</td>
              <td>{{ item.reorderLevel || 'N/A' }}</td>
              <td>{{ item.leadTimeDays || 'N/A' }}</td>
              <td>{{ item.vendorName || 'N/A' }}</td>
              <td class="actions">
                <button @click="editItem(item.itemId)" class="btn btn-sm btn-info">
                  <i class="fas fa-edit"></i>
                </button>
                <button @click="confirmDelete(item.itemId)" class="btn btn-sm btn-danger ml-1">
                  <i class="fas fa-trash-alt"></i>
                </button>
                <button @click="openStockAdjustmentModal(item)" class="btn btn-sm btn-warning ml-1">
                  <i class="fas fa-exchange-alt"></i>
                </button>
                <button @click="viewBatches(item.itemId)" class="btn btn-sm btn-success ml-1">
                  <i class="fas fa-boxes"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <div v-else class="error-message">
      Access Denied: You do not have permission to view this page.
    </div>

    <div v-if="showStockAdjustmentModal" class="modal-overlay">
      <div class="modal-content card">
        <h3>Adjust Stock for {{ selectedItem.itemName }}</h3>
        <p>Current Quantity based on fetched batches: <strong>{{ selectedItem.currentStockCalculated }}</strong></p>

        <form @submit.prevent="submitStockAdjustment">
          <div class="form-group-grid">
            <div class="form-group">
              <label for="adjustmentType">Adjustment Type:</label>
              <select id="adjustmentType" v-model="adjustmentType" class="form-control">
                <option value="receive">Receive New Stock (Add)</option>
                <option value="dispense">Dispense (Remove)</option>
                <option value="return">Return</option>
                <option value="damaged">Damaged/Spoiled</option>
              </select>
            </div>
          </div>
          
          <div v-if="adjustmentType === 'receive'">
            <div class="form-group-grid">
              <div class="form-group">
                <label for="batchNumber">Batch Number (New):</label>
                <input type="text" id="batchNumber" v-model="newBatch.batchNumber" class="form-control" required />
              </div>
              <div class="form-group">
                <label for="quantity">Quantity:</label>
                <input type="number" id="quantity" v-model.number="adjustmentQuantity" class="form-control" required min="1" />
              </div>
              <div class="form-group">
                <label for="expirationDate">Expiration Date (Optional):</label>
                <input type="date" id="expirationDate" v-model="newBatch.expirationDate" class="form-control" />
              </div>
              <div class="form-group">
                <label for="costPerUnit">Cost Per Unit (Optional):</label>
                <input type="number" id="costPerUnit" v-model.number="newBatch.costPerUnit" step="0.01" min="0" class="form-control" />
              </div>
              <div class="form-group full-width">
                <label for="vendor">Vendor (Optional):</label>
                <select id="vendor" v-model="newBatch.vendorId" class="form-control">
                  <option :value="null">Select Vendor</option>
                  <option v-for="sup in vendors" :key="sup.vendorId" :value="sup.vendorId">{{ sup.vendorName }}</option>
                </select>
              </div>
            </div>
          </div>

          <div v-else>
            <div class="form-group-grid">
              <div class="form-group">
                <label for="existingBatch">Select Batch:</label>
                <select id="existingBatch" v-model="selectedBatchId" class="form-control" required>
                  <option :value="null">Select an existing batch</option>
                  <option v-for="batch in itemBatches" :key="batch.batchId" :value="batch.batchId">
                    {{ batch.batchNumber }} (Qty: {{ batch.quantity }}, Exp: {{ formatDate(batch.expirationDate) }})
                  </option>
                </select>
              </div>
              <div class="form-group">
                <label for="quantity">Quantity:</label>
                <input type="number" id="quantity" v-model.number="adjustmentQuantity" class="form-control" required min="1" :max="selectedBatchQuantity" />
                <small v-if="selectedBatchQuantity !== null">Max: {{ selectedBatchQuantity }}</small>
              </div>
            </div>
          </div>

          <div class="form-group full-width">
            <label for="adjustmentNotes">Notes:</label>
            <textarea id="adjustmentNotes" v-model="adjustmentNotes" class="form-control" placeholder="Reason for adjustment"></textarea>
          </div>
          
          <div class="modal-actions">
            <button type="submit" class="btn btn-primary" :disabled="loadingAdjustment">Submit</button>
            <button type="button" @click="closeStockAdjustmentModal" class="btn btn-secondary ml-1">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import apiClient from '../api/authApi';
import { useRouter, useRoute } from 'vue-router';
import { authStore } from '../stores/auth';
import { debounce } from 'lodash';

const router = useRouter();
const route = useRoute();

const items = ref([]);
const vendors = ref([]);
const searchQuery = ref('');
const filterCategory = ref('');
const loading = ref(true);
const loadingAdjustment = ref(false);

const showStockAdjustmentModal = ref(false);
const selectedItem = ref({});
const adjustmentQuantity = ref(0);
const adjustmentType = ref('receive');
const adjustmentNotes = ref('');
const itemBatches = ref([]);
const selectedBatchId = ref(null);
const selectedBatchQuantity = ref(null);

const newBatch = ref({
  batchNumber: '',
  expirationDate: null,
  costPerUnit: 0,
  vendorId: null,
});

const hasPermission = computed(() => {
  const roles = authStore.userRoles;
  return roles.includes('Admin') || roles.includes('InventoryManager');
});

const debouncedFetchItems = debounce(() => {
  fetchItems();
}, 300);

const fetchItems = async () => {
  loading.value = true;
  try {
    const response = await apiClient.get('/api/InventoryItems', {
      params: {
        searchTerm: searchQuery.value,
        category: filterCategory.value || null,
        includeDeleted: false
      }
    });
    items.value = response.data;
  } catch (error) {
    console.error('Error fetching inventory items:', error);
    window.notify('Failed to fetch inventory items.', 'error');
  } finally {
    loading.value = false;
  }
};

const fetchVendors = async () => {
  try {
    const response = await apiClient.get('/api/Vendors');
    vendors.value = response.data;
  } catch (error) {
    console.error('Error fetching vendors:', error);
    window.notify('Failed to fetch vendors.', 'error');
  }
};

const fetchItemBatches = async (itemId) => {
  try {
    const response = await apiClient.get('/api/ItemBatches', { params: { itemId: itemId } });
    itemBatches.value = response.data.filter(b => b.quantity > 0 && (!b.expirationDate || new Date(b.expirationDate) > new Date()));
    const totalStock = itemBatches.value.reduce((sum, batch) => sum + batch.quantity, 0);
    selectedItem.value.currentStockCalculated = totalStock;
  } catch (error) {
    console.error('Error fetching item batches:', error);
    itemBatches.value = [];
  }
};

const openStockAdjustmentModal = async (item) => {
  selectedItem.value = { ...item, currentStockCalculated: 0 };
  adjustmentQuantity.value = 0;
  adjustmentType.value = 'receive';
  adjustmentNotes.value = '';
  selectedBatchId.value = null;
  selectedBatchQuantity.value = null;
  newBatch.value = { batchNumber: '', expirationDate: null, costPerUnit: 0, vendorId: null };

  await fetchItemBatches(item.itemId);
  showStockAdjustmentModal.value = true;
};

const closeStockAdjustmentModal = () => {
  showStockAdjustmentModal.value = false;
};

watch(selectedBatchId, (newVal) => {
  if (newVal) {
    const selected = itemBatches.value.find(b => b.batchId === newVal);
    selectedBatchQuantity.value = selected ? selected.quantity : null;
  } else {
    selectedBatchQuantity.value = null;
  }
});

const submitStockAdjustment = async () => {
  if (adjustmentQuantity.value <= 0) {
    window.notify('Quantity must be greater than zero.', 'error');
    return;
  }
  if (!adjustmentNotes.value) {
    window.notify('Please provide notes for the stock adjustment.', 'error');
    return;
  }

  loadingAdjustment.value = true;
  try {
    let transactionPayload = {
      quantity: adjustmentQuantity.value,
      transactionType: adjustmentType.value,
      notes: adjustmentNotes.value,
      staffId: 1, // Placeholder: Replace with actual logged-in staffId
      patientId: null
    };

    if (adjustmentType.value === 'receive') {
      if (!newBatch.value.batchNumber) {
        window.notify('Batch Number is required for new stock.', 'error');
        loadingAdjustment.value = false;
        return;
      }
      const newBatchPayload = {
        itemId: selectedItem.value.itemId,
        batchNumber: newBatch.value.batchNumber,
        quantity: adjustmentQuantity.value,
        expirationDate: newBatch.value.expirationDate ? new Date(newBatch.value.expirationDate).toISOString() : null,
        receivedDate: new Date().toISOString(),
        costPerUnit: newBatch.value.costPerUnit || null,
        vendorId: newBatch.value.vendorId || null
      };
      const createdBatch = await apiClient.post('/api/ItemBatches', newBatchPayload);
      transactionPayload.batchId = createdBatch.data.batchId;
    } else {
      if (!selectedBatchId.value) {
        window.notify('Please select a batch for this transaction.', 'error');
        loadingAdjustment.value = false;
        return;
      }
      if (adjustmentQuantity.value > selectedBatchQuantity.value) {
          window.notify('Cannot remove more than available in selected batch.', 'error');
          loadingAdjustment.value = false;
          return;
      }
      transactionPayload.batchId = selectedBatchId.value;
    }

    await apiClient.post('/api/StockTransactions', transactionPayload);
    window.notify('Stock adjusted successfully!', 'success');
    closeStockAdjustmentModal();
    fetchItems();
  } catch (error) {
    console.error('Error adjusting stock:', error.response?.data || error.message);
    window.notify(`Failed to adjust stock: ${error.response?.data?.detail || error.message}`, 'error');
  } finally {
    loadingAdjustment.value = false;
  }
};

const editItem = (id) => {
  router.push(`/inventory/items/edit/${id}`);
};

const confirmDelete = async (id) => {
  if (confirm('Are you sure you want to delete this item? This will soft delete it.')) {
    try {
      await apiClient.delete(`/api/InventoryItems/${id}`);
      fetchItems();
      window.notify('Item deleted successfully!', 'success');
    } catch (error) {
      console.error('Error deleting item:', error.response?.data || error.message);
      window.notify('Failed to delete item. Please try again.', 'error');
    }
  }
};

const viewBatches = (itemId) => {
  window.notify(`Viewing batches for Item ID: ${itemId}. You would navigate to a detailed batch view here.`, 'info');
};

const clearFilters = () => {
  searchQuery.value = '';
  filterCategory.value = '';
  fetchItems();
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

onMounted(async () => {
  if (!hasPermission.value) {
    loading.value = false;
    return;
  }
  await fetchVendors();
  fetchItems();
});

watch(() => route.query.filter, (newFilter) => {
  if (newFilter) {
    fetchItems();
  }
});
</script>

<style lang="scss" scoped>
@import "../../assets/styles/_variables.scss";

.inventory-items-list-view {
  padding: $spacing-lg;
}

.section-title {
  color: $color-primary-blue;
  margin-bottom: $spacing-lg;
  text-align: center;
  font-size: 2rem;
}

.toolbar {
  display: flex;
  gap: $spacing-md;
  margin-bottom: $spacing-lg;
  align-items: center;
  flex-wrap: wrap;
  background-color: $color-bg-white;
  padding: $spacing-md;
  border-radius: $border-radius-md;
  box-shadow: $box-shadow-sm;

  .search-group, .filter-group {
    position: relative;
    flex-grow: 1;
    min-width: 200px;
  }
  .search-icon {
    position: absolute;
    right: $spacing-sm;
    top: 50%;
    transform: translateY(-50%);
    color: $color-secondary-grey;
    pointer-events: none;
  }
  .ml-auto { margin-left: auto; }
}

.form-control {
  width: 100%;
  padding: $spacing-sm;
  padding-right: 35px; /* Add space for icon */
  border: 1px solid $color-border-medium;
  border-radius: $border-radius-sm;
  box-sizing: border-box;
  font-size: 1rem;
  &:focus {
    border-color: $color-primary-blue;
    outline: none;
    box-shadow: 0 0 0 3px rgba($color-primary-blue, 0.2);
  }
}

.btn {
  padding: $spacing-sm $spacing-md;
  border-radius: $border-radius-sm;
  cursor: pointer;
  font-weight: bold;
  transition: background-color 0.3s ease;
  display: inline-flex;
  align-items: center;
  white-space: nowrap;

  i { margin-right: 5px; }

  &.btn-primary {
    background-color: $color-primary-blue;
    color: $color-bg-white;
    border: 1px solid $color-primary-blue;
    &:hover { background-color: darken($color-primary-blue, 10%); }
  }
  &.btn-secondary {
    background-color: $color-secondary-grey;
    color: $color-bg-white;
    border: 1px solid $color-secondary-grey;
    &:hover { background-color: darken($color-secondary-grey, 10%); }
  }
}
.btn-sm {
  padding: 6px 10px;
  font-size: 0.85em;
  margin-left: 5px;
}
.ml-1 { margin-left: $spacing-xs; }

.loading-message, .no-records-message {
  text-align: center;
  padding: $spacing-lg;
  font-size: 1.2em;
  color: $color-text-medium-grey;
}

.items-table-container {
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

  th, td {
    border: 1px solid $color-border-light;
    padding: $spacing-sm;
    text-align: left;
    white-space: nowrap;
  }

  th {
    background-color: $color-bg-light;
    font-weight: bold;
    color: $color-text-dark;
  }

  tbody tr:nth-child(even) { background-color: #f9f9f9; }
  tbody tr:hover { background-color: #e9e9e9; }

  .low-stock {
    background-color: lighten($color-warning, 30%);
    color: darken($color-warning, 20%);
    font-weight: bold;
  }

  .actions {
    min-width: 250px;
  }
}
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: $color-bg-white;
  padding: $spacing-lg;
  border-radius: $border-radius-md;
  box-shadow: $box-shadow-md;
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.form-group-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: $spacing-md;
}
.form-group.full-width {
  grid-column: 1 / -1;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: $spacing-lg;
  gap: $spacing-sm;
}
</style>