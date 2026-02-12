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
  Chip,
  Collapse,
  LinearProgress,
  Popover,
  Checkbox,
  FormGroup,
  FormControlLabel,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  KeyboardArrowDown as ExpandIcon,
  KeyboardArrowDown as ArrowDownIcon,
  KeyboardArrowUp as ArrowUpIcon,
  KeyboardArrowRight as CollapseIcon,
  FolderRounded,
  AssignmentRounded,
  TuneRounded,
  Close as CloseIcon,
} from '@mui/icons-material';
import { AddProgramModal, AddInisiatifModal, AddPeriodeModal } from '../components/modals';

// Types
interface Inisiatif {
  id: string;
  nama: string;
  tahun: number;
  status: 'planning' | 'ongoing' | 'completed' | 'cancelled';
  progress: number;
  programId: string;
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

// Dummy Data - KEP 40 (2025)
const DUMMY_PROGRAMS: Program[] = [
  {
    id: '3.1',
    namaProgram: '3.1 – Aplikasi Pelaporan',
    deskripsi: 'Aplikasi untuk pengelolaan pelaporan sektor jasa keuangan',
    departemen: 'Pelaporan',
    tahun: 2025,
    status: 'active',
    inisiatif: [
      { id: '3.1.1', nama: '3.1.1 – Aplikasi Pelaporan Online OJK (APOLO)', tahun: 2025, status: 'ongoing', progress: 75, programId: '3.1' },
      { id: '3.1.2', nama: '3.1.2 – Sistem Penyampaian Informasi Nasabah Asing (SIPINA)', tahun: 2025, status: 'ongoing', progress: 60, programId: '3.1' },
      { id: '3.1.3', nama: '3.1.3 – Sistem Informasi Pelaporan Terintegrasi (SILARAS)', tahun: 2025, status: 'ongoing', progress: 45, programId: '3.1' },
      { id: '3.1.4', nama: '3.1.4 – E-Reporting', tahun: 2025, status: 'completed', progress: 100, programId: '3.1' },
      { id: '3.1.5', nama: '3.1.5 – Pusat Data Fintech Lending (Pusdafil)', tahun: 2025, status: 'ongoing', progress: 55, programId: '3.1' },
      { id: '3.1.6', nama: '3.1.6 – SI Pelaporan Edukasi dan Perlindungan Konsumen OJK (SIPEDULI)', tahun: 2025, status: 'planning', progress: 20, programId: '3.1' },
    ],
  },
  {
    id: '3.2',
    namaProgram: '3.2 – Aplikasi Bidang Pengawasan Perbankan',
    deskripsi: 'Aplikasi untuk mendukung pengawasan sektor perbankan',
    departemen: 'Pengawasan Perbankan',
    tahun: 2025,
    status: 'active',
    inisiatif: [
      { id: '3.2.1', nama: '3.2.1 – Aplikasi Pemeriksaan Bank Umum', tahun: 2025, status: 'ongoing', progress: 80, programId: '3.2' },
      { id: '3.2.2', nama: '3.2.2 – Aplikasi Pemeriksaan BPR/BPRS', tahun: 2025, status: 'ongoing', progress: 70, programId: '3.2' },
      { id: '3.2.3', nama: '3.2.3 – Data Pokok (Dapok) Perbankan', tahun: 2025, status: 'completed', progress: 100, programId: '3.2' },
      { id: '3.2.4', nama: '3.2.4 – Executive Monitoring Dashboard', tahun: 2025, status: 'ongoing', progress: 65, programId: '3.2' },
      { id: '3.2.5', nama: '3.2.5 – Supervision Dashboard', tahun: 2025, status: 'ongoing', progress: 50, programId: '3.2' },
      { id: '3.2.6', nama: '3.2.6 – OJK-BOX (OBOX) Modul Pasar Modal', tahun: 2025, status: 'planning', progress: 15, programId: '3.2' },
      { id: '3.2.7', nama: '3.2.7 – SI Pengawasan (SIP) BPR/BPRS', tahun: 2025, status: 'ongoing', progress: 55, programId: '3.2' },
      { id: '3.2.8', nama: '3.2.8 – SIP Konglomerasi Keuangan', tahun: 2025, status: 'ongoing', progress: 40, programId: '3.2' },
      { id: '3.2.9', nama: '3.2.9 – SI Penanganan Dugaan Pelanggaran (SIPEDANG)', tahun: 2025, status: 'ongoing', progress: 35, programId: '3.2' },
      { id: '3.2.10', nama: '3.2.10 – SIP', tahun: 2025, status: 'ongoing', progress: 60, programId: '3.2' },
      { id: '3.2.11', nama: '3.2.11 – SIP Akuntan Publik/Kantor Akuntan Publik (AP/KAP)', tahun: 2025, status: 'planning', progress: 10, programId: '3.2' },
    ],
  },
  {
    id: '3.3',
    namaProgram: '3.3 – Aplikasi Bidang Pengawasan Pasar Modal, Keuangan Derivatif, dan Bursa Karbon',
    deskripsi: 'Aplikasi untuk pengawasan pasar modal dan instrumen keuangan derivatif',
    departemen: 'Pengawasan Pasar Modal',
    tahun: 2025,
    status: 'active',
    inisiatif: [
      { id: '3.3.1', nama: '3.3.1 – SI Pengawasan Pasar Modal Terpadu (SIPM)', tahun: 2025, status: 'ongoing', progress: 45, programId: '3.3' },
      { id: '3.3.2', nama: '3.3.2 – Interoperabilitas SIPM dengan Aplikasi Internal dan Eksternal OJK', tahun: 2025, status: 'planning', progress: 20, programId: '3.3' },
      { id: '3.3.3', nama: '3.3.3 – Portal Web (LHF)', tahun: 2025, status: 'ongoing', progress: 70, programId: '3.3' },
    ],
  },
  {
    id: '3.4',
    namaProgram: '3.4 – Aplikasi Bidang Pengawasan Sektor Perasuransian, Penjaminan, dan Dana Pensiun (PPDP)',
    deskripsi: 'Aplikasi untuk pengawasan sektor asuransi dan dana pensiun',
    departemen: 'Pengawasan PPDP',
    tahun: 2025,
    status: 'active',
    inisiatif: [
      { id: '3.4.1', nama: '3.4.1 – SIP IKNB Modul PPDP', tahun: 2025, status: 'ongoing', progress: 55, programId: '3.4' },
    ],
  },
  {
    id: '3.5',
    namaProgram: '3.5 – Aplikasi Bidang Pengawasan Sektor PVML',
    deskripsi: 'Aplikasi untuk pengawasan Lembaga Pembiayaan, Modal Ventura, LKM, dan LJK Lainnya',
    departemen: 'Pengawasan PVML',
    tahun: 2025,
    status: 'active',
    inisiatif: [
      { id: '3.5.1', nama: '3.5.1 – SI Lembaga Keuangan Mikro (SILKM)', tahun: 2025, status: 'ongoing', progress: 65, programId: '3.5' },
      { id: '3.5.2', nama: '3.5.2 – SIP IKNB Modul PVML', tahun: 2025, status: 'ongoing', progress: 50, programId: '3.5' },
    ],
  },
  {
    id: '3.6',
    namaProgram: '3.6 – Aplikasi Bidang IAKD',
    deskripsi: 'Aplikasi untuk Inovasi, Aset Keuangan Digital',
    departemen: 'IAKD',
    tahun: 2025,
    status: 'active',
    inisiatif: [
      { id: '3.6.1', nama: '3.6.1 – Aplikasi terkait Peningkatan Literasi dan Inklusi Keuangan Digital', tahun: 2025, status: 'ongoing', progress: 40, programId: '3.6' },
      { id: '3.6.2', nama: '3.6.2 – SI Pengawasan IAKD (ITSK & Aset Kripto)', tahun: 2025, status: 'planning', progress: 25, programId: '3.6' },
    ],
  },
  {
    id: '3.7',
    namaProgram: '3.7 – Aplikasi Bidang PEPK',
    deskripsi: 'Aplikasi untuk Pengawasan Perilaku PUJK, Edukasi, dan Pelindungan Konsumen',
    departemen: 'PEPK',
    tahun: 2025,
    status: 'active',
    inisiatif: [
      { id: '3.7.1', nama: '3.7.1 – SikapiUangmu', tahun: 2025, status: 'completed', progress: 100, programId: '3.7' },
      { id: '3.7.2', nama: '3.7.2 – Mobile App Learning Management System (LMS) Edukasi Keuangan', tahun: 2025, status: 'ongoing', progress: 70, programId: '3.7' },
      { id: '3.7.3', nama: '3.7.3 – Aplikasi Portal Pelindungan Konsumen (APPK)', tahun: 2025, status: 'ongoing', progress: 85, programId: '3.7' },
      { id: '3.7.4', nama: '3.7.4 – Sistem Manajemen Gugatan Perdata', tahun: 2025, status: 'ongoing', progress: 45, programId: '3.7' },
      { id: '3.7.5', nama: '3.7.5 – SI Market Conduct Supervision (SI MACS)', tahun: 2025, status: 'ongoing', progress: 55, programId: '3.7' },
      { id: '3.7.6', nama: '3.7.6 – SI Tim Percepatan Akses Keuangan Daerah (SITPAKD)', tahun: 2025, status: 'planning', progress: 20, programId: '3.7' },
      { id: '3.7.7', nama: '3.7.7 – LOKASIKU', tahun: 2025, status: 'ongoing', progress: 60, programId: '3.7' },
      { id: '3.7.8', nama: '3.7.8 – Website OJK (Minisite Sustainable Finance & Enhancement)', tahun: 2025, status: 'ongoing', progress: 75, programId: '3.7' },
      { id: '3.7.9', nama: '3.7.9 – Sistem PPID OJK', tahun: 2025, status: 'ongoing', progress: 50, programId: '3.7' },
      { id: '3.7.10', nama: '3.7.10 – Sistem Pengolahan Data Program KEJAR', tahun: 2025, status: 'planning', progress: 30, programId: '3.7' },
      { id: '3.7.11', nama: '3.7.11 – Minisite Satgas PASTI', tahun: 2025, status: 'planning', progress: 15, programId: '3.7' },
    ],
  },
  {
    id: '3.8',
    namaProgram: '3.8 – Aplikasi Bidang Kebijakan Strategis - DPZT',
    deskripsi: 'Aplikasi Departemen Koordinasi Pengawasan dan Perizinan Terintegrasi',
    departemen: 'DPZT',
    tahun: 2025,
    status: 'active',
    inisiatif: [
      { id: '3.8.1', nama: '3.8.1 – Sistem Perizinan dan Registrasi Terintegrasi (SPRINT)', tahun: 2025, status: 'ongoing', progress: 80, programId: '3.8' },
      { id: '3.8.2', nama: '3.8.2 – SI Pelaku di LJK Terintegrasi (SIPUTRI)', tahun: 2025, status: 'ongoing', progress: 65, programId: '3.8' },
      { id: '3.8.3', nama: '3.8.3 – SI Pelaku di SJK (SIPELAKU)', tahun: 2025, status: 'ongoing', progress: 55, programId: '3.8' },
      { id: '3.8.4', nama: '3.8.4 – OJK Synergy Watch (OSW)', tahun: 2025, status: 'planning', progress: 25, programId: '3.8' },
    ],
  },
  {
    id: '3.9',
    namaProgram: '3.9 – Aplikasi Bidang Kebijakan Strategis - DPDS',
    deskripsi: 'Aplikasi Departemen Pengelolaan Data dan Statistik',
    departemen: 'DPDS',
    tahun: 2025,
    status: 'active',
    inisiatif: [
      { id: '3.9.1', nama: '3.9.1 – EDW SJK Terintegrasi', tahun: 2025, status: 'ongoing', progress: 70, programId: '3.9' },
      { id: '3.9.2', nama: '3.9.2 – BDA', tahun: 2025, status: 'ongoing', progress: 55, programId: '3.9' },
      { id: '3.9.3', nama: '3.9.3 – Portal Data dan Metadata SJK Terintegrasi', tahun: 2025, status: 'ongoing', progress: 60, programId: '3.9' },
      { id: '3.9.4', nama: '3.9.4 – MDM', tahun: 2025, status: 'ongoing', progress: 45, programId: '3.9' },
      { id: '3.9.5', nama: '3.9.5 – CFS', tahun: 2025, status: 'completed', progress: 100, programId: '3.9' },
      { id: '3.9.6', nama: '3.9.6 – FSR', tahun: 2025, status: 'completed', progress: 100, programId: '3.9' },
      { id: '3.9.7', nama: '3.9.7 – Mobile App Layanan SLIK', tahun: 2025, status: 'ongoing', progress: 75, programId: '3.9' },
      { id: '3.9.8', nama: '3.9.8 – DWH Pasar Modal', tahun: 2025, status: 'ongoing', progress: 50, programId: '3.9' },
      { id: '3.9.9', nama: '3.9.9 – SLIK', tahun: 2025, status: 'completed', progress: 100, programId: '3.9' },
      { id: '3.9.10', nama: '3.9.10 – RACE', tahun: 2025, status: 'ongoing', progress: 40, programId: '3.9' },
      { id: '3.9.11', nama: '3.9.11 – Dashboard Pusdafil', tahun: 2025, status: 'ongoing', progress: 55, programId: '3.9' },
      { id: '3.9.12', nama: '3.9.12 – CAM', tahun: 2025, status: 'planning', progress: 20, programId: '3.9' },
    ],
  },
  {
    id: '3.10',
    namaProgram: '3.10 – Aplikasi Bidang Kebijakan Strategis - DINP',
    deskripsi: 'Aplikasi Departemen Internasional dan APU-PPT',
    departemen: 'DINP',
    tahun: 2025,
    status: 'active',
    inisiatif: [
      { id: '3.10.1', nama: '3.10.1 – SI Program APU-PPT (SIGAP)', tahun: 2025, status: 'ongoing', progress: 65, programId: '3.10' },
    ],
  },
  {
    id: '3.11',
    namaProgram: '3.11 – Aplikasi Bidang Manajemen Strategis - DPJK',
    deskripsi: 'Aplikasi Departemen Penyidikan SJK',
    departemen: 'DPJK',
    tahun: 2025,
    status: 'active',
    inisiatif: [
      { id: '3.11.1', nama: '3.11.1 – SI Administrasi dan Manajemen Penyidikan (SIANDIK)', tahun: 2025, status: 'ongoing', progress: 70, programId: '3.11' },
    ],
  },
  {
    id: '3.12',
    namaProgram: '3.12 – Aplikasi Bidang Manajemen Strategis - DOSB',
    deskripsi: 'Aplikasi Departemen Organisasi, SDM, dan Budaya',
    departemen: 'DOSB',
    tahun: 2025,
    status: 'active',
    inisiatif: [
      { id: '3.12.1', nama: '3.12.1 – Dashboard Monitoring OJKWay', tahun: 2025, status: 'ongoing', progress: 80, programId: '3.12' },
      { id: '3.12.2', nama: '3.12.2 – Learning Management System (LMS) & KMS', tahun: 2025, status: 'planning', progress: 30, programId: '3.12' },
      { id: '3.12.3', nama: '3.12.3 – SI Sumber Daya Manusia (SIMFOSIA)', tahun: 2025, status: 'completed', progress: 100, programId: '3.12' },
      { id: '3.12.4', nama: '3.12.4 – Aplikasi Mobile SDM (SMART HR)', tahun: 2025, status: 'ongoing', progress: 75, programId: '3.12' },
      { id: '3.12.5', nama: '3.12.5 – Aplikasi Portal Rekrutmen', tahun: 2025, status: 'completed', progress: 100, programId: '3.12' },
      { id: '3.12.6', nama: '3.12.6 – Sistem Aplikasi Remunerasi (SAR)', tahun: 2025, status: 'ongoing', progress: 60, programId: '3.12' },
      { id: '3.12.7', nama: '3.12.7 – LMS Riset', tahun: 2025, status: 'planning', progress: 15, programId: '3.12' },
    ],
  },
  {
    id: '3.13',
    namaProgram: '3.13 – Aplikasi Bidang Manajemen Strategis - DHUK',
    deskripsi: 'Aplikasi Departemen Hukum',
    departemen: 'DHUK',
    tahun: 2025,
    status: 'active',
    inisiatif: [
      { id: '3.13.1', nama: '3.13.1 – Jaringan Dokumentasi dan Informasi Hukum (JDIH)', tahun: 2025, status: 'completed', progress: 100, programId: '3.13' },
      { id: '3.13.2', nama: '3.13.2 – Interoperabilitas JDIH dengan Aplikasi Internal dan Eksternal OJK', tahun: 2025, status: 'ongoing', progress: 55, programId: '3.13' },
      { id: '3.13.3', nama: '3.13.3 – Aplikasi Pembukaan Rahasia Nasabah Perbankan (AKRAB)', tahun: 2025, status: 'ongoing', progress: 70, programId: '3.13' },
      { id: '3.13.4', nama: '3.13.4 – Sistem Aplikasi Monitoring Peraturan OJK (SISIMPU)', tahun: 2025, status: 'ongoing', progress: 45, programId: '3.13' },
    ],
  },
  {
    id: '3.14',
    namaProgram: '3.14 – Aplikasi Bidang Manajemen Strategis - DPSU',
    deskripsi: 'Aplikasi Departemen Perencanaan Strategis dan Keuangan',
    departemen: 'DPSU',
    tahun: 2025,
    status: 'active',
    inisiatif: [
      { id: '3.14.1', nama: '3.14.1 – SI Akuntansi OJK (SIAUTO)', tahun: 2025, status: 'completed', progress: 100, programId: '3.14' },
      { id: '3.14.2', nama: '3.14.2 – SI Penerimaan OJK (SIPO)', tahun: 2025, status: 'ongoing', progress: 85, programId: '3.14' },
    ],
  },
  {
    id: '3.15',
    namaProgram: '3.15 – Aplikasi Bidang Manajemen Strategis - DLOG',
    deskripsi: 'Aplikasi Departemen Logistik',
    departemen: 'DLOG',
    tahun: 2025,
    status: 'active',
    inisiatif: [
      { id: '3.15.1', nama: '3.15.1 – SI Pengelolaan Naskah Dinas dan Arsip (SIPENA)', tahun: 2025, status: 'ongoing', progress: 80, programId: '3.15' },
      { id: '3.15.2', nama: '3.15.2 – SI Procurement OJK (SIPROJEK)', tahun: 2025, status: 'ongoing', progress: 65, programId: '3.15' },
    ],
  },
  {
    id: '3.16',
    namaProgram: '3.16 – Aplikasi Bidang Audit Internal dan Manajemen Risiko',
    deskripsi: 'Aplikasi untuk Audit Internal dan Manajemen Risiko',
    departemen: 'Audit Internal',
    tahun: 2025,
    status: 'active',
    inisiatif: [
      { id: '3.16.1', nama: '3.16.1 – SI Governance Risk Compliance (GRC) Terintegrasi', tahun: 2025, status: 'ongoing', progress: 50, programId: '3.16' },
      { id: '3.16.2', nama: '3.16.2 – Continuous Audit Continuous Monitoring (CACM)', tahun: 2025, status: 'planning', progress: 25, programId: '3.16' },
      { id: '3.16.3', nama: '3.16.3 – Sistem Pengendalian Gratifikasi OJK (SIPEGA)', tahun: 2025, status: 'planning', progress: 20, programId: '3.16' },
    ],
  },
];

const STATUS_LABELS: Record<Inisiatif['status'], string> = {
  planning: 'Perencanaan',
  ongoing: 'Berjalan',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
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

function ProgramList() {
  const [programs] = useState<Program[]>(DUMMY_PROGRAMS);
  const [keyword, setKeyword] = useState('');
  const [expandedPrograms, setExpandedPrograms] = useState<Set<string>>(new Set(DUMMY_PROGRAMS.map(p => p.id)));

  // Modal states
  const [openAddProgramModal, setOpenAddProgramModal] = useState(false);
  const [openAddInisiatifModal, setOpenAddInisiatifModal] = useState(false);
  const [selectedProgramIdForInisiatif, setSelectedProgramIdForInisiatif] = useState<string>('');

  // Filter state
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedDepartemen, setSelectedDepartemen] = useState<Set<string>>(new Set());

  // Periode Filter (Header Dropdown)
  const [periodeList, setPeriodeList] = useState<string[]>(['2023-2027', '2020-2024', '2025-2029']);
  const [selectedPeriode, setSelectedPeriode] = useState<string>('2023-2027');
  const [periodeAnchorEl, setPeriodeAnchorEl] = useState<null | HTMLElement>(null);
  const [openAddPeriodeModal, setOpenAddPeriodeModal] = useState(false);

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

  // Filter handlers
  const handleFilterOpen = (event: React.MouseEvent<HTMLElement>) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };

