import { useState } from 'react';
import {
  Box,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  InputAdornment,
  Typography,
  Paper,
  Button,
  Avatar,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  MoreHoriz as MoreHorizIcon,
  TuneRounded,
} from '@mui/icons-material';
import type { User } from '../types/User';

// Dummy data
const DUMMY_USERS: User[] = [
  {
    uuid: '1',
    username: 'jdoe',
    fullName: 'John Doe',
    email: 'john.doe@example.com',
    department: 'Engineering',
    title: 'Software Engineer',
    lastLoginAt: '2023-10-27T10:00:00Z',
    createdAt: '2023-01-01T00:00:00Z'
  },
  {
    uuid: '2',
    username: 'asmith',
    fullName: 'Alice Smith',
    email: 'alice.smith@example.com',
    department: 'People',
    title: 'HR Manager',
    lastLoginAt: '2023-10-26T14:30:00Z',
    createdAt: '2023-02-15T00:00:00Z'
  },
  {
    uuid: '3',
    username: 'bwayne',
    fullName: 'Bruce Wayne',
    email: 'bruce.wayne@example.com',
    department: 'Finance',
    title: 'CFO',
    lastLoginAt: '2023-10-25T09:15:00Z',
    createdAt: '2023-03-10T00:00:00Z'
  },
  {
    uuid: '4',
    username: 'ckent',
    fullName: 'Clark Kent',
    email: 'clark.kent@example.com',
    department: 'Marketing',
    title: 'Content Writer',
    lastLoginAt: '2023-10-24T08:00:00Z',
    createdAt: '2023-04-20T00:00:00Z'
  },
  {
    uuid: '5',
    username: 'dprince',
    fullName: 'Diana Prince',
    email: 'diana.prince@example.com',
    department: 'Legal',
    title: 'Legal Advisor',
    lastLoginAt: '2023-10-23T16:45:00Z',
    createdAt: '2023-05-05T00:00:00Z'
  }
];

type Order = 'asc' | 'desc';

// Generate avatar color from name
const stringToColor = (string: string) => {
  const colors = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
  ];
  let hash = 0;
  for (let i = 0; i < string.length; i++) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

