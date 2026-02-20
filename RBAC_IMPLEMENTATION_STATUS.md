# RBAC Frontend Implementation Progress

## ✅ Completed

### 1. Type Definitions
- ✅ Created `/src/types/rbac.types.ts` with all RBAC types (Role, Permission, UserWithRoles, etc.)
- ✅ Updated `/src/types/auth.types.ts` to include `has_role`, `roles`, `permissions` in UserInfo

### 2. API Layer
- ✅ Created `/src/api/roleApi.ts` with complete RBAC API functions:
  - Role CRUD (getAllRoles, getRoleById, createRole, updateRole, deleteRole)
  - Permission CRUD (getAllPermissions, createPermission, updatePermission, deletePermission)
  - User-Role Assignment (getAllUsersWithRoles, getUserWithRoles, assignRolesToUser, removeRoleFromUser)

- ✅ Updated `/src/api/authApi.ts` with:
  - Updated login response handling
  - Helper functions: `hasRole()`, `getUserRoles()`, `getUserPermissions()`
  - Role checks: `hasRoleName()`, `hasAnyRole()`, `hasAllRoles()`
  - Permission checks: `hasPermission()`, `hasAnyPermission()`
  - Convenience functions: `isAdmin()`, `isPengembang()`, `isSKPA()`

### 3. Components
- ✅ Updated `/src/components/ProtectedRoute.tsx`:
  - Added role-based access control
  - Added permission-based access control
  - Shows "No Role Assigned" alert if user doesn't have a role
  - Shows "Access Denied" alert if user doesn't have required role/permission

## 🔄 Next Steps (To Be Implemented)

### 4. Admin Pages

#### A. User Role Management Page (`/src/pages/UserRoleManagement.tsx`)
A full-featured page for admin to manage user roles:

**Features**:
- Table display of all users with their roles
- Search and filter users
- Assign/change roles via modal dialog
- Remove roles from users
- Show user status (has role / no role)

**Key Components**:
```typescript
- UserTable with columns: Username, Full Name, Email, Roles, Status, Actions
- AssignRoleModal: Select user and assign roles
- Role chips with different colors
- Actions: Edit Roles, View Details
```

#### B. Role Management Page (`/src/pages/RoleManagement.tsx`)
Manage roles and their permissions:

**Features**:
- List all roles
- Create new role with permissions
- Edit role permissions
- Delete role (with confirmation)
- View role details and associated users

#### C. Permission Management Page (`/src/pages/PermissionManagement.tsx`) [Optional]
For advanced admin configuration:

**Features**:
- List all permissions
- Create new permissions
- Edit permission details
- Delete permissions

### 5. LoginPage Updates (`/src/pages/Login/LoginPage.tsx`)

**Changes Needed**:
```typescript
// After successful login
const response = await login(username, password);

// Check if user has role
if (!response.data.user_info.has_role) {
  // Show alert warning
  alert('Akun Anda belum diberikan role. Silakan hubungi administrator.');
  // Or use MUI Alert/Snackbar for better UX
}

// Store token and user info
storeAuthData(response.data.token, response.data.user_info, rememberMe);
```

### 6. Sidebar Updates (`/src/components/Sidebar.tsx`)

**Conditional Menu Rendering**:
```typescript
import { isAdmin, hasAnyRole, hasPermission } from '../api/authApi';

// Example: Show Admin menu only for Admin role
{isAdmin() && (
  <ListItemButton>
    <ListItemIcon><AdminPanelSettings /></ListItemIcon>
    <ListItemText primary="Role Management" />
  </ListItemButton>
)}

// Example: Show menu for SKPA, Pengembang, or Admin
{hasAnyRole(['SKPA', 'Pengembang', 'Admin']) && (
  <ListItemButton>
    <ListItemIcon><Description /></ListItemIcon>
    <ListItemText primary="PKSI List" />
  </ListItemButton>
)}
```

### 7. App.tsx Route Configuration

**Add RBAC Routes**:
```typescript
import UserRoleManagement from './pages/UserRoleManagement';
import RoleManagement from './pages/RoleManagement';

// Inside Router
<Route
  path="/admin/user-roles"
  element={
    <ProtectedRoute requireRoles={['Admin']}>
      <Layout>
        <UserRoleManagement />
      </Layout>
    </ProtectedRoute>
  }
/>

<Route
  path="/admin/roles"
  element={
    <ProtectedRoute requireRoles={['Admin']}>
      <Layout>
        <RoleManagement />
      </Layout>
    </ProtectedRoute>
  }
/>
```

