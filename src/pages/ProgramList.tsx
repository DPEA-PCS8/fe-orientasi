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
  InputAdornment,
  Typography,
  Paper,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Chip,
  Collapse,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  LinearProgress,
  Tooltip,
  Avatar,
  AvatarGroup,
  Popover,
  Checkbox,
  FormControlLabel,
  FormGroup,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  KeyboardArrowDown as ExpandIcon,
  KeyboardArrowRight as CollapseIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FolderRounded,
  AssignmentRounded,
  TuneRounded,
  Close as CloseIcon,
} from '@mui/icons-material';

// Types
interface Inisiatif {
  id: string;
  nama: string;
  pic: string;
  tanggalMulai: string;
  tanggalSelesai: string;
  status: 'planning' | 'ongoing' | 'completed' | 'cancelled';
  prioritas: 'high' | 'medium' | 'low';
  progress: number;
}

interface Program {
  id: string;
  namaProgram: string;
  deskripsi: string;
  departemen: string;
  tahun: number;
  status: 'active' | 'completed' | 'archived';
  inisiatif: Inisiatif[];
}

// Dummy Data
const DUMMY_PROGRAMS: Program[] = [
  {
    id: 'PRG-001',
    namaProgram: 'Transformasi Digital OJK',
    deskripsi: 'Program transformasi digital untuk meningkatkan efisiensi pengawasan',
    departemen: 'Teknologi Informasi',
    tahun: 2026,
    status: 'active',
    inisiatif: [
      { id: 'INI-001', nama: 'Modernisasi Infrastruktur Cloud', pic: 'Ahmad Wijaya', tanggalMulai: '2026-01-15', tanggalSelesai: '2026-06-30', status: 'ongoing', prioritas: 'high', progress: 45 },
      { id: 'INI-002', nama: 'Implementasi API Gateway', pic: 'Eka Prasetya', tanggalMulai: '2026-02-01', tanggalSelesai: '2026-08-31', status: 'planning', prioritas: 'high', progress: 10 },
      { id: 'INI-003', nama: 'Migrasi Database ke Cloud', pic: 'Hendra Gunawan', tanggalMulai: '2026-03-01', tanggalSelesai: '2026-09-30', status: 'planning', prioritas: 'medium', progress: 5 },
    ],
  },
  {
    id: 'PRG-002',
    namaProgram: 'Peningkatan Keamanan Siber',
    deskripsi: 'Program untuk meningkatkan keamanan sistem informasi dan data',
    departemen: 'Keamanan Informasi',
    tahun: 2026,
    status: 'active',
    inisiatif: [
      { id: 'INI-004', nama: 'Security Audit & Assessment', pic: 'Siti Nurhaliza', tanggalMulai: '2026-01-01', tanggalSelesai: '2026-04-30', status: 'completed', prioritas: 'high', progress: 100 },
      { id: 'INI-005', nama: 'Implementasi Zero Trust Architecture', pic: 'Budi Santoso', tanggalMulai: '2026-03-01', tanggalSelesai: '2026-12-31', status: 'ongoing', prioritas: 'high', progress: 25 },
    ],
  },
  {
    id: 'PRG-003',
    namaProgram: 'Pengembangan SDM',
    deskripsi: 'Program pengembangan kapasitas dan kompetensi sumber daya manusia',
    departemen: 'SDM',
    tahun: 2026,
    status: 'active',
    inisiatif: [
      { id: 'INI-006', nama: 'Program Sertifikasi Profesional', pic: 'Rini Handayani', tanggalMulai: '2026-01-01', tanggalSelesai: '2026-12-31', status: 'ongoing', prioritas: 'medium', progress: 35 },
      { id: 'INI-007', nama: 'Leadership Development Program', pic: 'Dewi Lestari', tanggalMulai: '2026-02-01', tanggalSelesai: '2026-11-30', status: 'ongoing', prioritas: 'medium', progress: 20 },
      { id: 'INI-008', nama: 'Digital Skills Training', pic: 'Nita Wijaya', tanggalMulai: '2026-04-01', tanggalSelesai: '2026-10-31', status: 'planning', prioritas: 'low', progress: 0 },
    ],
  },
  {
    id: 'PRG-004',
    namaProgram: 'Optimisasi Proses Bisnis',
    deskripsi: 'Program untuk meningkatkan efisiensi dan efektivitas proses bisnis',
    departemen: 'Operasional',
    tahun: 2026,
    status: 'active',
    inisiatif: [
      { id: 'INI-009', nama: 'Business Process Reengineering', pic: 'Bambang Sutrisno', tanggalMulai: '2026-01-15', tanggalSelesai: '2026-07-31', status: 'ongoing', prioritas: 'high', progress: 60 },
    ],
  },
];

