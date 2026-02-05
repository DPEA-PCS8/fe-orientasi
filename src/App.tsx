import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './styles/theme';
import { LoginPage } from './pages';
import Layout from './components/Layout';
import UserList from './pages/UserList';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={
            <Layout
              pageTitle="User Management"
              pageDescription="Kelola data pengguna yang terdaftar dalam sistem"
              breadcrumbs={[{ label: 'User Management' }]}
            >
              <UserList />
            </Layout>
          } />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
