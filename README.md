# BrightLoopAutopilot1.0
## Subscription Management System

### Project Overview

BrightLoop Autopilot is a unified software platform designed to manage the complete lifecycle of a subscription-based business.

The system provides a centralized solution for managing products, plans, customer subscriptions, quotations, recurring invoices, payments, discounts, taxes and revenue reporting.

It aims to reduce manual work, prevent missed renewals and billing errors, and provide better visibility into business revenue.

### Problem Statement

Subscription-based businesses often manage their operations using spreadsheets and manual processes.

This creates several challenges:
- Difficulty tracking customer subscriptions and renewals.
- Manual invoice generation.
- Errors in payment and invoice matching.
- Difficulty managing taxes and discounts.
- Time-consuming revenue reporting.
- Limited visibility into outstanding and overdue invoices.

BrightLoop Autopilot aims to solve these problems through an integrated subscription management system.

### Main Objectives

- Centralize subscription business operations.
- Automate recurring billing and invoice generation.
- Simplify product and plan management.
- Manage customers and subscription lifecycles.
- Track payments and outstanding invoices.
- Provide accurate revenue reports and dashboard summaries.

### Core Modules and Features

#### 1. User and Access Management
- Admin, internal staff and customer roles.
- Customer registration and login.
- Password validation and reset functionality.
- Role-based access control.
- Only admins can add staff members.

#### 2. Product Management
- Create and manage products.
- Store product name, type, sales price, cost price and notes.
- Support product variants and additional pricing.

#### 3. Plan Management
- Create subscription plans.
- Support daily, weekly, monthly and yearly billing.
- Configure minimum quantities and availability dates.
- Support pausing, renewal and closure options.

#### 4. Subscription Management
- Create subscriptions from quotations.
- Manage subscription numbers, customers and plans.
- Track subscription start and expiry dates.
- Support Draft, Quotation, Confirmed, Active and Closed statuses.

#### 5. Quotation Management
- Create quotation templates.
- Define quotation validity periods.
- Convert quotations into subscriptions.

#### 6. Invoice and Billing Management
- Automatically generate invoices from subscriptions.
- Calculate taxes and invoice totals.
- Support invoice confirmation, cancellation, sending and printing.
- Track Draft, Confirmed and Paid invoice statuses.
- Prevent duplicate or missed billing.

#### 7. Discount Management
- Fixed amount and percentage discounts.
- Minimum purchase and quantity conditions.
- Discount validity periods and usage limits.
- Automatic application to eligible invoices.

#### 8. Payment Management
- Record payment methods, amounts, dates and notes.
- Link payments to the correct invoices.
- Track paid and outstanding invoices.
- Identify overdue payments.

#### 9. Revenue Dashboard and Reporting
- View active subscriptions.
- Monitor revenue and payments.
- Track outstanding and overdue invoices.
- Provide filters and summary reports.

## Technology Stack

### Frontend
- React.js
- Vite
- Tailwind CSS

### Backend
- Node.js
- Express.js
- Prisma ORM
- Zod
- dotenv

### Database
- SQLite

### Development Tools
- Visual Studio Code
- Git and GitHub

### Application Ports
- Frontend: 5173
- Backend: 5000

### Project Structure

```text
Subscription-management-system1.0/
│
├── frontend/
├── backend/
├── docs/
│   └── API_CONTRACT.md
└── README.md
```

### Installation and Setup

Installation instructions will be added after finalizing the technology stack.

### Running the Application

Frontend and backend execution commands will be documented after development setup.

### API Documentation

Refer to [API_CONTRACT.md](docs/API_CONTRACT.md) for the agreed API endpoints, request formats and response formats.

### Performance Requirements

- Application pages should respond in under two seconds.
- The system should support thousands of subscriptions.
- Billing and payment information should remain consistent.

### Development Team

| Member | Responsibility |
|---|---|
| Member 1 | Frontend Development |
| Member 2 | Backend Development |
| Member 3 | Coordination, Documentation and Integration |

### Project Status

Currently under development as a hackathon project.

