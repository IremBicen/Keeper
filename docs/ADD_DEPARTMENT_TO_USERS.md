# Adding Department Field to Existing Users

## Overview

This guide explains how to add the `department` field to existing users in your MongoDB database.

## Quick Start

### Option 1: Run the Script (Recommended)

```bash
cd dovec-keeper-backend
npm run add-department
```

This script will:
- Find all users without a department field
- Add a department based on their role (or default)
- Show you all users with their departments

### Option 2: Manual MongoDB Update

If you prefer to update manually using MongoDB Compass or mongosh:

```javascript
// Connect to your database
use dovec_keeper

// Add default department to all users without one
db.users.updateMany(
  { 
    $or: [
      { department: { $exists: false } },
      { department: null },
      { department: "" }
    ]
  },
  { 
    $set: { department: "General" } 
  }
)

// Or set department based on role
db.users.updateMany(
  { role: "admin", department: { $exists: false } },
  { $set: { department: "Administration" } }
)

db.users.updateMany(
  { role: "manager", department: { $exists: false } },
  { $set: { department: "Management" } }
)

db.users.updateMany(
  { role: "employee", department: { $exists: false } },
  { $set: { department: "Operations" } }
)
```

### Option 3: Update Specific Users

To update specific users with custom departments:

```javascript
// Update a specific user by email
db.users.updateOne(
  { email: "user@example.com" },
  { $set: { department: "Engineering" } }
)

// Update a specific user by ID
db.users.updateOne(
  { _id: ObjectId("your-user-id") },
  { $set: { department: "Marketing" } }
)
```

## Customizing the Script

Edit `dovec-keeper-backend/src/addDepartmentToUsers.ts` to customize:

1. **Default Department**: Change `defaultDepartment` variable
2. **Role-based Departments**: Modify `departmentByRole` object
3. **Custom Logic**: Add your own logic to assign departments

Example:
```typescript
// Set department based on email domain
if (user.email.includes("@engineering.")) {
  department = "Engineering";
} else if (user.email.includes("@sales.")) {
  department = "Sales";
}
```

## Verify the Update

After running the script, verify in MongoDB:

```javascript
// Check all users with departments
db.users.find({}, { name: 1, email: 1, role: 1, department: 1 })

// Count users by department
db.users.aggregate([
  { $group: { _id: "$department", count: { $sum: 1 } } }
])
```

## Using the API

You can also update departments via the API:

```bash
# Update user department (Admin only)
curl -X PUT http://localhost:5000/api/users/:userId \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"department": "Engineering"}'
```

## Notes

- The department field is **optional** - existing code handles `null` or missing departments
- Users without department will show "N/A" in the frontend
- The script is safe to run multiple times (won't duplicate data)
- Make sure your backend server is **stopped** when running the script to avoid conflicts