// Labels & Colors
const STATUS_LABELS: Record<Inisiatif['status'], string> = {
  planning: 'Perencanaan',
  ongoing: 'Berjalan',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
};

const PRIORITAS_LABELS: Record<Inisiatif['prioritas'], string> = {
  high: 'Tinggi',
  medium: 'Sedang',
  low: 'Rendah',
};

const PROGRAM_STATUS_LABELS: Record<Program['status'], string> = {
  active: 'Aktif',
  completed: 'Selesai',
  archived: 'Diarsipkan',
};

const getStatusColor = (status: Inisiatif['status']) => {
  switch (status) {
    case 'completed': return '#31A24C';
    case 'cancelled': return '#FF3B30';
    case 'ongoing': return '#007AFF';
    case 'planning': return '#FF9500';
    default: return '#86868b';
  }
};

const getPrioritasColor = (prioritas: Inisiatif['prioritas']) => {
  switch (prioritas) {
    case 'high': return '#FF3B30';
    case 'medium': return '#FF9500';
    case 'low': return '#34C759';
    default: return '#86868b';
  }
};

const getProgramStatusColor = (status: Program['status']) => {
  switch (status) {
    case 'active': return '#007AFF';
    case 'completed': return '#31A24C';
    case 'archived': return '#86868b';
    default: return '#86868b';
  }
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
};

const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

