# Döveç Keeper - Project Structure

## 📁 Project Overview

Döveç Keeper is a comprehensive survey and evaluation management system with role-based access control (RBAC).

## 🏗️ Architecture

### Frontend (Next.js 16)
- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Styling**: CSS Modules + Global CSS
- **State Management**: React Context API
- **API Client**: Axios with interceptors

### Backend (Node.js + Express)
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **Authorization**: Role-based middleware

## 📂 Directory Structure

```
dovec-keeper/
├── app/                          # Next.js frontend application
│   ├── components/              # Reusable UI components
│   │   ├── buttons.css         # Button styles
│   │   ├── darkMode.css        # Dark mode theme
│   │   ├── table.css           # Table styles
│   │   ├── deleteConfirmation/ # Delete confirmation modal
│   │   ├── notification/       # Notification component
│   │   ├── OfflineAlert/       # Offline status alert
│   │   └── sidebar/            # Navigation sidebar
│   │
│   ├── context/                 # React contexts
│   │   └── UserContext.tsx     # User authentication context
│   │
│   ├── form/                    # Survey form pages
│   │   ├── page.tsx            # Form route handler
│   │   ├── surveyForm.tsx      # Main survey form component
│   │   └── surveyForm.css      # Form styles
│   │
│   ├── login/                   # Authentication
│   │   ├── page.tsx            # Login page
│   │   └── login.css           # Login styles
│   │
│   ├── results/                 # Results display
│   │   ├── page.tsx            # Results page
│   │   └── results.css         # Results styles
│   │
│   ├── surveys/                 # Survey management
│   │   ├── page.tsx            # Surveys list page
│   │   ├── surveys.css         # Surveys styles
│   │   ├── categories/         # Category management
│   │   ├── subcategories/     # Subcategory management
│   │   ├── newSurveyForm/      # Create survey form
│   │   ├── editSurveyForm/     # Edit survey form
│   │   └── surveyPreview/      # Survey preview modal
│   │
│   ├── types/                   # TypeScript type definitions
│   │   ├── category.ts         # Category types
│   │   ├── employee.ts         # Employee/Result types
│   │   ├── response.ts          # Response types
│   │   ├── subcategory.ts      # Subcategory types
│   │   └── survey.ts           # Survey types
│   │
│   ├── users/                   # User management
│   │   ├── page.tsx            # Users list page
│   │   ├── users.css           # Users styles
│   │   └── specificEmployeeDetailsForm/ # Employee details
│   │
│   ├── utils/                   # Utility functions
│   │   └── api.ts              # Axios API client
│   │
│   ├── Dashboard.css           # Dashboard styles
│   ├── globals.css             # Global styles
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Home/Dashboard page
│
├── dovec-keeper-backend/        # Express backend
│   ├── src/
│   │   ├── config/              # Configuration
│   │   │   └── db.ts           # MongoDB connection
│   │   │
│   │   ├── middleware/          # Express middleware
│   │   │   └── auth.ts         # JWT authentication & authorization
│   │   │
│   │   ├── models/              # Mongoose models
│   │   │   ├── Category.ts     # Category model
│   │   │   ├── Response.ts     # Response model
│   │   │   ├── Subcategory.ts  # Subcategory model
│   │   │   ├── Survey.ts       # Survey model
│   │   │   └── User.ts         # User model
│   │   │
│   │   ├── routes/              # API routes
│   │   │   ├── auth.ts         # Authentication routes
│   │   │   ├── categories.ts   # Category CRUD
│   │   │   ├── responses.ts    # Response submission
│   │   │   ├── results.ts      # Results calculation
│   │   │   ├── subcategories.ts # Subcategory CRUD
│   │   │   ├── surveys.ts      # Survey CRUD
│   │   │   └── users.ts        # User management
│   │   │
│   │   ├── utils/               # Utility functions
│   │   │   └── surveyAccess.ts # Survey access control logic
│   │   │
│   │   ├── addDepartmentToUsers.ts # Migration script
│   │   ├── createAdmin.ts      # Admin creation script
│   │   ├── index.ts            # Server entry point
│   │   └── seed.ts             # Database seeding script
│   │
│   ├── scripts/                 # Utility scripts
│   │   └── check-responses.ts  # Response checking script
│   │
│   ├── package.json
│   └── tsconfig.json
│
├── docs/                        # Documentation
│   ├── ADD_DEPARTMENT_TO_USERS.md
│   ├── PROJECT_STRUCTURE.md    # This file
│   ├── RBAC_IMPLEMENTATION.md  # RBAC documentation
│   └── SCORE_CALCULATION.md    # Score calculation logic
│
├── scripts/                     # Development scripts
│   ├── add-dummy-data.js        # Add test data
│   ├── add-responses-only.js   # Add responses only
│   ├── check-admin-responses.js # Check admin data
│   ├── check-data.js           # Check database data
│   ├── check-mongodb-collections.js # MongoDB diagnostics
│   ├── check-mongodb-direct.js  # Direct MongoDB check
│   ├── check-responses-collection.js # Response diagnostics
│   ├── debug-score-calculation.js # Score calculation debug
│   ├── dummy-data.json         # Dummy data template
│   └── test-integration.js     # Integration tests
│
├── public/                      # Static assets
├── .gitignore
├── README.md
├── package.json
└── tsconfig.json
```

