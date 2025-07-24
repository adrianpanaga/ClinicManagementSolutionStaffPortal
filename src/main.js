import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

// Import auth store
import { authStore } from './stores/auth.js';


// Font Awesome Imports
import { library } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

// *** CRITICAL: Import ALL the missing icons here ***
import {
  faHouse,
  faUserDoctor,
  faCalendarDays,
  faClock,
  faUser,
  faPhone,
  faEnvelope,
  faVial,
  faFileLines,
  faRightToBracket, // For Login button
  faRightFromBracket, // For Logout button
  faSpinner,          // For Loading indicators
  faCalendarCheck,    // For Dashboard - Today's Appointments
  faUserInjured,      // For Dashboard - Total Active Patients
  faClipboardList,    // For Dashboard - Pending Tasks
  faFileMedical,      // For PatientHistoryView - View Medical History button/icon
  faCalendarAlt,      // For ClinicVisitHistoryView - View Visit History button/icon
  faHeartbeat,        // For TriageRecordsView - Triage icon
  faPlus,             // For Add button in TriageRecordsView
  faEdit,             // For Edit button in TriageRecordsView
  faTrash,            // For Delete button in TriageRecordsView
  faSave,             // For Save button in TriageRecordsView
  faTimes,             // For Cancel button in TriageRecordsView
  faVials, // For LabResultsView - View Lab Results button/icon
  faFileMedicalAlt, // For LabResultsView - View Lab Results button/icon
  faPlusCircle, // For Add button in LabResultsView
  faEdit as faEditSolid, // For Edit button in LabResultsView
  faTrashAlt as faTrashSolid, // For Delete button in LabResultsView
  faSave as faSaveSolid, // For Save button in LabResultsView
  faTimesCircle as faCancelSolid, // For Cancel button in LabResultsView
  faFileAlt,          // *** CRITICAL ADDITION for Patient Documents (File icon) ***
  faExternalLinkAlt,   // *** CRITICAL ADDITION for Patient Documents (External link icon) ***
  faCalendarDay,        // *** NEW: For Receptionist Dashboard - Today's Appointments ***
  faMagnifyingGlass, // *** NEW: For Receptionist Dashboard - Patient Lookup ***
  faChartLine,           // *** NEW: For Receptionist Dashboard - Daily Summary ***
  faSyringe,         // *** NEW: For Nurse Dashboard - Syringe icon ***
  faBoxesStacked,    // *** NEW: For Nurse Dashboard - Inventory icon ***
  faBell,            // *** NEW: For Nurse Dashboard - Reminders icon ***
  faClipboard,        // *** NEW: For Nurse Dashboard - Quick Actions icon ***
  faStethoscope,       // *** NEW: For Doctor Dashboard - Quick Access/Stethoscope icon ***
  faUsers,             // *** NEW: For Doctor Dashboard - Browse All Patients icon ***
  faNotesMedical,      // *** NEW: For Doctor Dashboard - Medical Notes icon ***
  faPrescriptionBottleAlt, // *** NEW: For Doctor Dashboard - Prescriptions icon ***
  faFilePrescription,  // *** NEW: For Doctor Dashboard - Prescription Files icon ***
  faUserNurse,         // *** NEW: For Doctor Dashboard - Nurse Contact icon ***
  faUserMd,            // *** NEW: For Doctor Dashboard - Doctor Contact icon ***
  faHospitalUser,      // *** NEW: For Doctor Dashboard - Hospital User icon ***
  faFlask,          // *** NEW: For Lab Tech Dashboard - Flask icon ***
  faTachometerAlt,    // *** NEW: For Admin Dashboard - Overview icon ***
  faUsersCog,         // *** NEW: For Admin Dashboard - User/Role Mgmt icon ***
  faUserShield,       // *** NEW: For Admin Dashboard - Manage Staff Accounts icon ***
  faUserTag,          // *** NEW: For Admin Dashboard - Manage Roles icon ***
  faDatabase,         // *** NEW: For Admin Dashboard - Data Access icon ***
  faCog,              // *** NEW: For Admin Dashboard - Clinic Settings icon ***
  faScroll,            // *** NEW: For Admin Dashboard - System Logs icon ***
  faBoxes, 
  faTrashAlt,
  faExchangeAlt,
  faTruckLoading,
  faLaptopMedical
} from '@fortawesome/free-solid-svg-icons'; // Assuming all are solid icons

// Add the imported icons to the library
library.add(
  faHouse,
  faUserDoctor,
  faCalendarDays,
  faClock,
  faUser,
  faPhone,
  faEnvelope,
  faVial,
  faFileLines,
  faRightToBracket,
  faRightFromBracket,
  faSpinner,
  faCalendarCheck,
  faUserInjured,
  faClipboardList,
  faFileMedical,
  faCalendarAlt,
  faHeartbeat,
  faPlus,
  faEdit,
  faTrash,
  faSave,
  faTimes,
  faVials,
  faFileMedicalAlt,
  faPlusCircle,
  faEditSolid,
  faTrashSolid,
  faSaveSolid,
  faCancelSolid,
  faFileAlt,
  faExternalLinkAlt,
  faCalendarDay,
  faMagnifyingGlass,
  faChartLine,
  faSyringe,
  faBoxesStacked,
  faBell,
  faClipboard,
  faStethoscope,
  faUsers,
  faNotesMedical,
  faPrescriptionBottleAlt,
  faFilePrescription,
  faUserNurse,
  faUserMd,
  faHospitalUser,
  faFlask,
  faTachometerAlt,
  faUsersCog,
  faUserShield,
  faUserTag,
  faDatabase,
  faCog,
  faScroll,
  faBoxes,
  faTrashAlt,
  faExchangeAlt,
  faTruckLoading,
  faLaptopMedical
);

import './assets/styles/_common.scss'; // Import common SCSS file

const app = createApp(App);

app.use(router);

app.component('font-awesome-icon', FontAwesomeIcon); // Register the Font Awesome component globally

app.mount('#app');