// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router';
import { authStore } from '../stores/auth.js'; // Import the auth store

// Import all views
import LoginView from '../views/LoginView.vue';
import AdminDashboard from '../views/AdminView.vue'; // Import the Admin Dashboard view';
import ReceptionistDashboard from '../views/ReceptionistView.vue';
import NurseDashboard from '../views/NurseView.vue';
import DoctorDashboard from '../views/DoctorView.vue';
import LabTechnicianDashboard from '../views/LabTechView.vue';
import InventoryManagerView from '../views/InventoryManagerView.vue'; // Your dashboard view

import InventoryItemsList from '../views/Inventory/InventoryItemsList.vue';
import AddEditInventoryItem from '../views/Inventory/AddEditInventoryItem.vue';
import StockTransactionsLog from '../views/Inventory/ReorderRequests.vue'; // Reusing your ReorderRequests component here, renamed for clarity

// Placeholder for other patient-related views if they exist
// import PatientMedicalHistory from '../views/Patient/PatientMedicalHistory.vue';
// import PatientVisitHistory from '../views/Patient/PatientVisitHistory.vue';
// import PatientTriageRecords from '../views/Patient/PatientTriageRecords.vue';
// import PatientLabResults from '../views/Patient/PatientLabResults.vue';
// import PatientDocuments from '../views/Patient/PatientDocuments.vue';