## 🔐 Role-Based Access Control

### Admin
- Full system access
- Create/edit/delete surveys, categories, subcategories
- View all users and results
- Assign surveys to users/departments

### Manager
- Department-scoped access
- View users and results in their department only
- Fill out assigned surveys
- Cannot create/edit surveys or categories

### Employee (User)
- Limited access
- View and fill assigned surveys only
- No administrative rights

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local or cloud)
- npm or yarn

### Installation

1. **Install frontend dependencies:**
```bash
npm install
```

2. **Install backend dependencies:**
```bash
cd dovec-keeper-backend
npm install
```

3. **Set up environment variables:**
- Create `.env` in `dovec-keeper-backend/`:
```
MONGO_URI=mongodb://localhost:27017/dovec_keeper
JWT_SECRET=your-secret-key-here
PORT=5000
```

4. **Create admin user:**
```bash
cd dovec-keeper-backend
npm run create-admin
```

5. **Start development servers:**
```bash
# Terminal 1 - Backend
cd dovec-keeper-backend
npm run dev

# Terminal 2 - Frontend
npm run dev
```

## 📝 Key Features

- ✅ Role-based access control (Admin, Manager, Employee)
- ✅ Survey creation and management
- ✅ Category and subcategory management
- ✅ Survey assignment (all users, departments, specific users)
- ✅ Survey form with draft saving
- ✅ Results calculation and display
- ✅ User management
- ✅ Department-based filtering for managers
- ✅ Excel export for results

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Surveys
- `GET /api/surveys` - Get surveys (filtered by role/assignments)
- `GET /api/surveys/:id` - Get single survey
- `POST /api/surveys` - Create survey (admin only)
- `PUT /api/surveys/:id` - Update survey (admin only)
- `DELETE /api/surveys/:id` - Delete survey (admin only)

### Categories
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create category (admin only)
- `PUT /api/categories/:id` - Update category (admin only)
- `DELETE /api/categories/:id` - Delete category (admin only)

### Subcategories
- `GET /api/subcategories` - Get all subcategories
- `POST /api/subcategories` - Create subcategory (admin only)
- `PUT /api/subcategories/:id` - Update subcategory (admin only)
- `DELETE /api/subcategories/:id` - Delete subcategory (admin only)

### Users
- `GET /api/users` - Get users (admin: all, manager: department only)
- `GET /api/users/:id` - Get single user
- `PUT /api/users/:id` - Update user (admin only)

### Responses
- `POST /api/responses/submit` - Submit survey response
- `GET /api/responses` - Get all responses

### Results
- `GET /api/results` - Get calculated results (filtered by role)
- `GET /api/results/:employeeId` - Get results for specific employee

## 📚 Documentation

- [RBAC Implementation](./docs/RBAC_IMPLEMENTATION.md) - Role-based access control details
- [Score Calculation](./docs/SCORE_CALCULATION.md) - How scores are calculated
- [Add Department to Users](./docs/ADD_DEPARTMENT_TO_USERS.md) - Migration guide

## 🧪 Testing

Run integration tests:
```bash
node scripts/test-integration.js
```

## 📦 Scripts

### Development Scripts
- `npm run dev` - Start frontend dev server
- `cd dovec-keeper-backend && npm run dev` - Start backend dev server
- `npm run build` - Build for production

### Backend Scripts
- `npm run create-admin` - Create admin user
- `npm run add-department` - Add department to existing users
- `npm run seed` - Seed database with sample data

## 🔒 Security

- JWT-based authentication
- Password hashing with bcrypt
- Role-based authorization middleware
- Department-based data filtering
- Input validation on all routes

## 🎨 Styling

- Consistent design system
- Dark mode support (via darkMode.css)
- Responsive layouts
- Modern UI components

## 📄 License

[Your License Here]

