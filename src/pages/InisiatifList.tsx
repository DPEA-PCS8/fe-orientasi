import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  Link,
  Chip,
  Popover,
  Checkbox,
  FormControlLabel,
  FormGroup,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  TuneRounded,
  KeyboardArrowDown as ArrowDownIcon,
  OpenInNew as OpenInNewIcon,
  Close as CloseIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';

interface InisiatifData {
  id: string;
  namaInisiatif: string;
  departemen: string;
  tanggalMulai: string;
  tanggalSelesai: string;
  status: 'planning' | 'ongoing' | 'completed' | 'cancelled';
  prioritas: 'high' | 'medium' | 'low';
  pic: string;
}

const DUMMY_INISIATIF: InisiatifData[] = [
  { id: '1', namaInisiatif: 'Transformasi Digital Pengawasan', departemen: 'Teknologi Informasi', tanggalMulai: '2026-01-15', tanggalSelesai: '2026-12-31', status: 'ongoing', prioritas: 'high', pic: 'Budi Santoso' },
  { id: '2', namaInisiatif: 'Peningkatan Sistem Keamanan Data', departemen: 'Keamanan Informasi', tanggalMulai: '2026-02-01', tanggalSelesai: '2026-08-31', status: 'ongoing', prioritas: 'high', pic: 'Siti Nurhaliza' },
  { id: '3', namaInisiatif: 'Modernisasi Infrastruktur Cloud', departemen: 'Teknologi Informasi', tanggalMulai: '2026-03-01', tanggalSelesai: '2026-11-30', status: 'planning', prioritas: 'high', pic: 'Ahmad Wijaya' },
  { id: '4', namaInisiatif: 'Optimisasi Proses Bisnis', departemen: 'Operasional', tanggalMulai: '2025-11-01', tanggalSelesai: '2026-05-31', status: 'ongoing', prioritas: 'medium', pic: 'Dewi Lestari' },
  { id: '5', namaInisiatif: 'Program Pelatihan SDM', departemen: 'SDM', tanggalMulai: '2026-01-01', tanggalSelesai: '2026-12-31', status: 'ongoing', prioritas: 'medium', pic: 'Rini Handayani' },
  { id: '6', namaInisiatif: 'Implementasi API Gateway', departemen: 'Teknologi Informasi', tanggalMulai: '2026-02-15', tanggalSelesai: '2026-07-31', status: 'planning', prioritas: 'high', pic: 'Eka Prasetya' },
  { id: '7', namaInisiatif: 'Audit dan Compliance', departemen: 'Audit Internal', tanggalMulai: '2026-01-01', tanggalSelesai: '2026-06-30', status: 'completed', prioritas: 'medium', pic: 'Bambang Sutrisno' },
  { id: '8', namaInisiatif: 'Migrasi Database ke Cloud', departemen: 'Teknologi Informasi', tanggalMulai: '2026-03-15', tanggalSelesai: '2026-09-30', status: 'planning', prioritas: 'high', pic: 'Hendra Gunawan' },
  { id: '9', namaInisiatif: 'Peningkatan User Experience', departemen: 'Product', tanggalMulai: '2026-02-01', tanggalSelesai: '2026-10-31', status: 'ongoing', prioritas: 'medium', pic: 'Nita Wijaya' },
  { id: '10', namaInisiatif: 'Program Sustainability', departemen: 'Corporate Social Responsibility', tanggalMulai: '2026-01-01', tanggalSelesai: '2026-12-31', status: 'ongoing', prioritas: 'low', pic: 'Yuki Tanaka' },
];

type Order = 'asc' | 'desc';

const STATUS_LABELS: Record<InisiatifData['status'], string> = {
  planning: 'Perencanaan',
  ongoing: 'Berjalan',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
};

const PRIORITAS_LABELS: Record<InisiatifData['prioritas'], string> = {
  high: 'Tinggi',
  medium: 'Sedang',
  low: 'Rendah',
};

const getStatusColor = (status: InisiatifData['status']) => {
  switch (status) {
    case 'completed':
      return '#31A24C';
    case 'cancelled':
      return '#FF3B30';
    case 'ongoing':
      return '#007AFF';
    case 'planning':
      return '#FF9500';
    default:
      return '#86868b';
  }
};

