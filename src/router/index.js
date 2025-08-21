// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router';
import { authStore } from '../stores/auth.js';

// Import all developed views
import LoginView from '../views/LoginView.vue';
import AdminView from '../views/AdminView.vue';
import ReceptionistView from '../views/ReceptionistView.vue';
import NurseView from '../views/NurseView.vue';
import DoctorView from '../views/DoctorView.vue';
import LabTechView from '../views/LabTechView.vue';
import InventoryManagerView from '../views/InventoryManagerView.vue';
import PatientsListView from '../views/PatientsListView.vue';
import UserManagementView from '../views/UserManagementView.vue';
import ClinicSettingsView from '../views/ClinicSettingsView.vue';

// Patient-related views
import PatientHistoryView from '../views/PatientHistoryView.vue';
import ClinicVisitHistoryView from '../views/ClinicVisitHistoryView.vue';
import TriageRecordsView from '../views/TriageRecordsView.vue';
import PatientDocumentsView from '../views/PatientDocumentsView.vue';

// Lab-related views
import AllMedicalRecordsView from '../views/AllMedicalRecordsView.vue';
import AllLabResultsView from '../views/AllLabResultsView.vue';
import LabResultDetailView from '../views/LabResultDetailView.vue';
import LabResultsHubView from '../views/LabResultsHubView.vue'; // The new hub view
import PatientLabResultsView from '../views/PatientLabResultsView.vue'; // The patient-specific list view

// Inventory-related views
import AddEditInventoryItem from '../views/Inventory/AddEditInventoryItem.vue';
import StockTransactionsLog from '../views/Inventory/StockTransactionsLog.vue';

import AppointmentsListView from '../views/AppointmentsListView.vue';

