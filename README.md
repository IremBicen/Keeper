# Döveç Keeper

A comprehensive survey and evaluation management system with role-based access control.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- MongoDB (local or cloud)
- npm or yarn

### Installation

1. **Clone and install:**
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd dovec-keeper-backend
npm install
```

2. **Set up environment:**
Create `dovec-keeper-backend/.env`:
```
MONGO_URI=mongodb://localhost:27017/dovec_keeper
JWT_SECRET=your-secret-key-change-this-in-production
PORT=5000
```

3. **Create admin user:**
```bash
cd dovec-keeper-backend
npm run create-admin
```

4. **Start servers:**
```bash
# Terminal 1 - Backend
cd dovec-keeper-backend
npm run dev

# Terminal 2 - Frontend
npm run dev
```

5. **Access the application:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 📋 Features

- ✅ **Role-Based Access Control** - Admin, Manager, and Employee roles
- ✅ **Survey Management** - Create, edit, delete surveys with assignments
- ✅ **Category & Subcategory Management** - Organize survey questions
- ✅ **Survey Assignment** - Assign to all users, departments, or specific users
- ✅ **Form Filling** - User-friendly survey forms with draft saving
- ✅ **Results Calculation** - Automatic score calculation and aggregation
- ✅ **User Management** - View and manage users (admin only)
- ✅ **Department Filtering** - Managers see only their department data
- ✅ **Excel Export** - Export results to Excel format

## 🏗️ Architecture

- **Frontend**: Next.js 16 (App Router) + TypeScript + React
- **Backend**: Express.js + TypeScript + MongoDB + Mongoose
- **Authentication**: JWT tokens
- **Authorization**: Role-based middleware

## 📁 Project Structure

See [PROJECT_STRUCTURE.md](./docs/PROJECT_STRUCTURE.md) for detailed structure.

## 🔐 Roles & Permissions

### Admin
- Full system control
- Create/edit/delete surveys, categories, subcategories
- View all users and results
- Assign surveys to users/departments

### Manager
- Department-scoped access
- View users/results in their department only
- Fill assigned surveys
- Cannot create/edit surveys

### Employee
- View and fill assigned surveys only
- No administrative rights

## 📚 Documentation

- [Project Structure](./docs/PROJECT_STRUCTURE.md)
- [RBAC Implementation](./docs/RBAC_IMPLEMENTATION.md)
- [Score Calculation](./docs/SCORE_CALCULATION.md)

## 🧪 Testing

Run integration tests:
```bash
node scripts/test-integration.js
```

## 🔧 Development

### Backend Scripts
```bash
cd dovec-keeper-backend
npm run dev          # Start dev server
npm run create-admin # Create admin user
npm run add-department # Add departments to users
npm run seed         # Seed database
```

### Frontend Scripts
```bash
npm run dev    # Start dev server
npm run build  # Build for production
npm run start  # Start production server
```

## 📝 API Documentation

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register

### Surveys
- `GET /api/surveys` - List surveys (filtered by role)
- `POST /api/surveys` - Create survey (admin)
- `PUT /api/surveys/:id` - Update survey (admin)
- `DELETE /api/surveys/:id` - Delete survey (admin)

### Results
- `GET /api/results` - Get calculated results
- `GET /api/results/:employeeId` - Get employee results

See [PROJECT_STRUCTURE.md](./docs/PROJECT_STRUCTURE.md) for full API documentation.

## 🛠️ Tech Stack

**Frontend:**
- Next.js 16
- TypeScript
- React Context API
- Axios
- CSS Modules

**Backend:**
- Node.js
- Express.js
- TypeScript
- MongoDB
- Mongoose
- JWT
- bcrypt

## 📄 License

[Your License Here]

## 👥 Contributing

[Contributing guidelines]
