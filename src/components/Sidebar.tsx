import { useState, useEffect, useMemo } from 'react';
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
  MonitorHeartRounded,
  AccountTreeRounded,
  SecurityRounded,
  ManageAccountsRounded,
} from '@mui/icons-material';
import { isAdmin, getUserRoles } from '../api/authApi';
import { getMyPermissions } from '../api/rolePermissionApi';
import type { MenuPermissionItem } from '../types/rbac.types';

const DRAWER_WIDTH = 240;

interface MenuItem {
  label: string;
  icon: React.ReactNode;
  href: string;
  menuCode?: string; // Add menu code for permission matching
  active?: boolean;
  subItems?: SubMenuItem[];
}

interface SubMenuItem {
  label: string;
  icon: React.ReactNode;
  href: string;
  menuCode?: string; // Add menu code for permission matching
}

interface MenuSection {
  title: string;
  items: MenuItem[];
  requiresPermission?: boolean; // Whether this section requires permission checks
}

const Sidebar = () => {
  const location = useLocation();
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({ PKSI: true, 'Manajemen RBSI': true });
  const [userPermissions, setUserPermissions] = useState<MenuPermissionItem[]>([]);
  const [permissionsLoaded, setPermissionsLoaded] = useState(false);

  // Load user permissions on mount
  useEffect(() => {
    const loadPermissions = async () => {
      try {
        const roles = getUserRoles();
        if (roles.length > 0) {
          const permissions = await getMyPermissions(roles);
          setUserPermissions(permissions.menu_permissions || []);
        }
      } catch (error) {
        console.warn('Failed to load user permissions:', error);
        // Continue with empty permissions - Admin role or no restriction
      } finally {
        setPermissionsLoaded(true);
      }
    };

    loadPermissions();
  }, []);

  // Check if user has permission to view a menu by its code
  const hasViewPermission = (menuCode?: string): boolean => {
    // Admin always has access
    if (isAdmin()) return true;
    
    // If no menu code specified, allow access
    if (!menuCode) return true;
    
    // If permissions not loaded yet, default to showing menu
    if (!permissionsLoaded) return true;
    
    // Find permission for this menu code
    const permission = userPermissions.find(
      p => p.menu_code.toUpperCase() === menuCode.toUpperCase()
    );
    
    return permission?.can_view ?? false;
  };

  // Filter menu items based on permissions
  const filterMenuItems = (items: MenuItem[]): MenuItem[] => {
    return items
      .map(item => {
        // First filter subItems based on their permissions
        const filteredSubItems = item.subItems?.filter(sub => hasViewPermission(sub.menuCode));
        return {
          ...item,
          subItems: filteredSubItems,
        };
      })
      .filter(item => {
        // Show item if:
        // 1. It has no subItems and has direct permission, OR
        // 2. It has subItems and at least one subItem has permission, OR
        // 3. Parent has permission (for items with subItems where parent has direct access)
        if (item.subItems && item.subItems.length > 0) {
          // Has visible children - show the parent
          return true;
        }
        if (item.subItems && item.subItems.length === 0) {
          // Had subItems but all filtered out - hide the parent
          return false;
        }
        // No subItems - check direct permission
        return hasViewPermission(item.menuCode);
      });
  };

  // Build menu sections dynamically based on user roles and permissions
  const allMenuSections: MenuSection[] = useMemo(() => [
    {
      title: 'Features',
      requiresPermission: true,
      items: [
        {
          label: 'Manajemen RBSI',
          icon: <LightbulbRounded />,
          href: '/rbsi',
          menuCode: 'RBSI',
          subItems: [
            { label: 'RBSI Monitoring', icon: <MonitorHeartRounded />, href: '/rbsi', menuCode: 'RBSI_MONITORING' },
            { label: 'RBSI Arsitektur', icon: <AccountTreeRounded />, href: '/rbsi-arsitektur', menuCode: 'RBSI_ARCHITECTURE' },
          ],
        },
        {
          label: 'PKSI',
          icon: <DescriptionRounded />,
          href: '/',
          menuCode: 'PKSI',
          subItems: [
            { label: 'Semua PKSI', icon: <ListAltRounded />, href: '/', menuCode: 'PKSI_ALL' },
            { label: 'PKSI Disetujui', icon: <CheckCircleRounded />, href: '/pksi-disetujui', menuCode: 'PKSI_APPROVED' },
          ],
        },
      ],
    },
    // Admin section - shown based on permissions (not just Admin role)
    {
      title: 'Admin',
      requiresPermission: true, // Filter based on actual permissions
      items: [
        {
          label: 'User & Roles',
          icon: <PeopleRounded />,
          href: '/admin/user-roles',
          menuCode: 'USER_ROLES',
          subItems: [
            { label: 'User Management', icon: <ManageAccountsRounded />, href: '/admin/user-roles', menuCode: 'USER_MANAGEMENT' },
            { label: 'Role Permissions', icon: <SecurityRounded />, href: '/admin/role-permissions', menuCode: 'ROLE_PERMISSIONS' },
          ],
        },
        { label: 'Settings', icon: <SettingsRounded />, href: '/settings', menuCode: 'SETTINGS' },
        { label: 'Audit Log', icon: <HistoryRounded />, href: '/audit', menuCode: 'AUDIT_LOG' },
        { label: 'Notifications', icon: <NotificationsRounded />, href: '/notifications', menuCode: 'NOTIFICATIONS' },
      ],
    },
    {
      title: 'Support',
      requiresPermission: false, // Support section always visible
      items: [
        { label: 'Documentation', icon: <MenuBookRounded />, href: '/docs' },
        { label: 'Help Center', icon: <HelpOutlineRounded />, href: '/support' },
      ],
    },
  ], []);

  // Apply permission filtering to menu sections
  const menuSections: MenuSection[] = useMemo(() => {
    return allMenuSections.map(section => ({
      ...section,
      items: section.requiresPermission ? filterMenuItems(section.items) : section.items,
    })).filter(section => section.items.length > 0);
  }, [allMenuSections, userPermissions, permissionsLoaded]);

  const isActive = (href: string) => {
    if (href === '/' && location.pathname === '/') {
      return true;
    }
    if (href !== '/') {
      // Exact match or match with trailing slash/path
      return location.pathname === href || location.pathname.startsWith(href + '/');
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