const routes = [
  { 
    path: '/login', 
    name: 'Login', 
    component: LoginView 
  },
  {
    path: '/',
    name: 'Home', // A generic home route that will redirect based on role
    redirect: '/dashboard', // Redirect to a dashboard path that will then handle role-based routing
    meta: { requiresAuth: true }
  },
  {
    path: '/dashboard', // This path will be the entry point after login
    name: 'DashboardRouter', // A dummy component or a simple redirector if needed
    component: 
    { 
      template: '<div></div>' 
    }, // Minimal component, actual view determined by redirect
    meta: { requiresAuth: true }
  },
  // Role-specific dashboards
  {
    path: '/admin',
    name: 'AdminDashboard',
    component: AdminDashboard,
    meta: { requiresAuth: true, roles: ['Admin'] }
  },
  {
    path: '/receptionist',
    name: 'ReceptionistDashboard',
    component: ReceptionistDashboard,
    meta: { requiresAuth: true, roles: ['Receptionist'] }
  },
  {
    path: '/nurse',
    name: 'NurseDashboard',
    component: NurseDashboard,
    meta: { requiresAuth: true, roles: ['Nurse'] }
  },
  {
    path: '/doctor',
    name: 'DoctorDashboard',
    component: DoctorDashboard,
    meta: { requiresAuth: true, roles: ['Doctor'] }
  },
  {
    path: '/lab-tech',
    name: 'LabTechnicianDashboard',
    component: LabTechnicianDashboard,
    meta: { requiresAuth: true, roles: ['LabTechnician'] }
  },

  // Inventory Manager routes
  {
    path: '/inventory',
    name: 'InventoryDashboard',
    component: InventoryManagerView,
    meta: { requiresAuth: true, roles: ['Admin', 'InventoryManager'] }
  },
  {
    path: '/inventory/items',
    name: 'InventoryItemsList',
    component: InventoryItemsList,
    meta: {
      requiresAuth: true,
      roles: ['Admin', 'InventoryManager']
    }
  },
  {
    path: '/inventory/items/add',
    name: 'AddInventoryItem',
    component: AddEditInventoryItem,
    meta: {
      requiresAuth: true,
      roles: ['Admin', 'InventoryManager']
    }
  },
  {
    path: '/inventory/items/edit/:id',
    name: 'EditInventoryItem',
    component: AddEditInventoryItem,
    props: true, // Pass ID as prop
    meta: {
      requiresAuth: true,
      roles: ['Admin', 'InventoryManager']
    }
  },
  {
    path: '/inventory/transactions', // Renamed for clarity as per API
    name: 'StockTransactionsLog',
    component: StockTransactionsLog,
    meta: {
      requiresAuth: true,
      roles: ['Admin', 'InventoryManager']
    }
  },
  // Placeholder for a generic patients list view
  {
    path: '/patients',
    name: 'PatientsList',
    component: { template: '<div>Patients List View (Implement this)</div>' }, // Replace with your actual PatientsList component
    meta: { requiresAuth: true, roles: ['Admin', 'Receptionist', 'Doctor', 'Nurse', 'LabTechnician'] }
  },
  // Placeholder for user management view
  {
    path: '/users',
    name: 'UserManagement',
    component: { template: '<div>User Management View (Implement this)</div>' }, // Replace with your actual UserManagement component
    meta: { requiresAuth: true, roles: ['Admin'] }
  },

  // Patient Data Management Views (example paths, uncomment and adjust as needed)
  /*
  {
    path: '/patients/:patientId/medical-history',
    name: 'PatientMedicalHistory',
    component: PatientMedicalHistory,
    props: true,
    meta: { requiresAuth: true, roles: ['Admin', 'Doctor', 'Nurse'] }
  },
  {
    path: '/patients/:patientId/visits',
    name: 'PatientVisitHistory',
    component: PatientVisitHistory,
    props: true,
    meta: { requiresAuth: true, roles: ['Admin', 'Receptionist', 'Doctor', 'Nurse'] }
  },
  {
    path: '/patients/:patientId/triage',
    name: 'PatientTriageRecords',
    component: PatientTriageRecords,
    props: true,
    meta: { requiresAuth: true, roles: ['Admin', 'Nurse'] }
  },
  {
    path: '/patients/:patientId/lab-results',
    name: 'PatientLabResults',
    component: PatientLabResults,
    props: true,
    meta: { requiresAuth: true, roles: ['Admin', 'Doctor', 'Nurse', 'LabTechnician'] }
  },
  {
    path: '/patients/:patientId/documents',
    name: 'PatientDocuments',
    component: PatientDocuments,
    props: true,
    meta: { requiresAuth: true, roles: ['Admin', 'Receptionist', 'Doctor', 'Nurse'] }
  },
  */

  // Catch-all route for 404 - redirect to dashboard if authenticated, or login if not
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    redirect: to => {
      if (authStore.isAuthenticated) {
        return '/dashboard'; // Redirect to their main dashboard if authenticated
      } else {
        return '/login'; // Redirect to login if not authenticated
      }
    }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Function to handle role-based redirection
// This prioritizes roles to ensure a user with multiple roles lands on their highest-priority dashboard
function redirectBasedOnRole(roles, next) {
  if (roles.includes('Admin')) {
    next('/admin');
  } else if (roles.includes('InventoryManager')) {
    next('/inventory');
  } else if (roles.includes('Doctor')) {
    next('/doctor');
  } else if (roles.includes('Nurse')) {
    next('/nurse');
  } else if (roles.includes('Receptionist')) {
    next('/receptionist');
  } else if (roles.includes('LabTechnician')) {
    next('/lab-tech');
  } else {
    // Fallback for any authenticated user without a specific role dashboard
    // You might want a generic "Staff Dashboard" here
    next('/dashboard');
  }
}

router.beforeEach((to, from, next) => {
  //const authStore = useAuthStore();
  const isAuthenticated = authStore.isAuthenticated;
  const userRoles = authStore.userRoles;

  // If trying to access login page while authenticated, redirect to appropriate dashboard
  if (to.path === '/login' && isAuthenticated) {
    redirectBasedOnRole(userRoles, next);
    return; // Stop further navigation
  }

  // If route requires authentication
  if (to.meta.requiresAuth) {
    if (!isAuthenticated) {
      next('/login'); // Not authenticated, redirect to login
    } else {
      // Authenticated, check roles if the route has specific roles defined
      if (to.meta.roles && !to.meta.roles.some(role => userRoles.includes(role))) {
        alert('Access Denied: You do not have permission to view this page.');
        redirectBasedOnRole(userRoles, next); // Redirect to their allowed dashboard
      } else if (to.name === 'DashboardRouter') {
        // This is the generic /dashboard route, redirect based on role
        redirectBasedOnRole(userRoles, next);
      } else {
        next(); // Has access, proceed to route
      }
    }
  } else {
    next(); // Route does not require auth (e.g., login page itself), proceed
  }
});

export default router;