  const handleDepartemenChange = (dept: string) => {
    const newSet = new Set(selectedDepartemen);
    if (newSet.has(dept)) {
      newSet.delete(dept);
    } else {
      newSet.add(dept);
    }
    setSelectedDepartemen(newSet);
  };

  // Filter programs logic
  const filteredPrograms = programs.filter(program => {
    const matchKeyword = program.namaProgram.toLowerCase().includes(keyword.toLowerCase()) ||
      program.departemen.toLowerCase().includes(keyword.toLowerCase()) ||
      program.inisiatif.some(ini => ini.nama.toLowerCase().includes(keyword.toLowerCase()));
    
    // Handle range periode (e.g., "2023-2027")
    let matchPeriode = false;
    if (selectedPeriode === 'all') {
      matchPeriode = true;
    } else if (selectedPeriode.includes('-')) {
      const [startYear, endYear] = selectedPeriode.split('-').map(Number);
      matchPeriode = program.tahun >= startYear && program.tahun <= endYear;
    } else {
      matchPeriode = program.tahun.toString() === selectedPeriode;
    }
    
    const matchDepartemen = selectedDepartemen.size === 0 || selectedDepartemen.has(program.departemen);

    return matchKeyword && matchPeriode && matchDepartemen;
  });

  const handleMappingClick = (inisiatifId: string) => {
    console.log('Mapping clicked for inisiatif:', inisiatifId);
    // TODO: Implement mapping functionality
  };

