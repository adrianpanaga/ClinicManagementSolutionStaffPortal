<template>
  <div class="inventory-items-list">
    <h2><i class="fas fa-clipboard-list"></i> All Inventory Items</h2>

    <div class="toolbar">
      <input type="text" v-model="searchQuery" placeholder="Search by name, SKU..." @input="debouncedFetchItems" />
      <input type="text" v-model="filterCategory" placeholder="Filter by Category" @input="debouncedFetchItems" />
      <button @click="clearFilters" class="btn btn-outline-secondary">Clear Filters</button>
      <router-link to="/inventory/items/add" class="btn btn-primary ml-auto">
        <i class="fas fa-plus-circle"></i> Add New Item
      </router-link>
    </div>

    <div v-if="loading" class="loading-spinner"></div>
    <div v-else-if="items.length === 0" class="no-data">No inventory items found.</div>
    <div v-else class="table-responsive">
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
            <td>
              <button @click="editItem(item.itemId)" class="btn btn-sm btn-info"><i class="fas fa-edit"></i></button>
              <button @click="confirmDelete(item.itemId)" class="btn btn-sm btn-danger ml-2"><i class="fas fa-trash-alt"></i></button>
              <button @click="openStockAdjustmentModal(item)" class="btn btn-sm btn-warning ml-2"><i class="fas fa-exchange-alt"></i> Adjust Stock</button>
              <button @click="viewBatches(item.itemId)" class="btn btn-sm btn-success ml-2"><i class="fas fa-boxes"></i> Batches</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="pagination-controls" v-if="totalPages > 1">
      <button @click="prevPage" :disabled="currentPage === 1">Previous</button>
      <span>Page {{ currentPage }} of {{ totalPages }}</span>
      <button @click="nextPage" :disabled="currentPage === totalPages">Next</button>
    </div>

    <div v-if="showStockAdjustmentModal" class="modal-overlay">
      <div class="modal-content">
        <h3>Adjust Stock for {{ selectedItem.itemName }}</h3>
        <p>Current Quantity based on fetched batches: <strong>{{ selectedItem.currentStockCalculated }}</strong></p>

        <div class="form-group">
          <label for="adjustmentType">Adjustment Type:</label>
          <select id="adjustmentType" v-model="adjustmentType">
            <option value="receive">Receive New Stock (Add)</option>
            <option value="dispense">Dispense (Remove)</option>
            <option value="return">Return</option>
            <option value="damaged">Damaged/Spoiled</option>
          </select>
        </div>

        <div v-if="adjustmentType === 'receive'">
          <div class="form-group">
            <label for="batchNumber">Batch Number (New):</label>
            <input type="text" id="batchNumber" v-model="newBatch.batchNumber" required />
          </div>
          <div class="form-group">
            <label for="quantity">Quantity:</label>
            <input type="number" id="quantity" v-model.number="adjustmentQuantity" required min="1" />
          </div>
          <div class="form-group">
            <label for="expirationDate">Expiration Date (Optional):</label>
            <input type="date" id="expirationDate" v-model="newBatch.expirationDate" />
          </div>
          <div class="form-group">
            <label for="costPerUnit">Cost Per Unit (Optional):</label>
            <input type="number" id="costPerUnit" v-model.number="newBatch.costPerUnit" step="0.01" min="0" />
          </div>
          <div class="form-group">
            <label for="vendor">Vendor (Optional):</label>
            <select id="vendor" v-model="newBatch.vendorId">
              <option value="">Select Vendor</option>
              <option v-for="sup in vendors" :key="sup.vendorId" :value="sup.vendorId">{{ sup.vendorName }}</option>
            </select>
          </div>
        </div>

        <div v-else>
          <div class="form-group">
            <label for="existingBatch">Select Batch:</label>
            <select id="existingBatch" v-model="selectedBatchId" required>
              <option value="">Select an existing batch</option>
              <option v-for="batch in itemBatches" :key="batch.batchId" :value="batch.batchId">
                {{ batch.batchNumber }} (Qty: {{ batch.quantity }}, Exp: {{ formatDate(batch.expirationDate) }})
              </option>
            </select>
          </div>
          <div class="form-group">
            <label for="quantity">Quantity:</label>
            <input type="number" id="quantity" v-model.number="adjustmentQuantity" required min="1" :max="selectedBatchQuantity" />
            <small v-if="selectedBatchQuantity !== null">Max: {{ selectedBatchQuantity }}</small>
          </div>
        </div>

        <div class="form-group">
          <label for="adjustmentNotes">Notes:</label>
          <textarea id="adjustmentNotes" v-model="adjustmentNotes" placeholder="Reason for adjustment"></textarea>
        </div>

        <div class="modal-actions">
          <button @click="submitStockAdjustment" class="btn btn-primary">Submit</button>
          <button @click="showStockAdjustmentModal = false" class="btn btn-secondary">Cancel</button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import apiClient from '../../api/authApi'; // Corrected path to apiClient
