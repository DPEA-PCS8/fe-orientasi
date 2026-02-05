import type { ReactNode } from 'react';
import { Box, Toolbar } from '@mui/material';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const DRAWER_WIDTH = 240;

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
          width: `calc(100% - ${DRAWER_WIDTH}px)`,
          minHeight: '100vh',
          bgcolor: '#fbfbfd',
        }}
      >
        <Toolbar sx={{ minHeight: '64px !important', height: 64 }} />
        {children}
      </Box>
    </Box>
  );
};

export default Layout;
