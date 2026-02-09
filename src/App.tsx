import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './styles/theme';
import { LoginPage } from './pages';
import Layout from './components/Layout';
import UserList from './pages/UserList';
import AddPksi from './pages/AddPksi';
import PksiList from './pages/PksiList';
import RbsiList from './pages/RbsiList';
import ProtectedRoute from './components/ProtectedRoute';
import { isAuthenticated } from './api/authApi';

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
            path="/add-pksi" 
            element={
              <ProtectedRoute>
                <Layout>
                  <AddPksi />
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