  const handleDetailClick = (inisiatifId: string) => {
    console.log('Detail clicked for inisiatif:', inisiatifId);
    // TODO: Implement detail view functionality
  };

  return (
    <Box sx={{ 
      p: 3.5,
      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.4) 0%, rgba(240, 245, 250, 0.3) 100%)',
      minHeight: '100vh',
    }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <Box>
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
            Kelola data program dan inisiatif strategis
          </Typography>
        </Box>

        {/* Periode Dropdown */}
        <Box>
          <Button
            endIcon={periodeAnchorEl ? <ArrowUpIcon /> : <ArrowDownIcon />}
            onClick={(e) => setPeriodeAnchorEl(e.currentTarget)}
            sx={{
              bgcolor: 'white',
              border: '1px solid #e0e0e0',
              borderRadius: '12px',
              py: 1,
              px: 2,
              color: '#1d1d1f',
              fontWeight: 600,
              fontSize: '0.95rem',
              minWidth: '160px',
              justifyContent: 'space-between',
              boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
              '&:hover': {
                bgcolor: '#fafafa',
                borderColor: '#DA251C',
              },
            }}
          >
            {selectedPeriode === 'all' ? 'Semua Periode' : `Periode ${selectedPeriode}`}
          </Button>
          <Menu
            anchorEl={periodeAnchorEl}
            open={Boolean(periodeAnchorEl)}
            onClose={() => setPeriodeAnchorEl(null)}
            PaperProps={{
              sx: { 
                mt: 1, 
                borderRadius: '12px', 
                minWidth: '180px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
              }
            }}
          >
            <MenuItem 
              selected={selectedPeriode === 'all'}
              onClick={() => { setSelectedPeriode('all'); setPeriodeAnchorEl(null); }}
            >
              Semua Periode
            </MenuItem>
            {periodeList.map(periode => (
              <MenuItem 
                key={periode} 
                selected={selectedPeriode === periode}
                onClick={() => { setSelectedPeriode(periode); setPeriodeAnchorEl(null); }}
              >
                {periode}
              </MenuItem>
            ))}
            <Box sx={{ borderTop: '1px solid #e5e5e7', mt: 1, pt: 1 }}>
              <MenuItem 
                onClick={() => { 
                  setPeriodeAnchorEl(null); 
                  setOpenAddPeriodeModal(true); 
                }}
                sx={{ 
                  color: '#DA251C', 
                  fontWeight: 600,
                  '&:hover': {
                    bgcolor: 'rgba(218, 37, 28, 0.05)',
                  }
                }}
              >
                <AddIcon sx={{ mr: 1, fontSize: 18 }} />
                Tambah Periode
              </MenuItem>
            </Box>
          </Menu>
        </Box>
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
                width: 320,
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
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#86868b', fontSize: 20 }} />
                  </InputAdornment>
                ),
              }}
            />
            <Button
              variant="text"
              startIcon={<TuneRounded sx={{ fontSize: 18 }} />}
              onClick={handleFilterOpen}
              sx={{
                color: selectedDepartemen.size > 0 ? '#DA251C' : '#86868b',
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
            onClick={() => setOpenAddProgramModal(true)}
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

        {/* Table */}
        <TableContainer>
          <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#f8f9fa' }}>
              <TableCell sx={{ fontWeight: 600, color: '#2C3E50', py: 2 }}>Program</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredPrograms.map((program) => (
              <>
                {/* Program Row */}
                <TableRow
                  key={program.id}
                  sx={{
                    borderLeft: '4px solid #DA251C',
                    '&:hover': { bgcolor: 'rgba(218, 37, 28, 0.04)' },
                    cursor: 'pointer',
                  }}
                  onClick={() => toggleExpand(program.id)}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <IconButton size="small">
                        {expandedPrograms.has(program.id) ? <ExpandIcon /> : <CollapseIcon />}
                      </IconButton>
                      <FolderRounded sx={{ color: '#DA251C', fontSize: 20 }} />
                      <Typography fontWeight={600} sx={{ color: '#2C3E50', fontSize: '0.95rem' }}>
                        {program.namaProgram}
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>

                {/* Inisiatif Rows */}
                <TableRow key={`${program.id}-inisiatif`}>
                  <TableCell colSpan={1} sx={{ p: 0, border: 'none' }}>
                    <Collapse in={expandedPrograms.has(program.id)} timeout="auto">
                      <Box sx={{ bgcolor: '#fafafa', p: 2 }}>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell sx={{ fontWeight: 600, fontSize: '0.85rem', color: '#666' }}>
                                Nama Inisiatif
                              </TableCell>
                              <TableCell sx={{ fontWeight: 600, fontSize: '0.85rem', color: '#666' }}>
                                Tahun
                              </TableCell>
                              <TableCell sx={{ fontWeight: 600, fontSize: '0.85rem', color: '#666' }}>
                                Status
                              </TableCell>
                              <TableCell sx={{ fontWeight: 600, fontSize: '0.85rem', color: '#666' }}>
                                Progress
                              </TableCell>
                              <TableCell sx={{ fontWeight: 600, fontSize: '0.85rem', color: '#666' }}>
                                Aksi
                              </TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {program.inisiatif.map((inisiatif) => (
                              <TableRow
                                key={inisiatif.id}
                                sx={{
                                  '&:hover': { bgcolor: 'rgba(218, 37, 28, 0.04)' },
                                }}
                              >
                                <TableCell>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <AssignmentRounded sx={{ color: '#666', fontSize: 18 }} />
                                    <Typography sx={{ fontSize: '0.9rem', fontWeight: 500 }}>
                                      {inisiatif.nama}
                                    </Typography>
                                  </Box>
                                </TableCell>
                                <TableCell>
                                  <Typography sx={{ fontSize: '0.85rem' }}>
                                    {inisiatif.tahun}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Chip
                                    label={STATUS_LABELS[inisiatif.status]}
                                    size="small"
                                    sx={{
                                      bgcolor: `${getStatusColor(inisiatif.status)}20`,
                                      color: getStatusColor(inisiatif.status),
                                      fontWeight: 500,
                                      fontSize: '0.75rem',
                                    }}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 100 }}>
                                    <LinearProgress
                                      variant="determinate"
                                      value={inisiatif.progress}
                                      sx={{
                                        flex: 1,
                                        height: 6,
                                        borderRadius: 3,
                                        bgcolor: '#e0e0e0',
                                        '& .MuiLinearProgress-bar': {
                                          bgcolor: getStatusColor(inisiatif.status),
                                          borderRadius: 3,
                                        },
                                      }}
                                    />
                                    <Typography sx={{ fontSize: '0.8rem', color: '#666', minWidth: '35px' }}>
                                      {inisiatif.progress}%
                                    </Typography>
                                  </Box>
                                </TableCell>
                                <TableCell>
                                  <Box sx={{ display: 'flex', gap: 1 }}>
                                    <Button
                                      size="small"
                                      variant="outlined"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleMappingClick(inisiatif.id);
                                      }}
                                      sx={{
                                        fontSize: '0.75rem',
                                        px: 2,
                                        py: 0.5,
                                        borderColor: '#2196F3',
                                        color: '#2196F3',
                                        '&:hover': {
                                          borderColor: '#1976D2',
                                          bgcolor: '#E3F2FD',
                                        },
                                      }}
                                    >
                                      Mapping
                                    </Button>
                                    <Button
                                      size="small"
                                      variant="outlined"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDetailClick(inisiatif.id);
                                      }}
                                      sx={{
                                        fontSize: '0.75rem',
                                        px: 2,
                                        py: 0.5,
                                        borderColor: '#4CAF50',
                                        color: '#4CAF50',
                                        '&:hover': {
                                          borderColor: '#388E3C',
                                          bgcolor: '#E8F5E8',
                                        },
                                      }}
                                    >
                                      Detail
                                    </Button>
                                  </Box>
                                </TableCell>
                              </TableRow>
                            ))}
                            {/* Tambah Inisiatif Row */}
                            <TableRow>
                              <TableCell colSpan={5} sx={{ py: 1.5 }}>
                                <Button
                                  size="small"
                                  startIcon={<AddIcon />}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedProgramIdForInisiatif(program.id);
                                    setOpenAddInisiatifModal(true);
                                  }}
                                  sx={{
                                    color: '#DA251C',
                                    fontSize: '0.85rem',
                                    fontWeight: 500,
                                    '&:hover': {
                                      bgcolor: 'rgba(218, 37, 28, 0.08)',
                                    },
                                  }}
                                >
                                  Tambah Inisiatif
                                </Button>
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </Box>
                    </Collapse>
                  </TableCell>
                </TableRow>
              </>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
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

          {/* Departemen Filter */}
          <Box sx={{ mb: 2.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#1d1d1f', mb: 1.5 }}>
              Departemen
            </Typography>
            <FormGroup>
              {['IT', 'Security', 'HR'].map((dept) => (
                <FormControlLabel
                  key={dept}
                  control={
                    <Checkbox
                      size="small"
                      checked={selectedDepartemen.has(dept)}
                      onChange={() => handleDepartemenChange(dept)}
                      sx={{
                        '&.Mui-checked': {
                          color: '#DA251C',
                        },
                      }}
                    />
                  }
                  label={<Typography variant="body2" sx={{ fontWeight: 500 }}>{dept}</Typography>}
                />
              ))}
            </FormGroup>
          </Box>
        </Box>
      </Popover>

      {/* Add Program Modal */}
      <AddProgramModal
        open={openAddProgramModal}
        onClose={() => setOpenAddProgramModal(false)}
        onSuccess={() => {
          console.log('Program added successfully');
        }}
      />

      {/* Add Inisiatif Modal */}
      <AddInisiatifModal
        open={openAddInisiatifModal}
        onClose={() => {
          setOpenAddInisiatifModal(false);
          setSelectedProgramIdForInisiatif('');
        }}
        onSuccess={() => {
          console.log('Inisiatif added successfully');
        }}
        preselectedProgramId={selectedProgramIdForInisiatif}
      />

      {/* Add Periode Modal */}
      <AddPeriodeModal
        open={openAddPeriodeModal}
        onClose={() => setOpenAddPeriodeModal(false)}
        onSuccess={(newPeriode) => {
          setPeriodeList(prev => [...prev, newPeriode].sort());
          setSelectedPeriode(newPeriode);
        }}
        existingPeriodes={periodeList}
      />
    </Box>
  );
}

export default ProgramList;
