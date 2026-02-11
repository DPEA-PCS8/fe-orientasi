import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './styles/theme';
import { LoginPage } from './pages';
import Layout from './components/Layout';
import AddPksi from './pages/AddPksi';
import PksiList from './pages/PksiList';
import PksiDisetujui from './pages/PksiDisetujui';
import RbsiList from './pages/RbsiList';
import ProgramList from './pages/ProgramList';
import ProtectedRoute from './components/ProtectedRoute';
import { isAuthenticated } from './api/authApi';
import Profile from './pages/Profile';

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
                  <RbsiList />
                </Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/program" 
            element={
              <ProtectedRoute>
                <Layout>
                  <ProgramList />
                </Layout>
              </ProtectedRoute>
            } 
          />
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
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
