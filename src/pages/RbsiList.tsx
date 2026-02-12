import { useState } from 'react';
import {
  Box,
  TextField,
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
  Collapse,
  TablePagination,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  TuneRounded,
  KeyboardArrowDown as ArrowDownIcon,
  KeyboardArrowUp as ArrowUpIcon,
  OpenInNew as OpenInNewIcon,
  Close as CloseIcon,
  FolderOpenRounded,
  AssignmentRounded,
} from '@mui/icons-material';

// Interface untuk Inisiatif
interface Initiative {
  id: string;
  namaInisiatif: string;
  tanggalSubmit: string;
  linkDokumen: string;
  status: 'pending' | 'disetujui' | 'tidak_disetujui';
}

// Interface untuk data Program
interface ProgramData {
  id: string;
  namaProgram: string;
  totalInisiatif: number;
  tanggalMulai: string;
  status: 'active' | 'inactive' | 'completed';
  inisiatif: Initiative[];
}

// Dummy data Program - 10 programs dengan inisiatif dari OJK KEP 40 (2025)
const DUMMY_PROGRAMS: ProgramData[] = [
  {
    id: '1',
    namaProgram: '3.1 – Aplikasi Pelaporan',
    totalInisiatif: 6,
    tanggalMulai: '2025-01-01',
    status: 'active',
    inisiatif: [
      { id: '1-1', namaInisiatif: '3.1.1 – Aplikasi Pelaporan Online OJK (APOLO)', tanggalSubmit: '2026-01-15T10:00:00Z', linkDokumen: 'https://docs.google.com/document/d/apolo', status: 'disetujui' },
      { id: '1-2', namaInisiatif: '3.1.2 – Sistem Penyampaian Informasi Nasabah Asing (SIPINA)', tanggalSubmit: '2026-01-20T11:30:00Z', linkDokumen: 'https://docs.google.com/document/d/sipina', status: 'disetujui' },
      { id: '1-3', namaInisiatif: '3.1.3 – Sistem Informasi Pelaporan Terintegrasi (SILARAS)', tanggalSubmit: '2026-02-01T14:00:00Z', linkDokumen: 'https://docs.google.com/document/d/silaras', status: 'disetujui' },
      { id: '1-4', namaInisiatif: '3.1.4 – E-Reporting', tanggalSubmit: '2026-02-05T09:30:00Z', linkDokumen: 'https://docs.google.com/document/d/ereporting', status: 'pending' },
      { id: '1-5', namaInisiatif: '3.1.5 – Pusat Data Fintech Lending (Pusdafil)', tanggalSubmit: '2026-02-08T11:15:00Z', linkDokumen: 'https://docs.google.com/document/d/pusdafil', status: 'disetujui' },
      { id: '1-6', namaInisiatif: '3.1.6 – SI Pelaporan Edukasi dan Perlindungan Konsumen OJK (SIPEDULI)', tanggalSubmit: '2026-02-12T13:45:00Z', linkDokumen: 'https://docs.google.com/document/d/sipeduli', status: 'pending' },
    ],
  },
  {
    id: '2',
    namaProgram: '3.2 – Aplikasi Bidang Pengawasan Perbankan',
    totalInisiatif: 11,
    tanggalMulai: '2024-06-01',
    status: 'active',
    inisiatif: [
      { id: '2-1', namaInisiatif: '3.2.1 – Aplikasi Pemeriksaan Bank Umum', tanggalSubmit: '2026-01-18T09:15:00Z', linkDokumen: 'https://docs.google.com/document/d/pembanku', status: 'disetujui' },
      { id: '2-2', namaInisiatif: '3.2.2 – Aplikasi Pemeriksaan BPR/BPRS', tanggalSubmit: '2026-01-25T15:45:00Z', linkDokumen: 'https://docs.google.com/document/d/pembprbprs', status: 'disetujui' },
      { id: '2-3', namaInisiatif: '3.2.3 – Data Pokok (Dapok) Perbankan', tanggalSubmit: '2026-02-05T10:30:00Z', linkDokumen: 'https://docs.google.com/document/d/dapok', status: 'disetujui' },
      { id: '2-4', namaInisiatif: '3.2.4 – Executive Monitoring Dashboard', tanggalSubmit: '2026-02-10T12:00:00Z', linkDokumen: 'https://docs.google.com/document/d/emd', status: 'pending' },
      { id: '2-5', namaInisiatif: '3.2.5 – Supervision Dashboard', tanggalSubmit: '2026-02-12T14:30:00Z', linkDokumen: 'https://docs.google.com/document/d/supd', status: 'disetujui' },
      { id: '2-6', namaInisiatif: '3.2.6 – OJK-BOX (OBOX) Modul Pasar Modal: 2023, 2025, 2026', tanggalSubmit: '2026-02-15T10:15:00Z', linkDokumen: 'https://docs.google.com/document/d/obox', status: 'pending' },
      { id: '2-7', namaInisiatif: '3.2.7 – SI Pengawasan (SIP) BPR/BPRS', tanggalSubmit: '2026-02-18T11:45:00Z', linkDokumen: 'https://docs.google.com/document/d/sipbprbprs', status: 'disetujui' },
      { id: '2-8', namaInisiatif: '3.2.8 – SIP Konglomerasi Keuangan', tanggalSubmit: '2026-02-20T13:20:00Z', linkDokumen: 'https://docs.google.com/document/d/sipkongkeu', status: 'disetujui' },
      { id: '2-9', namaInisiatif: '3.2.9 – SI Penanganan Dugaan Pelanggaran (SIPEDANG)', tanggalSubmit: '2026-02-22T15:00:00Z', linkDokumen: 'https://docs.google.com/document/d/sipedang', status: 'tidak_disetujui' },
      { id: '2-10', namaInisiatif: '3.2.10 – SIP', tanggalSubmit: '2026-02-24T09:30:00Z', linkDokumen: 'https://docs.google.com/document/d/sip', status: 'pending' },
      { id: '2-11', namaInisiatif: '3.2.11 – SIP Akuntan Publik/Kantor Akuntan Publik (AP/KAP)', tanggalSubmit: '2026-02-25T14:45:00Z', linkDokumen: 'https://docs.google.com/document/d/sipapkap', status: 'disetujui' },
    ],
  },
  {
    id: '3',
    namaProgram: '3.3 – Aplikasi Bidang Pengawasan Pasar Modal, Keuangan Derivatif, dan Bursa Karbon',
    totalInisiatif: 3,
    tanggalMulai: '2024-09-01',
    status: 'active',
    inisiatif: [
      { id: '3-1', namaInisiatif: '3.3.1 – SI Pengawasan Pasar Modal Terpadu (SIPM) dengan Migrasi Sumber Data dan Modul Pengawasan Bursa Karbon (2025-2027)', tanggalSubmit: '2026-02-06T09:15:00Z', linkDokumen: 'https://docs.google.com/document/d/sipm', status: 'disetujui' },
      { id: '3-2', namaInisiatif: '3.3.2 – Interoperabilitas SIPM dengan Aplikasi Internal dan Eksternal OJK', tanggalSubmit: '2026-02-12T12:45:00Z', linkDokumen: 'https://docs.google.com/document/d/interopsipm', status: 'pending' },
      { id: '3-3', namaInisiatif: '3.3.3 – Portal Web (LHF)', tanggalSubmit: '2026-02-15T15:00:00Z', linkDokumen: 'https://docs.google.com/document/d/lhf', status: 'disetujui' },
    ],
  },
  {
    id: '4',
    namaProgram: '3.4 – Aplikasi Bidang Pengawasan Sektor Perasuransian, Penjaminan, dan Dana Pensiun (PPDP)',
    totalInisiatif: 1,
    tanggalMulai: '2025-03-01',
    status: 'active',
    inisiatif: [
      { id: '4-1', namaInisiatif: '3.4.1 – SIP IKNB Modul PPDP', tanggalSubmit: '2026-02-10T13:15:00Z', linkDokumen: 'https://docs.google.com/document/d/sipppdp', status: 'disetujui' },
    ],
  },
  {
    id: '5',
    namaProgram: '3.5 – Aplikasi Bidang Pengawasan Sektor Lembaga Pembiayaan dan Keuangan Mikro (PVML)',
    totalInisiatif: 2,
    tanggalMulai: '2025-02-01',
    status: 'active',
    inisiatif: [
      { id: '5-1', namaInisiatif: '3.5.1 – SI Lembaga Keuangan Mikro (SILKM)', tanggalSubmit: '2026-02-15T11:45:00Z', linkDokumen: 'https://docs.google.com/document/d/silkm', status: 'disetujui' },
      { id: '5-2', namaInisiatif: '3.5.2 – SIP IKNB Modul PVML', tanggalSubmit: '2026-02-20T14:30:00Z', linkDokumen: 'https://docs.google.com/document/d/sippvml', status: 'pending' },
    ],
  },
  {
    id: '6',
    namaProgram: '3.6 – Aplikasi Bidang IAKD (Inovasi dan Aset Keuangan Digital)',
    totalInisiatif: 2,
    tanggalMulai: '2025-04-01',
    status: 'active',
    inisiatif: [
      { id: '6-1', namaInisiatif: '3.6.1 – Aplikasi terkait Peningkatan Literasi dan Inklusi Keuangan Digital', tanggalSubmit: '2026-02-04T10:00:00Z', linkDokumen: 'https://docs.google.com/document/d/litkeu', status: 'disetujui' },
      { id: '6-2', namaInisiatif: '3.6.2 – SI Pengawasan IAKD (Pengawasan Inovasi Teknologi Sektor Keuangan dan Aset Kripto)', tanggalSubmit: '2026-02-10T14:30:00Z', linkDokumen: 'https://docs.google.com/document/d/siakd', status: 'pending' },
    ],
  },
  {
    id: '7',
    namaProgram: '3.7 – Aplikasi Bidang Pengawasan Perilaku Pelaku Usaha Jasa Keuangan (PEPK)',
    totalInisiatif: 11,
    tanggalMulai: '2024-08-15',
    status: 'active',
    inisiatif: [
      { id: '7-1', namaInisiatif: '3.7.1 – SikapiUangmu', tanggalSubmit: '2026-02-06T09:15:00Z', linkDokumen: 'https://docs.google.com/document/d/sikapi', status: 'disetujui' },
      { id: '7-2', namaInisiatif: '3.7.2 – Mobile App Learning Management System (LMS) Edukasi Keuangan', tanggalSubmit: '2026-02-12T12:45:00Z', linkDokumen: 'https://docs.google.com/document/d/lmsedu', status: 'disetujui' },
      { id: '7-3', namaInisiatif: '3.7.3 – Aplikasi Portal Pelindungan Konsumen (APPK)', tanggalSubmit: '2026-02-15T15:00:00Z', linkDokumen: 'https://docs.google.com/document/d/appk', status: 'pending' },
      { id: '7-4', namaInisiatif: '3.7.4 – Sistem Manajemen Gugatan Perdata', tanggalSubmit: '2026-02-18T10:30:00Z', linkDokumen: 'https://docs.google.com/document/d/smgp', status: 'disetujui' },
      { id: '7-5', namaInisiatif: '3.7.5 – SI Market Conduct Supervision (SI MACS)', tanggalSubmit: '2026-02-20T11:00:00Z', linkDokumen: 'https://docs.google.com/document/d/simacs', status: 'tidak_disetujui' },
      { id: '7-6', namaInisiatif: '3.7.6 – SI Tim Percepatan Akses Keuangan Daerah (SITPAKD)', tanggalSubmit: '2026-02-22T13:45:00Z', linkDokumen: 'https://docs.google.com/document/d/sitpakd', status: 'pending' },
      { id: '7-7', namaInisiatif: '3.7.7 – LOKASIKU', tanggalSubmit: '2026-02-24T14:20:00Z', linkDokumen: 'https://docs.google.com/document/d/lokasiku', status: 'disetujui' },
      { id: '7-8', namaInisiatif: '3.7.8 – Website OJK (Enhancement 2024, Minisite Sustainable Finance)', tanggalSubmit: '2026-02-25T10:15:00Z', linkDokumen: 'https://docs.google.com/document/d/webjk', status: 'disetujui' },
      { id: '7-9', namaInisiatif: '3.7.9 – Sistem Pejabat Pengelola Informasi dan Dokumentasi (PPID) OJK', tanggalSubmit: '2026-02-26T11:30:00Z', linkDokumen: 'https://docs.google.com/document/d/ppid', status: 'pending' },
      { id: '7-10', namaInisiatif: '3.7.10 – Sistem Pengolahan Data Program Satu Rekening Satu Pelajar (KEJAR)', tanggalSubmit: '2026-02-27T15:45:00Z', linkDokumen: 'https://docs.google.com/document/d/kejar', status: 'disetujui' },
      { id: '7-11', namaInisiatif: '3.7.11 – Minisite Satgas Pemberatasan Aktivitas Keuangan Ilegal (PASTI)', tanggalSubmit: '2026-02-28T09:00:00Z', linkDokumen: 'https://docs.google.com/document/d/pasti', status: 'tidak_disetujui' },
    ],
  },
  {
    id: '8',
    namaProgram: '3.8 – Aplikasi Bidang Kebijakan Strategis DPZT (Perizinan Terintegrasi)',
    totalInisiatif: 3,
    tanggalMulai: '2024-07-01',
    status: 'active',
    inisiatif: [
      { id: '8-1', namaInisiatif: '3.8.1 – Sistem Perizinan dan Registrasi Terintegrasi (SPRINT) dan Interoperabilitas dengan SRO', tanggalSubmit: '2026-01-25T09:30:00Z', linkDokumen: 'https://docs.google.com/document/d/sprint', status: 'disetujui' },
      { id: '8-2', namaInisiatif: '3.8.2 – SI Pelaku di Lembaga Jasa Keuangan Terintegrasi (SIPUTRI)', tanggalSubmit: '2026-02-01T14:15:00Z', linkDokumen: 'https://docs.google.com/document/d/siputri', status: 'pending' },
      { id: '8-3', namaInisiatif: '3.8.3 – SI Pelaku di SJK (SIPELAKU)', tanggalSubmit: '2026-02-05T10:45:00Z', linkDokumen: 'https://docs.google.com/document/d/sipelaku', status: 'disetujui' },
    ],
  },
  {
    id: '9',
    namaProgram: '3.9 – Aplikasi Bidang Kebijakan Strategis DPDS (Pengelolaan Data dan Statistik)',
    totalInisiatif: 12,
    tanggalMulai: '2024-05-15',
    status: 'active',
    inisiatif: [
      { id: '9-1', namaInisiatif: '3.9.1 – EDW SJK Terintegrasi', tanggalSubmit: '2026-02-03T08:30:00Z', linkDokumen: 'https://docs.google.com/document/d/edwsjk', status: 'disetujui' },
      { id: '9-2', namaInisiatif: '3.9.2 – BDA (Business Data Analytics)', tanggalSubmit: '2026-02-08T11:15:00Z', linkDokumen: 'https://docs.google.com/document/d/bda', status: 'disetujui' },
      { id: '9-3', namaInisiatif: '3.9.3 – Portal Data dan Metadata SJK Terintegrasi', tanggalSubmit: '2026-02-12T13:45:00Z', linkDokumen: 'https://docs.google.com/document/d/portal', status: 'pending' },
      { id: '9-4', namaInisiatif: '3.9.4 – MDM (Master Data Management)', tanggalSubmit: '2026-02-15T10:30:00Z', linkDokumen: 'https://docs.google.com/document/d/mdm', status: 'disetujui' },
      { id: '9-5', namaInisiatif: '3.9.5 – CFS (Consolidated Financial Statistics)', tanggalSubmit: '2026-02-18T14:00:00Z', linkDokumen: 'https://docs.google.com/document/d/cfs', status: 'pending' },
      { id: '9-6', namaInisiatif: '3.9.6 – FSR (Financial Stability Review)', tanggalSubmit: '2026-02-20T09:45:00Z', linkDokumen: 'https://docs.google.com/document/d/fsr', status: 'disetujui' },
      { id: '9-7', namaInisiatif: '3.9.7 – Mobile App Layanan SLIK', tanggalSubmit: '2026-02-22T11:20:00Z', linkDokumen: 'https://docs.google.com/document/d/mslik', status: 'tidak_disetujui' },
      { id: '9-8', namaInisiatif: '3.9.8 – DWH Pasar Modal', tanggalSubmit: '2026-02-24T15:30:00Z', linkDokumen: 'https://docs.google.com/document/d/dwhpm', status: 'disetujui' },
      { id: '9-9', namaInisiatif: '3.9.9 – SLIK (Sistem Layanan Informasi Kreditmu)', tanggalSubmit: '2026-02-25T10:15:00Z', linkDokumen: 'https://docs.google.com/document/d/slik', status: 'pending' },
      { id: '9-10', namaInisiatif: '3.9.10 – RACE (Risk Assessment and Collective Evaluation)', tanggalSubmit: '2026-02-26T12:40:00Z', linkDokumen: 'https://docs.google.com/document/d/race', status: 'disetujui' },
      { id: '9-11', namaInisiatif: '3.9.11 – Dashboard Pusdafil', tanggalSubmit: '2026-02-27T14:50:00Z', linkDokumen: 'https://docs.google.com/document/d/dashpusdafil', status: 'disetujui' },
      { id: '9-12', namaInisiatif: '3.9.12 – CAM (Core Assets Management)', tanggalSubmit: '2026-02-28T09:30:00Z', linkDokumen: 'https://docs.google.com/document/d/cam', status: 'pending' },
    ],
  },
  {
    id: '10',
    namaProgram: '3.10 – Aplikasi Bidang Kebijakan Strategis DINP (Internasional dan APU-PPT)',
    totalInisiatif: 1,
    tanggalMulai: '2024-10-01',
    status: 'completed',
    inisiatif: [
      { id: '10-1', namaInisiatif: '3.10.1 – SI Program APU-PPT (SIGAP)', tanggalSubmit: '2026-02-13T10:30:00Z', linkDokumen: 'https://docs.google.com/document/d/sigap', status: 'disetujui' },
    ],
  },
];