import { useRouter, useRoute } from 'vue-router';
import { debounce } from 'lodash'; // You might need to install lodash: npm install lodash

const router = useRouter();
const route = useRoute(); // To read query parameters like filter=low-stock

const items = ref([]);
const vendors = ref([]); // For vendor dropdown in batch creation
const searchQuery = ref('');
const filterCategory = ref('');
const loading = ref(true);
const currentPage = ref(1);
const pageSize = 10;
const totalPages = ref(1);

const showStockAdjustmentModal = ref(false);
const selectedItem = ref(null);
const adjustmentQuantity = ref(0);
const adjustmentType = ref('receive'); // 'receive', 'dispense', 'return', 'damaged'
const adjustmentNotes = ref('');
const itemBatches = ref([]); // Batches for the selected item
const selectedBatchId = ref(null); // For outgoing transactions
const selectedBatchQuantity = ref(null); // Max quantity for selected batch

// New batch details for 'receive' type
const newBatch = ref({
  batchNumber: '',
  expirationDate: null,
  costPerUnit: 0,
  vendorId: null,
});

// Debounced fetch function for search/filter
const debouncedFetchItems = debounce(() => {
  currentPage.value = 1;
  fetchItems();
}, 300);

const fetchItems = async () => {
  loading.value = true;
  try {
    const response = await apiClient.get('/api/InventoryItems', {
      params: {
        page: currentPage.value, // Pagination might need to be implemented on backend
        pageSize: pageSize,
        searchTerm: searchQuery.value, // Assuming backend supports searchTerm for InventoryItems
        category: filterCategory.value || null, // Assuming backend supports category filter
        includeDeleted: false // Only active items
      }
    });

    // Manually filter for low stock/expired if no direct API for them
    let fetchedItems = response.data;
    const filterQuery = route.query.filter; // Read from URL query
    if (filterQuery === 'low-stock') {
      // This logic requires 'currentStockCalculated' to be pre-calculated in DTO or calculated here
      // For accurate low stock, you'd need current stock levels of each InventoryItem,
      // which is usually derived from batches and transactions.
      // For now, this is a placeholder. You'd ideally extend your InventoryItemDto
      // with a calculated 'CurrentStock' property from the backend.
      fetchedItems = fetchedItems.filter(item => item.reorderLevel && item.reorderLevel > 0 && item.currentStockCalculated <= item.reorderLevel);
    } else if (filterQuery === 'expired') {
        // This requires detailed batch info for each item to properly calculate if any batches are expired.
        // This would be best done on the backend or by fetching all batches.
        // Placeholder: Assuming ItemBatchDto directly contains expirationDate
        const allBatches = await apiClient.get('/api/ItemBatches');
        const expiredBatchItemIds = new Set(
            allBatches.data
                .filter(b => b.expirationDate && new Date(b.expirationDate) < new Date())
                .map(b => b.itemId)
        );
        fetchedItems = fetchedItems.filter(item => expiredBatchItemIds.has(item.itemId));
    }


    items.value = fetchedItems; // Assuming API returns an array directly
    // If your backend implements pagination, it should return total count.
    // For now, dummy totalPages calculation based on frontend length.
    totalPages.value = 1; // Adjust if backend supports pagination metadata
  } catch (error) {
    console.error('Error fetching inventory items:', error);
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
  }
};