const routes = [
  {
    path: '/login',
    name: 'login',
    component: LoginView,
  },
  {
    path: '/',
    name: 'Home',
    redirect: '/dashboard',
    meta: { requiresAuth: true },
  },
  {
    path: '/dashboard',
    name: 'DashboardRouter',
    component: { template: '<div></div>' },
    meta: { requiresAuth: true },
  },
  // Role-specific dashboards
  {
    path: '/admin',
    name: 'AdminDashboard',
    component: AdminView,
    meta: { requiresAuth: true, roles: ['Admin'] },
  },
  {
    path: '/receptionist',
    name: 'ReceptionistDashboard',
    component: ReceptionistView,
    meta: { requiresAuth: true, roles: ['Receptionist'] },
  },
  {
    path: '/nurse',
    name: 'NurseDashboard',
    component: NurseView,
    meta: { requiresAuth: true, roles: ['Nurse'] },
  },
  {
    path: '/doctor',
    name: 'DoctorDashboard',
    component: DoctorView,
    meta: { requiresAuth: true, roles: ['Doctor'] },
  },
  {
    path: '/lab-tech',
    name: 'LabTechnicianDashboard',
    component: LabTechView,
    meta: { requiresAuth: true, roles: ['LabTech'] },
  },
  // Inventory Management routes
  {
    path: '/inventory',
    name: 'InventoryDashboard',
    component: InventoryManagerView,
    meta: { requiresAuth: true, roles: ['Admin', 'InventoryManager'] },
  },
  {
    path: '/inventory/items/add',
    name: 'AddInventoryItem',
    component: AddEditInventoryItem,
    meta: { requiresAuth: true, roles: ['Admin', 'InventoryManager'] },
  },
  {
    path: '/inventory/items/edit/:id',
    name: 'EditInventoryItem',
    component: AddEditInventoryItem,
    props: true,
    meta: { requiresAuth: true, roles: ['Admin', 'InventoryManager'] },
  },
  {
    path: '/inventory/transactions',
    name: 'StockTransactionsLog',
    component: StockTransactionsLog,
    meta: { requiresAuth: true, roles: ['Admin', 'InventoryManager'] },
  },
  // User and Admin routes
  {
    path: '/users',
    name: 'UserManagement',
    component: UserManagementView,
    meta: { requiresAuth: true, roles: ['Admin', 'HR'] },
  },
  {
    path: '/clinic-settings',
    name: 'ClinicSettings',
    component: ClinicSettingsView,
    meta: { requiresAuth: true, roles: ['Admin', 'HR'] },
  },
  // Patient-related routes
  {
    path: '/patients',
    name: 'PatientsList',
    component: PatientsListView,
    meta: { requiresAuth: true, roles: ['Admin', 'Receptionist', 'Doctor', 'Nurse', 'LabTech'] },
  },
  {
    path: '/patients/:patientId/medical-history',
    name: 'patient-history',
    component: PatientHistoryView,
    props: true,
    meta: { requiresAuth: true, roles: ['Admin', 'Doctor', 'Nurse'] },
  },
  {
    path: '/patients/:patientId/visits',
    name: 'clinic-visits',
    component: ClinicVisitHistoryView,
    props: true,
    meta: { requiresAuth: true, roles: ['Admin', 'Receptionist', 'Doctor', 'Nurse'] },
  },
  {
    path: '/patients/:patientId/triage',
    name: 'triage-records',
    component: TriageRecordsView,
    props: true,
    meta: { requiresAuth: true, roles: ['Admin', 'Nurse'] },
  },
  // The new lab results hub page
  {
    path: '/lab-results',
    name: 'lab-results-hub',
    component: LabResultsHubView,
    meta: { requiresAuth: true, roles: ['Admin', 'Doctor', 'Nurse', 'LabTech'] },
  },
  // The patient-specific list view (now correctly named)
  {
    path: '/patients/:patientId/lab-results',
    name: 'patient-lab-results',
    component: PatientLabResultsView,
    props: true,
    meta: { requiresAuth: true, roles: ['Admin', 'Doctor', 'Nurse', 'LabTech'] },
  },
  {
    path: '/lab-results/all',
    name: 'all-lab-results',
    component: AllLabResultsView,
    props: true,
    meta: { requiresAuth: true, roles: ['Admin', 'Doctor', 'Nurse', 'LabTech'] },
  },
  {
    path: '/lab-results/:id',
    name: 'lab-result-detail',
    component: LabResultDetailView,
    props: true,
    meta: { requiresAuth: true, roles: ['Admin', 'Doctor', 'Nurse', 'LabTech'] },
  },
  {
    path: '/patients/:patientId/documents',
    name: 'patient-documents',
    component: PatientDocumentsView,
    props: true,
    meta: { requiresAuth: true, roles: ['Admin', 'Receptionist'] },
  },
  {
    path: '/appointments',
    name: 'AppointmentsList',
    component: AppointmentsListView,
    meta: { requiresAuth: true, roles: ['Admin', 'Receptionist', 'Doctor', 'Nurse'] },
  },
  {
    path: '/medical-records',
    name: 'patient-medical-records',
    component: AllMedicalRecordsView,
    props: true,
    meta: { requiresAuth: true, roles: ['Admin', 'Doctor', 'Nurse'] },
  },
  // Catch-all route for 404
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    redirect: (to) => {
      if (authStore.isAuthenticated) {
        return '/dashboard';
      } else {
        return '/login';
      }
    },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

function redirectBasedOnRole(roles, next) {
  if (roles.includes('Admin')) {
    next('/admin');
  } else if (roles.includes('Receptionist')) {
    next('/receptionist');
  } else if (roles.includes('Doctor')) {
    next('/doctor');
  } else if (roles.includes('Nurse')) {
    next('/nurse');
  } else if (roles.includes('LabTech')) {
    next('/lab-tech');
  } else if (roles.includes('InventoryManager')) {
    next('/inventory');
  } else {
    next('/dashboard');
  }
}

router.beforeEach((to, from, next) => {
  const isAuthenticated = authStore.isAuthenticated;
  const userRoles = authStore.userRoles;

  if (to.path === '/login' && isAuthenticated) {
    redirectBasedOnRole(userRoles, next);
    return;
  }

  if (to.meta.requiresAuth) {
    if (!isAuthenticated) {
      next('/login');
    } else {
      if (to.meta.roles && !to.meta.roles.some((role) => userRoles.includes(role))) {
        window.notify('Access Denied: You do not have permission to view this page.');
        redirectBasedOnRole(userRoles, next);
      } else if (to.name === 'DashboardRouter') {
        redirectBasedOnRole(userRoles, next);
      } else {
        next();
      }
    }
  } else {
    next();
  }
});

export default router;