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
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
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
  AppsRounded,
  ChevronLeftRounded,
  ChevronRightRounded,
} from '@mui/icons-material';
import { isAdmin, getUserRoles } from '../api/authApi';
import { getMyPermissions } from '../api/rolePermissionApi';
import type { MenuPermissionItem } from '../types/rbac.types';

const DRAWER_WIDTH = 240;
const DRAWER_WIDTH_COLLAPSED = 64;

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
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({ 
    PKSI: true, 
    'Manajemen RBSI': true,
    'Master Data': true,
    'User & Roles': true,
  });
  const [userPermissions, setUserPermissions] = useState<MenuPermissionItem[]>([]);
  const [permissionsLoaded, setPermissionsLoaded] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [activeDropdownMenu, setActiveDropdownMenu] = useState<MenuItem | null>(null);

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
    
    // Find direct permission for this menu code
    const permission = userPermissions.find(
      p => p.menu_code.toUpperCase() === menuCode.toUpperCase()
    );
    
    // If direct permission found, use it
    if (permission?.can_view) return true;
    
    // Check if any child menu has permission (for parent menus)
    const childHasPermission = userPermissions.some(
      p => p.menu_code.toUpperCase().startsWith(menuCode.toUpperCase() + '_') && p.can_view
    );
    if (childHasPermission) return true;
    
    // If not found and this is a child menu, check parent menu permission
    const menuCodeParts = menuCode.split('_');
    if (menuCodeParts.length > 1) {
      const parentCode = menuCodeParts[0];
      const parentPermission = userPermissions.find(
        p => p.menu_code.toUpperCase() === parentCode.toUpperCase()
      );
      return parentPermission?.can_view ?? false;
    }
    
    return false;
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
        // Check if parent has direct permission
        const parentHasPermission = hasViewPermission(item.menuCode);
        
        // Has visible children - show the parent
        if (item.subItems && item.subItems.length > 0) {
          return true;
        }
        
        // Originally had subItems but all filtered out - show only if parent has direct permission
        if (item.subItems !== undefined && item.subItems.length === 0) {
          return parentHasPermission;
        }
        
        // No subItems - check direct permission
        return parentHasPermission;
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
          href: '/pksi-list',
          menuCode: 'PKSI',
          subItems: [
            { label: 'Semua PKSI', icon: <ListAltRounded />, href: '/pksi-list', menuCode: 'PKSI_ALL' },
            { label: 'PKSI Disetujui', icon: <CheckCircleRounded />, href: '/pksi-disetujui', menuCode: 'PKSI_APPROVED' },
          ],
        },
        {
          label: 'Aplikasi',
          icon: <AppsRounded />,
          href: '/aplikasi',
          menuCode: 'APLIKASI',
          subItems: [
            { label: 'Daftar Aplikasi', icon: <AppsRounded />, href: '/aplikasi', menuCode: 'APLIKASI' },
            { label: 'Historis Aplikasi', icon: <HistoryRounded />, href: '/historis-aplikasi', menuCode: 'HISTORIS_APLIKASI' },
          ],
        },
        {
          label: 'FS2',
          icon: <DescriptionRounded />,
          href: '/fs2-list',
          menuCode: 'FS2',
          subItems: [
            { label: 'Semua F.S.2', icon: <ListAltRounded />, href: '/fs2-list', menuCode: 'FS2_ALL' },
            { label: 'F.S.2 Disetujui', icon: <CheckCircleRounded />, href: '/fs2-disetujui', menuCode: 'FS2_APPROVED' },
          ],
        },
        {
          label: 'Master Data',
          icon: <PeopleRounded />,
          href: '/master-data',
          menuCode: 'MASTER_DATA',
          subItems: [
            { label: 'SKPA', icon: <ListAltRounded />, href: '/skpa', menuCode: 'SKPA' },
            { label: 'Bidang', icon: <ListAltRounded />, href: '/bidang', menuCode: 'BIDANG' },
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
    if (!isCollapsed) {
      setOpenMenus(prev => ({
        ...prev,
        [label]: !prev[label],
      }));
    }
  };

  const handleSidebarToggle = () => {
    setIsCollapsed(prev => !prev);
    // Close all menus when collapsing
    if (!isCollapsed) {
      setOpenMenus({});
    }
  };

  const handleDropdownOpen = (event: React.MouseEvent<HTMLElement>, item: MenuItem) => {
    setAnchorEl(event.currentTarget);
    setActiveDropdownMenu(item);
  };

  const handleDropdownClose = () => {
    setAnchorEl(null);
    setActiveDropdownMenu(null);
  };

  return (
    <>
      <Drawer
        variant="permanent"
        sx={{
          width: isCollapsed ? DRAWER_WIDTH_COLLAPSED : DRAWER_WIDTH,
          flexShrink: 0,
          transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '& .MuiDrawer-paper': {
            width: isCollapsed ? DRAWER_WIDTH_COLLAPSED : DRAWER_WIDTH,
            boxSizing: 'border-box',
            bgcolor: '#fbfbfd',
            border: 'none',
            borderRight: '1px solid rgba(0, 0, 0, 0.08)',
            transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            overflowX: 'hidden',
            boxShadow: '2px 0 8px rgba(0, 0, 0, 0.02)',
          },
        }}
      >
      <Toolbar sx={{ minHeight: '64px !important', height: 64 }} />

      <Box sx={{ overflow: 'auto', px: isCollapsed ? 0.5 : 1.5, py: 1.5 }}>
        {/* Toggle Button - Only visible when collapsed */}
        {isCollapsed && (
          <>
            <Box 
              sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                mb: 2, 
              }}
            >
              <Tooltip title="Perluas Menu" placement="right" arrow>
                <IconButton 
                  onClick={handleSidebarToggle}
                  size="small"
                  sx={{ 
                    width: 32,
                    height: 32,
                    color: '#86868b',
                    bgcolor: 'transparent',
                    border: '1.5px solid rgba(0, 0, 0, 0.08)',
                    borderRadius: '10px',
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      bgcolor: 'rgba(218, 37, 28, 0.06)',
                      color: '#DA251C',
                      borderColor: 'rgba(218, 37, 28, 0.15)',
                      transform: 'scale(1.05)',
                      boxShadow: '0 2px 8px rgba(218, 37, 28, 0.08)',
                    },
                    '&:active': {
                      transform: 'scale(0.95)',
                    },
                  }}
                >
                  <ChevronRightRounded sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
            </Box>

            {/* Divider after toggle */}
            <Box 
              sx={{ 
                height: '1px', 
                bgcolor: 'rgba(0, 0, 0, 0.06)', 
                mb: 2,
                mx: 0.5,
              }} 
            />
          </>
        )}

        {menuSections.map((section, sectionIndex) => (
          <Box key={sectionIndex} sx={{ mb: 2 }}>
            {!isCollapsed ? (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 1.5, mb: 0.75 }}>
                <Typography
                  variant="caption"
                  sx={{
                    color: '#86868b',
                    fontWeight: 600,
                    fontSize: '0.6875rem',
                    letterSpacing: '0.02em',
                    textTransform: 'uppercase',
                  }}
                >
                  {section.title}
                </Typography>
                {sectionIndex === 0 && (
                  <Tooltip title="Perkecil Menu" placement="top" arrow>
                    <IconButton 
                      onClick={handleSidebarToggle}
                      size="small"
                      sx={{ 
                        width: 28,
                        height: 28,
                        color: '#86868b',
                        bgcolor: 'transparent',
                        border: '1px solid rgba(0, 0, 0, 0.08)',
                        borderRadius: '8px',
                        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                          bgcolor: 'rgba(218, 37, 28, 0.06)',
                          color: '#DA251C',
                          borderColor: 'rgba(218, 37, 28, 0.15)',
                          transform: 'scale(1.05)',
                          boxShadow: '0 2px 8px rgba(218, 37, 28, 0.08)',
                        },
                        '&:active': {
                          transform: 'scale(0.95)',
                        },
                      }}
                    >
                      <ChevronLeftRounded sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            ) : (
              sectionIndex > 0 && (
                <Box 
                  sx={{ 
                    height: '1px', 
                    bgcolor: 'rgba(0, 0, 0, 0.04)', 
                    mb: 1,
                    mx: 1,
                  }} 
                />
              )
            )}

            <List disablePadding>
              {section.items.map((item, itemIndex) => {
                const active = item.subItems ? isParentActive(item) : isActive(item.href);
                const hasSubItems = item.subItems && item.subItems.length > 0;
                const isOpen = openMenus[item.label] ?? false;
                
                const menuButton = (
                  <ListItem disablePadding>
                    <ListItemButton
                      onClick={hasSubItems ? (isCollapsed ? (e: React.MouseEvent<HTMLElement>) => handleDropdownOpen(e, item) : () => handleMenuToggle(item.label)) : undefined}
                      component={hasSubItems ? 'div' : RouterLink}
                      to={hasSubItems ? undefined : item.href}
                      selected={active && !hasSubItems}
                      sx={{
                        borderRadius: '12px',
                        mb: 0.5,
                        py: 1,
                        px: isCollapsed ? 1 : 1.5,
                        justifyContent: isCollapsed ? 'center' : 'flex-start',
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
                          transform: isCollapsed ? 'scale(1.05)' : 'translateX(2px)',
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
                          minWidth: isCollapsed ? 'auto' : 32,
                          color: active ? '#DA251C' : '#86868b',
                          '& svg': { fontSize: 20 },
                          justifyContent: 'center',
                        }}
                      >
                        {item.icon}
                      </ListItemIcon>
                      {!isCollapsed && (
                        <>
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
                        </>
                      )}
                    </ListItemButton>
                  </ListItem>
                );
                
                return (
                  <Box key={itemIndex}>
                    {isCollapsed && hasSubItems ? (
                      <Tooltip title={item.label} placement="right">
                        {menuButton}
                      </Tooltip>
                    ) : isCollapsed ? (
                      <Tooltip title={item.label} placement="right">
                        {menuButton}
                      </Tooltip>
                    ) : (
                      menuButton
                    )}

                    {/* SubItems */}
                    {hasSubItems && !isCollapsed && (
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
      {!isCollapsed && (
        <Box
          sx={{
            mt: 'auto',
            p: 2,
            pt: 1.5,
            borderTop: '1px solid rgba(0, 0, 0, 0.06)',
            bgcolor: 'rgba(0, 0, 0, 0.01)',
          }}
        >
          <Typography
            variant="caption"
            sx={{ 
              color: '#86868b', 
              display: 'block', 
              textAlign: 'center', 
              fontSize: '0.625rem',
              lineHeight: 1.4,
              letterSpacing: '-0.01em',
            }}
          >
            © 2026 Departemen Pengembangan Aplikasi<br />Otoritas Jasa Keuangan
          </Typography>
        </Box>
      )}
      </Drawer>

      {/* Dropdown Menu for Collapsed Sidebar */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleDropdownClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        PaperProps={{
          sx: {
            ml: 1,
            mt: -1,
            minWidth: 200,
            borderRadius: '12px',
            border: '1px solid rgba(0, 0, 0, 0.08)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
            bgcolor: '#fbfbfd',
          },
        }}
      >
        {activeDropdownMenu?.subItems && activeDropdownMenu.subItems.length > 0 && activeDropdownMenu.subItems.map((subItem, index) => (
          <MenuItem
            key={index}
            component={RouterLink}
            to={subItem.href}
            onClick={handleDropdownClose}
            selected={isActive(subItem.href)}
            sx={{
              py: 1.25,
              px: 2,
              fontSize: '0.8125rem',
              borderRadius: '8px',
              mx: 0.75,
              mb: 0.5,
              transition: 'all 0.2s ease',
              '&.Mui-selected': {
                bgcolor: 'rgba(218, 37, 28, 0.08)',
                color: '#DA251C',
                '&:hover': {
                  bgcolor: 'rgba(218, 37, 28, 0.12)',
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
                color: isActive(subItem.href) ? '#DA251C' : '#86868b',
                '& svg': { fontSize: 18 },
              }}
            >
              {subItem.icon}
            </ListItemIcon>
            <ListItemText 
              primary={subItem.label} 
              primaryTypographyProps={{
                fontSize: '0.8125rem',
                fontWeight: isActive(subItem.href) ? 600 : 500,
              }}
            />
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default Sidebar;