const UserList = () => {
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [orderBy, setOrderBy] = useState<keyof User>('createdAt');
  const [order, setOrder] = useState<Order>('asc');

  const filteredUsers = (() => {
    const result = DUMMY_USERS.filter(user => 
      user.username.toLowerCase().includes(keyword.toLowerCase()) ||
      user.fullName.toLowerCase().includes(keyword.toLowerCase())
    );

    result.sort((a, b) => {
      const fieldA = String(a[orderBy] ?? '');
      const fieldB = String(b[orderBy] ?? '');
      if (order === 'asc') {
        return fieldA < fieldB ? -1 : fieldA > fieldB ? 1 : 0;
      }
      return fieldA > fieldB ? -1 : fieldA < fieldB ? 1 : 0;
    });

    return result;
  })();

  const handleSort = (property: keyof User) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedUsers = filteredUsers.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Box sx={{ p: 3, width: '100%' }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography 
          variant="h4" 
          sx={{ 
            fontWeight: 600, 
            color: '#1d1d1f',
            letterSpacing: '-0.02em',
            mb: 0.5,
          }}
        >
          Users
        </Typography>
        <Typography variant="body1" sx={{ color: '#86868b' }}>
          Manage team members and their account permissions.
        </Typography>
      </Box>

      {/* Main Card */}
      <Paper
        elevation={0}
        sx={{
          width: '100%',
          borderRadius: 2,
          border: '1px solid rgba(0, 0, 0, 0.08)',
          overflow: 'hidden',
        }}
      >
        {/* Toolbar */}
        <Box
          sx={{
            p: 2.5,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
          }}
        >
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
            <TextField
              placeholder="Search users..."
              variant="outlined"
              size="small"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              sx={{ 
                width: 280,
                '& .MuiOutlinedInput-root': {
                  bgcolor: '#f5f5f7',
                  borderRadius: '10px',
                  '& fieldset': {
                    borderColor: 'transparent',
                  },
                  '&:hover fieldset': {
                    borderColor: 'transparent',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#DA251C',
                    borderWidth: 2,
                  },
                },
              }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: '#86868b', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                },
              }}
            />
            <Button
              variant="text"
              startIcon={<TuneRounded sx={{ fontSize: 18 }} />}
              sx={{
                color: '#86868b',
                fontWeight: 500,
                '&:hover': {
                  bgcolor: 'rgba(0, 0, 0, 0.04)',
                },
              }}
            >
              Filters
            </Button>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            sx={{
              background: 'linear-gradient(135deg, #DA251C 0%, #FF4D45 100%)',
              fontWeight: 500,
              px: 2.5,
              '&:hover': {
                background: 'linear-gradient(135deg, #B91C14 0%, #D83A32 100%)',
              },
            }}
          >
            Add User
          </Button>
        </Box>

        {/* Table */}
        <TableContainer sx={{ width: '100%' }}>
          <Table sx={{ minWidth: '100%' }} stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ pl: 3, width: 48 }}>#</TableCell>
                <TableCell sx={{ minWidth: 240 }}>
                  <TableSortLabel
                    active={orderBy === 'fullName'}
                    direction={orderBy === 'fullName' ? order : 'asc'}
                    onClick={() => handleSort('fullName')}
                  >
                    User
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'department'}
                    direction={orderBy === 'department' ? order : 'asc'}
                    onClick={() => handleSort('department')}
                  >
                    Department
                  </TableSortLabel>
                </TableCell>
                <TableCell>Role</TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'lastLoginAt'}
                    direction={orderBy === 'lastLoginAt' ? order : 'asc'}
                    onClick={() => handleSort('lastLoginAt')}
                  >
                    Last Active
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right" sx={{ pr: 3 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} sx={{ py: 8, textAlign: 'center' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <SearchIcon sx={{ fontSize: 48, color: '#d1d1d6', mb: 2 }} />
                      <Typography variant="body1" sx={{ color: '#86868b', fontWeight: 500 }}>
                        No users found
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#aeaeb2' }}>
                        Try adjusting your search or filters
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedUsers.map((user, index) => (
                  <TableRow
                    key={user.uuid}
                    sx={{
                      '&:last-child td': { borderBottom: 0 },
                    }}
                  >
                    <TableCell sx={{ pl: 3, color: '#86868b', fontSize: '0.8125rem' }}>
                      {page * rowsPerPage + index + 1}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar
                          sx={{
                            width: 36,
                            height: 36,
                            background: stringToColor(user.fullName),
                            fontSize: '0.8125rem',
                            fontWeight: 600,
                          }}
                        >
                          {getInitials(user.fullName)}
                        </Avatar>
                        <Box>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              fontWeight: 500, 
                              color: '#1d1d1f',
                              lineHeight: 1.3,
                            }}
                          >
                            {user.fullName}
                          </Typography>
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              color: '#86868b',
                              fontSize: '0.75rem',
                            }}
                          >
                            {user.email}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box
                        sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          px: 1.5,
                          py: 0.5,
                          borderRadius: '6px',
                          bgcolor: 'rgba(218, 37, 28, 0.08)',
                          color: '#DA251C',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                        }}
                      >
                        {user.department}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: '#1d1d1f' }}>
                        {user.title}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: '#86868b', fontSize: '0.8125rem' }}>
                        {user.lastLoginAt
                          ? new Date(user.lastLoginAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : '—'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ pr: 3 }}>
                      <Tooltip title="More options">
                        <IconButton 
                          size="small"
                          sx={{
                            color: '#86868b',
                            '&:hover': {
                              bgcolor: 'rgba(0, 0, 0, 0.04)',
                            },
                          }}
                        >
                          <MoreHorizIcon sx={{ fontSize: 20 }} />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            px: 3,
            py: 2,
            borderTop: '1px solid rgba(0, 0, 0, 0.06)',
            bgcolor: '#fbfbfd',
          }}
        >
          <Typography variant="body2" sx={{ color: '#86868b', fontSize: '0.8125rem' }}>
            Showing {page * rowsPerPage + 1} to {Math.min((page + 1) * rowsPerPage, filteredUsers.length)} of {filteredUsers.length} users
          </Typography>
          <TablePagination
            component="div"
            count={filteredUsers.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25]}
            labelRowsPerPage=""
            sx={{
              '& .MuiTablePagination-select': {
                borderRadius: '8px',
                bgcolor: '#f5f5f7',
                mr: 1,
              },
              '& .MuiTablePagination-displayedRows': {
                display: 'none',
              },
            }}
          />
        </Box>
      </Paper>
    </Box>
  );
};

export default UserList;
