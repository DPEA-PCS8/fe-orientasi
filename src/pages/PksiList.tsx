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
} from '@mui/icons-material';

// Interface untuk data PKSI
interface PksiData {
  id: string;
  namaPksi: string;
  jangkaWaktu: string;
  tanggalPengajuan: string;
  linkDocsT01: string;
  status: 'pending' | 'disetujui' | 'tidak_disetujui';
}

// Dummy data PKSI - 100 entries
const DUMMY_PKSI: PksiData[] = [
  { id: '1', namaPksi: 'SIP Perbankan Modul Penyusunan KYBPR - KYBPRS', jangkaWaktu: 'Single Year', tanggalPengajuan: '2026-02-01T10:00:00Z', linkDocsT01: 'https://docs.google.com/document/d/abc123', status: 'pending' },
  { id: '2', namaPksi: 'SIP Perbankan Modul Manajemen Pemeriksaan BPR/BPRS', jangkaWaktu: 'Single Year', tanggalPengajuan: '2026-02-03T14:30:00Z', linkDocsT01: 'https://docs.google.com/document/d/def456', status: 'disetujui' },
  { id: '3', namaPksi: 'Supervision Dashboard Perbankan', jangkaWaktu: 'Single Year', tanggalPengajuan: '2026-02-05T09:15:00Z', linkDocsT01: 'https://docs.google.com/document/d/ghi789', status: 'tidak_disetujui' },
  { id: '4', namaPksi: 'Sistem Informasi Pengawasan Konglomerasi Keuangan (SIPKK) Modul Financial Conglomerate Ratio (FICOR)', jangkaWaktu: 'Single Year', tanggalPengajuan: '2026-02-06T08:00:00Z', linkDocsT01: 'https://docs.google.com/document/d/jkl012', status: 'pending' },
  { id: '5', namaPksi: 'Sistem Informasi Penanganan Dugaan Pelanggaran (SIPEDANG)', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-02-07T16:45:00Z', linkDocsT01: 'https://docs.google.com/document/d/mno345', status: 'disetujui' },
  { id: '6', namaPksi: 'Sistem Informasi Pengawasan Profesi Penunjang Akuntan Publik dan Kantor Akuntan Publik', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-02-08T10:30:00Z', linkDocsT01: 'https://docs.google.com/document/d/pqr678', status: 'pending' },
  { id: '7', namaPksi: 'Pengembangan Sistem Informasi Pengawasan Pasar Modal (SIPM) Tahun 2024 - Modul Profil Nasabah', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-02-09T11:00:00Z', linkDocsT01: 'https://docs.google.com/document/d/stu901', status: 'disetujui' },
  { id: '8', namaPksi: 'Pengembangan Sistem Informasi Pengawasan Pasar Modal (SIPM) Tahun 2024 - Modul Manajemen Investasi', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-02-10T13:45:00Z', linkDocsT01: 'https://docs.google.com/document/d/vwx234', status: 'tidak_disetujui' },
  { id: '9', namaPksi: 'Sistem Informasi Pengawasan Pasar Modal Terpadu (SIPM) - Modul Monitoring Emiten', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-02-11T15:30:00Z', linkDocsT01: 'https://docs.google.com/document/d/yza567', status: 'pending' },
  { id: '10', namaPksi: 'Sistem Informasi Pengawasan Pasar Modal Terpadu (SIPM) - Modul Pengawasan Profesi', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-02-12T10:15:00Z', linkDocsT01: 'https://docs.google.com/document/d/bcd890', status: 'disetujui' },
  { id: '11', namaPksi: 'Sistem Informasi Pengawasan Pasar Modal Terpadu (SIPM) - Modul Pengawasan Lembaga Penunjang', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-02-13T12:45:00Z', linkDocsT01: 'https://docs.google.com/document/d/efg123', status: 'tidak_disetujui' },
  { id: '12', namaPksi: 'SIP IKNB - Sistem Informasi Pengawasan Industri Keuangan Non-Bank', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-02-14T09:30:00Z', linkDocsT01: 'https://docs.google.com/document/d/hij456', status: 'pending' },
  { id: '13', namaPksi: 'SIP IKNB Modul Pemeriksaan Langsung Asuransi Konvensional', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-02-15T14:00:00Z', linkDocsT01: 'https://docs.google.com/document/d/klm789', status: 'disetujui' },
  { id: '14', namaPksi: 'SIP IKNB Modul Pemeriksaan Langsung Asuransi Syariah', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-02-16T11:20:00Z', linkDocsT01: 'https://docs.google.com/document/d/nop012', status: 'pending' },
  { id: '15', namaPksi: 'SIP IKNB Modul Pemeriksaan Langsung Dana Pensiun', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-02-17T13:50:00Z', linkDocsT01: 'https://docs.google.com/document/d/qrs345', status: 'tidak_disetujui' },
  { id: '16', namaPksi: 'SIP IKNB Modul Pengawasan Manajemen Investasi', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-02-18T10:40:00Z', linkDocsT01: 'https://docs.google.com/document/d/tuv678', status: 'disetujui' },
  { id: '17', namaPksi: 'SIP IKNB Modul Pengawasan Perusahaan Pemeringkat Efek', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-02-19T15:15:00Z', linkDocsT01: 'https://docs.google.com/document/d/wxy901', status: 'pending' },
  { id: '18', namaPksi: 'SIP IKNB Modul Pengawasan Lembaga Konsultasi Bisnis', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-02-20T12:00:00Z', linkDocsT01: 'https://docs.google.com/document/d/zab234', status: 'tidak_disetujui' },
  { id: '19', namaPksi: 'Sistem Informasi Pengawasan Pasar Modal Terpadu (SIPM) - Modul Monitoring Laporan Emiten dan Perusahaan Publik (Tahap 1)', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-02-21T14:30:00Z', linkDocsT01: 'https://docs.google.com/document/d/cde567', status: 'disetujui' },
  { id: '20', namaPksi: 'Sistem Informasi Pengawasan Pasar Modal Terpadu (SIPM) - Modul Monitoring Laporan Emiten dan Perusahaan Publik (Tahap 2)', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-02-22T09:45:00Z', linkDocsT01: 'https://docs.google.com/document/d/fgh890', status: 'pending' },
  { id: '21', namaPksi: 'Pengembangan Sistem Informasi Pengawasan Pasar Modal (SIPM) Tahun 2024 - Modul Manajemen Aset', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-02-23T11:30:00Z', linkDocsT01: 'https://docs.google.com/document/d/ijk123', status: 'tidak_disetujui' },
  { id: '22', namaPksi: 'Pengembangan Sistem Informasi Pengawasan Pasar Modal (SIPM) Tahun 2024 - Modul Manajemen Risiko', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-02-24T13:15:00Z', linkDocsT01: 'https://docs.google.com/document/d/lmn456', status: 'disetujui' },
  { id: '23', namaPksi: 'Pengembangan Sistem Informasi Pengawasan Pasar Modal (SIPM) Tahun 2024 - Modul Kepatuhan Regulasi', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-02-25T10:00:00Z', linkDocsT01: 'https://docs.google.com/document/d/opq789', status: 'pending' },
  { id: '24', namaPksi: 'Pengembangan Sistem Informasi Pengawasan Pasar Modal (SIPM) Tahun 2024 - Modul Tata Kelola Perusahaan', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-02-26T15:45:00Z', linkDocsT01: 'https://docs.google.com/document/d/rst012', status: 'tidak_disetujui' },
  { id: '25', namaPksi: 'Pengembangan Sistem Informasi Pengawasan Pasar Modal (SIPM) Tahun 2024 - Modul Analisis Laporan Keuangan', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-02-27T12:30:00Z', linkDocsT01: 'https://docs.google.com/document/d/uvw345', status: 'disetujui' },
  { id: '26', namaPksi: 'Pengembangan Sistem Informasi Pengawasan Pasar Modal (SIPM) Tahun 2024 - Modul Penilaian Kinerja', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-02-28T14:15:00Z', linkDocsT01: 'https://docs.google.com/document/d/xyz678', status: 'pending' },
  { id: '27', namaPksi: 'Pengembangan Sistem Informasi Pengawasan Pasar Modal (SIPM) Tahun 2024 - Modul Audit Internal', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-03-01T09:30:00Z', linkDocsT01: 'https://docs.google.com/document/d/abc901', status: 'tidak_disetujui' },
  { id: '28', namaPksi: 'Pengembangan Sistem Informasi Pengawasan Pasar Modal (SIPM) Tahun 2024 - Modul Governance Framework', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-03-02T11:45:00Z', linkDocsT01: 'https://docs.google.com/document/d/def234', status: 'disetujui' },
  { id: '29', namaPksi: 'Pengembangan Sistem Informasi Pengawasan Pasar Modal (SIPM) Tahun 2024 - Modul Risk Assessment', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-03-03T13:20:00Z', linkDocsT01: 'https://docs.google.com/document/d/ghi567', status: 'pending' },
  { id: '30', namaPksi: 'Pengembangan Sistem Informasi Pengawasan Pasar Modal (SIPM) Tahun 2024 - Modul Compliance Management', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-03-04T15:00:00Z', linkDocsT01: 'https://docs.google.com/document/d/jkl890', status: 'tidak_disetujui' },
  { id: '31', namaPksi: 'Pengembangan Sistem Informasi Pengawasan Pasar Modal (SIPM) Tahun 2024 - Modul Disclosure Management', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-03-05T10:15:00Z', linkDocsT01: 'https://docs.google.com/document/d/mno123', status: 'disetujui' },
  { id: '32', namaPksi: 'Pengembangan Sistem Informasi Pengawasan Pasar Modal (SIPM) Tahun 2024 - Modul Stakeholder Management', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-03-06T12:45:00Z', linkDocsT01: 'https://docs.google.com/document/d/pqr456', status: 'pending' },
  { id: '33', namaPksi: 'Pengembangan Sistem Informasi Pengawasan Pasar Modal (SIPM) Tahun 2024 - Modul Innovation Management', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-03-07T14:30:00Z', linkDocsT01: 'https://docs.google.com/document/d/stu789', status: 'tidak_disetujui' },
  { id: '34', namaPksi: 'Pengembangan Sistem Informasi Pengawasan Pasar Modal (SIPM) Tahun 2024 - Modul Technology Management', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-03-08T09:00:00Z', linkDocsT01: 'https://docs.google.com/document/d/vwx012', status: 'disetujui' },
  { id: '35', namaPksi: 'Pengembangan Sistem Informasi Pengawasan Pasar Modal (SIPM) Tahun 2024 - Modul Change Management', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-03-09T11:30:00Z', linkDocsT01: 'https://docs.google.com/document/d/yza345', status: 'pending' },
  { id: '36', namaPksi: 'Pengembangan Sistem Informasi Pengawasan Pasar Modal (SIPM) Tahun 2024 - Modul Sustainability Reporting', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-03-10T13:15:00Z', linkDocsT01: 'https://docs.google.com/document/d/bcd678', status: 'tidak_disetujui' },
  { id: '37', namaPksi: 'Pengembangan Sistem Informasi Pengawasan Pasar Modal (SIPM) Tahun 2024 - Modul ESG Framework', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-03-11T15:45:00Z', linkDocsT01: 'https://docs.google.com/document/d/efg901', status: 'disetujui' },
  { id: '38', namaPksi: 'Pengembangan Sistem Informasi Pengawasan Pasar Modal (SIPM) Tahun 2024 - Modul Whistleblowing System', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-03-12T10:30:00Z', linkDocsT01: 'https://docs.google.com/document/d/hij234', status: 'pending' },
  { id: '39', namaPksi: 'Pengembangan Sistem Informasi Pengawasan Pasar Modal (SIPM) Tahun 2024 - Modul Anti-Fraud System', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-03-13T12:00:00Z', linkDocsT01: 'https://docs.google.com/document/d/klm567', status: 'tidak_disetujui' },
  { id: '40', namaPksi: 'Pengembangan Sistem Informasi Pengawasan Pasar Modal (SIPM) Tahun 2024 - Modul Data Protection', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-03-14T14:30:00Z', linkDocsT01: 'https://docs.google.com/document/d/nop890', status: 'disetujui' },
  { id: '41', namaPksi: 'Pengembangan Sistem Informasi Pengawasan Pasar Modal (SIPM) Tahun 2024 - Modul Cybersecurity Framework', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-03-15T09:15:00Z', linkDocsT01: 'https://docs.google.com/document/d/qrs123', status: 'pending' },
  { id: '42', namaPksi: 'Pengembangan Sistem Informasi Pengawasan Pasar Modal (SIPM) Tahun 2024 - Modul Business Continuity', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-03-16T11:45:00Z', linkDocsT01: 'https://docs.google.com/document/d/tuv456', status: 'tidak_disetujui' },
  { id: '43', namaPksi: 'Pengembangan Sistem Informasi Pengawasan Pasar Modal (SIPM) Tahun 2024 - Modul Disaster Recovery', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-03-17T13:20:00Z', linkDocsT01: 'https://docs.google.com/document/d/wxy789', status: 'disetujui' },
  { id: '44', namaPksi: 'Pengembangan Sistem Informasi Pengawasan Pasar Modal (SIPM) Tahun 2024 - Modul Quality Assurance', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-03-18T15:00:00Z', linkDocsT01: 'https://docs.google.com/document/d/zab012', status: 'pending' },
  { id: '45', namaPksi: 'Pengembangan Sistem Informasi Pengawasan Pasar Modal (SIPM) Tahun 2024 - Modul Testing Framework', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-03-19T10:30:00Z', linkDocsT01: 'https://docs.google.com/document/d/cde345', status: 'tidak_disetujui' },
  { id: '46', namaPksi: 'Pengembangan Sistem Informasi Pengawasan Pasar Modal (SIPM) Tahun 2024 - Modul Performance Monitoring', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-03-20T12:15:00Z', linkDocsT01: 'https://docs.google.com/document/d/fgh678', status: 'disetujui' },
  { id: '47', namaPksi: 'Pengembangan Sistem Informasi Pengawasan Pasar Modal (SIPM) Tahun 2024 - Modul Incident Management', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-03-21T14:45:00Z', linkDocsT01: 'https://docs.google.com/document/d/ijk901', status: 'pending' },
  { id: '48', namaPksi: 'Pengembangan Sistem Informasi Pengawasan Pasar Modal (SIPM) Tahun 2024 - Modul Problem Management', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-03-22T09:30:00Z', linkDocsT01: 'https://docs.google.com/document/d/lmn234', status: 'tidak_disetujui' },
  { id: '49', namaPksi: 'Pengembangan Sistem Informasi Pengawasan Pasar Modal (SIPM) Tahun 2024 - Modul Configuration Management', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-03-23T11:00:00Z', linkDocsT01: 'https://docs.google.com/document/d/opq567', status: 'disetujui' },
  { id: '50', namaPksi: 'Pengembangan Sistem Informasi Pengawasan Pasar Modal (SIPM) Tahun 2024 - Modul Release Management', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-03-24T13:30:00Z', linkDocsT01: 'https://docs.google.com/document/d/rst890', status: 'pending' },
  { id: '51', namaPksi: 'Pengembangan Sistem Informasi Pengawasan Pasar Modal (SIPM) Tahun 2024 - Modul Demand Management', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-03-25T15:15:00Z', linkDocsT01: 'https://docs.google.com/document/d/uvw123', status: 'tidak_disetujui' },
  { id: '52', namaPksi: 'Pengembangan Sistem Informasi Pengawasan Pasar Modal (SIPM) Tahun 2024 - Modul Financial Management', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-03-26T10:45:00Z', linkDocsT01: 'https://docs.google.com/document/d/xyz456', status: 'disetujui' },
  { id: '53', namaPksi: 'Pengembangan Sistem Informasi Pengawasan Pasar Modal (SIPM) Tahun 2024 - Modul Capacity Management', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-03-27T12:30:00Z', linkDocsT01: 'https://docs.google.com/document/d/abc789', status: 'pending' },
  { id: '54', namaPksi: 'Pengembangan Sistem Informasi Pengawasan Pasar Modal (SIPM) Tahun 2024 - Modul Availability Management', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-03-28T14:00:00Z', linkDocsT01: 'https://docs.google.com/document/d/def012', status: 'tidak_disetujui' },
  { id: '55', namaPksi: 'Pengembangan Sistem Informasi Pengawasan Pasar Modal (SIPM) Tahun 2024 - Modul Service Continuity', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-03-29T16:30:00Z', linkDocsT01: 'https://docs.google.com/document/d/ghi345', status: 'disetujui' },
  { id: '56', namaPksi: 'Pengembangan Sistem Informasi Pengawasan Pasar Modal (SIPM) Tahun 2024 - Modul Knowledge Management', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-03-30T09:45:00Z', linkDocsT01: 'https://docs.google.com/document/d/jkl678', status: 'pending' },
  { id: '57', namaPksi: 'Pengembangan Sistem Informasi Pengawasan Pasar Modal (SIPM) Tahun 2024 - Modul Portfolio Management', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-03-31T11:15:00Z', linkDocsT01: 'https://docs.google.com/document/d/mno901', status: 'tidak_disetujui' },
  { id: '58', namaPksi: 'Pengembangan Sistem Informasi Pengawasan Pasar Modal (SIPM) Tahun 2024 - Modul Program Management', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-04-01T13:45:00Z', linkDocsT01: 'https://docs.google.com/document/d/pqr234', status: 'disetujui' },
  { id: '59', namaPksi: 'Pengembangan Sistem Informasi Pengawasan Pasar Modal (SIPM) Tahun 2024 - Modul Project Management', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-04-02T15:20:00Z', linkDocsT01: 'https://docs.google.com/document/d/stu567', status: 'pending' },
  { id: '60', namaPksi: 'Pengembangan Sistem Informasi Pengawasan Pasar Modal (SIPM) Tahun 2024 - Modul Resource Management', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-04-03T10:30:00Z', linkDocsT01: 'https://docs.google.com/document/d/vwx890', status: 'tidak_disetujui' },
  { id: '61', namaPksi: 'Pengembangan Sistem Informasi Pengawasan Pasar Modal (SIPM) Tahun 2024 - Modul Supplier Management', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-04-04T12:00:00Z', linkDocsT01: 'https://docs.google.com/document/d/yza123', status: 'disetujui' },
  { id: '62', namaPksi: 'Pengembangan Sistem Informasi Pengawasan Pasar Modal (SIPM) Tahun 2024 - Modul Customer Management', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-04-05T14:30:00Z', linkDocsT01: 'https://docs.google.com/document/d/bcd456', status: 'pending' },
  { id: '63', namaPksi: 'Pengembangan Sistem Informasi Pengawasan Pasar Modal (SIPM) Tahun 2024 - Modul Asset Management', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-04-06T09:15:00Z', linkDocsT01: 'https://docs.google.com/document/d/efg789', status: 'tidak_disetujui' },
  { id: '64', namaPksi: 'Pengembangan Sistem Informasi Pengawasan Pasar Modal (SIPM) Tahun 2024 - Modul Budget Planning', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-04-07T11:45:00Z', linkDocsT01: 'https://docs.google.com/document/d/hij012', status: 'disetujui' },
  { id: '65', namaPksi: 'Pengembangan Sistem Informasi Pengawasan Pasar Modal (SIPM) Tahun 2024 - Modul Cost Control', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-04-08T13:20:00Z', linkDocsT01: 'https://docs.google.com/document/d/klm345', status: 'pending' },
  { id: '66', namaPksi: 'Pengembangan Sistem Informasi Pengawasan Pasar Modal (SIPM) Tahun 2024 - Modul Revenue Tracking', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-04-09T15:00:00Z', linkDocsT01: 'https://docs.google.com/document/d/nop678', status: 'tidak_disetujui' },
  { id: '67', namaPksi: 'Pengembangan Sistem Informasi Pengawasan Pasar Modal (SIPM) Tahun 2024 - Modul Profit Analysis', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-04-10T10:30:00Z', linkDocsT01: 'https://docs.google.com/document/d/qrs901', status: 'disetujui' },
  { id: '68', namaPksi: 'Pengembangan Sistem Informasi Pengawasan Pasar Modal (SIPM) Tahun 2024 - Modul Break-even Analysis', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-04-11T12:15:00Z', linkDocsT01: 'https://docs.google.com/document/d/tuv234', status: 'pending' },
  { id: '69', namaPksi: 'Pengembangan Sistem Informasi Pengawasan Pasar Modal (SIPM) Tahun 2024 - Modul Cash Flow Analysis', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-04-12T14:45:00Z', linkDocsT01: 'https://docs.google.com/document/d/wxy567', status: 'tidak_disetujui' },
  { id: '70', namaPksi: 'Pengembangan Sistem Informasi Pengawasan Pasar Modal (SIPM) Tahun 2024 - Modul Forecasting', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-04-13T09:30:00Z', linkDocsT01: 'https://docs.google.com/document/d/zab890', status: 'disetujui' },
  { id: '71', namaPksi: 'Pengembangan Sistem Informasi Pengawasan Pasar Modal (SIPM) Tahun 2024 - Modul Budgeting', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-04-14T11:00:00Z', linkDocsT01: 'https://docs.google.com/document/d/cde123', status: 'pending' },
  { id: '72', namaPksi: 'Pengembangan Sistem Informasi Pengawasan Pasar Modal (SIPM) Tahun 2024 - Modul Variance Analysis', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-04-15T13:30:00Z', linkDocsT01: 'https://docs.google.com/document/d/fgh456', status: 'tidak_disetujui' },
  { id: '73', namaPksi: 'Pengembangan Sistem Informasi Pengawasan Pasar Modal (SIPM) Tahun 2024 - Modul Trend Analysis', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-04-16T15:15:00Z', linkDocsT01: 'https://docs.google.com/document/d/ijk789', status: 'disetujui' },
  { id: '74', namaPksi: 'Pengembangan Sistem Informasi Pengawasan Pasar Modal (SIPM) Tahun 2024 - Modul Ratio Analysis', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-04-17T10:45:00Z', linkDocsT01: 'https://docs.google.com/document/d/lmn012', status: 'pending' },
  { id: '75', namaPksi: 'Pengembangan Sistem Informasi Pengawasan Pasar Modal (SIPM) Tahun 2024 - Modul Sensitivity Analysis', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-04-18T12:30:00Z', linkDocsT01: 'https://docs.google.com/document/d/opq345', status: 'tidak_disetujui' },
  { id: '76', namaPksi: 'Pengembangan Sistem Informasi Pengawasan Pasar Modal (SIPM) Tahun 2024 - Modul Scenario Analysis', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-04-19T14:00:00Z', linkDocsT01: 'https://docs.google.com/document/d/rst678', status: 'disetujui' },
  { id: '77', namaPksi: 'Pengembangan Sistem Informasi Pengawasan Pasar Modal (SIPM) Tahun 2024 - Modul Simulation', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-04-20T16:30:00Z', linkDocsT01: 'https://docs.google.com/document/d/uvw901', status: 'pending' },
  { id: '78', namaPksi: 'Pengembangan Sistem Informasi Pengawasan Pasar Modal (SIPM) Tahun 2024 - Modul Optimization', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-04-21T09:15:00Z', linkDocsT01: 'https://docs.google.com/document/d/xyz234', status: 'tidak_disetujui' },
  { id: '79', namaPksi: 'Pengembangan Sistem Informasi Pengawasan Pasar Modal (SIPM) Tahun 2024 - Modul Decision Support', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-04-22T11:45:00Z', linkDocsT01: 'https://docs.google.com/document/d/abc567', status: 'disetujui' },
  { id: '80', namaPksi: 'Pengembangan Sistem Informasi Pengawasan Pasar Modal (SIPM) Tahun 2024 - Modul Analytics Dashboard', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-04-23T13:20:00Z', linkDocsT01: 'https://docs.google.com/document/d/def890', status: 'pending' },
  { id: '81', namaPksi: 'Pengembangan Sistem Informasi Pengawasan Pasar Modal (SIPM) Tahun 2024 - Modul Reporting Tools', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-04-24T15:00:00Z', linkDocsT01: 'https://docs.google.com/document/d/ghi123', status: 'tidak_disetujui' },
  { id: '82', namaPksi: 'Pengembangan Sistem Informasi Pengawasan Pasar Modal (SIPM) Tahun 2024 - Modul Data Integration', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-04-25T10:30:00Z', linkDocsT01: 'https://docs.google.com/document/d/jkl456', status: 'disetujui' },
  { id: '83', namaPksi: 'Pengembangan Sistem Informasi Pengawasan Pasar Modal (SIPM) Tahun 2024 - Modul Data Cleansing', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-04-26T12:15:00Z', linkDocsT01: 'https://docs.google.com/document/d/mno789', status: 'pending' },
  { id: '84', namaPksi: 'Pengembangan Sistem Informasi Pengawasan Pasar Modal (SIPM) Tahun 2024 - Modul Data Validation', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-04-27T14:45:00Z', linkDocsT01: 'https://docs.google.com/document/d/pqr012', status: 'tidak_disetujui' },
  { id: '85', namaPksi: 'Pengembangan Sistem Informasi Pengawasan Pasar Modal (SIPM) Tahun 2024 - Modul Data Governance', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-04-28T09:30:00Z', linkDocsT01: 'https://docs.google.com/document/d/stu345', status: 'disetujui' },
  { id: '86', namaPksi: 'Pengembangan Sistem Informasi Pengawasan Pasar Modal (SIPM) Tahun 2024 - Modul Master Data Management', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-04-29T11:00:00Z', linkDocsT01: 'https://docs.google.com/document/d/vwx678', status: 'pending' },
  { id: '87', namaPksi: 'Pengembangan Sistem Informasi Pengawasan Pasar Modal (SIPM) Tahun 2024 - Modul Reference Data Management', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-04-30T13:30:00Z', linkDocsT01: 'https://docs.google.com/document/d/yza901', status: 'tidak_disetujui' },
  { id: '88', namaPksi: 'Pengembangan Sistem Informasi Pengawasan Pasar Modal (SIPM) Tahun 2024 - Modul Data Quality Framework', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-05-01T15:15:00Z', linkDocsT01: 'https://docs.google.com/document/d/bcd234', status: 'disetujui' },
  { id: '89', namaPksi: 'Pengembangan Sistem Informasi Pengawasan Pasar Modal (SIPM) Tahun 2024 - Modul Data Warehouse', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-05-02T10:45:00Z', linkDocsT01: 'https://docs.google.com/document/d/efg567', status: 'pending' },
  { id: '90', namaPksi: 'Pengembangan Sistem Informasi Pengawasan Pasar Modal (SIPM) Tahun 2024 - Modul Data Lake', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-05-03T12:30:00Z', linkDocsT01: 'https://docs.google.com/document/d/hij890', status: 'tidak_disetujui' },
  { id: '91', namaPksi: 'Pengembangan Sistem Informasi Pengawasan Pasar Modal (SIPM) Tahun 2024 - Modul ETL Process', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-05-04T14:00:00Z', linkDocsT01: 'https://docs.google.com/document/d/klm123', status: 'disetujui' },
  { id: '92', namaPksi: 'Pengembangan Sistem Informasi Pengawasan Pasar Modal (SIPM) Tahun 2024 - Modul Streaming Pipeline', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-05-05T16:30:00Z', linkDocsT01: 'https://docs.google.com/document/d/nop456', status: 'pending' },
  { id: '93', namaPksi: 'Pengembangan Sistem Informasi Pengawasan Pasar Modal (SIPM) Tahun 2024 - Modul Batch Processing', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-05-06T09:15:00Z', linkDocsT01: 'https://docs.google.com/document/d/qrs789', status: 'tidak_disetujui' },
  { id: '94', namaPksi: 'Pengembangan Sistem Informasi Pengawasan Pasar Modal (SIPM) Tahun 2024 - Modul Real-time Processing', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-05-07T11:45:00Z', linkDocsT01: 'https://docs.google.com/document/d/tuv012', status: 'disetujui' },
  { id: '95', namaPksi: 'Pengembangan Sistem Informasi Pengawasan Pasar Modal (SIPM) Tahun 2024 - Modul Complex Event Processing', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-05-08T13:20:00Z', linkDocsT01: 'https://docs.google.com/document/d/wxy345', status: 'pending' },
  { id: '96', namaPksi: 'Pengembangan Sistem Informasi Pengawasan Pasar Modal (SIPM) Tahun 2024 - Modul Stream Fusion', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-05-09T15:00:00Z', linkDocsT01: 'https://docs.google.com/document/d/zab678', status: 'tidak_disetujui' },
  { id: '97', namaPksi: 'Pengembangan Sistem Informasi Pengawasan Pasar Modal (SIPM) Tahun 2024 - Modul Stream Windowing', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-05-10T10:30:00Z', linkDocsT01: 'https://docs.google.com/document/d/cde901', status: 'disetujui' },
  { id: '98', namaPksi: 'Pengembangan Sistem Informasi Pengawasan Pasar Modal (SIPM) Tahun 2024 - Modul Stream Enrichment', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-05-11T12:15:00Z', linkDocsT01: 'https://docs.google.com/document/d/fgh234', status: 'pending' },
  { id: '99', namaPksi: 'Pengembangan Sistem Informasi Pengawasan Pasar Modal (SIPM) Tahun 2024 - Modul Stream Monitoring', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-05-12T14:45:00Z', linkDocsT01: 'https://docs.google.com/document/d/ijk567', status: 'tidak_disetujui' },
  { id: '100', namaPksi: 'Pengembangan Sistem Informasi Pengawasan Pasar Modal (SIPM) Tahun 2024 - Modul Advanced Analytics', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-05-13T09:30:00Z', linkDocsT01: 'https://docs.google.com/document/d/lmn890', status: 'disetujui' },
];

type Order = 'asc' | 'desc';

// Status label mapping
const STATUS_LABELS: Record<PksiData['status'], string> = {
  pending: 'Pending',
  disetujui: 'Disetujui',
  tidak_disetujui: 'Tidak Disetujui',
};

const getStatusColor = (status: PksiData['status']) => {
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

function PksiList() {
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [orderBy, setOrderBy] = useState<keyof PksiData>('namaPksi');
  const [order, setOrder] = useState<Order>('asc');
  const [pksiData, setPksiData] = useState<PksiData[]>(DUMMY_PKSI);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedPksiId, setSelectedPksiId] = useState<string | null>(null);

  // Filter state
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedJangkaWaktu, setSelectedJangkaWaktu] = useState<Set<string>>(new Set());
  const [selectedStatus, setSelectedStatus] = useState<Set<string>>(new Set());

  const handleStatusMenuOpen = (event: React.MouseEvent<HTMLElement>, pksiId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedPksiId(pksiId);
  };

  const handleStatusMenuClose = () => {
    setAnchorEl(null);
    setSelectedPksiId(null);
  };

  const handleStatusChange = (newStatus: PksiData['status']) => {
    if (selectedPksiId) {
      setPksiData(prev => 
        prev.map(item => 
          item.id === selectedPksiId ? { ...item, status: newStatus } : item
        )
      );
    }
    handleStatusMenuClose();
  };

  const handleFilterOpen = (event: React.MouseEvent<HTMLElement>) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };

  const handleJangkaWaktuChange = (jangkaWaktu: string) => {
    const newSet = new Set(selectedJangkaWaktu);
    if (newSet.has(jangkaWaktu)) {
      newSet.delete(jangkaWaktu);
    } else {
      newSet.add(jangkaWaktu);
    }
    setSelectedJangkaWaktu(newSet);
  };

  const handleStatusFilterChange = (status: string) => {
    const newSet = new Set(selectedStatus);
    if (newSet.has(status)) {
      newSet.delete(status);
    } else {
      newSet.add(status);
    }
    setSelectedStatus(newSet);
  };

  const handleResetFilter = () => {
    setSelectedJangkaWaktu(new Set());
    setSelectedStatus(new Set());
  };

  const filteredPksi = (() => {
    let result = pksiData.filter(item => {
      // Keyword filter
      const matchKeyword = item.namaPksi.toLowerCase().includes(keyword.toLowerCase());
      
      // Jangka Waktu filter
      const matchJangkaWaktu = selectedJangkaWaktu.size === 0 || selectedJangkaWaktu.has(item.jangkaWaktu);
      
      // Status filter
      const matchStatus = selectedStatus.size === 0 || selectedStatus.has(item.status);
      
      return matchKeyword && matchJangkaWaktu && matchStatus;
    });

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

  const handleSort = (property: keyof PksiData) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedPksi = filteredPksi.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const navigate = useNavigate();

  const handleAddPksi = () => {
    navigate('/add-pksi');
  };

  return (
    <Box sx={{ p: 3.5 }}>
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
          Dashboard PKSI
        </Typography>
        <Typography variant="body1" sx={{ color: '#86868b' }}>
          Kelola data pengajuan PKSI
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
              placeholder="Cari nama PKSI..."
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
                color: selectedJangkaWaktu.size > 0 || selectedStatus.size > 0 ? '#DA251C' : '#86868b',
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
            onClick={handleAddPksi}  // <-- Tambah baris ini
            sx={{
              background: 'linear-gradient(135deg, #DA251C 0%, #FF4D45 100%)',
              fontWeight: 500,
              px: 2.5,
              '&:hover': {
                background: 'linear-gradient(135deg, #B91C14 0%, #D83A32 100%)',
              },
            }}
          >
            Tambah PKSI
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

            {/* Jangka Waktu Filter */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#1d1d1f', mb: 1 }}>
                Jangka Waktu
              </Typography>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={selectedJangkaWaktu.has('Single Year')}
                      onChange={() => handleJangkaWaktuChange('Single Year')}
                    />
                  }
                  label={<Typography variant="body2">Single Year</Typography>}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={selectedJangkaWaktu.has('Multiyears 2024-2025')}
                      onChange={() => handleJangkaWaktuChange('Multiyears 2024-2025')}
                    />
                  }
                  label={<Typography variant="body2">Multiyears 2024-2025</Typography>}
                />
              </FormGroup>
            </Box>

            <Box sx={{ borderTop: '1px solid rgba(0,0,0,0.06)', my: 2 }} />

            {/* Status Filter */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#1d1d1f', mb: 1 }}>
                Status
              </Typography>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={selectedStatus.has('disetujui')}
                      onChange={() => handleStatusFilterChange('disetujui')}
                    />
                  }
                  label={<Typography variant="body2">Disetujui</Typography>}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={selectedStatus.has('tidak_disetujui')}
                      onChange={() => handleStatusFilterChange('tidak_disetujui')}
                    />
                  }
                  label={<Typography variant="body2">Tidak Disetujui</Typography>}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={selectedStatus.has('pending')}
                      onChange={() => handleStatusFilterChange('pending')}
                    />
                  }
                  label={<Typography variant="body2">Pending</Typography>}
                />
              </FormGroup>
            </Box>

            <Box sx={{ borderTop: '1px solid rgba(0,0,0,0.06)', my: 2 }} />

            {/* Reset Button */}
            <Button
              fullWidth
              variant="outlined"
              size="small"
              onClick={handleResetFilter}
              sx={{
                color: '#DA251C',
                borderColor: '#DA251C',
                '&:hover': {
                  bgcolor: 'rgba(218, 37, 28, 0.04)',
                  borderColor: '#DA251C',
                },
              }}
            >
              Reset Filter
            </Button>
          </Box>
        </Popover>

        {/* Table */}
        <TableContainer sx={{ width: '100%' }}>
          <Table>
            <TableHead sx={{ bgcolor: '#f5f5f7' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, color: '#1d1d1f', py: 2 }}>No</TableCell>
                <TableCell 
                  sortDirection={orderBy === 'namaPksi' ? order : false}
                  sx={{ fontWeight: 600, color: '#1d1d1f', py: 2 }}
                >
                  <TableSortLabel
                    active={orderBy === 'namaPksi'}
                    direction={orderBy === 'namaPksi' ? order : 'asc'}
                    onClick={() => handleSort('namaPksi')}
                  >
                    Nama PKSI
                  </TableSortLabel>
                </TableCell>
                <TableCell 
                  sortDirection={orderBy === 'jangkaWaktu' ? order : false}
                  sx={{ fontWeight: 600, color: '#1d1d1f', py: 2 }}
                >
                  <TableSortLabel
                    active={orderBy === 'jangkaWaktu'}
                    direction={orderBy === 'jangkaWaktu' ? order : 'asc'}
                    onClick={() => handleSort('jangkaWaktu')}
                  >
                    Jangka Waktu
                  </TableSortLabel>
                </TableCell>
                <TableCell 
                  sortDirection={orderBy === 'tanggalPengajuan' ? order : false}
                  sx={{ fontWeight: 600, color: '#1d1d1f', py: 2 }}
                >
                  <TableSortLabel
                    active={orderBy === 'tanggalPengajuan'}
                    direction={orderBy === 'tanggalPengajuan' ? order : 'asc'}
                    onClick={() => handleSort('tanggalPengajuan')}
                  >
                    Tanggal Pengajuan
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#1d1d1f', py: 2 }}>Lampiran Docs T.01</TableCell>
                <TableCell 
                  sortDirection={orderBy === 'status' ? order : false}
                  sx={{ fontWeight: 600, color: '#1d1d1f', py: 2 }}
                >
                  <TableSortLabel
                    active={orderBy === 'status'}
                    direction={orderBy === 'status' ? order : 'asc'}
                    onClick={() => handleSort('status')}
                  >
                    Status
                  </TableSortLabel>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedPksi.map((item, index) => (
                <TableRow 
                  key={item.id}
                  sx={{
                    borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
                    '&:hover': {
                      bgcolor: 'rgba(0, 0, 0, 0.02)',
                    },
                  }}
                >
                  <TableCell sx={{ color: '#86868b', py: 2 }}>
                    {page * rowsPerPage + index + 1}
                  </TableCell>
                  <TableCell sx={{ color: '#1d1d1f', py: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {item.namaPksi}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ color: '#1d1d1f', py: 2 }}>
                    <Chip
                      label={item.jangkaWaktu}
                      size="small"
                      sx={{
                        bgcolor: item.jangkaWaktu === 'Single Year' ? '#8B5CF6' : '#2563EB',
                        color: 'white',
                        fontWeight: 500,
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ color: '#1d1d1f', py: 2 }}>
                    {new Date(item.tanggalPengajuan).toLocaleDateString('id-ID', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </TableCell>
                  <TableCell sx={{ py: 2 }}>
                    <Tooltip title="Buka dokumen">
                      <IconButton
                        component={Link}
                        href={item.linkDocsT01}
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
                  </TableCell>
                  <TableCell sx={{ py: 2 }}>
                    <Box
                      onClick={(e) => handleStatusMenuOpen(e as any, item.id)}
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 1,
                        px: 1.5,
                        py: 0.75,
                        bgcolor: `${getStatusColor(item.status)}20`,
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': {
                          bgcolor: `${getStatusColor(item.status)}30`,
                        },
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 500,
                          color: getStatusColor(item.status),
                        }}
                      >
                        {STATUS_LABELS[item.status]}
                      </Typography>
                      <ArrowDownIcon sx={{ fontSize: 16, color: getStatusColor(item.status) }} />
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Status Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleStatusMenuClose}
        >
          <MenuItem onClick={() => handleStatusChange('disetujui')}>
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
          <MenuItem onClick={() => handleStatusChange('tidak_disetujui')}>
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
          <MenuItem onClick={() => handleStatusChange('pending')}>
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
        </Menu>

        {/* Pagination */}
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredPksi.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{
            borderTop: '1px solid rgba(0, 0, 0, 0.06)',
            '& .MuiTablePagination-select': {
              bgcolor: '#f5f5f7',
              borderRadius: '8px',
              border: '1px solid rgba(0, 0, 0, 0.08)',
            },
          }}
        />
      </Paper>
    </Box>
  );
}

export default PksiList;