function ProgramList() {
  const [programs, setPrograms] = useState<Program[]>(DUMMY_PROGRAMS);
  const [keyword, setKeyword] = useState('');
  const [expandedPrograms, setExpandedPrograms] = useState<Set<string>>(new Set(DUMMY_PROGRAMS.map(p => p.id)));
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedItem, setSelectedItem] = useState<{ type: 'program' | 'inisiatif'; id: string; programId?: string } | null>(null);
  
  // Filter state
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedDepartemen, setSelectedDepartemen] = useState<Set<string>>(new Set());
  const [selectedProgramStatus, setSelectedProgramStatus] = useState<Set<string>>(new Set());
  
  // Dialog states
  const [showAddProgramDialog, setShowAddProgramDialog] = useState(false);
  const [showAddInisiatifDialog, setShowAddInisiatifDialog] = useState(false);
  const [targetProgramId, setTargetProgramId] = useState<string>('');
  
  // Form states
  const [programForm, setProgramForm] = useState({
    namaProgram: '',
    deskripsi: '',
    departemen: '',
    tahun: new Date().getFullYear(),
  });
  
  const [inisiatifForm, setInisiatifForm] = useState({
    nama: '',
    pic: '',
    tanggalMulai: '',
    tanggalSelesai: '',
    status: 'planning' as Inisiatif['status'],
    prioritas: 'medium' as Inisiatif['prioritas'],
  });

  // Toggle expand/collapse
  const toggleExpand = (programId: string) => {
    setExpandedPrograms(prev => {
      const newSet = new Set(prev);
      if (newSet.has(programId)) {
        newSet.delete(programId);
      } else {
        newSet.add(programId);
      }
      return newSet;
    });
  };

  // Menu handlers
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, type: 'program' | 'inisiatif', id: string, programId?: string) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
    setSelectedItem({ type, id, programId });
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedItem(null);
  };

  // Filter handlers
  const handleFilterOpen = (event: React.MouseEvent<HTMLElement>) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };

  const handleDepartemenChange = (dep: string) => {
    const newSet = new Set(selectedDepartemen);
    if (newSet.has(dep)) {
      newSet.delete(dep);
    } else {
      newSet.add(dep);
    }
    setSelectedDepartemen(newSet);
  };

  const handleProgramStatusChange = (status: string) => {
    const newSet = new Set(selectedProgramStatus);
    if (newSet.has(status)) {
      newSet.delete(status);
    } else {
      newSet.add(status);
    }
    setSelectedProgramStatus(newSet);
  };

  const handleResetFilter = () => {
    setSelectedDepartemen(new Set());
    setSelectedProgramStatus(new Set());
  };

  // Get unique departemen
  const uniqueDepartemen = [...new Set(programs.map(p => p.departemen))];

  // Add inisiatif to specific program
  const handleOpenAddInisiatif = (programId: string) => {
    setTargetProgramId(programId);
    setInisiatifForm({
      nama: '',
      pic: '',
      tanggalMulai: '',
      tanggalSelesai: '',
      status: 'planning',
      prioritas: 'medium',
    });
    setShowAddInisiatifDialog(true);
  };

  const handleAddInisiatif = () => {
    if (!inisiatifForm.nama || !inisiatifForm.pic) return;
    
    const newInisiatif: Inisiatif = {
      id: `INI-${Date.now()}`,
      nama: inisiatifForm.nama,
      pic: inisiatifForm.pic,
      tanggalMulai: inisiatifForm.tanggalMulai,
      tanggalSelesai: inisiatifForm.tanggalSelesai,
      status: inisiatifForm.status,
      prioritas: inisiatifForm.prioritas,
      progress: 0,
    };

    setPrograms(prev => prev.map(p => 
      p.id === targetProgramId 
        ? { ...p, inisiatif: [...p.inisiatif, newInisiatif] }
        : p
    ));
    setShowAddInisiatifDialog(false);
  };

  // Add program
  const handleAddProgram = () => {
    if (!programForm.namaProgram || !programForm.departemen) return;
    
    const newProgram: Program = {
      id: `PRG-${Date.now()}`,
      namaProgram: programForm.namaProgram,
      deskripsi: programForm.deskripsi,
      departemen: programForm.departemen,
      tahun: programForm.tahun,
      status: 'active',
      inisiatif: [],
    };

    setPrograms(prev => [...prev, newProgram]);
    setExpandedPrograms(prev => new Set([...prev, newProgram.id]));
    setShowAddProgramDialog(false);
    setProgramForm({ namaProgram: '', deskripsi: '', departemen: '', tahun: new Date().getFullYear() });
  };

  // Delete handlers
  const handleDelete = () => {
    if (!selectedItem) return;
    
    if (selectedItem.type === 'program') {
      setPrograms(prev => prev.filter(p => p.id !== selectedItem.id));
    } else if (selectedItem.type === 'inisiatif' && selectedItem.programId) {
      setPrograms(prev => prev.map(p => 
        p.id === selectedItem.programId
          ? { ...p, inisiatif: p.inisiatif.filter(i => i.id !== selectedItem.id) }
          : p
      ));
    }
    handleMenuClose();
  };

  // Calculate program progress
  const calculateProgramProgress = (program: Program) => {
    if (program.inisiatif.length === 0) return 0;
    return Math.round(program.inisiatif.reduce((acc, ini) => acc + ini.progress, 0) / program.inisiatif.length);
  };

  // Filter programs
  const filteredPrograms = programs.filter(p => {
    const matchKeyword = p.namaProgram.toLowerCase().includes(keyword.toLowerCase()) ||
      p.departemen.toLowerCase().includes(keyword.toLowerCase()) ||
      p.inisiatif.some(i => i.nama.toLowerCase().includes(keyword.toLowerCase()));
    
    const matchDepartemen = selectedDepartemen.size === 0 || selectedDepartemen.has(p.departemen);
    const matchStatus = selectedProgramStatus.size === 0 || selectedProgramStatus.has(p.status);
    
    return matchKeyword && matchDepartemen && matchStatus;
  });

  return (
    <Box sx={{ 
      p: 3.5,
      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.4) 0%, rgba(240, 245, 250, 0.3) 100%)',
      minHeight: '100vh',
    }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography 
          variant="h4" 
          sx={{ 
            fontWeight: 700, 
            color: '#1d1d1f',
            letterSpacing: '-0.02em',
            mb: 0.5,
          }}
        >
          Daftar Program
        </Typography>
        <Typography variant="body1" sx={{ color: '#86868b' }}>
          Kelola program dan inisiatif organisasi
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
              placeholder="Cari program atau inisiatif..."
              size="small"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              sx={{ 
                width: 300,
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
                color: selectedDepartemen.size > 0 || selectedProgramStatus.size > 0 ? '#DA251C' : '#86868b',
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
            onClick={() => setShowAddProgramDialog(true)}
            sx={{
              background: 'linear-gradient(135deg, #DA251C 0%, #FF4D45 100%)',
              fontWeight: 500,
              px: 2.5,
              '&:hover': {
                background: 'linear-gradient(135deg, #B91C14 0%, #D83A32 100%)',
              },
            }}
          >
            Tambah Program
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

            {/* Departemen Filter */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#1d1d1f', mb: 1 }}>
                Departemen
              </Typography>
              <FormGroup>
                {uniqueDepartemen.map(dep => (
                  <FormControlLabel
                    key={dep}
                    control={
                      <Checkbox
                        size="small"
                        checked={selectedDepartemen.has(dep)}
                        onChange={() => handleDepartemenChange(dep)}
                      />
                    }
                    label={<Typography variant="body2">{dep}</Typography>}
                  />
                ))}
              </FormGroup>
            </Box>

            <Box sx={{ borderTop: '1px solid rgba(0,0,0,0.06)', my: 2 }} />

            {/* Status Filter */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#1d1d1f', mb: 1 }}>
                Status Program
              </Typography>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={selectedProgramStatus.has('active')}
                      onChange={() => handleProgramStatusChange('active')}
                    />
                  }
                  label={<Typography variant="body2">Aktif</Typography>}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={selectedProgramStatus.has('completed')}
                      onChange={() => handleProgramStatusChange('completed')}
                    />
                  }
                  label={<Typography variant="body2">Selesai</Typography>}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={selectedProgramStatus.has('archived')}
                      onChange={() => handleProgramStatusChange('archived')}
                    />
                  }
                  label={<Typography variant="body2">Diarsipkan</Typography>}
                />
              </FormGroup>
            </Box>

            <Box sx={{ borderTop: '1px solid rgba(0,0,0,0.06)', my: 2 }} />

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              <Button
                size="small"
                onClick={handleResetFilter}
                sx={{ color: '#86868b' }}
              >
                Reset
              </Button>
              <Button
                size="small"
                variant="contained"
                onClick={handleFilterClose}
                sx={{
                  bgcolor: '#DA251C',
                  '&:hover': { bgcolor: '#B91C14' },
                }}
              >
                Terapkan
              </Button>
            </Box>
          </Box>
        </Popover>

        {/* Table */}
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#fafafa' }}>
                <TableCell sx={{ width: 50, fontWeight: 600, color: '#1d1d1f' }} />
                <TableCell sx={{ fontWeight: 600, color: '#1d1d1f' }}>Program / Inisiatif</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#1d1d1f' }}>PIC</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#1d1d1f' }}>Timeline</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#1d1d1f' }}>Progress</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#1d1d1f' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#1d1d1f' }}>Prioritas</TableCell>
                <TableCell sx={{ width: 60 }} />
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPrograms.map((program) => (
                <>
                  {/* Program Row */}
                  <TableRow
                    key={program.id}
                    onClick={() => toggleExpand(program.id)}
                    sx={{
                      cursor: 'pointer',
                      bgcolor: '#fff',
                      '&:hover': {
                        bgcolor: 'rgba(0, 0, 0, 0.02)',
                      },
                    }}
                  >
                    <TableCell>
                      <IconButton size="small" sx={{ color: '#86868b' }}>
                        {expandedPrograms.has(program.id) ? <ExpandIcon /> : <CollapseIcon />}
                      </IconButton>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box
                          sx={{
                            width: 36,
                            height: 36,
                            borderRadius: 1.5,
                            background: 'linear-gradient(135deg, #DA251C 0%, #FF4D45 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <FolderRounded sx={{ color: '#fff', fontSize: 18 }} />
                        </Box>
                        <Box>
                          <Typography sx={{ fontWeight: 600, color: '#1d1d1f', fontSize: '0.9rem' }}>
                            {program.namaProgram}
                          </Typography>
                          <Typography sx={{ fontSize: '0.75rem', color: '#86868b' }}>
                            {program.departemen} • {program.inisiatif.length} inisiatif
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <AvatarGroup max={3} sx={{ justifyContent: 'flex-start' }}>
                        {[...new Set(program.inisiatif.map(i => i.pic))].map((pic, idx) => (
                          <Tooltip key={idx} title={pic}>
                            <Avatar
                              sx={{
                                width: 26,
                                height: 26,
                                fontSize: '0.65rem',
                                bgcolor: ['#DA251C', '#FF9500', '#007AFF', '#34C759', '#AF52DE'][idx % 5],
                              }}
                            >
                              {getInitials(pic)}
                            </Avatar>
                          </Tooltip>
                        ))}
                      </AvatarGroup>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ color: '#86868b', fontSize: '0.85rem' }}>
                        Tahun {program.tahun}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={calculateProgramProgress(program)}
                          sx={{
                            width: 80,
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: 'rgba(0, 0, 0, 0.08)',
                            '& .MuiLinearProgress-bar': {
                              borderRadius: 3,
                              background: calculateProgramProgress(program) === 100 
                                ? 'linear-gradient(90deg, #34C759, #31A24C)'
                                : 'linear-gradient(90deg, #DA251C, #FF4D45)',
                            },
                          }}
                        />
                        <Typography sx={{ color: '#1d1d1f', fontSize: '0.8rem', fontWeight: 500 }}>
                          {calculateProgramProgress(program)}%
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={PROGRAM_STATUS_LABELS[program.status]}
                        size="small"
                        sx={{
                          bgcolor: `${getProgramStatusColor(program.status)}15`,
                          color: getProgramStatusColor(program.status),
                          fontWeight: 500,
                          fontSize: '0.75rem',
                        }}
                      />
                    </TableCell>
                    <TableCell />
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, 'program', program.id)}
                        sx={{ color: '#86868b', '&:hover': { color: '#1d1d1f' } }}
                      >
                        <MoreVertIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>

                  {/* Inisiatif Rows (Collapsible) */}
                  <TableRow>
                    <TableCell colSpan={8} sx={{ p: 0, border: 'none' }}>
                      <Collapse in={expandedPrograms.has(program.id)} timeout="auto" unmountOnExit>
                        <Box sx={{ bgcolor: '#fafafa' }}>
                          {program.inisiatif.map((inisiatif, idx) => (
                            <Box
                              key={inisiatif.id}
                              sx={{
                                display: 'grid',
                                gridTemplateColumns: '50px 1fr 150px 180px 150px 100px 90px 60px',
                                alignItems: 'center',
                                py: 1.5,
                                px: 2,
                                borderBottom: idx < program.inisiatif.length - 1 ? '1px solid rgba(0, 0, 0, 0.04)' : 'none',
                                '&:hover': {
                                  bgcolor: 'rgba(0, 0, 0, 0.02)',
                                },
                              }}
                            >
                              {/* Indent indicator */}
                              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                                <Box sx={{ 
                                  width: 2, 
                                  height: 20, 
                                  bgcolor: '#DA251C',
                                  borderRadius: 1,
                                  opacity: 0.3,
                                }} />
                              </Box>
                              
                              {/* Nama Inisiatif */}
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Box
                                  sx={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: 1,
                                    bgcolor: 'rgba(0, 0, 0, 0.04)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                >
                                  <AssignmentRounded sx={{ color: '#86868b', fontSize: 16 }} />
                                </Box>
                                <Typography sx={{ color: '#1d1d1f', fontSize: '0.85rem' }}>
                                  {inisiatif.nama}
                                </Typography>
                              </Box>

                              {/* PIC */}
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Avatar
                                  sx={{
                                    width: 22,
                                    height: 22,
                                    fontSize: '0.6rem',
                                    bgcolor: '#DA251C',
                                  }}
                                >
                                  {getInitials(inisiatif.pic)}
                                </Avatar>
                                <Typography sx={{ color: '#86868b', fontSize: '0.8rem' }}>
                                  {inisiatif.pic}
                                </Typography>
                              </Box>

                              {/* Timeline */}
                              <Typography sx={{ color: '#86868b', fontSize: '0.8rem' }}>
                                {formatDate(inisiatif.tanggalMulai)} - {formatDate(inisiatif.tanggalSelesai)}
                              </Typography>

                              {/* Progress */}
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <LinearProgress
                                  variant="determinate"
                                  value={inisiatif.progress}
                                  sx={{
                                    width: 60,
                                    height: 4,
                                    borderRadius: 2,
                                    backgroundColor: 'rgba(0, 0, 0, 0.08)',
                                    '& .MuiLinearProgress-bar': {
                                      borderRadius: 2,
                                      bgcolor: inisiatif.progress === 100 ? '#34C759' : '#DA251C',
                                    },
                                  }}
                                />
                                <Typography sx={{ color: '#86868b', fontSize: '0.75rem' }}>
                                  {inisiatif.progress}%
                                </Typography>
                              </Box>

                              {/* Status */}
                              <Chip
                                label={STATUS_LABELS[inisiatif.status]}
                                size="small"
                                sx={{
                                  height: 22,
                                  fontSize: '0.7rem',
                                  bgcolor: `${getStatusColor(inisiatif.status)}15`,
                                  color: getStatusColor(inisiatif.status),
                                  fontWeight: 500,
                                }}
                              />

                              {/* Prioritas */}
                              <Chip
                                label={PRIORITAS_LABELS[inisiatif.prioritas]}
                                size="small"
                                sx={{
                                  height: 22,
                                  fontSize: '0.7rem',
                                  bgcolor: `${getPrioritasColor(inisiatif.prioritas)}15`,
                                  color: getPrioritasColor(inisiatif.prioritas),
                                  fontWeight: 500,
                                }}
                              />

                              {/* Actions */}
                              <IconButton
                                size="small"
                                onClick={(e) => handleMenuOpen(e, 'inisiatif', inisiatif.id, program.id)}
                                sx={{ color: '#86868b', '&:hover': { color: '#1d1d1f' } }}
                              >
                                <MoreVertIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          ))}

                          {/* Add Inisiatif Button */}
                          <Box
                            onClick={() => handleOpenAddInisiatif(program.id)}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              py: 1.5,
                              px: 2,
                              pl: 7,
                              cursor: 'pointer',
                              borderTop: '1px dashed rgba(218, 37, 28, 0.2)',
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                bgcolor: 'rgba(218, 37, 28, 0.04)',
                              },
                            }}
                          >
                            <AddIcon sx={{ fontSize: 16, color: '#DA251C' }} />
                            <Typography sx={{ fontSize: '0.8rem', color: '#DA251C', fontWeight: 500 }}>
                              Tambah Inisiatif
                            </Typography>
                          </Box>
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Empty State */}
        {filteredPrograms.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <FolderRounded sx={{ fontSize: 56, color: '#d1d1d6', mb: 2 }} />
            <Typography sx={{ color: '#86868b', fontSize: '1rem', mb: 0.5 }}>
              {keyword ? 'Tidak ada program yang ditemukan' : 'Belum ada program'}
            </Typography>
            <Typography sx={{ color: '#aeaeb2', fontSize: '0.875rem', mb: 2 }}>
              {keyword ? 'Coba kata kunci lain' : 'Mulai dengan menambahkan program baru'}
            </Typography>
            {!keyword && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setShowAddProgramDialog(true)}
                sx={{
                  background: 'linear-gradient(135deg, #DA251C 0%, #FF4D45 100%)',
                  fontWeight: 500,
                  '&:hover': {
                    background: 'linear-gradient(135deg, #B91C14 0%, #D83A32 100%)',
                  },
                }}
              >
                Tambah Program
              </Button>
            )}
          </Box>
        )}
      </Paper>

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
            minWidth: 150,
          },
        }}
      >
        <MenuItem onClick={handleMenuClose} sx={{ gap: 1.5 }}>
          <EditIcon fontSize="small" sx={{ color: '#007AFF' }} />
          <Typography sx={{ fontSize: '0.875rem' }}>Edit</Typography>
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ gap: 1.5, color: '#FF3B30' }}>
          <DeleteIcon fontSize="small" />
          <Typography sx={{ fontSize: '0.875rem' }}>Hapus</Typography>
        </MenuItem>
      </Menu>

      {/* Add Program Dialog */}
      <Dialog
        open={showAddProgramDialog}
        onClose={() => setShowAddProgramDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 600, color: '#1d1d1f' }}>
          Tambah Program Baru
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            <TextField
              label="Nama Program"
              fullWidth
              value={programForm.namaProgram}
              onChange={(e) => setProgramForm({ ...programForm, namaProgram: e.target.value })}
              required
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&.Mui-focused fieldset': {
                    borderColor: '#DA251C',
                  },
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#DA251C',
                },
              }}
            />
            <TextField
              label="Deskripsi"
              fullWidth
              multiline
              rows={3}
              value={programForm.deskripsi}
              onChange={(e) => setProgramForm({ ...programForm, deskripsi: e.target.value })}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&.Mui-focused fieldset': {
                    borderColor: '#DA251C',
                  },
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#DA251C',
                },
              }}
            />
            <TextField
              label="Departemen"
              fullWidth
              value={programForm.departemen}
              onChange={(e) => setProgramForm({ ...programForm, departemen: e.target.value })}
              required
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&.Mui-focused fieldset': {
                    borderColor: '#DA251C',
                  },
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#DA251C',
                },
              }}
            />
            <TextField
              label="Tahun"
              type="number"
              fullWidth
              value={programForm.tahun}
              onChange={(e) => setProgramForm({ ...programForm, tahun: parseInt(e.target.value) })}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&.Mui-focused fieldset': {
                    borderColor: '#DA251C',
                  },
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#DA251C',
                },
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 1 }}>
          <Button onClick={() => setShowAddProgramDialog(false)} sx={{ color: '#86868b' }}>
            Batal
          </Button>
          <Button
            variant="contained"
            onClick={handleAddProgram}
            sx={{
              background: 'linear-gradient(135deg, #DA251C 0%, #FF4D45 100%)',
              fontWeight: 500,
              px: 3,
              '&:hover': {
                background: 'linear-gradient(135deg, #B91C14 0%, #D83A32 100%)',
              },
            }}
          >
            Tambah
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Inisiatif Dialog */}
      <Dialog
        open={showAddInisiatifDialog}
        onClose={() => setShowAddInisiatifDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 600, color: '#1d1d1f' }}>
          Tambah Inisiatif Baru
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            <TextField
              label="Nama Inisiatif"
              fullWidth
              value={inisiatifForm.nama}
              onChange={(e) => setInisiatifForm({ ...inisiatifForm, nama: e.target.value })}
              required
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&.Mui-focused fieldset': {
                    borderColor: '#DA251C',
                  },
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#DA251C',
                },
              }}
            />
            <TextField
              label="PIC (Person In Charge)"
              fullWidth
              value={inisiatifForm.pic}
              onChange={(e) => setInisiatifForm({ ...inisiatifForm, pic: e.target.value })}
              required
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&.Mui-focused fieldset': {
                    borderColor: '#DA251C',
                  },
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#DA251C',
                },
              }}
            />
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                label="Tanggal Mulai"
                type="date"
                fullWidth
                value={inisiatifForm.tanggalMulai}
                onChange={(e) => setInisiatifForm({ ...inisiatifForm, tanggalMulai: e.target.value })}
                InputLabelProps={{ shrink: true }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&.Mui-focused fieldset': {
                      borderColor: '#DA251C',
                    },
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#DA251C',
                  },
                }}
              />
              <TextField
                label="Tanggal Selesai"
                type="date"
                fullWidth
                value={inisiatifForm.tanggalSelesai}
                onChange={(e) => setInisiatifForm({ ...inisiatifForm, tanggalSelesai: e.target.value })}
                InputLabelProps={{ shrink: true }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&.Mui-focused fieldset': {
                      borderColor: '#DA251C',
                    },
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#DA251C',
                  },
                }}
              />
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={inisiatifForm.status}
                  label="Status"
                  onChange={(e) => setInisiatifForm({ ...inisiatifForm, status: e.target.value as Inisiatif['status'] })}
                >
                  <MenuItem value="planning">Perencanaan</MenuItem>
                  <MenuItem value="ongoing">Berjalan</MenuItem>
                  <MenuItem value="completed">Selesai</MenuItem>
                  <MenuItem value="cancelled">Dibatalkan</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Prioritas</InputLabel>
                <Select
                  value={inisiatifForm.prioritas}
                  label="Prioritas"
                  onChange={(e) => setInisiatifForm({ ...inisiatifForm, prioritas: e.target.value as Inisiatif['prioritas'] })}
                >
                  <MenuItem value="high">Tinggi</MenuItem>
                  <MenuItem value="medium">Sedang</MenuItem>
                  <MenuItem value="low">Rendah</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 1 }}>
          <Button onClick={() => setShowAddInisiatifDialog(false)} sx={{ color: '#86868b' }}>
            Batal
          </Button>
          <Button
            variant="contained"
            onClick={handleAddInisiatif}
            sx={{
              background: 'linear-gradient(135deg, #DA251C 0%, #FF4D45 100%)',
              fontWeight: 500,
              px: 3,
              '&:hover': {
                background: 'linear-gradient(135deg, #B91C14 0%, #D83A32 100%)',
              },
            }}
          >
            Tambah
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default ProgramList;
