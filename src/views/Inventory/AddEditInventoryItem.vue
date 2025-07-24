<template>
  <div class="add-edit-inventory-item">
    <h2><i :class="isEditMode ? 'fas fa-edit' : 'fas fa-plus-circle'"></i> {{ isEditMode ? 'Edit Inventory Item' : 'Add New Inventory Item' }}</h2>

    <form @submit.prevent="saveItem">
      <div class="form-group">
        <label for="itemName">Item Name:</label>
        <input type="text" id="itemName" v-model="item.itemName" required />
      </div>
      <div class="form-group">
        <label for="category">Category:</label>
        <input type="text" id="category" v-model="item.category" placeholder="e.g., Medications, Supplies" />
      </div>
      <div class="form-group">
        <label for="unitOfMeasure">Unit of Measure:</label>
        <input type="text" id="unitOfMeasure" v-model="item.unitOfMeasure" placeholder="e.g., box, piece, mL" />
      </div>
      <div class="form-group">
        <label for="purchasePrice">Purchase Price:</label>
        <input type="number" id="purchasePrice" v-model.number="item.purchasePrice" step="0.01" min="0" />
      </div>
      <div class="form-group">
        <label for="sellingPrice">Selling Price:</label>
        <input type="number" id="sellingPrice" v-model.number="item.sellingPrice" step="0.01" min="0" />
      </div>
      <div class="form-group">
        <label for="reorderLevel">Reorder Level:</label>
        <input type="number" id="reorderLevel" v-model.number="item.reorderLevel" min="0" />
      </div>
      <div class="form-group">
        <label for="leadTimeDays">Lead Time (Days):</label>
        <input type="number" id="leadTimeDays" v-model.number="item.leadTimeDays" min="0" />
      </div>
      <div class="form-group">
        <label for="vendor">Primary Vendor:</label>
        <select id="vendor" v-model="item.vendorId" required>
          <option value="">Select Vendor</option>
          <option v-for="vendor in vendors" :key="vendor.vendorId" :value="vendor.vendorId">{{ vendor.vendorName }}</option>
        </select>
      </div>
      <div class="form-group">
        <label for="description">Description:</label>
        <textarea id="description" v-model="item.description"></textarea>
      </div>

      <div class="form-actions">
        <button type="submit" class="btn btn-primary">{{ isEditMode ? 'Update Item' : 'Add Item' }}</button>
        <button type="button" @click="cancel" class="btn btn-secondary">Cancel</button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import apiClient from '../../api/authApi'; // Corrected path to apiClient
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

const isEditMode = ref(false);
const item = ref({
  itemId: null, // For edit mode
  itemName: '',
  category: '',
  unitOfMeasure: '',
  purchasePrice: null,
  sellingPrice: null,
  reorderLevel: null,
  leadTimeDays: null,
  description: '',
  vendorId: null // Required by CreateInventoryItemDto
});

const vendors = ref([]);

const fetchVendors = async () => {
  try {
    const response = await apiClient.get('/api/Vendors');
    vendors.value = response.data;
  } catch (error) {
    console.error('Error fetching vendors:', error);
  }
};

const fetchItemDetails = async (id) => {
  try {
    const response = await apiClient.get(`/api/InventoryItems/${id}`);
    item.value = { ...response.data };
  } catch (error) {
    console.error('Error fetching item details:', error);
    alert('Failed to load item details.');
    router.push('/inventory/items');
  }
};

const saveItem = async () => {
  try {
    if (isEditMode.value) {
      await apiClient.put(`/api/InventoryItems/${item.value.itemId}`, item.value);
      alert('Inventory item updated successfully!');
    } else {
      await apiClient.post('/api/InventoryItems', item.value);
      alert('Inventory item added successfully!');
    }
    router.push('/inventory/items');
  } catch (error) {
    console.error('Error saving inventory item:', error.response?.data || error.message);
    alert('Failed to save item. Please check your input and try again: ' + (error.response?.data?.title || error.message));
  }
};

const cancel = () => {
  router.push('/inventory/items');
};

onMounted(() => {
  fetchVendors();
  if (route.params.id) {
    isEditMode.value = true;
    fetchItemDetails(route.params.id);
  }
});
</script>

<style lang="scss" scoped>
@import "../../assets/styles/_common.scss";

.add-edit-inventory-item {
  padding: 20px;
  max-width: 700px;
  margin: 0 auto;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);

  h2 {
    margin-bottom: 25px;
    color: $color-primary-blue; // Using your variable
    text-align: center;
    font-family: $font-family-base; // Using your variable
  }

  .form-group {
    margin-bottom: 20px;

    label {
      display: block;
      margin-bottom: 8px;
      font-weight: bold;
      color: #555;
    }

    input[type="text"],
    input[type="number"],
    input[type="date"],
    select,
    textarea {
      width: 100%;
      padding: 12px;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: 1em;
      box-sizing: border-box;

      &:focus {
        border-color: $color-primary-blue; // Using your variable
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
    gap: 15px;
    margin-top: 30px;

    .btn {
      padding: 12px 25px;
      border-radius: 6px;
      font-size: 1em;
      font-weight: bold;
      cursor: pointer;
      transition: background-color 0.3s ease, transform 0.2s ease;

      &-primary {
        background-color: $color-primary-blue; // Using your variable
        color: white;
        border: 1px solid $color-primary-blue;
        &:hover {
          background-color: darken($color-primary-blue, 8%);
          transform: translateY(-1px);
        }
      }

      &-secondary {
        background-color: $color-secondary-grey; // Using your variable
        color: white;
        border: 1px solid $color-secondary-grey;
        &:hover {
          background-color: darken($color-secondary-grey, 8%);
          transform: translateY(-1px);
        }
      }
    }
  }
}
</style>