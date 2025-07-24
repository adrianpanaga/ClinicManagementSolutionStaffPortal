// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router';
import LoginView from '../views/LoginView.vue';
import DashboardView from '../views/DashboardView.vue';
import PatientHistoryView from '../views/PatientHistoryView.vue'; // Import the new view
import ClinicVisitHistoryView from '../views/ClinicVisitHistoryView.vue';

import AppointmentsListView from '../views/AppointmentsListView.vue'; // Create this simple view
import PatientsListView from '../views/PatientsListView.vue'; // Create this simple view
import TasksView from '../views/TasksView.vue'; // Create this simple view
import TriageRecordsView from '../views/TriageRecordsView.vue'; // Import the new view
import LabResultsView from '../views/LabResultsView.vue'; // Import the new view
import PatientDocumentsView from '../views/PatientDocumentsView.vue'; // Import the new view for patient documents

import MedicalRecordCreateView from '../views/MedicalRecordCreateView.vue'; // *** NEW IMPORT ***

import ReceptionistView from '../views/ReceptionistView.vue';
import NurseView from '../views/NurseView.vue';
import DoctorView from '../views/DoctorView.vue';
import LabTechView from '../views/LabTechView.vue'; // Import the new Lab Tech view
import AdminView from '../views/AdminView.vue';

import InventoryManagerView from '../views/InventoryManagerView.vue';
import InventoryItemsList from '../views/Inventory/InventoryItemsList.vue';
import AddEditInventoryItem from '../views/Inventory/AddEditInventoryItem.vue';
import ReorderRequests from '../views/Inventory/ReorderRequests.vue';

import { authStore } from '../stores/auth.js'; // Import the auth store

const routes = [
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { public: true, onlyWhenLoggedOut: true }
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: DashboardView,
    meta: { requiresAuth: true }
  },
  {
    path: '/admin', // NEW: Dedicated Admin Dashboard Route
    name: 'admin-dashboard',
    component: AdminView,
    meta: { requiresAuth: true, roles: ['Admin'] } // Only Admin can access
  },
  {
    path: '/receptionist',
    name: 'receptionist-dashboard',
    component: ReceptionistView,
    meta: { requiresAuth: true, roles: ['Receptionist'] }
  },
  {
    path: '/nurse',
    name: 'nurse-dashboard',
    component: NurseView,
    meta: { requiresAuth: true, roles: ['Nurse'] }
  },
  {
    path: '/doctor', // New route for Doctor Dashboard
    name: 'doctor-dashboard',
    component: DoctorView,
    meta: { requiresAuth: true, roles: ['Doctor'] } // Only Admin or Doctor can access
  },
  {
    path: '/lab-tech', // New route for Lab Tech Dashboard
    name: 'labtech-dashboard',
    component: LabTechView,
    meta: { requiresAuth: true, roles: ['LabTech'] } // Only Admin or LabTech can access
  },
  {
    path: '/patients/:patientId/medical-history',
    name: 'patient-history',
    component: PatientHistoryView,
    meta: { requiresAuth: true }
  },
  {
    path: '/patients/:patientId/visits',
    name: 'clinic-visits',
    component: ClinicVisitHistoryView,
    meta: { requiresAuth: true }
  },
  {
    path: '/patients/:patientId/triage',
    name: 'triage-records',
    component: TriageRecordsView,
    meta: { requiresAuth: true }
  },
  {
    path: '/patients/:patientId/lab-results',
    name: 'lab-results',
    component: LabResultsView,
    meta: { requiresAuth: true }
  },
  {
    path: '/patients/:patientId/documents',
    name: 'patient-documents',
    component: PatientDocumentsView,
    meta: { requiresAuth: true }
  },
  {
    path: '/patients/:patientId/medical-records/create/:appointmentId?', // appointmentId is optional
    name: 'medical-record-create',
    component: MedicalRecordCreateView,
    meta: { requiresAuth: true, roles: ['Admin', 'Doctor', 'Nurse'] } // Doctors/Nurses/Admins can create
  },
  { path: '/users', name: 'user-management', component: () => import('../views/PlaceholderView.vue'), meta: { requiresAuth: true, roles: ['Admin'] } },
  { path: '/roles', name: 'role-management', component: () => import('../views/PlaceholderView.vue'), meta: { requiresAuth: true, roles: ['Admin'] } },
  { path: '/appointments/all', name: 'all-appointments', component: () => import('../views/PlaceholderView.vue'), meta: { requiresAuth: true, roles: ['Admin'] } },
  { path: '/medical-records/all', name: 'all-medical-records', component: () => import('../views/PlaceholderView.vue'), meta: { requiresAuth: true, roles: ['Admin'] } },
  { path: '/clinic-settings', name: 'clinic-settings', component: () => import('../views/PlaceholderView.vue'), meta: { requiresAuth: true, roles: ['Admin'] } },
  { path: '/system-logs', name: 'system-logs', component: () => import('../views/PlaceholderView.vue'), meta: { requiresAuth: true, roles: ['Admin'] } },
  {
    path: '/inventory',
    name: 'InventoryDashboard',
    component: InventoryManagerView,
    meta: { requiresAuth: true, roles: ['InventoryManager'] } // Only Admin or InventoryManager can access
  },
    {
    path: '/inventory/items',
    name: 'InventoryItemsList',
    component: InventoryItemsList,
    meta: {
      requiresAuth: true,
      roles: ['InventoryManager']
    }
  },
  {
    path: '/inventory/items/add',
    name: 'AddInventoryItem',
    component: AddEditInventoryItem,
    meta: {
      requiresAuth: true,
      roles: ['InventoryManager']
    }
  },
  {
    path: '/inventory/items/edit/:id',
    name: 'EditInventoryItem',
    component: AddEditInventoryItem,
    props: true, // Pass ID as prop
    meta: {
      requiresAuth: true,
      roles: ['InventoryManager']
    }
  },
  {
    path: '/inventory/reorders',
    name: 'ReorderRequests',
    component: ReorderRequests,
    meta: {
      requiresAuth: true,
      roles: ['InventoryManager']
    }
  },
  {
    path: '/',
    redirect: { name: 'dashboard' }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    redirect: { name: 'dashboard' }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Navigation Guard to protect authenticated routes
router.beforeEach((to, from, next) => {
  // Use the reactive state from authStore
  const isAuthenticated = authStore.isAuthenticated;

  const userRoles = authStore.userRoles || [];

  // Case 1: Route requires authentication and user is NOT authenticated
  if (to.meta.requiresAuth && !isAuthenticated) {
    console.log("Navigation Guard: Protected route access denied. Redirecting to login.");
    next({ name: 'login' });
  }
  // Case 2: Route is the login page AND user IS authenticated
  else if (to.meta.onlyWhenLoggedOut && isAuthenticated) {
    console.log("Navigation Guard: Logged in user trying to access login. Redirecting to dashboard.");
    next({ name: 'dashboard' });
  } else if (to.meta.roles && !to.meta.roles.some(role => userRoles.includes(role))) {
    // If route has specific role requirements and user doesn't have any of them
    console.log(`Navigation Guard: Access denied for route ${to.name}. Required roles: ${to.meta.roles.join(', ')}. User roles: ${userRoles.join(', ')}.`);
    alert("Access Denied: You do not have the required permissions to view this page.");
    next({ name: 'dashboard' }); // Redirect to main dashboard or a specific unauthorized page
  }
  else {
    console.log("Navigation Guard: Allowing navigation.");
    next();
  }
});
export default router;