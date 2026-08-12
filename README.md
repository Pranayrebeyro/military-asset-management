# Military Asset Management System

A full-stack web application for managing military equipment and assets across multiple bases. The system provides role-based access control, inventory tracking, purchases, transfers, assignments, expenditures, and dashboard reporting.

## Features

- User authentication with JWT
- Role-based access control
- Admin and Base Commander roles
- Multi-base asset management
- Equipment inventory tracking
- Purchase management
- Asset transfers between bases
- Equipment assignments to users
- Equipment expenditure tracking
- Dashboard with inventory movement statistics
- Base-level authorization
- Transaction-safe inventory updates
- Audit logging
- PostgreSQL database
- Responsive React frontend

## User Roles

### ADMIN

Administrators have access to assets and transactions across all bases.

Admin capabilities include:

- View dashboard
- Manage purchases
- Manage transfers
- Manage assignments
- Manage expenditures
- View transaction history
- Access multiple bases

### BASE_COMMANDER

Base Commanders are restricted to their assigned base.

Base Commander capabilities include:

- View dashboard for assigned base
- View purchases for assigned base
- Create purchases for assigned base
- View transfers involving their base
- Manage assignments at their base
- Manage expenditures at their base
- View relevant transaction history

## Technology Stack

### Frontend

- React.js
- React Router
- Axios
- Lucide React
- Vite
- CSS

### Backend

- Node.js
- Express.js
- JWT
- bcryptjs
- Helmet
- CORS

### Database

- PostgreSQL

## Project Structure

```text
military-asset-management/
│
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middlewares/
│   ├── models/
│   ├── routes/
│   ├── .env.example
│   ├── package.json
│   ├── schema.sql
│   └── server.js
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── .gitignore
└── README.md
