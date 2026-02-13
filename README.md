# Car Booking Management System

A full-stack MERN application for managing car bookings, drivers, and administrative roles.

## Features

- **User Roles**: Super Admin, Admin.
- **Car Management**: Add, edit, delete cars. Track availability.
- **Driver Management**: Manage drivers and their status.
- **Booking System**: Create bookings with conflict detection.
- **Calendar View**: Visual representation of bookings.
- **Dashboard**: Overview of system statistics.

## Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, React Big Calendar.
- **Backend**: Node.js, Express, MongoDB, Mongoose.
- **Auth**: JWT, bcryptjs.

## Setup Instructions

### Prerequisites
- Node.js
- MongoDB

### Backend Setup
1. Navigate to `server` directory:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create `.env` file (see `env.example` or use provided config).
4. Seed database (optional):
   ```bash
   node seeder.js
   ```
5. Start server:
   ```bash
   npm run dev
   ```

### Frontend Setup
1. Navigate to `client` directory:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start development server:
   ```bash
   npm run dev
   ```

## Default Credentials
- **Email**: admin@example.com
- **Password**: password123
