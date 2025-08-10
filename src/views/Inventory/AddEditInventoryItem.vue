<template>
  <div class="add-edit-inventory-item">
    <div v-if="hasPermission">
      <h2 class="section-title">
        <font-awesome-icon :icon="['fas', isEditMode ? 'edit' : 'plus-circle']" />
        {{ isEditMode ? 'Edit Inventory Item' : 'Add New Inventory Item' }}
      </h2>

      <form @submit.prevent="saveItem">
        <div class="form-group-grid">
          <div class="form-group">
            <label for="itemName">Item Name:</label>
            <input type="text" id="itemName" v-model="item.itemName" class="form-control" required />
          </div>
          <div class="form-group">
            <label for="category">Category:</label>
            <input type="text" id="category" v-model="item.category" class="form-control" placeholder="e.g., Medications, Supplies" />
          </div>
          <div class="form-group">
            <label for="unitOfMeasure">Unit of Measure:</label>
            <input type="text" id="unitOfMeasure" v-model="item.unitOfMeasure" class="form-control" placeholder="e.g., box, piece, mL" />
          </div>
          <div class="form-group">
            <label for="purchasePrice">Purchase Price:</label>
            <input type="number" id="purchasePrice" v-model.number="item.purchasePrice" step="0.01" min="0" class="form-control" />
          </div>
          <div class="form-group">
            <label for="sellingPrice">Selling Price:</label>
            <input type="number" id="sellingPrice" v-model.number="item.sellingPrice" step="0.01" min="0" class="form-control" />
          </div>
          <div class="form-group">
            <label for="reorderLevel">Reorder Level:</label>
            <input type="number" id="reorderLevel" v-model.number="item.reorderLevel" min="0" class="form-control" />
          </div>
          <div class="form-group">
            <label for="leadTimeDays">Lead Time (Days):</label>
            <input type="number" id="leadTimeDays" v-model.number="item.leadTimeDays" min="0" class="form-control" />
          </div>
          <div class="form-group">
            <label for="vendor">Primary Vendor:</label>
            <select id="vendor" v-model="item.vendorId" class="form-control" required>
              <option value="">Select Vendor</option>
              <option v-for="vendor in vendors" :key="vendor.vendorId" :value="vendor.vendorId">{{ vendor.vendorName }}</option>
            </select>
          </div>
          <div class="form-group full-width">
            <label for="description">Description:</label>
            <textarea id="description" v-model="item.description" class="form-control"></textarea>
          </div>
        </div>

        <div v-if="loadingForm" class="loading-message mt-3">
          <font-awesome-icon :icon="['fas', 'spinner']" spin /> Saving item...
        </div>
        <div v-if="formError" class="error-message mt-3">{{ formError }}</div>

        <div class="form-actions">
          <button type="submit" class="btn btn-success" :disabled="loadingForm">
            <font-awesome-icon :icon="['fas', 'save']" /> {{ isEditMode ? 'Update Item' : 'Add Item' }}
          </button>
          <button type="button" @click="cancel" class="btn btn-secondary ml-1" :disabled="loadingForm">
            <font-awesome-icon :icon="['fas', 'times']" /> Cancel
          </button>
        </div>
      </form>
    </div>
    <div v-else-if="!loading" class="error-message">
      Access Denied: You do not have permission to view this page.
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import apiClient from '../../api/authApi';
import { authStore } from '../../stores/auth';

const route = useRoute();
const router = useRouter();

const isEditMode = ref(false);
const item = ref({
  itemId: null,
  itemName: '',
  category: '',
  unitOfMeasure: '',
  purchasePrice: null,
  sellingPrice: null,
  reorderLevel: null,
  leadTimeDays: null,
  description: '',
  vendorId: null
});
const vendors = ref([]);
const loading = ref(true);
const loadingForm = ref(false);
const formError = ref('');

// --- Computed property for role-based permissions
const hasPermission = computed(() => {
  const roles = authStore.userRoles;
  return roles.includes('Admin') || roles.includes('InventoryManager');
});

const fetchVendors = async () => {
  try {
    const response = await apiClient.get('/Vendors');
    vendors.value = response.data;
  } catch (error) {
    console.error('Error fetching vendors:', error);
  }
};

const fetchItemDetails = async (id) => {
  try {
    const response = await apiClient.get(`/InventoryItems/${id}`);
    item.value = { ...response.data };
  } catch (error) {
    console.error('Error fetching item details:', error);
    router.push('/inventory/items'); // Redirect on error
  }
};

const saveItem = async () => {
  loadingForm.value = true;
  formError.value = '';
  try {
    if (isEditMode.value) {
      await apiClient.put(`/InventoryItems/${item.value.itemId}`, item.value);
      window.notify('Inventory item updated successfully!');
    } else {
      await apiClient.post('/InventoryItems', item.value);
      window.notify('Inventory item added successfully!');
    }
    router.push('/inventory/items');
  } catch (error) {
    console.error('Error saving inventory item:', error.response?.data || error.message);
    formError.value = 'Failed to save item. Please check your input and try again: ' + (error.response?.data?.title || error.message);
  } finally {
    loadingForm.value = false;
  }
};

const cancel = () => {
  router.push('/inventory/items');
};

onMounted(async () => {
  if (!hasPermission.value) {
    loading.value = false;
    return;
  }
  await fetchVendors();
  if (route.params.id) {
    isEditMode.value = true;
    await fetchItemDetails(route.params.id);
  }
  loading.value = false;
});
</script>

<style lang="scss" scoped>
@import "../../assets/styles/_common.scss";

.add-edit-inventory-item {
  padding: $spacing-lg;
  max-width: 800px;
  margin: 0 auto;
}

.section-title {
  color: $color-primary-blue;
  margin-bottom: $spacing-lg;
  text-align: center;
  font-size: 2rem;
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

  input,
  select,
  textarea {
    width: 100%;
    padding: $spacing-sm;
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

  textarea {
    min-height: 100px;
    resize: vertical;
  }
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: $spacing-md;
  margin-top: $spacing-xl;
}

.btn {
  padding: $spacing-sm $spacing-md;
  font-weight: bold;
  cursor: pointer;
  border-radius: $border-radius-sm;
  transition: background-color 0.3s ease;
  
  &-primary {
    background-color: $color-primary-blue;
    color: $color-bg-white;
    border: none;
    &:hover { background-color: darken($color-primary-blue, 8%); }
  }
  &-secondary {
    background-color: $color-secondary-grey;
    color: $color-bg-white;
    border: none;
    &:hover { background-color: darken($color-secondary-grey, 8%); }
  }
  &-success {
    background-color: $color-confirm-green;
    color: $color-bg-white;
    border: none;
    &:hover { background-color: darken($color-confirm-green, 8%); }
  }
}
.ml-1 { margin-left: $spacing-xs; }
.mt-3 { margin-top: $spacing-md; }
</style>