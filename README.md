# MERN Stack Employee Management System (EMS)

A full-featured, secure, and modern Employee Management System (EMS) built using the MERN stack (MongoDB, Express.js, React, Node.js). This application separates capabilities into two dedicated portals: **Admin Portal** and **Employee Portal**.

---

## 🚀 Key Features

### 🔑 Authentication & Security
*   **Dual Portal Login**: Dedicated authentication portals for Admin and Employee accounts.
*   **Secure Password Hashing**: Passwords stored using `bcrypt` hashing with salt rounds.
*   **JWT Sessions**: Protected resources powered by stateless JSON Web Tokens with a 7-day expiration.
*   **Two-Step OTP Password Reset**: Secure OTP-based reset flows for both admins and employees, with email dispatch via Nodemailer SMTP.

### 👥 Employee Management
*   **Employee Directory**: Full CRUD options (Add, Update, Soft-Delete, and Recover deleted employees).
*   **Data Consistency**: Automated synchronization of profile updates (firstName, lastName, bio) between Mongoose `User` and `Employee` documents, with pre-write email uniqueness checks.

### ⏰ Attendance & Time Tracking
*   **Clock-in / Clock-out**: Instant check-in/out logging with active working hours computation.
*   **Kolkata Timezone-Aware IST Boundaries**: Fixed timezone mapping (`Asia/Kolkata`) preventing UTC server offset discrepancies.
*   **Lateness Flags**: Automatic "LATE" check-in flags if employee checks in past 9:00 AM IST.
*   **Cron Jobs**:
    *   **Auto Check-Out**: If an employee forgets to check out after 9 hours, they receive an email reminder. After 10 hours, they are automatically clocked out and flagged for a "Half Day".
    *   **Absent Alerts**: Fires daily at 11:30 AM IST, notifying active employees who haven't logged attendance or leave.

### 📅 Leave Management
*   **Apply for Leave**: Employees can request full-day or half-day (First/Second half) leaves.
*   **Approval Queue**: Real-time admin workspace to approve or reject leave applications with required feedback notes.
*   **Leave Balance Calculations**: Automatically evaluates remaining allowances (Sick, Casual, Annual) on payslip processing.

### 💵 Payroll & Payslip Generation
*   **Custom Payslips**: Admins can generate monthly payslips with custom basic salary, allowances, and deductions.
*   **Annual Leave Cash Payout**: Integrated annual leave buyout features computed against remaining balances.
*   **Print Utility**: PDF/Print-ready payslip layouts with print commands.
*   **Integrity Control**: Strict check constraints to prevent duplicate payslip generation for the same employee, month, and year.

### 📈 Task Board & Messaging
*   **Productivity Tracker**: In-app task list supporting Todo, In Progress, and Completed states.
*   **Support/Messaging Center**: Direct channel for employees to log feedback or report platform concerns to the admin.

---

## 📁 Directory Structure

```text
Employee Management System/
├── client/                     # React + Vite Frontend
│   ├── public/                 # Static assets
│   ├── src/
│   │   ├── api/                # Axios API instance
│   │   ├── components/         # Reusable UI elements (Forms, Modals, Sidebar)
│   │   ├── context/            # AuthContext session hook
│   │   ├── pages/              # Router screens (Dashboard, Attendance, Leave, Payslips)
│   │   ├── utils/              # Client formatting helpers
│   │   └── App.jsx             # React router configuration
│   ├── .env                    # Frontend environment configurations
│   └── package.json            # React project dependencies
│
└── server/                     # Node.js + Express Backend
    ├── config/                 # DB connector & Nodemailer transporter setup
    ├── controllers/            # Controller handlers containing core business logic
    ├── jobs/                   # Background Cron/Timer files
    ├── middleware/             # Express middlewares (JWT check, multer)
    ├── models/                 # Mongoose schema models
    ├── routes/                 # Express route entry points
    ├── utils/                  # Backend utilities (JWT generator, templates)
    ├── .env                    # Backend database strings & API keys
    ├── seed.js                 # Admin initialization script
    └── server.js               # Express application entrypoint
```

---

## 🛠️ Installation & Setup

### Prerequisites
*   Node.js (v18+)
*   MongoDB Instance (Local or MongoDB Atlas Cluster)
*   Cloudinary Account (For profile picture uploads)
*   Gmail account with SMTP App Password (For emails)

### Step 1: Clone and Install Dependencies
Navigate into each directory and install node modules:

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### Step 2: Configure Environment Variables
Create `.env` files in both directories.

#### Backend Env (`server/.env`)
```env
PORT=4000
MONGODB_URI=your_mongodb_connection_uri
JWT_SECRET=your_jwt_secret_phrase

# Admin details
ADMIN_EMAIL=admin@yourcompany.com

# Cloudinary Setup
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# SMTP Email setup
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_gmail_app_password
SENDER_EMAIL=your_email@gmail.com
```

#### Frontend Env (`client/.env`)
```env
VITE_BASE_URL=http://localhost:4000
```

### Step 3: Seed Admin User
Before logging in, run the seed script to create the initial admin account:

```bash
cd server
npm run seed
```
*Note: The default credentials created will match the `ADMIN_EMAIL` specified in your env configuration with password `admin123`.*

---

## 🏃 Running the Application

Start both the backend server and frontend development server:

### Run Backend
```bash
cd server
npm run server
```
*The server will start on port `4000`.*

### Run Frontend
```bash
cd client
npm run dev
```
*Vite will start the client, usually on `http://localhost:5173`.*

---

## 🛡️ API Endpoints

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/auth/login` | Public | Authenticates and returns JWT |
| **GET** | `/api/auth/session` | Protected | Returns user session info |
| **POST** | `/api/auth/change-password` | Protected | Changes user password |
| **POST** | `/api/auth/forgot-password/admin/request-otp` | Public | Generates OTP for Admin reset |
| **POST** | `/api/auth/forgot-password/admin/reset` | Public | Resets Admin password with OTP |
| **POST** | `/api/auth/forgot-password/employee/request-otp`| Public | Generates OTP for Employee reset |
| **POST** | `/api/auth/forgot-password/employee/reset` | Public | Resets Employee password with OTP |
| **GET** | `/api/employees` | Protected | Fetches active employee directory |
| **POST** | `/api/employees` | Admin Only | Registers a new employee |
| **PUT** | `/api/employees/:id` | Admin Only | Updates employee information |
| **DELETE**| `/api/employees/:id` | Admin Only | Soft-deletes employee account |
| **POST** | `/api/attendance` | Employee Only | Marks attendance clock-in/out |
| **POST** | `/api/payslips` | Admin Only | Generates monthly payslip |
| **POST** | `/api/profile` | Protected | Updates bio/profile photo (Cloudinary)|