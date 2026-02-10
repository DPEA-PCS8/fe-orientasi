import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Box,
  Typography,
} from '@mui/material';
import {
  SettingsRounded,
  HistoryRounded,
  NotificationsRounded,
  MenuBookRounded,
  HelpOutlineRounded,
  DocumentScannerRounded,
  DescriptionRounded,
  LightbulbRounded,
} from '@mui/icons-material';

const DRAWER_WIDTH = 240;

interface MenuItem {
  label: string;
  icon: React.ReactNode;
  href: string;
  active?: boolean;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

const menuSections: MenuSection[] = [
  {
    title: 'Features',
    items: [
      { label: 'PKSI', icon: <DescriptionRounded />, href: '/' },
      { label: 'RBSI', icon: <DocumentScannerRounded />, href: '/rbsi' },
      { label: 'Inisiatif', icon: <LightbulbRounded />, href: '/inisiatif' },
    ],
  },
  {
    title: 'Admin',
    items: [
      { label: 'Settings', icon: <SettingsRounded />, href: '/settings' },
      { label: 'Audit Log', icon: <HistoryRounded />, href: '/audit' },
      { label: 'Notifications', icon: <NotificationsRounded />, href: '/notifications' },
    ],
  },
  {
    title: 'Support',
    items: [
      { label: 'Documentation', icon: <MenuBookRounded />, href: '/docs' },
      { label: 'Help Center', icon: <HelpOutlineRounded />, href: '/support' },
    ],
  },
];

const Sidebar = () => {
  return (
    <Drawer
      variant="permanent"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          bgcolor: '#fbfbfd',
          border: 'none',
          borderRight: '1px solid rgba(0, 0, 0, 0.06)',
        },
      }}
    >
      <Toolbar sx={{ minHeight: '64px !important', height: 64 }} />

      <Box sx={{ overflow: 'auto', px: 1.5, py: 2 }}>
        {menuSections.map((section, sectionIndex) => (
          <Box key={sectionIndex} sx={{ mb: 2.5 }}>
            <Typography
              variant="caption"
              sx={{
                px: 1.5,
                mb: 0.5,
                display: 'block',
                color: '#86868b',
                fontWeight: 600,
                fontSize: '0.6875rem',
                letterSpacing: '0.02em',
                textTransform: 'uppercase',
              }}
            >
              {section.title}
            </Typography>

            <List disablePadding>
              {section.items.map((item, itemIndex) => (
                <ListItem key={itemIndex} disablePadding>
                  <ListItemButton
                    href={item.href}
                    selected={item.active}
                    sx={{
                      borderRadius: '10px',
                      mb: 0.25,
                      py: 0.75,
                      px: 1.5,
                      transition: 'all 0.2s ease',
                      '&.Mui-selected': {
                        bgcolor: 'rgba(218, 37, 28, 0.08)',
                        color: '#DA251C',
                        '&:hover': {
                          bgcolor: 'rgba(218, 37, 28, 0.12)',
                        },
                        '& .MuiListItemIcon-root': {
                          color: '#DA251C',
                        },
                      },
                      '&:hover': {
                        bgcolor: 'rgba(0, 0, 0, 0.04)',
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 32,
                        color: item.active ? '#DA251C' : '#86868b',
                        '& svg': { fontSize: 20 },
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{
                        fontSize: '0.8125rem',
                        fontWeight: item.active ? 600 : 500,
                        letterSpacing: '-0.01em',
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Box>
        ))}
      </Box>

      {/* Footer */}
      <Box
        sx={{
          mt: 'auto',
          p: 2,
          borderTop: '1px solid rgba(0, 0, 0, 0.06)',
        }}
      >
        <Typography
          variant="caption"
          sx={{ color: '#86868b', display: 'block', textAlign: 'center', fontSize: '0.6875rem' }}
        >
          © 2026 OJK Orientasi
        </Typography>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
