# Unitec Pharmacy PMS - Comprehensive Project Documentation

**Version:** 1.0.0  
**Last Updated:** July 12, 2026  
**Project Name:** Unitec Pharmacy Point of Sale System  
**License:** MIT

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Core Features](#core-features)
5. [Database Architecture](#database-architecture)
6. [Installation & Setup](#installation--setup)
7. [Development Workflow](#development-workflow)
8. [Key Modules & Features](#key-modules--features)
9. [API Routes](#api-routes)
10. [Frontend Architecture](#frontend-architecture)
11. [Payment Gateway Integration](#payment-gateway-integration)
12. [Testing Framework](#testing-framework)
13. [Code Quality Standards](#code-quality-standards)
14. [Deployment Guide](#deployment-guide)
15. [Common Commands](#common-commands)

---

## Project Overview

### Description
Unitec Pharmacy PMS (Pharmacy Management System) is a comprehensive, full-stack pharmacy and retail management platform with Point of Sale (POS) capabilities. It's designed to streamline pharmacy operations including inventory management, sales, customer management, financial tracking, and prescription management.

### Key Characteristics
- **Full-Stack Application**: Modern web application with Electron desktop support
- **Enterprise-Grade**: Supports multiple branches, complex inventory tracking, and extensive reporting
- **Multi-Currency & Multi-Payment**: Integrated with 30+ international payment gateways
- **Role-Based Access Control**: Fine-grained permission system using Spatie Laravel Permissions
- **Multi-Language Support**: i18n implementation with language detection
- **Real-Time Capabilities**: WebSocket support, live notifications, and deferred props
- **Media Management**: Integrated media library for product images, documents, and prescriptions
- **Advanced Reporting**: Customer/supplier ledgers, stock reports, sales analytics

### Target Users
- Pharmacy owners and managers
- Retail/point-of-sale operators
- Inventory managers
- Finance/accounting teams
- Branch managers
- Customers (via customer portal)

---

## Tech Stack

### Backend (PHP/Laravel)

| Component | Version | Purpose |
|-----------|---------|---------|
| **Laravel Framework** | v12 | Core application framework |
| **PHP** | 8.4.19 | Server-side language |
| **Laravel Boost** | v2 | Development toolkit with MCP integration |
| **Inertia.js (Laravel)** | v2 | Server-side SPA rendering |
| **Spatie Laravel Permissions** | v6.18 | Role and permission management |
| **Spatie Media Library** | v11.13 | File/media handling and conversions |
| **Ziggy** | v2 | Frontend route generation |
| **Laravel Tinker** | v2.10.1 | Interactive PHP shell |
| **Laravel Pail** | v1.2.2 | Log viewing utility |

### Frontend (React/TypeScript)

| Component | Version | Purpose |
|-----------|---------|---------|
| **React** | v19 | UI framework |
| **TypeScript** | - | Type-safe JavaScript |
| **Inertia.js (React)** | v2 | Frontend client adapter |
| **Tailwind CSS** | v4 | Utility-first CSS framework |
| **Radix UI** | Latest | Unstyled accessible components |
| **Headless UI** | v2.2.0 | Utilities for accessible UI |
| **Lucide React** | v0.475 | Icon library |
| **Framer Motion** | v12.23.12 | Animation library |
| **Tiptap** | v2.23.0 | Rich text editor |
| **FullCalendar** | v6.1.19 | Calendar components |
| **React Router** | - | Client-side routing |

### Desktop Application

| Component | Version | Purpose |
|-----------|---------|---------|
| **Electron** | v42.0.1 | Desktop app framework |
| **Electron Builder** | v26.8.1 | Electron packaging |

### Build & Tooling

| Tool | Version | Purpose |
|------|---------|---------|
| **Vite** | Latest | Frontend bundler |
| **Laravel Vite Plugin** | v1.0 | Laravel/Vite integration |
| **Biome** | v2.4.0 | Code formatter & linter |
| **ESLint** | v9.17.0 | JavaScript linting |
| **Prettier** | v3.4.2 | Code formatting |
| **TypeScript ESLint** | v8.23.0 | TypeScript linting |
| **Ultracite** | v7.2.4 | Zero-config code quality preset |

### Database & Services

| Service | Version | Purpose |
|---------|---------|---------|
| **MySQL** | - | Primary database |
| **Redis** | - | Caching layer |
| **AWS S3** | v3 | File storage (optional) |
| **Google APIs** | v2.18 | Google Calendar integration |
| **OpenAI** | v0.14 | AI features (ChatGPT integration) |
| **Twilio** | v8.8 | SMS capabilities |

### Testing

| Tool | Version | Purpose |
|------|---------|---------|
| **Pest** | v3.8 | Modern PHP testing framework |
| **Pest Laravel Plugin** | v3.1 | Pest + Laravel integration |
| **PHPUnit** | v11 | Unit testing |
| **Mockery** | v1.6 | Mocking library |
| **Faker** | v1.23 | Fake data generation |

---

## Project Structure

```
unitec-pharmacy/
├── app/
│   ├── Console/               # Artisan commands
│   ├── Enums/                 # PHP 8 Enums
│   ├── Events/                # Event classes
│   ├── Helpers/               # Helper functions
│   ├── Http/
│   │   ├── Controllers/       # 150+ API controllers
│   │   ├── Requests/          # Form validation classes
│   │   ├── Resources/         # API resources
│   │   └── Middleware/        # Route middleware
│   ├── Libraries/             # Custom libraries
│   ├── Listeners/             # Event listeners
│   ├── Mail/                  # Mailable classes
│   ├── Models/                # 140+ Eloquent models
│   ├── Observers/             # Model observers
│   ├── PathGenerators/        # Media path generation
│   ├── Providers/             # Service providers
│   ├── Services/              # Business logic services
│   └── Traits/                # Reusable traits
│
├── bootstrap/
│   ├── app.php                # Application configuration
│   ├── cache/                 # Bootstrap cache
│   └── providers.php          # Service provider registration
│
├── config/                    # Configuration files
│   ├── app.php
│   ├── auth.php
│   ├── cache.php
│   ├── database.php
│   ├── filesystems.php
│   ├── inertia.php
│   ├── media-library.php
│   ├── openai.php
│   ├── permission.php
│   └── [25+ more config files]
│
├── database/
│   ├── factories/             # Model factories for testing
│   ├── migrations/            # 150+ database migrations
│   └── seeders/               # Database seeders
│
├── resources/
│   ├── css/                   # Global styles
│   ├── js/
│   │   ├── pages/             # Inertia page components
│   │   ├── components/        # Reusable React components
│   │   ├── contexts/          # React contexts
│   │   ├── hooks/             # Custom React hooks
│   │   ├── layouts/           # Page layouts
│   │   ├── lib/               # Utility libraries
│   │   ├── types/             # TypeScript type definitions
│   │   ├── utils/             # Utility functions
│   │   ├── helpers/           # Helper functions
│   │   ├── config/            # Frontend config
│   │   ├── app.tsx            # React app entry
│   │   ├── ssr.tsx            # Server-side rendering entry
│   │   └── i18n.js            # i18n configuration
│   ├── lang/                  # Localization strings
│   └── views/                 # Blade templates (for email)
│
├── routes/
│   ├── web.php                # Main web routes
│   ├── auth.php               # Authentication routes
│   ├── settings.php           # Settings routes
│   └── console.php            # Console commands
│
├── storage/
│   ├── app/                   # Application storage
│   ├── framework/             # Framework cache
│   ├── logs/                  # Application logs
│   └── media-library/         # Media library storage
│
├── tests/
│   ├── Feature/               # Feature tests
│   ├── Unit/                  # Unit tests
│   ├── Pest.php               # Pest configuration
│   └── TestCase.php           # Test base class
│
├── public/
│   ├── storage/               # Public storage symlink
│   ├── index.php              # Entry point
│   └── images/                # Static images
│
├── vendor/                    # Composer dependencies
│
├── electron/                  # Electron desktop app
│   ├── main.js
│   └── preload.js
│
├── .github/
│   └── skills/                # Copilot skills
│       ├── inertia-react-development/
│       ├── medialibrary-development/
│       ├── pest-testing/
│       └── tailwindcss-development/
│
├── Root Config Files
│   ├── composer.json          # PHP dependencies
│   ├── package.json           # Node dependencies
│   ├── vite.config.ts         # Vite configuration
│   ├── tailwind.config.js     # Tailwind configuration
│   ├── tsconfig.json          # TypeScript configuration
│   ├── eslint.config.js       # ESLint configuration
│   ├── biome.jsonc            # Biome configuration
│   ├── phpunit.xml            # PHPUnit configuration
│   ├── artisan                # Laravel CLI
│   └── .env                   # Environment variables
```

---

## Core Features

### 1. **Point of Sale (POS) System**
- Real-time sales transaction processing
- Multi-register support
- Cash register management and reconciliation
- POS session tracking
- Invoice generation and printing
- Digital and printed receipts
- Discount and coupon application

### 2. **Inventory Management**
- Product catalog (140+ products in system)
- Stock tracking with batch numbers
- Batch and expiry date management
- Stock transfers between branches
- Goods Received Notes (GRN)
- Stock bin cards and in-hand reports
- Wastage tracking
- Generic name management for pharmaceutical products
- Drug form (tablets, capsules, liquids, etc.)

### 3. **Sales Management**
- Sales orders and invoicing
- Multiple payment methods
- Sales reports and analytics
- Customer-specific pricing
- Bulk purchasing options
- Return order processing
- Delivery order management
- Delivery routes

### 4. **Purchase Management**
- Purchase orders from suppliers
- Goods receipt tracking
- Supplier management
- Supplier payments and reconciliation
- Supplier return orders
- Purchase analytics

### 5. **Customer Management**
- Customer profiles and records
- Customer loyalty points program
- Customer portal for order tracking
- Customer ledger cards
- Privilege customer system
- Customer segmentation
- Referral management

### 6. **Financial Management**
- Multi-currency support
- Finance account management
- Transaction tracking
- Payment tracking
- Petty cash management
- Bank account management
- Financial reports and reconciliation
- Invoice payments

### 7. **Prescription Management**
- Digital prescription upload and tracking
- Prescription fulfillment
- Medicine items management
- Delivery tracking for prescriptions
- Patient communication via messages
- Prescription expiry tracking

### 8. **Reporting & Analytics**
- Sales reports with filters
- Stock reports (bin cards, in-hand)
- Customer details and ledger reports
- Supplier details and ledger reports
- Cash collection reports
- Stock transfer approval reports
- Price details reports
- Financial transaction reports

### 9. **CRM Integration**
- Accounts management
- Contacts management
- Leads tracking with custom stages
- Opportunities pipeline
- Campaigns and targeted lists
- Calls and meetings scheduling
- Cases management
- Activity tracking and comments
- Integration with Google Calendar

### 10. **User & Role Management**
- Multi-branch user assignment
- Role-based access control (RBAC)
- Fine-grained permission system
- User login history tracking
- Impersonation feature (admin)
- User activity monitoring

### 11. **Notifications & Communication**
- Email templates and customization
- SMS notifications (Twilio)
- In-app notifications
- Email delivery system
- Notification scheduling
- Multi-language email templates

### 12. **Document Management**
- Document folders and organization
- Document types
- Document storage and retrieval
- File upload with media library

### 13. **Settings & Configuration**
- Global application settings
- Tax configuration
- Currency management
- Brand management
- Category management
- Account types and industries
- Lead sources and statuses
- Shipping provider setup
- Payment gateway configuration

### 14. **Payment Gateway Integration**
- 30+ payment gateways supported
- Stripe, PayPal, Razorpay
- Mollie, Authorize.net, Cashfree
- Local payment processors (Khalti, Paytabs, etc.)
- Payment processing and recording
- Multi-currency transactions

### 15. **AI Integration**
- ChatGPT integration
- AI-powered features and suggestions
- Document and content analysis

### 16. **Website/Landing Page**
- Public-facing landing page
- Cookie consent management
- Newsletter signup
- Custom page management
- Public customer registration

### 17. **Mobile/Desktop Support**
- Responsive web design
- Electron desktop application
- Offline capabilities (in development)
- QR code generation and scanning

---

## Database Architecture

### Core Data Models (140+ Models)

#### **Sales & Invoicing**
- `Invoice` - Main invoice records
- `InvoiceProduct` - Invoice line items
- `InvoicePayment` - Payment records
- `InvoiceActivity` - Activity tracking
- `InvoiceComment` - Comments and notes
- `SalesOrder` - Sales orders
- `SalesTransaction` - POS transactions
- `SalesTransactionItem` - Transaction items
- `SalePayment` - Sale payments

#### **Inventory & Stock**
- `Product` - Product catalog
- `ProductDetailsPrice` - Product pricing details
- `Grn` - Goods Received Notes
- `GrnItem` - GRN line items
- `StockTransfer` - Inter-branch transfers
- `StockTransferItem` - Transfer line items
- `Wastage` - Wastage tracking
- `WastageItem` - Wastage line items
- `GenericName` - Pharmaceutical generic names
- `DrugForm` - Drug formulations
- `Unit` - Measurement units
- `Brand` - Product brands
- `Category` - Product categories

#### **Purchasing**
- `PurchaseOrder` - Purchase orders
- `PurchaseOrderProduct` - PO line items
- `PurchaseOrderActivity` - Activity tracking
- `PurchaseOrderComment` - Comments
- `ReceiptOrder` - Receipt tracking
- `ReceiptOrderProduct` - Receipt items
- `ReturnOrder` - Return orders
- `SupplierReturn` - Supplier returns
- `SupplierReturnItem` - Return items

#### **Customer & Supplier Management**
- `Customer` - Customer records
- `CustomerPayment` - Customer payments
- `CustomerReturn` - Customer returns
- `CustomerReturnItem` - Return items
- `CustomerDetailsReport` - Customer analytics
- `Supplier` - Supplier records
- `SupplierPayment` - Supplier payments
- `Contact` - Contact information
- `ContactMessage` - Contact messages

#### **Prescription Management**
- `Prescription` - Prescription records
- `PrescriptionMessage` - Prescription messages

#### **CRM**
- `Account` - Account/company records
- `AccountActivity` - Activity tracking
- `AccountComment` - Comments
- `AccountType` - Account types
- `AccountIndustry` - Industry classification
- `Lead` - Lead records
- `LeadActivity` - Activity tracking
- `LeadComment` - Comments
- `LeadSource` - Lead sources
- `LeadStatus` - Lead status/stage
- `Opportunity` - Sales opportunities
- `OpportunityActivity` - Activity tracking
- `OpportunityComment` - Comments
- `OpportunitySource` - Opportunity sources
- `OpportunityStage` - Sales pipeline stages
- `Campaign` - Marketing campaigns
- `CampaignType` - Campaign types
- `TargetList` - Campaign target lists
- `Case` - Support cases
- `Call` - Call records
- `CallAttendee` - Call participants
- `Meeting` - Meeting records
- `MeetingAttendee` - Meeting participants

#### **Delivery & Logistics**
- `DeliveryOrder` - Delivery orders
- `DeliveryRoute` - Delivery routes
- `ShippingProviderType` - Shipping providers

#### **Financial Management**
- `FinanceAccount` - Finance accounts/GL
- `FinanceTransaction` - Financial transactions
- `FinancePayment` - Finance payments
- `FinancePaymentDetail` - Payment details
- `PettyCashCategory` - Petty cash categories
- `PettyCashEntry` - Petty cash entries
- `MasterTransaction` - Master transaction log

#### **POS & Branches**
- `Branch` - Store branches
- `CashRegister` - POS registers
- `PosSession` - POS sessions

#### **User & Admin**
- `User` - User accounts
- `Role` - Roles (Spatie)
- `Permission` - Permissions (Spatie)
- `LoginHistory` - Login tracking
- `BankAccount` - Bank accounts

#### **Configuration & Settings**
- `Setting` - Global settings
- `Tax` - Tax configuration
- `Currency` - Currency configuration
- `Coupon` - Discount coupons
- `PaymentSetting` - Payment configuration
- `Plan` - Subscription plans
- `PlanOrder` - Plan orders
- `PlanRequest` - Plan requests
- `Referral` - Referral program
- `ReferralSetting` - Referral settings
- `PointsEarningRule` - Loyalty points rules

#### **Communication & Notifications**
- `EmailTemplate` - Email templates
- `EmailTemplateLang` - Multi-language templates
- `UserEmailTemplate` - User email template settings
- `NotificationTemplate` - Notification templates
- `NotificationTemplateLang` - Multi-language notifications
- `UserNotificationTemplate` - User notification settings
- `Newsletter` - Newsletter records
- `ContactMessage` - Contact form messages

#### **Media & Documents**
- `Document` - Document records
- `DocumentFolder` - Document folders
- `DocumentType` - Document types
- `MediaItem` - Media library items
- `Media` - Spatie media records

#### **Other**
- `Project` - Project management
- `ProjectTask` - Project tasks
- `TaskStatus` - Task statuses
- `Quote` - Sales quotes
- `QuoteActivity` - Activity tracking
- `QuoteComment` - Comments
- `DrugDestroy` - Drug destruction records
- `Webhook` - Webhook configurations
- `LandingPageSetting` - Landing page config
- `LandingPageCustomPage` - Custom pages

### Database Key Relationships

**One-to-Many Relationships:**
- Customer → Orders, Payments, Returns
- Supplier → Purchase Orders, Payments
- Branch → Users, Registers, Inventory
- Invoice → InvoiceProducts, InvoicePayments, InvoiceComments
- Product → Stock Levels, Prices, Media

**Many-to-Many Relationships:**
- User ↔ Role
- User ↔ Branch
- Role ↔ Permission
- Campaign ↔ TargetList

**Polymorphic Relationships:**
- Comments (on Invoice, Lead, Quote, etc.)
- Activities (on multiple models)
- Media (associated with Products, Documents, etc.)

### Database Statistics
- **Total Tables:** 150+
- **Relationships:** Complex hierarchy with 300+ foreign keys
- **Indexes:** Optimized for read-heavy operations
- **Storage:** Estimated 500MB+ for large installations

---

## Installation & Setup

### Prerequisites
- PHP 8.4.19 or higher
- MySQL 8.0+
- Node.js 18+
- Composer
- Git

### Environment Setup

#### 1. Clone Repository
```bash
git clone https://github.com/yourusername/unitec-pharmacy.git
cd unitec-pharmacy
```

#### 2. Install PHP Dependencies
```bash
composer install
```

#### 3. Install JavaScript Dependencies
```bash
npm install
```

#### 4. Environment Configuration
```bash
cp .env.example .env
php artisan key:generate
```

#### 5. Configure Database
Edit `.env` file:
```
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=unitec-pharmacy
DB_USERNAME=root
DB_PASSWORD=
```

#### 6. Database Migration & Seeding
```bash
php artisan migrate:fresh --seed
```

#### 7. Storage Setup
```bash
php artisan storage:link
```

#### 8. Cache & Config
```bash
php artisan config:cache
php artisan route:cache
```

### Development Server

#### Using Laravel Herd (Recommended)
The project is automatically available at: `https://unitec-pharmacy.test`

#### Manual Setup
```bash
# Terminal 1: Start Laravel dev server
php artisan serve

# Terminal 2: Start Vite dev server
npm run dev
```

Access at: `http://localhost:8000`

### Building for Production

```bash
# Build frontend
npm run build

# Optimize Laravel
php artisan optimize:all

# Build Electron app (optional)
npm run electron:build
```

---

## Development Workflow

### Code Quality Standards (Ultracite)

The project uses **Ultracite** - a zero-config code quality preset that enforces strict standards:

#### Check for Issues
```bash
npm exec -- ultracite check
```

#### Auto-Fix Issues
```bash
npm exec -- ultracite fix
# or
npm run fix
```

#### Format Code
```bash
npm run format
```

#### Type Checking
```bash
npm run types
```

### PHP Code Quality

#### Laravel Pint (PHP Formatter)
```bash
vendor/bin/pint --dirty --format agent
```

#### ESLint (JavaScript)
```bash
npm run lint
```

### Git Workflow

#### Using Gitlens Commit Composer
Organize changes into well-formed commits:
```bash
npm run gitlens:commit
```

#### Using Gitlens Start Work
Start work on an issue with automatic branch creation:
```bash
npm run gitlens:start-work [issue-url]
```

### Core Principles

**Type Safety & Explicitness**
- Use explicit types for function parameters and returns
- Prefer `unknown` over `any`
- Use `as const` for immutable values
- Use meaningful variable names

**Modern JavaScript/TypeScript**
- Arrow functions for callbacks
- `for...of` loops over `.forEach()`
- Optional chaining (`?.`) and nullish coalescing (`??`)
- Template literals
- Destructuring assignments
- `const` by default, `let` when needed

**React Best Practices**
- Function components (no class components)
- Call hooks at top level only
- Specify all hook dependencies
- Use `key` prop with unique identifiers
- Semantic HTML and ARIA attributes
- No console.log, debugger, or alert in production

**Error Handling**
- Throw Error objects with descriptive messages
- Use try-catch blocks meaningfully
- Handle all promise rejections

**Performance**
- Avoid spread syntax in loop accumulators
- Use top-level regex literals
- Prefer specific imports over namespaces
- Avoid barrel files (index re-exports)

---

## Key Modules & Features

### 1. **Point of Sale (POS) Module**

**Controllers:**
- `PosSessionController` - Session management
- `CashRegisterController` - Register configuration
- `SalesTransactionController` - Transaction processing

**Key Flows:**
- Open POS session → Create transaction → Add items → Apply discounts → Process payment → Close transaction

**Features:**
- Multi-payment support
- Instant receipt generation
- Real-time inventory updates
- Cash register reconciliation

### 2. **Inventory Module**

**Controllers:**
- `ProductController` - Product CRUD
- `GrnController` - Goods receipt
- `StockTransferController` - Inter-branch transfers
- `WastageController` - Wastage tracking
- `InventoryDashboardController` - Analytics

**Key Entities:**
- Products with multiple pricing levels
- Batch and expiry tracking
- Stock levels by branch
- Transfer workflows with approval

### 3. **Invoice/Billing Module**

**Controllers:**
- `InvoiceController` - Invoice management
- `InvoiceCommentController` - Comments
- 25+ Payment gateway controllers

**Workflow:**
- Create invoice → Add line items → Apply taxes/discounts → Process payment → Generate receipt

**Multi-Currency Support:**
- Multiple payment gateways
- Automatic currency conversion
- Payment reconciliation

### 4. **CRM Module**

**Controllers:**
- `AccountController` - Company/account management
- `LeadController` - Lead pipeline
- `OpportunityController` - Sales opportunities
- `CampaignController` - Marketing campaigns
- `CallController` - Call logging
- `MeetingController` - Meeting scheduling
- `CaseController` - Support cases

**Features:**
- Activity tracking and comments
- Google Calendar integration
- Lead/opportunity lifecycle
- Campaign targeting

### 5. **Financial Module**

**Controllers:**
- `FinanceAccountController` - GL accounts
- `FinanceTransactionController` - Transactions
- `PettyCashController` - Petty cash management

**Features:**
- Double-entry accounting
- Bank reconciliation
- Financial reporting
- Transaction history

### 6. **Customer Management Module**

**Controllers:**
- `CustomerController` - Customer CRUD
- `CustomerPortalController` - Portal access
- `ReferralController` - Referral program
- `PointsEarningRuleController` - Loyalty points

**Features:**
- Customer profiles and history
- Loyalty point system
- Referral program
- Customer portal
- Privilege customer benefits

### 7. **Prescription Module**

**Controllers:**
- `PrescriptionManagementController` - Prescription handling
- `CustomerPrescriptionController` - Customer portal prescriptions

**Features:**
- Digital prescription upload
- Medicine fulfillment
- Delivery tracking
- Patient messaging

### 8. **Reporting Module**

**Controllers:**
- `ReportsController` - Report management
- `SalesReportController` - Sales analytics
- `CustomerDetailsReportController` - Customer reports
- `SupplierDetailsReportController` - Supplier reports
- Multiple specific report controllers

**Report Types:**
- Sales by date/product/customer
- Inventory stock reports
- Customer ledger cards
- Supplier ledger cards
- Cash collection reports
- Stock transfer approvals

---

## API Routes

### Authentication Routes (`routes/auth.php`)
```
POST   /login              - User login
POST   /register          - User registration
POST   /logout            - Logout
POST   /forgot-password   - Password reset request
POST   /reset-password    - Password reset
POST   /verify-email      - Email verification
```

### Main Routes (`routes/web.php`)

**Dashboard**
```
GET    /dashboard         - Main dashboard
GET    /dashboard/inventory  - Inventory dashboard
GET    /dashboard/finance    - Finance dashboard
```

**POS & Sales**
```
GET    /pos-sessions                    - List sessions
POST   /pos-sessions                    - Create session
POST   /sales-transactions              - Create transaction
GET    /sales-transactions/{id}         - Transaction details
POST   /sales-transactions/{id}/pay    - Process payment
```

**Invoicing** (150+ endpoints)
```
GET    /invoices                        - List invoices
POST   /invoices                        - Create invoice
PATCH  /invoices/{id}                   - Update invoice
DELETE /invoices/{id}                   - Delete invoice
POST   /invoices/{id}/payments          - Record payment
GET    /invoices/{id}/payments          - Payment history
```

**Inventory Management**
```
GET    /products                        - List products
POST   /products                        - Create product
PATCH  /products/{id}                   - Update product
GET    /grns                            - Goods receipts
POST   /grns                            - Create GRN
PATCH  /grns/{id}/complete              - Complete GRN
POST   /stock-transfers                 - Create transfer
POST   /stock-transfers/{id}/accept     - Accept transfer
```

**Customers & Suppliers**
```
GET    /customers                       - List customers
POST   /customers                       - Create customer
PATCH  /customers/{id}                  - Update customer
GET    /customers/{id}/ledger          - Customer ledger
GET    /suppliers                       - List suppliers
POST   /purchase-orders                 - Create PO
```

**Financial**
```
GET    /finance-accounts                - GL accounts
POST   /finance-transactions            - Record transaction
GET    /petty-cash-entries              - Petty cash
```

**Reports**
```
GET    /reports/sales                   - Sales report
GET    /reports/customer-details        - Customer details
GET    /reports/supplier-details        - Supplier details
GET    /reports/stock-bin-card          - Stock bin card
```

**CRM**
```
GET    /accounts                        - List accounts
POST   /accounts                        - Create account
GET    /leads                           - List leads
POST   /leads                           - Create lead
GET    /opportunities                   - List opportunities
```

**Settings**
```
GET    /settings                        - Global settings
PATCH  /settings                        - Update settings
GET    /roles                           - List roles
POST   /roles                           - Create role
GET    /permissions                     - List permissions
```

### API Resource Controllers

All main resources follow RESTful conventions:
- `GET    /resource` - List all
- `POST   /resource` - Create new
- `GET    /resource/{id}` - Show single
- `PATCH  /resource/{id}` - Update
- `DELETE /resource/{id}` - Delete

**Related Actions:**
- `POST   /resource/{id}/action` - Custom actions
- `GET    /resource?filter=value` - Filtering
- `GET    /resource?sort=-field` - Sorting
- `GET    /resource?include=relation` - Eager loading

---

## Frontend Architecture

### Structure

```
resources/js/
├── app.tsx                 # Main React app component
├── ssr.tsx                 # Server-side rendering
├── components/             # Reusable UI components
│   ├── ui/                 # Base components (Button, Input, etc.)
│   ├── Forms/              # Form components
│   ├── Tables/             # Table components
│   ├── Navigation/         # Navigation components
│   └── [Domain specific]
├── pages/                  # Inertia page components
│   ├── Dashboard/
│   ├── Invoice/
│   ├── Product/
│   ├── Customer/
│   ├── Settings/
│   └── [Domain specific]
├── layouts/                # Page layouts
│   ├── AuthLayout.tsx
│   ├── DashboardLayout.tsx
│   └── [Custom layouts]
├── contexts/               # React contexts
│   ├── AuthContext
│   ├── BranchContext
│   └── [Domain contexts]
├── hooks/                  # Custom React hooks
│   ├── useAuth
│   ├── useForm
│   ├── usePermission
│   └── [Custom hooks]
├── types/                  # TypeScript definitions
│   ├── models.ts           # Data models
│   ├── api.ts              # API types
│   └── [Domain types]
├── lib/                    # Utility libraries
│   ├── api.ts              # API client
│   ├── axios.ts            # Axios config
│   └── [Helper libraries]
├── utils/                  # Utility functions
├── helpers/                # Helper functions
├── config/                 # Configuration
└── i18n.js                 # i18n setup
```

### Key Technologies

**Inertia.js v2**
- Seamless server/client routing
- Automatic property passing to components
- Prefetching and lazy loading
- Deferred props for slow queries

**Tailwind CSS v4**
- Utility-first styling
- Dark mode support
- Responsive design
- Custom theme configuration

**Radix UI**
- Accessible component primitives
- Headless approach (unstyled)
- Full control over styling

**TypeScript**
- Full type safety
- IntelliSense support
- Better IDE integration

### Component Patterns

**Form Components**
```tsx
<form method="post" action={route('resource.store')}>
  <TextField
    name="email"
    label="Email"
    type="email"
    required
  />
  <Button type="submit">Submit</Button>
</form>
```

**Table Components**
```tsx
<DataTable
  columns={columns}
  data={data}
  paginated
  searchable
  sortable
/>
```

**Modal Components**
```tsx
<Modal open={isOpen} onOpenChange={setIsOpen}>
  <ModalContent>
    {/* Modal content */}
  </ModalContent>
</Modal>
```

### State Management

**React Hooks**
- `useState` for local component state
- `useContext` for global state
- Custom hooks for reusable logic

**Inertia Props**
- Automatic server data synchronization
- Reactive props updates
- Deferred props for performance

**Global Contexts**
- Authentication context
- Branch/company context
- Notification context
- Permission context

### Styling Strategy

**Tailwind Utility Classes**
```tsx
<div className="flex flex-col gap-4 p-6 bg-white rounded-lg shadow">
  <h2 className="text-xl font-bold text-gray-900">Title</h2>
  <p className="text-gray-600">Description</p>
</div>
```

**CSS Modules** (for complex styles)
```tsx
import styles from './Component.module.css';

export function Component() {
  return <div className={styles.container}>...</div>;
}
```

**Dark Mode**
```tsx
<div className="dark:bg-gray-900 dark:text-white bg-white text-black">
  Content adapts to light/dark mode
</div>
```

### Internationalization (i18n)

**Language Files** (resources/lang/{locale}/*.json)
```json
{
  "invoice": "Invoice",
  "customer": "Customer",
  "payment_processed": "Payment processed successfully"
}
```

**Usage in Components**
```tsx
import { useTranslation } from 'react-i18next';

export function Component() {
  const { t } = useTranslation();
  return <h1>{t('invoice')}</h1>;
}
```

---

## Payment Gateway Integration

### Supported Payment Gateways (30+)

**International Gateways:**
- Stripe
- PayPal
- Razorpay
- Mollie
- Authorize.net
- Cashfree

**Regional Gateways:**
- Khalti (Nepal)
- Paytabs (Middle East)
- Paystack (Africa)
- Flutterwave (Africa)
- Mercado Pago (Latin America)

**Additional Providers:**
- Midtrans, CoinGate, Fedapay, Iyzipay, Easebuzz
- PayFast, PayHere, Tap, Toyyibpay
- And many more...

### Implementation Pattern

Each payment gateway has:
1. **Controller** (e.g., `StripePaymentController`)
2. **Invoice-specific Controller** (e.g., `InvoiceStripePaymentController`)
3. **Configuration** in `config/paytabs.php` etc.
4. **Routes** registered in `routes/web.php`

### Payment Flow

```
User selects payment method
    ↓
Initialize payment gateway
    ↓
Redirect to gateway (if external)
    ↓
Process payment
    ↓
Return to application
    ↓
Verify transaction
    ↓
Update invoice/transaction status
    ↓
Send confirmation
```

### Configuration

Each gateway requires:
- API keys (public/secret)
- Webhook endpoints
- Currency settings
- Transaction fee configuration

Environment variables format:
```
STRIPE_PUBLIC_KEY=
STRIPE_SECRET_KEY=
PAYPAL_CLIENT_ID=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
[Gateway-specific keys...]
```

### Webhook Handling

Webhooks verify payment status:
```
POST /webhooks/stripe
POST /webhooks/razorpay
POST /webhooks/[gateway-name]
```

Configured in `app/Models/Webhook` and webhook routes.

---

## Testing Framework

### Pest Testing

Pest 3 is the primary testing framework. Tests are organized as:

```
tests/
├── Feature/                # Feature tests
│   ├── Invoice/
│   ├── Product/
│   └── Auth/
├── Unit/                   # Unit tests
│   ├── Services/
│   ├── Models/
│   └── Helpers/
└── TestCase.php            # Base test class
```

### Running Tests

```bash
# Run all tests
php artisan test

# Run specific file
php artisan test tests/Feature/InvoiceTest.php

# Run with filter
php artisan test --filter=InvoiceTest

# Run compact output
php artisan test --compact

# Run with coverage
php artisan test --coverage
```

### Test Structure

```php
<?php

uses(TestCase::class);

describe('Invoice Creation', function () {
    it('creates a valid invoice', function () {
        $customer = Customer::factory()->create();
        $product = Product::factory()->create();
        
        $response = $this->post(route('invoices.store'), [
            'customer_id' => $customer->id,
            'products' => [
                ['product_id' => $product->id, 'quantity' => 2]
            ]
        ]);
        
        $response->assertSuccessful();
        expect(Invoice::count())->toBe(1);
    });
    
    it('fails without required fields', function () {
        $response = $this->post(route('invoices.store'), []);
        $response->assertUnprocessable();
    });
});
```

### Test Factories

Factories generate test data:

```php
Product::factory()
    ->count(10)
    ->create();

Customer::factory()
    ->has(Invoice::factory()->count(3))
    ->create();
```

### Assertions

```php
// HTTP assertions
expect($response)->successful()
    ->ok()
    ->created()
    ->unprocessable();

// Database assertions
expect(Invoice::count())->toBe(1);
expect(Invoice::first())->toHaveProperty('total', 100);

// Collection assertions
expect($invoices)->toHaveCount(5);
```

---

## Code Quality Standards

### Ultracite Preset

Ultracite enforces zero-config code quality standards with:

**Biome** (Core linting & formatting)
- Code formatting
- Linting rules
- Performance checks
- Security checks

**ESLint** (JavaScript/TypeScript)
- React plugin
- React hooks plugin
- Best practices

**Prettier** (Code formatting)
- Consistent formatting
- Tailwind CSS plugin
- Import organization plugin

**TypeScript**
- Type checking
- Strict mode
- Declaration files

### Standards Enforcement

**Before Commit:**
```bash
npm run fix              # Auto-fix issues
npm run types            # Type check
vendor/bin/pint --dirty  # PHP formatting
```

**In CI/CD:**
```bash
npm run check            # Check for issues
composer test            # Run tests
php artisan test         # Run all tests
```

### Key Rules

**React**
- No console.log in production
- No debugger statements
- useEffect dependencies
- No direct DOM manipulation
- Semantic HTML required

**TypeScript**
- Explicit return types
- No implicit any
- Strict null checks
- No unused variables

**PHP**
- PSR-12 coding standard
- Type hints required
- Curly braces always
- No trailing commas in param lists

**Security**
- No dangerouslySetInnerHTML
- No direct eval()
- Validate all inputs
- Sanitize output
- rel="noopener" for target="_blank"

---

## Deployment Guide

### Pre-Deployment Checklist

- [ ] Run tests: `php artisan test`
- [ ] Check code quality: `npm run check`
- [ ] Update dependencies: Check for security updates
- [ ] Run migrations: Test database changes
- [ ] Build frontend: `npm run build`
- [ ] Clear caches: `php artisan config:cache`
- [ ] Run seeders if needed: `php artisan db:seed`

### Deployment Steps

#### 1. Server Preparation
```bash
# SSH into production server
ssh user@server.com

# Clone repository
git clone [repo-url] app
cd app

# Setup environment
cp .env.example .env
# Edit .env with production values
```

#### 2. PHP Setup
```bash
# Install dependencies
composer install --optimize-autoloader --no-dev

# Generate application key
php artisan key:generate

# Generate cache
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

#### 3. Database Setup
```bash
# Run migrations
php artisan migrate --force

# Seed if needed
php artisan db:seed --force
```

#### 4. Frontend Build
```bash
# Install dependencies
npm install --omit=dev

# Build assets
npm run build

# Publish storage
php artisan storage:link
```

#### 5. Web Server Configuration

**Nginx:**
```nginx
server {
    listen 443 ssl http2;
    server_name pharmacy.example.com;
    
    root /var/www/app/public;
    index index.php;
    
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    
    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }
    
    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.4-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }
}
```

**Apache:**
- Ensure `mod_rewrite` is enabled
- `.htaccess` file is included in public directory
- Set proper DocumentRoot to `public/`

#### 6. Environment Variables
```bash
# Set production values in .env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://pharmacy.example.com

# Database
DB_HOST=production-db-host
DB_DATABASE=production_db
DB_USERNAME=db_user
DB_PASSWORD=secure_password

# Mail service
MAIL_DRIVER=smtp
MAIL_HOST=smtp.example.com
MAIL_USERNAME=email@example.com
MAIL_PASSWORD=email_password

# Payment gateways
STRIPE_PUBLIC_KEY=pk_live_xxx
STRIPE_SECRET_KEY=sk_live_xxx
# ... other gateway keys
```

#### 7. Permissions
```bash
# Set proper file permissions
chmod -R 755 storage bootstrap/cache
chmod -R 775 storage bootstrap/cache
chown -R www-data:www-data /var/www/app
```

#### 8. SSL Certificate
```bash
# Install Certbot for Let's Encrypt
sudo apt install certbot python3-certbot-nginx

# Generate certificate
sudo certbot certonly --nginx -d pharmacy.example.com

# Auto-renew
sudo systemctl enable certbot.timer
```

### Production Monitoring

**Laravel Logs:**
```bash
# View logs in real-time
tail -f storage/logs/laravel.log

# Using Laravel Pail
php artisan pail --filter=error
```

**Error Tracking:**
- Configure Sentry/Larabug in `.env`
- Monitor application errors
- Set up alerts

**Performance Monitoring:**
- Monitor database queries
- Check server resources (CPU, memory, disk)
- Monitor response times
- Set up automated backups

### Backup Strategy

```bash
# Daily database backup
0 2 * * * cd /var/www/app && php artisan backup:run

# Weekly full backup to S3
0 3 * * 0 cd /var/www/app && php artisan backup:run --only-to-disk=s3
```

### Update & Maintenance

```bash
# Update dependencies (in maintenance mode)
php artisan down
composer update
npm update
php artisan up

# Clear all caches
php artisan cache:clear
php artisan config:cache
php artisan route:cache
```

---

## Common Commands

### Artisan Commands

```bash
# Server & Cache
php artisan serve                    # Start dev server
php artisan cache:clear              # Clear cache
php artisan config:cache             # Cache config

# Database
php artisan migrate                  # Run migrations
php artisan migrate:fresh            # Reset and migrate
php artisan migrate:fresh --seed     # Reset, migrate, and seed
php artisan db:seed                  # Run seeders
php artisan tinker                   # Interactive shell

# Make Commands
php artisan make:controller Name     # Create controller
php artisan make:model Name          # Create model
php artisan make:migration Name      # Create migration
php artisan make:test Name           # Create test
php artisan make:request Name        # Create form request
php artisan make:resource Name       # Create API resource
php artisan make:command Name        # Create console command

# Testing
php artisan test                     # Run all tests
php artisan test tests/Feature/      # Run specific suite
php artisan test --filter=TestName   # Run specific test

# Development
php artisan tinker                   # Interactive REPL
php artisan storage:link             # Link public storage
php artisan queue:work               # Process queue jobs
php artisan schedule:work            # Run scheduler
```

### npm Commands

```bash
# Development
npm run dev                          # Start dev server
npm run build                        # Build for production
npm run preview                      # Preview production build

# Code Quality
npm run fix                          # Fix code issues (Ultracite)
npm run check                        # Check for issues
npm run types                        # Type check
npm run lint                         # Lint JavaScript
npm run format                       # Format code (Prettier)
npm run format:check                 # Check formatting

# Desktop
npm run electron:dev                 # Dev Electron app
npm run electron:start               # Start dev Electron
npm run electron:build               # Build Electron app

# Other
npm run prepare                      # Setup husky hooks
```

### Useful Aliases

Add to bash profile or create aliases:
```bash
alias artisan="php artisan"
alias tinker="php artisan tinker"
alias migrate="php artisan migrate"
alias test="php artisan test --compact"
alias lint="npm run lint && vendor/bin/pint --dirty"
```

---

## Troubleshooting

### Common Issues

**1. Vite Manifest Error**
```
Illuminate\Foundation\ViteException: Unable to locate file in Vite manifest
```
**Solution:**
```bash
npm run build              # Or
npm run dev               # For development
```

**2. Database Connection Failed**
```
SQLSTATE[HY000] [2002] Connection refused
```
**Solution:**
- Check MySQL is running
- Verify DB credentials in `.env`
- Test connection: `mysql -h 127.0.0.1 -u root -p`

**3. Storage Permission Denied**
```
Warning: mkdir(): Permission denied
```
**Solution:**
```bash
chmod -R 775 storage bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache
```

**4. Node Modules Issues**
```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install
```

**5. PHP Version Mismatch**
```bash
# Check current version
php --version

# Install PHP 8.4.19 if needed
# or adjust version in composer.json
```

---

## Additional Resources

### Documentation Links
- [Laravel Documentation](https://laravel.com/docs)
- [Inertia.js Documentation](https://inertiajs.com)
- [React Documentation](https://react.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com)
- [Spatie Packages](https://spatie.be/open-source)
- [Pest Documentation](https://pestphp.com)

### Learning Resources
- Laravel Best Practices
- React Patterns & Practices
- Database Design Patterns
- API Design Principles
- Testing Strategies

### Team Guidelines
- Follow Ultracite code quality standards
- Write comprehensive tests (80%+ coverage)
- Document complex business logic
- Use clear, descriptive naming
- Keep components focused and reusable
- Review code thoroughly before merging

---

## Support & Contribution

### Getting Help
1. Check documentation first
2. Search existing issues
3. Review error logs
4. Ask in team channels
5. Create detailed bug reports

### Contributing
1. Create feature branch: `git checkout -b feature/name`
2. Make changes following code standards
3. Write tests for new features
4. Run all tests: `php artisan test`
5. Fix code quality: `npm run fix`
6. Commit with clear messages
7. Push and create pull request
8. Wait for review and approval

### Reporting Issues
Include:
- Clear description of issue
- Steps to reproduce
- Expected behavior
- Actual behavior
- Error logs
- System information

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-07-12 | Initial project documentation |
| 0.9.0 | 2025-05-01 | Beta release |
| 0.1.0 | 2025-01-27 | Project kickoff |

---

## License

This project is licensed under the MIT License - see LICENSE file for details.

---

## Project Metadata

- **Repository:** [GitHub URL]
- **Project Manager:** [Contact info]
- **Lead Developer:** [Contact info]
- **Documentation:** This file
- **Last Updated:** July 12, 2026
- **Status:** Active Development
- **PHP Version:** 8.4.19
- **Laravel Version:** 12.0
- **React Version:** 19.0
- **Node Version:** 18+

---

**End of Documentation**

For the latest updates and changes, please refer to the CHANGELOG.md file.
