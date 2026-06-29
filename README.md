# Slooze: Enterprise Food Delivery Management System

Slooze is a B2B SaaS platform designed to manage corporate food ordering across global offices. It features a complex **Role-Based Access Control (RBAC)** system and **Geofenced Data Filtering** to serve three distinct user types: Admins, Managers, and Employees.

## Live Demo

Check out the live application here: **[https://slooze-food-app.vercel.app/](https://slooze-food-app.vercel.app/)**

## Core Features

### Multi-Tier Architecture (RBAC)

- **Global Admins:** Manage vendors, oversee global budgets, and control system health.
- **Regional Managers (USA & India):** Approve team orders, manage regional budgets, and enable/disable local vendors.
- **Employees:** Browse localized menus, add items to cart, and place orders (requires manager approval).

### Geofenced Localization

Data is siloed by region. The Node.js backend detects the user's `country` context and automatically filters:

- **Menus:** India employees only see Indian restaurants; USA employees only see USA restaurants.
- **Manager Dashboards:** USA Managers only see and approve USA team orders.

### Approval Workflow & Payments

- Employees send cart items to a "Pending" queue.
- Managers review items and click "Approve" to instantly deduct from the corporate budget and send the order to the kitchen.
- Admins track real-time revenue and payout stats.

## Tech Stack

- **Frontend:** Next.js 14 (App Router), React, TypeScript, Tailwind CSS, Lucide Icons
- **Backend:** Next.js API Routes (Node.js)
- **Database:** PostgreSQL (Hosted on NeonDB)
- **ORM:** Prisma
- **State Management:** Zustand (with LocalStorage persistence)

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/ramanakumar2580/slooze-food-app.git
cd slooze-food-app
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up your environment variables

Create a `.env` file in the root directory and add your NeonDB connection string:

```bash
DATABASE_URL="postgresql://user:password@endpoint.neon.tech/slooze?sslmode=require"
```

### 4. Push the schema to the database

```bash
npx prisma db push
npx prisma generate
```

### 5. Seed the database with test data

```bash
npx prisma db seed
```

### 6. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Demo Accounts

Use the "One-Click" login page to test the RBAC pipeline:

- **Nick Fury:** Global Admin
- **Captain America:** USA Regional Manager
- **Travis:** USA Employee
- **Captain Marvel:** India Regional Manager
- **Thanos:** India Employee