const getPrioritasColor = (prioritas: InisiatifData['prioritas']) => {
  switch (prioritas) {
    case 'high':
      return '#FF3B30';
    case 'medium':
      return '#FF9500';
    case 'low':
      return '#34C759';
    default:
      return '#86868b';
  }
};

function InisiatifList() {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [orderBy, setOrderBy] = useState<keyof InisiatifData>('namaInisiatif');
  const [order, setOrder] = useState<Order>('asc');
  const [inisiatifData, setInisiatifData] = useState<InisiatifData[]>(DUMMY_INISIATIF);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedInisiatifId, setSelectedInisiatifId] = useState<string | null>(null);
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedStatus, setSelectedStatus] = useState<Set<string>>(new Set());
  const [selectedPrioritas, setSelectedPrioritas] = useState<Set<string>>(new Set());

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, inisiatifId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedInisiatifId(inisiatifId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedInisiatifId(null);
  };

  const handleStatusChange = (newStatus: InisiatifData['status']) => {
    if (selectedInisiatifId) {
      setInisiatifData(prev => 
        prev.map(item => 
          item.id === selectedInisiatifId ? { ...item, status: newStatus } : item
        )
      );
    }
    handleMenuClose();
  };

  const handleFilterOpen = (event: React.MouseEvent<HTMLElement>) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };

  const handleStatusCheckChange = (status: string) => {
    const newSelected = new Set(selectedStatus);
    if (newSelected.has(status)) {
      newSelected.delete(status);
    } else {
      newSelected.add(status);
    }
    setSelectedStatus(newSelected);
  };

  const handlePrioritasCheckChange = (prioritas: string) => {
    const newSelected = new Set(selectedPrioritas);
    if (newSelected.has(prioritas)) {
      newSelected.delete(prioritas);
    } else {
      newSelected.add(prioritas);
    }
    setSelectedPrioritas(newSelected);
  };

  const handleRequestSort = (event: React.MouseEvent<unknown>, property: keyof InisiatifData) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const filteredData = inisiatifData.filter(item => {
    const matchKeyword = 
      item.namaInisiatif.toLowerCase().includes(keyword.toLowerCase()) ||
      item.departemen.toLowerCase().includes(keyword.toLowerCase()) ||
      item.pic.toLowerCase().includes(keyword.toLowerCase());
    
    const matchStatus = selectedStatus.size === 0 || selectedStatus.has(item.status);
    const matchPrioritas = selectedPrioritas.size === 0 || selectedPrioritas.has(item.prioritas);
    
    return matchKeyword && matchStatus && matchPrioritas;
  });

  const sortedData = [...filteredData].sort((a, b) => {
    const aValue = a[orderBy];
    const bValue = b[orderBy];
    
    if (aValue < bValue) {
      return order === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return order === 'asc' ? 1 : -1;
    }
    return 0;
  });

  const displayedData = sortedData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      {/* Header */}
      <Box>
        <Typography 
          variant="h4" 
          sx={{ 
            fontWeight: 700, 
            color: '#1d1d1f',
            mb: 0.5 
          }}
        >
          Daftar Inisiatif
        </Typography>
        <Typography variant="body1" sx={{ color: '#86868b' }}>
          Kelola inisiatif strategis organisasi
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
              placeholder="Cari inisiatif, departemen, atau PIC..."
              size="small"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              sx={{ 
                width: 350,
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
              onClick={handleFilterOpen}
              sx={{
                color: selectedStatus.size > 0 || selectedPrioritas.size > 0 ? '#DA251C' : '#86868b',
                fontWeight: 500,
                '&:hover': {
                  bgcolor: 'rgba(0, 0, 0, 0.04)',
                },
              }}
            >
              Filter
            </Button>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/add-inisiatif')}
            sx={{
              background: 'linear-gradient(135deg, #DA251C 0%, #FF4D45 100%)',
              fontWeight: 500,
              px: 2.5,
              '&:hover': {
                background: 'linear-gradient(135deg, #B91C14 0%, #D83A32 100%)',
              },
            }}
          >
            Tambah Inisiatif
          </Button>
        </Box>

        {/* Filter Popover */}
        <Popover
          open={Boolean(filterAnchorEl)}
          anchorEl={filterAnchorEl}
          onClose={handleFilterClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
          PaperProps={{
            sx: {
              mt: 1,
              borderRadius: 2,
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            },
          }}
        >
          <Box sx={{ p: 2.5, minWidth: 300 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1d1d1f' }}>
                Filter
              </Typography>
              <IconButton size="small" onClick={handleFilterClose}>
                <CloseIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Box>

            {/* Status Filter */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#1d1d1f', mb: 1 }}>
                Status
              </Typography>
              <FormGroup>
                {Object.keys(STATUS_LABELS).map(status => (
                  <FormControlLabel
                    key={status}
                    control={
                      <Checkbox
                        size="small"
                        checked={selectedStatus.has(status)}
                        onChange={() => handleStatusCheckChange(status)}
                      />
                    }
                    label={<Typography variant="body2">{STATUS_LABELS[status as InisiatifData['status']]}</Typography>}
                  />
                ))}
              </FormGroup>
            </Box>

            {/* Prioritas Filter */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#1d1d1f', mb: 1 }}>
                Prioritas
              </Typography>
              <FormGroup>
                {Object.keys(PRIORITAS_LABELS).map(prioritas => (
                  <FormControlLabel
                    key={prioritas}
                    control={
                      <Checkbox
                        size="small"
                        checked={selectedPrioritas.has(prioritas)}
                        onChange={() => handlePrioritasCheckChange(prioritas)}
                      />
                    }
                    label={<Typography variant="body2">{PRIORITAS_LABELS[prioritas as InisiatifData['prioritas']]}</Typography>}
                  />
                ))}
              </FormGroup>
            </Box>
          </Box>
        </Popover>

        {/* Table */}
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f5f5f7' }}>
                <TableCell sx={{ fontWeight: 600, color: '#1d1d1f', width: '25%' }}>
                  <TableSortLabel
                    active={orderBy === 'namaInisiatif'}
                    direction={orderBy === 'namaInisiatif' ? order : 'asc'}
                    onClick={(e) => handleRequestSort(e, 'namaInisiatif')}
                  >
                    Nama Inisiatif
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#1d1d1f', width: '15%' }}>
                  Departemen
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#1d1d1f', width: '10%' }}>
                  PIC
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#1d1d1f', width: '10%' }}>
                  <TableSortLabel
                    active={orderBy === 'status'}
                    direction={orderBy === 'status' ? order : 'asc'}
                    onClick={(e) => handleRequestSort(e, 'status')}
                  >
                    Status
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#1d1d1f', width: '10%' }}>
                  Prioritas
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#1d1d1f', width: '15%' }}>
                  Periode
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#1d1d1f', width: '5%', textAlign: 'center' }}>
                  Aksi
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {displayedData.map((row) => (
                <TableRow key={row.id} hover sx={{ '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.02)' } }}>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 500, color: '#1d1d1f' }}>
                      {row.namaInisiatif}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ color: '#86868b' }}>
                      {row.departemen}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ color: '#86868b' }}>
                      {row.pic}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={STATUS_LABELS[row.status]}
                      size="small"
                      sx={{
                        bgcolor: `${getStatusColor(row.status)}20`,
                        color: getStatusColor(row.status),
                        fontWeight: 500,
                        fontSize: '0.75rem',
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={PRIORITAS_LABELS[row.prioritas]}
                      size="small"
                      sx={{
                        bgcolor: `${getPrioritasColor(row.prioritas)}20`,
                        color: getPrioritasColor(row.prioritas),
                        fontWeight: 500,
                        fontSize: '0.75rem',
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ color: '#86868b', fontSize: '0.8125rem' }}>
                      {new Date(row.tanggalMulai).toLocaleDateString('id-ID')} - {new Date(row.tanggalSelesai).toLocaleDateString('id-ID')}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuOpen(e, row.id)}
                    >
                      <MoreVertIcon sx={{ fontSize: 18, color: '#86868b' }} />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Menu for status change */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          {Object.entries(STATUS_LABELS).map(([status, label]) => (
            <MenuItem key={status} onClick={() => handleStatusChange(status as InisiatifData['status'])}>
              {label}
            </MenuItem>
          ))}
        </Menu>

        {/* Pagination */}
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredData.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{
            borderTop: '1px solid rgba(0, 0, 0, 0.06)',
            '& .MuiTablePagination-selectLabel': {
              mb: 0,
            },
          }}
        />
      </Paper>
    </Box>
  );
}

export default InisiatifList;