const fetchItemBatches = async (itemId) => {
  try {
    const response = await apiClient.get('/api/ItemBatches', { params: { itemId: itemId } });
    itemBatches.value = response.data.filter(b => b.quantity > 0 && (!b.expirationDate || new Date(b.expirationDate) > new Date())); // Only active, non-expired batches
    // Calculate total stock for the item (placeholder logic, ideal if backend provides)
    const totalStock = itemBatches.value.reduce((sum, batch) => sum + batch.quantity, 0);
    selectedItem.value.currentStockCalculated = totalStock;
  } catch (error) {
    console.error('Error fetching item batches:', error);
    itemBatches.value = [];
  }
};

const openStockAdjustmentModal = async (item) => {
  selectedItem.value = { ...item, currentStockCalculated: 0 }; // Initialize for calculation
  adjustmentQuantity.value = 0;
  adjustmentType.value = 'receive';
  adjustmentNotes.value = '';
  selectedBatchId.value = null;
  selectedBatchQuantity.value = null;
  newBatch.value = { batchNumber: '', expirationDate: null, costPerUnit: 0, vendorId: null };

  await fetchItemBatches(item.itemId); // Load batches for this item
  showStockAdjustmentModal.value = true;
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
    alert('Quantity must be greater than zero.');
    return;
  }
  if (!adjustmentNotes.value) {
    alert('Please provide notes for the stock adjustment.');
    return;
  }

  try {
    let transactionPayload = {
      quantity: adjustmentQuantity.value,
      transactionType: adjustmentType.value,
      notes: adjustmentNotes.value,
      staffId: 1, // Placeholder: Replace with actual logged-in staffId
      patientId: null // Only if dispensed to a patient
    };

    if (adjustmentType.value === 'receive') {
      // 1. Create new ItemBatch
      if (!newBatch.value.batchNumber) {
        alert('Batch Number is required for new stock.');
        return;
      }
      const newBatchPayload = {
        itemId: selectedItem.value.itemId,
        batchNumber: newBatch.value.batchNumber,
        quantity: adjustmentQuantity.value, // Initial quantity for the batch
        expirationDate: newBatch.value.expirationDate ? new Date(newBatch.value.expirationDate).toISOString() : null,
        receivedDate: new Date().toISOString(),
        costPerUnit: newBatch.value.costPerUnit || null,
        vendorId: newBatch.value.vendorId || null
      };
      const createdBatch = await apiClient.post('/api/ItemBatches', newBatchPayload);
      transactionPayload.batchId = createdBatch.data.batchId;
    } else {
      // For outgoing transactions (dispense, return, damaged)
      if (!selectedBatchId.value) {
        alert('Please select a batch for this transaction.');
        return;
      }
      if (adjustmentQuantity.value > selectedBatchQuantity.value) {
          alert('Cannot remove more than available in selected batch.');
          return;
      }
      transactionPayload.batchId = selectedBatchId.value;
    }

    // 2. Create StockTransaction
    await apiClient.post('/api/StockTransactions', transactionPayload);
    alert('Stock adjusted successfully!');
    showStockAdjustmentModal.value = false;
    fetchItems(); // Refresh the list
  } catch (error) {
    console.error('Error adjusting stock:', error.response?.data || error.message);
    alert('Failed to adjust stock. ' + (error.response?.data?.detail || error.message));
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
      alert('Item deleted successfully!');
    } catch (error) {
      console.error('Error deleting item:', error.response?.data || error.message);
      alert('Failed to delete item. Please try again.');
    }
  }
};

