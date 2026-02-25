import { useState, useEffect, useCallback, Fragment } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Snackbar,
  Tooltip,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import {
  Save as SaveIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  Security as SecurityIcon,
  Visibility as ViewIcon,
  Add as CreateIcon,
  Edit as UpdateIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { getAllRoles } from '../api/roleApi';
import {
  getAllPermissionMatrices,
  bulkUpdatePermissions,
  getAllMenus,
} from '../api/rolePermissionApi';
import type {
  Role,
  RolePermissionMatrix,
  Menu,
  BulkRolePermissionRequest,
} from '../types/rbac.types';

// Permission column configuration for dynamic rendering
type PermissionKey = 'can_view' | 'can_create' | 'can_update' | 'can_delete';

interface PermissionColumnConfig {
  key: PermissionKey;
  label: string;
  icon: React.ReactNode;
  color: 'primary' | 'success' | 'warning' | 'error';
}

const PERMISSION_COLUMNS: PermissionColumnConfig[] = [
  { key: 'can_view', label: 'View', icon: <ViewIcon fontSize="small" />, color: 'primary' },
  { key: 'can_create', label: 'Create', icon: <CreateIcon fontSize="small" />, color: 'success' },
  { key: 'can_update', label: 'Update', icon: <UpdateIcon fontSize="small" />, color: 'warning' },
  { key: 'can_delete', label: 'Delete', icon: <DeleteIcon fontSize="small" />, color: 'error' },
];

interface LocalPermission {
  menu_id: string;
  menu_code: string;
  menu_name: string;
  parent_id: string | null;
  parent_name: string | null;
  display_order: number;
  can_view: boolean;
  can_create: boolean;
  can_update: boolean;
  can_delete: boolean;
  isDirty: boolean;
}

export default function RolePermissions() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [matrices, setMatrices] = useState<RolePermissionMatrix[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [permissions, setPermissions] = useState<LocalPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [expandedParents, setExpandedParents] = useState<Set<string>>(new Set());

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  // Update permissions when selected role changes
  useEffect(() => {
    if (!selectedRoleId || menus.length === 0) {
      return;
    }

    // Try to find existing matrix for this role
    const matrix = matrices.find(m => m.role_id === selectedRoleId);
    
    if (matrix && matrix.menu_permissions.length > 0) {
      // Initialize permissions with existing matrix data
      const localPerms: LocalPermission[] = matrix.menu_permissions.map(mp => ({
        ...mp,
        isDirty: false,
      }));
      setPermissions(localPerms);
      
      // Expand all parent menus by default
      const parentIds = new Set<string>();
      localPerms.forEach(p => {
        if (p.parent_id === null) {
          parentIds.add(p.menu_id);
        }
      });
      setExpandedParents(parentIds);
    } else {
      // No existing permissions for this role, initialize with all menus
      const localPerms: LocalPermission[] = menus.map(menu => ({
        menu_id: menu.id,
        menu_code: menu.menu_code,
        menu_name: menu.menu_name,
        parent_id: menu.parent_id,
        parent_name: menu.parent_name,
        display_order: menu.display_order,
        can_view: false,
        can_create: false,
        can_update: false,
        can_delete: false,
        isDirty: false,
      }));
      setPermissions(localPerms);
      
      // Expand all parent menus by default
      const parentIds = new Set<string>();
      localPerms.forEach(p => {
        if (p.parent_id === null) {
          parentIds.add(p.menu_id);
        }
      });
      setExpandedParents(parentIds);
    }
  }, [selectedRoleId, matrices, menus]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load roles and menus first (required)
      const [rolesData, menusData] = await Promise.all([
        getAllRoles(),
        getAllMenus(),
      ]);

      setRoles(rolesData);
      setMenus(menusData);

      // Load matrices separately (may fail if no permissions exist yet)
      let matricesData: RolePermissionMatrix[] = [];
      try {
        matricesData = await getAllPermissionMatrices();
      } catch (matrixErr) {
        console.warn('Failed to load permission matrices:', matrixErr);
        // Continue without matrices - we'll initialize permissions from menus
      }
      setMatrices(matricesData);

      // Auto-select first role if available
      if (rolesData.length > 0 && !selectedRoleId) {
        setSelectedRoleId(rolesData[0].id);
      }
    } catch (err) {
      console.error('Failed to load data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (event: SelectChangeEvent<string>) => {
    setSelectedRoleId(event.target.value);
  };

  const handlePermissionChange = useCallback(
    (menuId: string, field: 'can_view' | 'can_create' | 'can_update' | 'can_delete', value: boolean) => {
      setPermissions(prevPermissions =>
        prevPermissions.map(perm => {
          if (perm.menu_id === menuId) {
            return { ...perm, [field]: value, isDirty: true };
          }
          return perm;
        })
      );
    },
    []
  );

  const handleToggleAll = useCallback(
    (field: 'can_view' | 'can_create' | 'can_update' | 'can_delete', value: boolean) => {
      setPermissions(prevPermissions =>
        prevPermissions.map(perm => ({
          ...perm,
          [field]: value,
          isDirty: true,
        }))
      );
    },
    []
  );

  const handleSave = async () => {
    if (!selectedRoleId) return;

    const dirtyPermissions = permissions.filter(p => p.isDirty);
    if (dirtyPermissions.length === 0) {
      setSuccessMessage('No changes to save');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const request: BulkRolePermissionRequest = {
        role_id: selectedRoleId,
        permissions: dirtyPermissions.map(p => ({
          menu_id: p.menu_id,
          can_view: p.can_view,
          can_create: p.can_create,
          can_update: p.can_update,
          can_delete: p.can_delete,
        })),
      };

      await bulkUpdatePermissions(request);
      setSuccessMessage('Permissions saved successfully');

      // Reload data to get updated matrices
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save permissions');
    } finally {
      setSaving(false);
    }
  };

  const toggleParentExpansion = (parentId: string) => {
    setExpandedParents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(parentId)) {
        newSet.delete(parentId);
      } else {
        newSet.add(parentId);
      }
      return newSet;
    });
  };

  const hasDirtyPermissions = permissions.some(p => p.isDirty);

  // Organize permissions by parent/child hierarchy
  const parentMenus = permissions.filter(p => p.parent_id === null);
  const getChildMenus = (parentId: string) =>
    permissions.filter(p => p.parent_id === parentId);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <SecurityIcon sx={{ fontSize: 32, color: '#DA251C' }} />
          <Box>
            <Typography variant="h5" fontWeight={600}>
              Role Permissions
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage access control for each role
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadData}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={!hasDirtyPermissions || saving}
            sx={{
              bgcolor: hasDirtyPermissions ? '#DA251C' : '#e0e0e0',
              color: hasDirtyPermissions ? 'white' : '#9e9e9e',
              '&:hover': { 
                bgcolor: hasDirtyPermissions ? '#b91c14' : '#d5d5d5',
              },
              '&.Mui-disabled': {
                bgcolor: '#e0e0e0',
                color: '#9e9e9e',
              },
            }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Role Selector */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
          <FormControl sx={{ minWidth: 300 }}>
            <InputLabel id="role-select-label">Select Role</InputLabel>
            <Select
              labelId="role-select-label"
              id="role-select"
              value={selectedRoleId}
              label="Select Role"
              onChange={handleRoleChange}
              disabled={roles.length === 0}
            >
              {roles.length === 0 ? (
                <MenuItem value="" disabled>
                  No roles available
                </MenuItem>
              ) : (
                roles.map(role => (
                  <MenuItem key={role.id} value={role.id}>
                    {role.roleName}
                  </MenuItem>
                ))
              )}
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* Info: No roles available */}
      {roles.length === 0 && !loading && (
        <Alert severity="info" sx={{ mb: 3 }}>
          No roles found. Please create roles first in the User Role Management page.
        </Alert>
      )}

      {/* Info: No menus available */}
      {selectedRoleId && menus.length === 0 && !loading && (
        <Alert severity="info" sx={{ mb: 3 }}>
          No menus found in the system. Menus need to be created in the database first.
        </Alert>
      )}

      {/* Permissions Table */}
      {selectedRoleId && menus.length > 0 && (
        <Paper sx={{ overflow: 'hidden', borderRadius: 2 }}>
          <TableContainer sx={{ maxHeight: 'calc(100vh - 280px)', minHeight: 450 }}>
            <Table stickyHeader size="medium" sx={{ tableLayout: 'fixed' }}>
              <TableHead>
                <TableRow>
                  <TableCell 
                    sx={{ 
                      fontWeight: 600, 
                      bgcolor: '#f8f9fa', 
                      borderBottom: '2px solid #dee2e6',
                      width: '40%',
                      minWidth: 250,
                    }}
                  >
                    Menu
                  </TableCell>
                  {PERMISSION_COLUMNS.map(col => (
                    <TableCell 
                      key={col.key}
                      align="center" 
                      sx={{ 
                        fontWeight: 600, 
                        bgcolor: '#f8f9fa', 
                        borderBottom: '2px solid #dee2e6',
                        width: '15%',
                        minWidth: 90,
                        p: 1,
                      }}
                    >
                      <Tooltip title={`Toggle all ${col.label}`} arrow placement="top">
                        <Box 
                          sx={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'center',
                            gap: 0.5,
                            cursor: 'pointer',
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: `${col.color}.main` }}>
                            {col.icon}
                            <Typography variant="caption" fontWeight={600} sx={{ fontSize: '0.75rem' }}>
                              {col.label}
                            </Typography>
                          </Box>
                          <Checkbox
                            size="small"
                            onChange={(e) => handleToggleAll(col.key, e.target.checked)}
                            sx={{ 
                              p: 0.25,
                              '& .MuiSvgIcon-root': { fontSize: 18 },
                            }}
                            color={col.color}
                          />
                        </Box>
                      </Tooltip>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {parentMenus.map(parentMenu => {
                  const children = getChildMenus(parentMenu.menu_id);
                  const isExpanded = expandedParents.has(parentMenu.menu_id);
                  const hasChildren = children.length > 0;

                  return (
                    <Fragment key={parentMenu.menu_id}>
                      {/* Parent Row */}
                      <TableRow
                        sx={{
                          bgcolor: parentMenu.isDirty ? 'rgba(218, 37, 28, 0.04)' : '#fafafa',
                          '&:hover': { bgcolor: parentMenu.isDirty ? 'rgba(218, 37, 28, 0.08)' : '#f0f0f0' },
                          transition: 'background-color 0.2s',
                        }}
                      >
                        <TableCell sx={{ py: 1.5, borderBottom: hasChildren && isExpanded ? 'none' : undefined }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {hasChildren ? (
                              <IconButton
                                size="small"
                                onClick={() => toggleParentExpansion(parentMenu.menu_id)}
                                sx={{ 
                                  transition: 'transform 0.2s',
                                  transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                }}
                              >
                                <ExpandMoreIcon fontSize="small" />
                              </IconButton>
                            ) : (
                              <Box sx={{ width: 28 }} /> // Spacer for alignment
                            )}
                            <Box sx={{ flex: 1 }}>
                              <Typography fontWeight={600} fontSize="0.875rem" color="text.primary">
                                {parentMenu.menu_name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                {parentMenu.menu_code}
                              </Typography>
                            </Box>
                            {parentMenu.isDirty && (
                              <Chip 
                                label="Modified" 
                                size="small" 
                                color="warning" 
                                sx={{ height: 20, fontSize: '0.65rem' }} 
                              />
                            )}
                          </Box>
                        </TableCell>
                        {PERMISSION_COLUMNS.map(col => (
                          <TableCell 
                            key={col.key} 
                            align="center" 
                            sx={{ 
                              py: 1, 
                              borderBottom: hasChildren && isExpanded ? 'none' : undefined 
                            }}
                          >
                            <Checkbox
                              checked={parentMenu[col.key]}
                              onChange={(e) =>
                                handlePermissionChange(parentMenu.menu_id, col.key, e.target.checked)
                              }
                              color={col.color}
                              size="small"
                              sx={{ 
                                p: 0.5,
                                '& .MuiSvgIcon-root': { fontSize: 20 },
                              }}
                            />
                          </TableCell>
                        ))}
                      </TableRow>

                      {/* Child Rows - Rendered inline with Collapse */}
                      {hasChildren && children.map((childMenu, childIndex) => (
                        <TableRow
                          key={childMenu.menu_id}
                          sx={{
                            bgcolor: childMenu.isDirty ? 'rgba(218, 37, 28, 0.04)' : 'white',
                            '&:hover': { bgcolor: childMenu.isDirty ? 'rgba(218, 37, 28, 0.08)' : '#f5f5f5' },
                            display: isExpanded ? 'table-row' : 'none',
                            transition: 'background-color 0.2s',
                          }}
                        >
                          <TableCell 
                            sx={{ 
                              py: 1, 
                              pl: 7,
                              borderBottom: childIndex === children.length - 1 ? undefined : '1px solid #f0f0f0',
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Box 
                                sx={{ 
                                  width: 8, 
                                  height: 8, 
                                  borderRadius: '50%', 
                                  bgcolor: 'grey.300',
                                  flexShrink: 0,
                                }} 
                              />
                              <Typography fontSize="0.8125rem" color="text.secondary">
                                {childMenu.menu_name}
                              </Typography>
                              <Typography 
                                variant="caption" 
                                color="text.disabled" 
                                sx={{ fontSize: '0.65rem' }}
                              >
                                ({childMenu.menu_code})
                              </Typography>
                              {childMenu.isDirty && (
                                <Chip 
                                  label="Modified" 
                                  size="small" 
                                  color="warning" 
                                  sx={{ height: 18, fontSize: '0.6rem', ml: 'auto' }} 
                                />
                              )}
                            </Box>
                          </TableCell>
                          {PERMISSION_COLUMNS.map(col => (
                            <TableCell 
                              key={col.key} 
                              align="center"
                              sx={{ 
                                py: 0.5,
                                borderBottom: childIndex === children.length - 1 ? undefined : '1px solid #f0f0f0',
                              }}
                            >
                              <Checkbox
                                checked={childMenu[col.key]}
                                onChange={(e) =>
                                  handlePermissionChange(childMenu.menu_id, col.key, e.target.checked)
                                }
                                color={col.color}
                                size="small"
                                sx={{ 
                                  p: 0.25,
                                  '& .MuiSvgIcon-root': { fontSize: 18 },
                                }}
                              />
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Summary Footer */}
          <Box sx={{ p: 2, borderTop: '1px solid #e0e0e0', bgcolor: '#fafafa' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                {parentMenus.length} parent menu(s) • {permissions.length} total • {permissions.filter(p => p.isDirty).length} modified
              </Typography>
              {hasDirtyPermissions && (
                <Chip 
                  label="Unsaved changes" 
                  size="small" 
                  color="warning" 
                  variant="outlined"
                  sx={{ fontWeight: 500 }}
                />
              )}
            </Box>
          </Box>
        </Paper>
      )}

      {/* Success Snackbar */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={4000}
        onClose={() => setSuccessMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity="success" onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}
