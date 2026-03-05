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
import SmartLanding from './components/SmartLanding';
import { isAuthenticated } from './api/authApi';
import Profile from './pages/Profile';
import UserRoleManagement from './pages/UserRoleManagement';
import RolePermissions from './pages/RolePermissions';
import SkpaPage from './pages/SkpaPage';
import BidangPage from './pages/BidangPage';
import AplikasiListPage from './pages/AplikasiListPage';
import AplikasiDetailPage from './pages/AplikasiDetailPage';
import AplikasiFormPage from './pages/AplikasiFormPage';

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
          {/* Smart landing page - redirects based on user permissions */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <SmartLanding />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/pksi-list" 
            element={
              <ProtectedRoute requireMenuPermission="PKSI_ALL">
                <Layout>
                  <PksiList />
                </Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/pksi-disetujui" 
            element={
              <ProtectedRoute requireMenuPermission="PKSI_APPROVED">
                <Layout>
                  <PksiDisetujui />
                </Layout>
              </ProtectedRoute>
            } 
          />
          <Route
            path="/rbsi"
            element={
              <ProtectedRoute requireMenuPermission="RBSI_MONITORING">
                <Layout>
                  <RbsiManagementPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/rbsi-arsitektur"
            element={
              <ProtectedRoute requireMenuPermission="RBSI_ARCHITECTURE">
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
              <ProtectedRoute requireMenuPermission="PKSI_ALL">
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
              <ProtectedRoute requireMenuPermission="RBSI_MONITORING">
                <Layout>
                  <AddProgram />
                </Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/add-inisiatif" 
            element={
              <ProtectedRoute requireMenuPermission="RBSI_MONITORING">
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
        <Route
          path="/skpa"
          element={
            <ProtectedRoute requireMenuPermission='SKPA'>
              <Layout>
                <SkpaPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/bidang"
          element={
            <ProtectedRoute requireMenuPermission='BIDANG'>
              <Layout>
                <BidangPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        {/* Aplikasi Routes */}
        <Route
          path="/aplikasi"
          element={
            <ProtectedRoute requireMenuPermission='APLIKASI'>
              <Layout>
                <AplikasiListPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/aplikasi/:id"
          element={
            <ProtectedRoute requireMenuPermission='APLIKASI'>
              <Layout>
                <AplikasiDetailPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/aplikasi/tambah"
          element={
            <ProtectedRoute requireMenuPermission='APLIKASI'>
              <Layout>
                <AplikasiFormPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/aplikasi/edit/:id"
          element={
            <ProtectedRoute requireMenuPermission='APLIKASI'>
              <Layout>
                <AplikasiFormPage />
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