const viewBatches = (itemId) => {
  // You could implement a dedicated view for Item Batches or open a detailed modal
  // For now, let's just log or show a simplified alert
  alert(`Viewing batches for Item ID: ${itemId}. You would navigate to a detailed batch view here.`);
  // Example: router.push(`/inventory/items/${itemId}/batches`);
};

const clearFilters = () => {
  searchQuery.value = '';
  filterCategory.value = '';
  currentPage.value = 1;
  fetchItems();
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
    fetchItems();
  }
};

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
    fetchItems();
  }
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

onMounted(() => {
  fetchItems();
  fetchVendors();
});

// Watch route queries for filters (e.g., from dashboard links)
watch(() => route.query.filter, (newFilter) => {
  if (newFilter) {
    // You might want to update internal filters or re-fetch directly based on newFilter
    // For now, just re-fetch to apply route-based filtering
    fetchItems();
  }
});
</script>

<style lang="scss" scoped>
@import "../../assets/styles/_common.scss"; // This should contain your color variables

.inventory-items-list {
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

    input[type="text"], select {
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

    .btn-primary {
      background-color: $color-primary-blue; // Using your variable
      color: white;
      border: 1px solid $color-primary-blue;
      &:hover { background-color: darken($color-primary-blue, 10%); }
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
    .ml-auto { margin-left: auto; }
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

    .btn {
      padding: 6px 10px;
      font-size: 0.85em;
      margin-left: 5px;
      display: inline-flex;
      align-items: center;
      &.btn-info { background-color: #17a2b8; color: white; border: 1px solid #17a2b8; &:hover { background-color: darken(#17a2b8, 10%); } }
      &.btn-danger { background-color: #dc3545; color: white; border: 1px solid #dc3545; &:hover { background-color: darken(#dc3545, 10%); } }
      &.btn-warning { background-color: #ffc107; color: white; border: 1px solid #ffc107; &:hover { background-color: darken(#ffc107, 10%); } }
      &.btn-success { background-color: #28a745; color: white; border: 1px solid #28a745; &:hover { background-color: darken(#28a745, 10%); } }
    }

    .low-stock {
      background-color: lighten(#ffc107, 30%); // Light yellow for low stock (based on warning-color)
      color: darken(#ffc107, 20%);
      font-weight: bold;
    }

    .expired {
      background-color: lighten(#dc3545, 30%); // Light red for expired (based on danger-color)
      color: darken(#dc3545, 20%);
      font-weight: bold;
    }
  }

  .pagination-controls {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 15px;
    margin-top: 20px;

    button {
      padding: 8px 15px;
      background-color: $color-primary-blue; // Using your variable
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      &:disabled {
        background-color: #cccccc;
        cursor: not-allowed;
      }
    }
  }

  .modal-overlay {
    @include modal-overlay;
  }

  .modal-content {
    @include modal-content;
    max-width: 600px;
    text-align: left; // Adjusted for forms within modal

    h3 { margin-bottom: 20px; color: #333; }
    .form-group {
      margin-bottom: 15px;
      label {
        display: block;
        margin-bottom: 5px;
        font-weight: bold;
      }
      input[type="number"], input[type="text"], input[type="date"], select, textarea {
        width: 100%;
        padding: 10px;
        border: 1px solid #ddd;
        border-radius: 5px;
        box-sizing: border-box;
      }
      small {
          color: #666;
          font-size: 0.9em;
          margin-top: 5px;
          display: block;
      }
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 20px;

      .btn {
        padding: 10px 20px;
        border-radius: 5px;
        cursor: pointer;
        font-weight: bold;
        &-primary {
          background-color: $color-primary-blue; // Using your variable
          color: white;
          border: 1px solid $color-primary-blue;
          &:hover { background-color: darken($color-primary-blue, 10%); }
        }
        &-secondary {
          background-color: $color-secondary-grey; // Using your variable
          color: white;
          border: 1px solid $color-secondary-grey;
          &:hover { background-color: darken($color-secondary-grey, 10%); }
        }
      }
    }
  }
}
</style>