// Status label mapping
const STATUS_LABELS: Record<Initiative['status'], string> = {
  pending: 'Pending',
  disetujui: 'Disetujui',
  tidak_disetujui: 'Tidak Disetujui',
};

const PROGRAM_STATUS_COLORS: Record<ProgramData['status'], string> = {
  active: '#31A24C',
  inactive: '#FF9500',
  completed: '#86868b',
};

// Fungsi helper untuk mendapatkan warna status
const getStatusColor = (status: Initiative['status']): string => {
  switch (status) {
    case 'disetujui':
      return '#31A24C';
    case 'tidak_disetujui':
      return '#FF3B30';
    case 'pending':
      return '#FF9500';
    default:
      return '#86868b';
  }
};

function RbsiList() {
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [programData, setProgramData] = useState<ProgramData[]>(DUMMY_PROGRAMS);
  const [expandedPrograms, setExpandedPrograms] = useState<Set<string>>(new Set(DUMMY_PROGRAMS.map(p => p.id)));
  const [selectedInitiativeId, setSelectedInitiativeId] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // Periode List (Mock)

  // Filter state
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedPeriode, setSelectedPeriode] = useState<Set<string>>(new Set());
  const [selectedStatus] = useState<Set<string>>(new Set());


  const toggleProgramExpand = (programId: string) => {
    const newSet = new Set(expandedPrograms);
    if (newSet.has(programId)) {
      newSet.delete(programId);
    } else {
      newSet.add(programId);
    }
    setExpandedPrograms(newSet);
  };

  const handleFilterOpen = (event: React.MouseEvent<HTMLElement>) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };

  const handlePeriodeChange = (year: string) => {
    const newSet = new Set(selectedPeriode);
    if (newSet.has(year)) {
      newSet.delete(year);
    } else {
      newSet.add(year);
    }
    setSelectedPeriode(newSet);
  };

  // Filter programs logic
  const filteredPrograms = programData.filter(program => {
    // Keyword Filter
    const matchKeyword = program.namaProgram.toLowerCase().includes(keyword.toLowerCase()) ||
      program.inisiatif.some(ini => ini.namaInisiatif.toLowerCase().includes(keyword.toLowerCase()));
    
    // Period Filter (extract year from tanggalMulai)
    const programYear = new Date(program.tanggalMulai).getFullYear().toString();
    const matchPeriode = selectedPeriode.size === 0 || selectedPeriode.has(programYear);

    // Status Filter (if needed, or keep existing logic)
    // Assuming we might want to filter by Program Status in the future, but user asked for Period.
    
    return matchKeyword && matchPeriode;
  });

  const handleInitiativeStatusMenuOpen = (event: React.MouseEvent<HTMLElement>, initiativeId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedInitiativeId(initiativeId);
  };

  const handleStatusMenuClose = () => {
    setAnchorEl(null);
    setSelectedInitiativeId(null);
  };

  const handleInitiativeStatusChange = (newStatus: Initiative['status']) => {
    if (selectedInitiativeId) {
      setProgramData(prev =>
        prev.map(program => ({
          ...program,
          inisiatif: program.inisiatif.map(ini =>
            ini.id === selectedInitiativeId ? { ...ini, status: newStatus } : ini
          )
        }))
      );
    }
    handleStatusMenuClose();
  };


  const paginatedPrograms = filteredPrograms.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

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
          Daftar Program & Inisiatif
        </Typography>
        <Typography variant="body1" sx={{ color: '#86868b' }}>
          Kelola data program dan inisiatif strategis RBSI
        </Typography>
      </Box>
      
      {/* Main Card */}
      
      {/* Main Card */}
      <Paper
        elevation={0}
        sx={{
          width: '100%',
          borderRadius: '16px',
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
              placeholder="Cari nama program..."
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
              onClick={handleFilterOpen}
              sx={{
                color: selectedPeriode.size > 0 ? '#DA251C' : '#86868b',
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
            Tambah Program
          </Button>
        </Box>


        {/* Programs List */}
        <Box sx={{ p: 2.5 }}>
          {paginatedPrograms.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <FolderOpenRounded sx={{ fontSize: 48, color: '#d0d0d0', mb: 2 }} />
              <Typography sx={{ color: '#86868b', fontSize: '0.95rem' }}>
                Tidak ada program yang sesuai dengan pencarian
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {paginatedPrograms.map((program) => {
                const isExpanded = expandedPrograms.has(program.id);
                const filteredInisiatif = selectedStatus.size === 0 
                  ? program.inisiatif 
                  : program.inisiatif.filter(ini => selectedStatus.has(ini.status));

                return (
                  <Paper
                    key={program.id}
                    sx={{
                      border: '1px solid rgba(0, 0, 0, 0.08)',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      transition: 'all 0.2s',
                      '&:hover': {
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                      },
                    }}
                  >
                    {/* Program Header - Expandable */}
                    <Box
                      onClick={() => toggleProgramExpand(program.id)}
                      sx={{
                        p: 2,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer',
                        bgcolor: 'rgba(0, 0, 0, 0.02)',
                        '&:hover': {
                          bgcolor: 'rgba(0, 0, 0, 0.04)',
                        },
                        transition: 'all 0.2s',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                        <IconButton
                          size="small"
                          sx={{
                            transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                            transition: 'transform 0.3s',
                          }}
                        >
                          {isExpanded ? <ArrowDownIcon /> : <ArrowUpIcon sx={{ transform: 'rotate(-180deg)' }} />}
                        </IconButton>
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <FolderOpenRounded sx={{ fontSize: 20, color: '#DA251C' }} />
                            <Typography variant="body1" sx={{ fontWeight: 600, color: '#1d1d1f' }}>
                              {program.namaProgram}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                            <Typography variant="caption" sx={{ color: '#86868b' }}>
                              {program.totalInisiatif} inisiatif
                            </Typography>
                            <Chip
                              label={program.status}
                              size="small"
                              sx={{
                                height: '24px',
                                bgcolor: `${PROGRAM_STATUS_COLORS[program.status]}20`,
                                color: PROGRAM_STATUS_COLORS[program.status],
                                fontWeight: 500,
                                fontSize: '0.75rem',
                                textTransform: 'capitalize',
                              }}
                            />
                            <Typography variant="caption" sx={{ color: '#86868b' }}>
                              Dimulai: {new Date(program.tanggalMulai).toLocaleDateString('id-ID')}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    </Box>

                    {/* Initiatives - Expandable Content */}
                    <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                      <Box sx={{ borderTop: '1px solid rgba(0, 0, 0, 0.06)' }}>
                        {filteredInisiatif.length === 0 ? (
                          <Box sx={{ p: 3, textAlign: 'center', bgcolor: '#f9f9fc' }}>
                            <Typography sx={{ color: '#86868b', fontSize: '0.9rem' }}>
                              Tidak ada inisiatif dengan filter yang dipilih
                            </Typography>
                          </Box>
                        ) : (
                          <Box sx={{ bgcolor: '#f9f9fc' }}>
                            {filteredInisiatif.map((inisiatif, iniIndex) => (
                              <Box
                                key={inisiatif.id}
                                sx={{
                                  p: 2,
                                  borderBottom: iniIndex < filteredInisiatif.length - 1 ? '1px solid rgba(0, 0, 0, 0.04)' : 'none',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  '&:hover': {
                                    bgcolor: 'rgba(0, 0, 0, 0.02)',
                                  },
                                }}
                              >
                                <Box sx={{ flex: 1 }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                    <AssignmentRounded sx={{ fontSize: 18, color: '#86868b' }} />
                                    <Typography variant="body2" sx={{ fontWeight: 500, color: '#1d1d1f' }}>
                                      {inisiatif.namaInisiatif}
                                    </Typography>
                                  </Box>
                                  <Typography variant="caption" sx={{ color: '#86868b' }}>
                                    {new Date(inisiatif.tanggalSubmit).toLocaleDateString('id-ID', {
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric',
                                    })}
                                  </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                  <Tooltip title="Buka dokumen">
                                    <IconButton
                                      component={Link}
                                      href={inisiatif.linkDokumen}
                                      target="_blank"
                                      size="small"
                                      sx={{
                                        color: '#DA251C',
                                        '&:hover': {
                                          bgcolor: 'rgba(218, 37, 28, 0.1)',
                                        },
                                      }}
                                    >
                                      <OpenInNewIcon sx={{ fontSize: 18 }} />
                                    </IconButton>
                                  </Tooltip>
                                  <Box
                                    onClick={(e) => handleInitiativeStatusMenuOpen(e, inisiatif.id)}
                                    sx={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 0.5,
                                      px: 1.5,
                                      py: 0.75,
                                      bgcolor: `${getStatusColor(inisiatif.status)}20`,
                                      borderRadius: '8px',
                                      cursor: 'pointer',
                                      transition: 'all 0.2s',
                                      '&:hover': {
                                        bgcolor: `${getStatusColor(inisiatif.status)}30`,
                                      },
                                    }}
                                  >
                                    <Typography
                                      variant="caption"
                                      sx={{
                                        fontWeight: 500,
                                        color: getStatusColor(inisiatif.status),
                                      }}
                                    >
                                      {STATUS_LABELS[inisiatif.status]}
                                    </Typography>
                                    <ArrowDownIcon sx={{ fontSize: 14, color: getStatusColor(inisiatif.status) }} />
                                  </Box>
                                </Box>
                              </Box>
                            ))}
                          </Box>
                        )}
                      </Box>
                    </Collapse>
                  </Paper>
                );
              })}
            </Box>
          )}
        </Box>

        {/* Pagination */}
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredPrograms.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{
            borderTop: '1px solid rgba(0, 0, 0, 0.06)',
            '& .MuiTablePagination-select': {
              bgcolor: '#f5f5f7',
              borderRadius: '8px',
            },
          }}
        />

        {/* Status Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleStatusMenuClose}
        >
          <MenuItem onClick={() => handleInitiativeStatusChange('disetujui')}>
            <Chip
              label="Disetujui"
              size="small"
              sx={{
                bgcolor: '#31A24C',
                color: 'white',
                fontWeight: 500,
              }}
            />
          </MenuItem>
          <MenuItem onClick={() => handleInitiativeStatusChange('pending')}>
            <Chip
              label="Pending"
              size="small"
              sx={{
                bgcolor: '#FF9500',
                color: 'white',
                fontWeight: 500,
              }}
            />
          </MenuItem>
          <MenuItem onClick={() => handleInitiativeStatusChange('tidak_disetujui')}>
            <Chip
              label="Tidak Disetujui"
              size="small"
              sx={{
                bgcolor: '#FF3B30',
                color: 'white',
                fontWeight: 500,
              }}
            />
          </MenuItem>
        </Menu>
      </Paper>

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
            borderRadius: '16px',
            boxShadow: '0 20px 40px rgba(218, 37, 28, 0.1)',
            overflow: 'hidden',
            border: '1px solid #ffebeb',
          },
        }}
      >
        {/* Header */}
        <Box sx={{
          background: '#DA251C',
          p: 2.5,
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              bgcolor: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <TuneRounded sx={{ fontSize: 16, color: '#DA251C' }} />
            </Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'white' }}>
              Filter
            </Typography>
          </Box>
          <IconButton 
            size="small" 
            onClick={handleFilterClose}
            sx={{ 
              color: 'white', 
              '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } 
            }}
          >
            <CloseIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>
        
        <Box sx={{ p: 3, minWidth: 320, bgcolor: 'white' }}>

          {/* Periode Filter */}
          <Box sx={{ mb: 2.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#1d1d1f', mb: 1.5 }}>
              Periode
            </Typography>
            <FormGroup>
              {['2024', '2025', '2026'].map((year) => (
                <FormControlLabel
                  key={year}
                  control={
                    <Checkbox
                      size="small"
                      checked={selectedPeriode.has(year)}
                      onChange={() => handlePeriodeChange(year)}
                      sx={{
                        '&.Mui-checked': {
                          color: '#DA251C',
                        },
                      }}
                    />
                  }
                  label={<Typography variant="body2" sx={{ fontWeight: 500 }}>{year}</Typography>}
                />
              ))}
            </FormGroup>
          </Box>
        </Box>
      </Popover>
    </Box>
  );
}

export default RbsiList;
