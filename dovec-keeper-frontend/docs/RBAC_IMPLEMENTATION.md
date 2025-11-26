# Role-Based Access Control (RBAC) Implementation

## Overview
This document describes the RBAC system implementation with three roles: Admin, Manager, and User.

## Roles and Permissions

### 1. Admin
- ✅ Full control of the system
- ✅ Can create, edit, and delete surveys (forms)
- ✅ Can create, edit, and delete categories and subcategories
- ✅ Can see all users (regardless of department)
- ✅ Can see all user results
- ✅ Can assign forms to:
  - All users
  - Only administrators
  - Only users
  - A specific department
  - Specific individuals
- ✅ Can manage all system settings

### 2. Manager
- ✅ Cannot create, delete, or edit forms
- ✅ Cannot create categories or subcategories
- ✅ Can only see users in their own department
- ✅ Can only see results for users in their own department
- ✅ Can fill out assigned forms
- ⏳ (Optional) Can propose forms to users in their own department (pending admin approval)

### 3. User (Employee)
- ✅ Can only see forms assigned to them
- ✅ Can fill out forms
- ✅ No administrative rights (no user management, categories, or form creation)

## Backend Implementation

### 1. Survey Model Updates
**File:** `dovec-keeper-backend/src/models/Survey.ts`

Added assignment fields:
- `assignmentType`: "all" | "admins" | "users" | "department" | "specific"
- `assignedDepartments`: Array of department names
- `assignedUsers`: Array of user IDs
- `assignedRoles`: Array of roles

### 2. Survey Access Utility
**File:** `dovec-keeper-backend/src/utils/surveyAccess.ts`

Created helper functions:
- `canUserAccessSurvey()`: Checks if a user can access a specific survey
- `buildSurveyQuery()`: Builds MongoDB query based on user role and assignments

### 3. Routes Updated

#### Surveys (`/api/surveys`)
- ✅ GET: Filters surveys based on role and assignments
- ✅ POST: Admin only
- ✅ PUT: Admin only
- ✅ DELETE: Admin only

#### Users (`/api/users`)
- ✅ GET: Admin sees all, Manager sees only their department
- ✅ GET /:id: Access control based on role
- ✅ PUT: Admin only

#### Categories (`/api/categories`)
- ✅ GET: All authenticated users can view
- ✅ POST/PUT/DELETE: Admin only

#### Subcategories (`/api/subcategories`)
- ✅ GET: All authenticated users can view
- ✅ POST/PUT/DELETE: Admin only

#### Results (`/api/results`)
- ✅ GET: Admin sees all, Manager sees only their department
- ✅ GET /:employeeId: Access control based on role

## Frontend Implementation

### 1. Surveys Page
**File:** `app/surveys/page.tsx`
- ✅ "New Survey" button only visible to admins
- ✅ "Edit" and "Delete" buttons only visible to admins
- ✅ Surveys automatically filtered by backend based on assignments

### 2. Users Page
**File:** `app/users/page.tsx`
- ✅ Backend automatically filters users by department for managers
- ✅ Error handling for access denied scenarios

### 3. Results Page
**File:** `app/results/page.tsx`
- ✅ Backend automatically filters results by department for managers

## Pending Implementation

### Assignment UI in Survey Forms
**Files to Update:**
- `app/surveys/newSurveyForm/NewSurveyForm.tsx`
- `app/surveys/editSurveyForm/EditSurveyForm.tsx`

**Required Features:**
1. Assignment type selector (radio buttons or dropdown):
   - All users
   - Only administrators
   - Only users
   - Specific department(s)
   - Specific individual(s)

2. Department selector (multi-select):
   - Only shown when "Specific department" is selected
   - Fetch departments from users list

3. User selector (multi-select):
   - Only shown when "Specific individuals" is selected
   - Fetch all users (admin only)

4. Include assignment data in survey save/update payload

## Testing Checklist

- [ ] Admin can create/edit/delete surveys
- [ ] Admin can see all users and results
- [ ] Manager cannot create/edit/delete surveys
- [ ] Manager can only see users in their department
- [ ] Manager can only see results in their department
- [ ] User can only see assigned surveys
- [ ] User cannot access admin features
- [ ] Survey assignments work correctly:
  - [ ] "All users" - everyone can see
  - [ ] "Only administrators" - only admins can see
  - [ ] "Only users" - managers and employees can see
  - [ ] "Specific department" - only users in that department can see
  - [ ] "Specific individuals" - only selected users can see

## Migration Notes

Existing surveys will default to `assignmentType: "all"`, meaning all users can access them. To restrict access, update surveys through the admin panel.

## Next Steps

1. Add assignment UI to survey creation/edit forms
2. Add department management (if needed)
3. Implement manager proposal feature (optional)
4. Add comprehensive error messages for access denied scenarios
5. Add unit tests for access control logic

