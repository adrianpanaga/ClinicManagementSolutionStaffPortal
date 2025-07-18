# Clinic Staff Portal

A secure, role-based web application built with **Vue.js 3** and **ASP.NET Core API** for efficient clinic operations and patient data management.

---

## 🚀 Live Demo & Installation

[![Live Demo](https://img.shields.io/badge/Live%20Demo-blue?style=for-the-badge)](YOUR_LIVE_DEMO_URL_HERE)
### Prerequisites

Before you begin, ensure you have met the following requirements:

* Node.js (LTS recommended)
* npm or Yarn
* .NET SDK (for the ASP.NET Core API backend)
* Git

### Installation (Frontend)

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/adrianpanaga/ClinicManagementSolutionStaffPortal.git
    cd your-clinic-portal-frontend
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```
3.  **Configure Environment Variables:**
    Create a `.env` file in the root of the project and add your API base URL:
    ```
    VITE_APP_API_BASE_URL=https://localhost:7001/api # or your deployed API URL
    ```
4.  **Run the development server:**
    ```bash
    npm run dev
    # or
    yarn dev
    ```
    The application will typically run on `http://localhost:5173`.

### Installation (Backend - ASP.NET Core API)

1.  **Clone the API repository:**
    ```bash
    git clone [https://github.com/YourUsername/your-clinic-portal-api.git](https://github.com/YourUsername/your-clinic-portal-api.git)
    cd your-clinic-portal-api
    ```
2.  **Restore NuGet packages:**
    ```bash
    dotnet restore
    ```
3.  **Configure Database & Settings:**
    Update `appsettings.json` (or `appsettings.Development.json`) with your database connection string and any other necessary configurations (e.g., JWT settings, email settings for identity).
4.  **Run database migrations (if applicable):**
    ```bash
    dotnet ef database update
    ```
5.  **Run the API:**
    ```bash
    dotnet run
    ```
    The API will typically run on `https://localhost:7001` (or your configured port).

---

## Core Principles & Technology

This application is built upon a foundation of robust technologies and key development principles:

* **Single Page Application (SPA):** Developed using **Vue.js 3**, **Vite** for lightning-fast development, **Axios** for HTTP requests, **Vue Router** for navigation, and **Sass/SCSS** for powerful styling. This combination delivers a smooth, dynamic, and highly responsive user experience.
* **Robust Security:** Utilizes **JWT (JSON Web Token) Bearer Authentication** to ensure secure and authenticated access to all backend APIs, protecting sensitive patient and operational data.
* **Granular Role-Based Access Control (RBAC):** Leverages **ASP.NET Core Identity** for comprehensive user management on the backend. On the frontend, it implements detailed role-based routing and conditional UI rendering, ensuring that staff members only access authorized views and features relevant to their specific roles.
* **Centralized State Management:** Employs a reactive store for seamless management of critical application state, including `isAuthenticated` status and `userRoles`, ensuring consistency across the entire application.
* **Consistent UI/UX:** Adheres to a clean, structured layout with clear visual hierarchy, utilizing the professional "PT Sans" typography and a comprehensive set of icons from **Font Awesome 6** to provide an intuitive and pleasant user experience.

---

## Key Features Implemented

The Clinic Staff Portal is packed with features designed to streamline clinic workflows:

### Secure Authentication Flow

A robust authentication system ensures only authorized personnel can access the portal:

* **Dedicated Login View:** A secure entry point for staff to log in.
* **JWT Handling:** Upon successful login, a JWT is issued by the backend and securely stored in `localStorage` on the client side.
* **Axios Interceptors:** Automatically attach the JWT to all subsequent API requests, ensuring authenticated communication without manual intervention.
* **Unauthorized Access Handling:** Automatic redirection to the `/login` page if a protected route is accessed without authentication or if a JWT expires/is invalid (graceful `401 Unauthorized` handling).
* **Login Page Protection:** Prevents already authenticated users from inadvertently accessing the login page.

### Role-Based Dashboards & Navigation

The application dynamically adapts to the logged-in user's role:

* **Dynamic Navigation:** Navigation links in the main application header are conditionally rendered, displaying only the options relevant to the logged-in user's roles.
* **Role-Based Routing:** A sophisticated **Vue Router Navigation Guard** protects specific routes. Unauthorized staff attempting to access restricted, role-specific views are gracefully redirected to a general dashboard or the login page, accompanied by clear "Access Denied" alerts.
* **Dedicated Dashboards for Each Role:**
    * **Admin Dashboard (`/admin`):** A comprehensive overview for administrators, providing key clinic metrics (total patients, total staff, upcoming appointments, open medical records) and quick links to manage user accounts, roles, and access all clinic data (e.g., all appointments, all medical records, inventory, clinic settings, system logs).
    * **Receptionist Dashboard (`/receptionist`):** Focuses on daily front-desk operations, featuring a table of Today's Appointments with quick actions for Confirming, Checking-in, marking No Show, or Cancelling appointments. Includes a Patient Lookup search bar to quickly find patient records by name, contact, or email, along with daily summary statistics.
    * **Nurse's Dashboard (`/nurse`):** Offers a view of Today's Clinic Appointments (all relevant appointments for the day) with links to access patient charts, triage records, and medical history. Includes a Patient Lookup and quick links to check inventory and view reminders.
    * **Doctor's Dashboard (`/doctor`):** Tailored for physicians, displaying My Upcoming Appointments (appointments specifically assigned to the logged-in doctor) with direct links to patient charts and options to create new medical records. Includes a Patient Lookup and quick links for broader data access (all patients, all medical records).
    * **Lab Technician Dashboard (`/lab-tech`):** Designed for lab personnel, featuring a list of Pending Lab Orders (lab results without a recorded value), with actions to "Enter Result" for existing orders. Includes a Patient Lookup and quick links for adding new lab results or checking lab supplies.

### Comprehensive Patient Data Management Views

Accessible by authorized staff roles, these views provide deep insights into patient information and enable efficient data management:

* **Patient History View (`/patients/:patientId/medical-history`):** Offers a comprehensive historical overview of a patient, displaying their demographic details and a chronological list of their medical records (diagnoses, treatments, prescriptions).
* **Clinic Visit History View (`/patients/:patientId/visits`):** Provides a detailed log of all a patient's appointments (clinic visits), including service, assigned doctor, status, and notes, with direct links to associated medical records.
* **Triage Records View (`/patients/:patientId/triage`):** A dedicated module to view, add, edit, and delete patient triage entries, including vital signs (temperature, blood pressure, pulse, respiration, weight, height), chief complaints, and notes.
* **Lab Results View (`/patients/:patientId/lab-results`):** Allows viewing, adding, editing, and deleting detailed lab results, including test names, result values, units, reference ranges, and interpretations, with links to ordering staff.
* **Patient Documents View (`/patients/:patientId/documents`):** Facilitates the management of various patient-related documents (e.g., consent forms, referral letters) by storing metadata and linking to the actual file locations, with full CRUD (Create, Read, Update, Delete) capabilities.

---

The Clinic Staff Portal significantly streamlines clinic operations by providing specialized, secure, and intuitive interfaces for each staff role, ensuring efficient management of patient care and administrative tasks.

---

## 🛠️ Technologies Used

* **Frontend:**
    * [Vue.js 3](https://vuejs.org/)
    * [Vite](https://vitejs.dev/)
    * [Vue Router](https://router.vuejs.org/)
    * [Axios](https://axios-http.com/)
    * [Sass/SCSS](https://sass-lang.com/)
    * [Font Awesome 6](https://fontawesome.com/)
* **Backend:**
    * [ASP.NET Core API](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/apis?view=aspnetcore-8.0)
    * [ASP.NET Core Identity](https://learn.microsoft.com/en-us/aspnet/core/security/authentication/identity?view=aspnetcore-8.0)
    * JWT Bearer Authentication

---

## 📧 Contact

If you have any questions or feedback, please feel free to reach out to adrianpanaga@gmail.com

