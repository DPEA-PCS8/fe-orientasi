import { useState } from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
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
  Collapse,
} from '@mui/material';
import {
  SettingsRounded,
  HistoryRounded,
  NotificationsRounded,
  MenuBookRounded,
  HelpOutlineRounded,
  DescriptionRounded,
  LightbulbRounded,
  ExpandLess,
  ExpandMore,
  CheckCircleRounded,
  ListAltRounded,
  PeopleRounded,
} from '@mui/icons-material';
import { isAdmin } from '../api/authApi';

const DRAWER_WIDTH = 240;

interface MenuItem {
  label: string;
  icon: React.ReactNode;
  href: string;
  active?: boolean;
  subItems?: SubMenuItem[];
}

interface SubMenuItem {
  label: string;
  icon: React.ReactNode;
  href: string;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

const Sidebar = () => {
  const location = useLocation();
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({ PKSI: true });

  // Build menu sections dynamically based on user roles
  const menuSections: MenuSection[] = [
    {
      title: 'Features',
      items: [
        { label: 'RBSI', icon: <LightbulbRounded />, href: '/program' },
        {
          label: 'PKSI',
          icon: <DescriptionRounded />,
          href: '/',
          subItems: [
            { label: 'Semua PKSI', icon: <ListAltRounded />, href: '/' },
            { label: 'PKSI Disetujui', icon: <CheckCircleRounded />, href: '/pksi-disetujui' },
          ],
        },
      ],
    },
    // Admin section - only shown to admin users
    ...(isAdmin() ? [{
      title: 'Admin',
      items: [
        { label: 'User & Roles', icon: <PeopleRounded />, href: '/admin/user-roles' },
        { label: 'Settings', icon: <SettingsRounded />, href: '/settings' },
        { label: 'Audit Log', icon: <HistoryRounded />, href: '/audit' },
        { label: 'Notifications', icon: <NotificationsRounded />, href: '/notifications' },
      ],
    }] : []),
    {
      title: 'Support',
      items: [
        { label: 'Documentation', icon: <MenuBookRounded />, href: '/docs' },
        { label: 'Help Center', icon: <HelpOutlineRounded />, href: '/support' },
      ],
    },
  ];

  const isActive = (href: string) => {
    if (href === '/' && location.pathname === '/') {
      return true;
    }
    if (href !== '/' && location.pathname.startsWith(href)) {
      return true;
    }
    return false;
  };

  const isParentActive = (item: MenuItem) => {
    if (item.subItems) {
      return item.subItems.some(subItem => isActive(subItem.href));
    }
    return isActive(item.href);
  };

  const handleMenuToggle = (label: string) => {
    setOpenMenus(prev => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

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
              {section.items.map((item, itemIndex) => {
                const active = item.subItems ? isParentActive(item) : isActive(item.href);
                const hasSubItems = item.subItems && item.subItems.length > 0;
                const isOpen = openMenus[item.label] ?? false;
                
                return (
                  <Box key={itemIndex}>
                    <ListItem disablePadding>
                      <ListItemButton
                        onClick={hasSubItems ? () => handleMenuToggle(item.label) : undefined}
                        component={hasSubItems ? 'div' : RouterLink}
                        to={hasSubItems ? undefined : item.href}
                        selected={active && !hasSubItems}
                        sx={{
                          borderRadius: '12px',
                          mb: 0.5,
                          py: 1,
                          px: 1.5,
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          position: 'relative',
                          '&.Mui-selected': {
                            background: 'linear-gradient(135deg, rgba(218, 37, 28, 0.15) 0%, rgba(255, 77, 69, 0.08) 100%)',
                            backdropFilter: 'blur(10px)',
                            color: '#DA251C',
                            border: '1px solid rgba(218, 37, 28, 0.2)',
                            boxShadow: '0 4px 20px rgba(218, 37, 28, 0.12)',
                            '&:hover': {
                              background: 'linear-gradient(135deg, rgba(218, 37, 28, 0.2) 0%, rgba(255, 77, 69, 0.12) 100%)',
                              boxShadow: '0 6px 28px rgba(218, 37, 28, 0.16)',
                            },
                            '& .MuiListItemIcon-root': {
                              color: '#DA251C',
                            },
                          },
                          '&:hover': {
                            bgcolor: 'rgba(0, 0, 0, 0.04)',
                            transform: 'translateX(2px)',
                          },
                          ...(hasSubItems && active && {
                            color: '#DA251C',
                            '& .MuiListItemIcon-root': {
                              color: '#DA251C',
                            },
                          }),
                        }}
                      >
                        <ListItemIcon
                          sx={{
                            minWidth: 32,
                            color: active ? '#DA251C' : '#86868b',
                            '& svg': { fontSize: 20 },
                          }}
                        >
                          {item.icon}
                        </ListItemIcon>
                        <ListItemText
                          primary={item.label}
                          primaryTypographyProps={{
                            fontSize: '0.8125rem',
                            fontWeight: active ? 600 : 500,
                            letterSpacing: '-0.01em',
                          }}
                        />
                        {hasSubItems && (
                          isOpen ? <ExpandLess sx={{ fontSize: 20, color: '#86868b' }} /> : <ExpandMore sx={{ fontSize: 20, color: '#86868b' }} />
                        )}
                      </ListItemButton>
                    </ListItem>

                    {/* SubItems */}
                    {hasSubItems && (
                      <Collapse in={isOpen} timeout="auto" unmountOnExit>
                        <List component="div" disablePadding>
                          {item.subItems!.map((subItem, subIndex) => {
                            const subActive = isActive(subItem.href);
                            return (
                              <ListItem key={subIndex} disablePadding>
                                <ListItemButton
                                  component={RouterLink}
                                  to={subItem.href}
                                  selected={subActive}
                                  sx={{
                                    borderRadius: '10px',
                                    mb: 0.25,
                                    py: 0.75,
                                    pl: 5,
                                    pr: 1.5,
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
                                      minWidth: 28,
                                      color: subActive ? '#DA251C' : '#86868b',
                                      '& svg': { fontSize: 16 },
                                    }}
                                  >
                                    {subItem.icon}
                                  </ListItemIcon>
                                  <ListItemText
                                    primary={subItem.label}
                                    primaryTypographyProps={{
                                      fontSize: '0.75rem',
                                      fontWeight: subActive ? 600 : 500,
                                      letterSpacing: '-0.01em',
                                    }}
                                  />
                                </ListItemButton>
                              </ListItem>
                            );
                          })}
                        </List>
                      </Collapse>
                    )}
                  </Box>
                );
              })}
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
