import type { ReactNode } from 'react';
import { Box, Toolbar } from '@mui/material';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import Footer from './Footer';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#fbfbfd' }}>
      <Navbar />
      <Sidebar />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          minHeight: '100vh',
          bgcolor: '#fbfbfd',
          display: 'flex',
          flexDirection: 'column',
          transition: 'margin 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <Toolbar sx={{ minHeight: '64px !important', height: 64 }} />
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>{children}</Box>
        <Footer />
      </Box>
    </Box>
  );
};

export default Layout;