### 8. Existing Page Protection

**Update Existing Routes with Role Requirements**:

```typescript
// Example: ProgramList - only Pengembang and Admin can edit
<Route
  path="/program"
  element={
    <ProtectedRoute requireRoles={['Pengembang', 'Admin']}>
      <Layout>
        <ProgramList />
      </Layout>
    </ProtectedRoute>
  }
/>

// Example: Monitoring - SKPA can read, Pengembang can edit
<Route
  path="/monitoring"
  element={
    <ProtectedRoute
      requirePermissions={['monitoring.read']}
    >
      <Layout>
        <MonitoringPage />
      </Layout>
    </ProtectedRoute>
  }
/>
```

## 📋 Implementation Priority

1. **HIGH**: UserRoleManagement Page (critical for admin to assign roles)
2. **HIGH**: Update LoginPage to handle has_role flag
3. **MEDIUM**: Update Sidebar to hide/show menu based on roles
4. **MEDIUM**: RoleManagement Page
5. **MEDIUM**: Update existing routes with role requirements
6. **LOW**: PermissionManagement Page

## 🚀 Quick Implementation Guide

### Step 1: Create UserRoleManagement Page

File: `/src/pages/UserRoleManagement.tsx`

This is the most important page. It should:
1. Fetch all users with roles using `getAllUsersWithRoles()`
2. Display in a table
3. Have "Assign Roles" button that opens modal
4. Modal shows list of available roles (from `getAllRoles()`)
5. Submit calls `assignRolesToUser()`

### Step 2: Update LoginPage

File: `/src/pages/Login/LoginPage.tsx`

Add after successful login:
```typescript
// Before navigate
if (!response.data.user_info.has_role) {
  setError('Akun Anda belum diberikan role. Silakan hubungi administrator.');
  return;
}
```

### Step 3: Update Sidebar Menu

File: `/src/components/Sidebar.tsx`

Wrap menu items with role checks:
```typescript
{isAdmin() && (
  <>
    <ListSubheader>Admin</ListSubheader>
    <ListItemButton component={Link} to="/admin/user-roles">
      <ListItemIcon><People /></ListItemIcon>
      <ListItemText primary="User & Roles" />
    </ListItemButton>
  </>
)}
```

### Step 4: Add Routes in App.tsx

Import and add protected routes for admin pages.

## 📚 Usage Examples

### Example 1: Protect Route by Role
```typescript
<ProtectedRoute requireRoles={['Admin']}>
  <AdminPage />
</ProtectedRoute>
```

### Example 2: Protect Route by Permission
```typescript
<ProtectedRoute requirePermissions={['pksi.create']}>
  <AddPksiPage />
</ProtectedRoute>
```

### Example 3: Require Multiple Roles (OR logic)
```typescript
<ProtectedRoute requireRoles={['Admin', 'Pengembang']}>
  <ProgramPage />
</ProtectedRoute>
```

### Example 4: Require Multiple Permissions (AND logic)
```typescript
<ProtectedRoute
  requirePermissions={['pksi.update', 'pksi.delete']}
  requireAll={true}
>
  <DeletePksiButton />
</ProtectedRoute>
```

### Example 5: Conditional Rendering in Component
```typescript
import { isAdmin, hasPermission } from '../api/authApi';

function MyComponent() {
  return (
    <>
      {/* Show to everyone */}
      <ViewButton />

      {/* Only show edit to users with permission */}
      {hasPermission('pksi.update') && <EditButton />}

   {/* Only show delete to Admin */}
      {isAdmin() && <DeleteButton />}
    </>
  );
}
```

## 🔐 Security Note

Frontend role checks are for UX only. Backend MUST also enforce authorization using the `@RequiresRole` and `@RequiresPermission` annotations.

## 📝 Testing Checklist

After full implementation:

- [ ] Admin can access User Role Management page
- [ ] Non-admin cannot access admin pages
- [ ] User without role sees warning message
- [ ] Admin can assign roles to users
- [ ] User gets updated JWT after role assignment
- [ ] Sidebar shows/hides menu based on roles
- [ ] Protected routes work correctly
- [ ] Login prevents access for users without roles

---

## Contact

For questions: Check `RBAC_GUIDE.md` in backend project.
