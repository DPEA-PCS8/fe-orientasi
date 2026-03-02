import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './styles/theme';
import { LoginPage } from './pages';
import Layout from './components/Layout';
import AddPksi from './pages/AddPksi';
import AddProgram from './pages/AddProgram';
import AddInisiatif from './pages/AddInisiatif';
import PksiList from './pages/PksiList';
import PksiDisetujui from './pages/PksiDisetujui';
import RbsiManagementPage from './pages/RbsiManagementPage';
import RbsiArsitekturPage from './pages/RbsiArsitekturPage';
import ProtectedRoute from './components/ProtectedRoute';
import { isAuthenticated } from './api/authApi';
import Profile from './pages/Profile';
import UserRoleManagement from './pages/UserRoleManagement';
import RolePermissions from './pages/RolePermissions';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route 
            path="/login" 
            element={
              isAuthenticated() ? <Navigate to="/" replace /> : <LoginPage />
            } 
          />
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Layout>
                  <PksiList />
                </Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/pksi-disetujui" 
            element={
              <ProtectedRoute>
                <Layout>
                  <PksiDisetujui />
                </Layout>
              </ProtectedRoute>
            } 
          />
          <Route
            path="/rbsi"
            element={
              <ProtectedRoute>
                <Layout>
                  <RbsiManagementPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/rbsi-arsitektur"
            element={
              <ProtectedRoute>
                <Layout>
                  <RbsiArsitekturPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          {/* Redirect old routes to new unified page */}
          <Route path="/program" element={<Navigate to="/rbsi" replace />} />
          <Route path="/monitoring-rbsi" element={<Navigate to="/rbsi" replace />} />
          <Route 
            path="/add-pksi" 
            element={
              <ProtectedRoute>
                <Layout>
                  <AddPksi />
                </Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <Layout>
                  <Profile />
                </Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/add-program" 
            element={
              <ProtectedRoute>
                <Layout>
                  <AddProgram />
                </Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/add-inisiatif" 
            element={
              <ProtectedRoute>
                <Layout>
                  <AddInisiatif />
                </Layout>
              </ProtectedRoute>
            } 
          />
          <Route
            path="/admin/user-roles"
            element={
              <ProtectedRoute requireMenuPermission="USER_MANAGEMENT">
                <Layout>
                  <UserRoleManagement />
                </Layout>
              </ProtectedRoute>
            } 
          />
          <Route
            path="/admin/role-permissions"
            element={
              <ProtectedRoute requireMenuPermission="ROLE_PERMISSIONS">
                <Layout>
                  <RolePermissions />
                </Layout>
              </ProtectedRoute>
            } 
          />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
