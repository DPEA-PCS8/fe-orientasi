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
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  TuneRounded,
  KeyboardArrowDown as ArrowDownIcon,
  OpenInNew as OpenInNewIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { Popover, Checkbox, FormControlLabel, FormGroup } from '@mui/material';

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
  { id: '8', namaPksi: 'Pengembangan Sistem Informasi Pengawasan Pasar Modal (SIPM) Tahun 2024 - Analisis Kinerja Perusahaan Efek dan MKBD Mingguan', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-02-09T12:15:00Z', linkDocsT01: 'https://docs.google.com/document/d/vwx234', status: 'tidak_disetujui' },
  { id: '9', namaPksi: 'Pengembangan Sistem Informasi Pengawasan Pasar Modal (SIPM) Tahun 2024 - Modul Pengawasan Profesi Penunjang Pasar Modal – Konsultan Hukum', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-02-09T13:45:00Z', linkDocsT01: 'https://docs.google.com/document/d/yza567', status: 'pending' },
  { id: '10', namaPksi: 'Pengembangan Sistem Informasi Pengawasan Pasar Modal (SIPM) Tahun 2024 - Modul Pengawasan Profesi Penunjang Pasar Modal - Penilai', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-02-09T14:20:00Z', linkDocsT01: 'https://docs.google.com/document/d/bcd890', status: 'disetujui' },
  { id: '11', namaPksi: 'Pengembangan Sistem Informasi Pengawasan Pasar Modal (SIPM) Tahun 2024 - Modul Pengawasan Profesi Penunjang Pasar Modal - Notaris', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-02-10T09:00:00Z', linkDocsT01: 'https://docs.google.com/document/d/efg123', status: 'pending' },
  { id: '12', namaPksi: 'Pengembangan Sistem Informasi Pengawasan Pasar Modal (SIPM) Tahun 2024 - Modul Pengawasan Industri Pengelolaan Investasi', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-02-10T10:15:00Z', linkDocsT01: 'https://docs.google.com/document/d/hij456', status: 'tidak_disetujui' },
  { id: '13', namaPksi: 'Pengembangan Sistem Informasi Pengawasan Pasar Modal (SIPM) Tahun 2024 - Modul Pengawasan Laporan Keuangan Manajer Investasi', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-02-10T11:30:00Z', linkDocsT01: 'https://docs.google.com/document/d/klm789', status: 'disetujui' },
  { id: '14', namaPksi: 'Enhancement Sistem Informasi Pengawasan Pasar Modal (SIPM) Tahun 2024 - Modul Monitoring Laporan Emiten dan Perusahaan Publik (Tahap 3)', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-02-10T12:45:00Z', linkDocsT01: 'https://docs.google.com/document/d/nop012', status: 'pending' },
  { id: '15', namaPksi: 'Pengembangan Sistem Informasi Pengawasan Pasar Modal (SIPM) Tahun 2024 - Modul Factbook SRO, Layanan Urun Dana (LUD), dan Lembaga Penunjang (Bank Kustodian, Biro Administrasi Efek, Wali Amanat, PPDES, Perusahaan Pemeringkat Efek)', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-02-10T14:00:00Z', linkDocsT01: 'https://docs.google.com/document/d/qrs345', status: 'disetujui' },
  { id: '16', namaPksi: 'Pengembangan Sistem Informasi Pengawasan Pasar Modal Terpadu (SIPM) - Modul Penanganan Keberatan', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-02-10T15:15:00Z', linkDocsT01: 'https://docs.google.com/document/d/tuv678', status: 'tidak_disetujui' },
  { id: '17', namaPksi: 'SIP IKNB - Enhancement Modul Pemeriksaan Langsung Asuransi dan Reasuransi Konvensional', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-02-10T16:30:00Z', linkDocsT01: 'https://docs.google.com/document/d/wxy901', status: 'pending' },
  { id: '18', namaPksi: 'SIP IKNB - Enhancement Modul Pemeriksaan Langsung Asuransi dan Reasuransi Syariah', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-02-11T08:00:00Z', linkDocsT01: 'https://docs.google.com/document/d/zab234', status: 'disetujui' },
  { id: '19', namaPksi: 'SIP IKNB - Enhancement Modul Sanksi Asuransi dan Reasuransi Konvensional', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-02-11T09:30:00Z', linkDocsT01: 'https://docs.google.com/document/d/cde567', status: 'pending' },
  { id: '20', namaPksi: 'SIP IKNB - Enhancement Modul Sanksi Asuransi dan Reasuransi Syariah', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-02-11T10:45:00Z', linkDocsT01: 'https://docs.google.com/document/d/fgh890', status: 'tidak_disetujui' },
  { id: '21', namaPksi: 'SIP IKNB - Enhancement Modul Tindak Lanjut Hasil Pengawasan (TLHP) Asuransi dan Reasuransi Konvensional', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-02-11T12:00:00Z', linkDocsT01: 'https://docs.google.com/document/d/ijk123', status: 'disetujui' },
  { id: '22', namaPksi: 'SIP IKNB - Enhancement Modul Tindak Lanjut Hasil Pengawasan (TLHP) Asuransi dan Reasuransi Syariah', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-02-11T13:15:00Z', linkDocsT01: 'https://docs.google.com/document/d/lmn456', status: 'pending' },
  { id: '23', namaPksi: 'SIP IKNB - Pelaporan Tindak Lanjut Rekomendasi Hasil Pemeriksaan Langsung Dana Pensiun', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-02-11T14:30:00Z', linkDocsT01: 'https://docs.google.com/document/d/opq789', status: 'tidak_disetujui' },
  { id: '24', namaPksi: 'SIP IKNB ALB - Pengembangan Sistem Informasi Analisis Laporan Keuangan Perusahaan Asuransi dan Reasuransi', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-02-11T15:45:00Z', linkDocsT01: 'https://docs.google.com/document/d/rst012', status: 'disetujui' },
  { id: '25', namaPksi: 'SIP IKNB ALB - Pengembangan Sistem Informasi Analisis Laporan Keuangan Perusahaan Asuransi dan Reasuransi Syariah', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-02-11T17:00:00Z', linkDocsT01: 'https://docs.google.com/document/d/uvw345', status: 'pending' },
  { id: '26', namaPksi: 'Enhancement SIP IKNB ALB Dana Pensiun - Syariah', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-02-12T08:30:00Z', linkDocsT01: 'https://docs.google.com/document/d/xyz678', status: 'disetujui' },
  { id: '27', namaPksi: 'Pengembangan SI IKNB Modul Analisis Laporan Berkala Non Keuangan (ALB-NK) Jasa Penunjang', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-02-12T09:45:00Z', linkDocsT01: 'https://docs.google.com/document/d/abc901', status: 'tidak_disetujui' },
  { id: '28', namaPksi: 'SIP IKNB ALB - Analisis Laporan Keuangan – Laporan Rencana Bisnis LPBBTI', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-02-12T11:00:00Z', linkDocsT01: 'https://docs.google.com/document/d/def234', status: 'pending' },
  { id: '29', namaPksi: 'SIP IKNB ALB - Analisis Laporan Keuangan (ALK ) - Laporan Berkala LPBBTI', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-02-12T12:15:00Z', linkDocsT01: 'https://docs.google.com/document/d/ghi567', status: 'disetujui' },
  { id: '30', namaPksi: 'SIP IKNB - Pengembangan SI IKNB Modul Monitoring Sanksi dan Rekomendasi Hasil Pemeriksaan', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-02-12T13:30:00Z', linkDocsT01: 'https://docs.google.com/document/d/jkl890', status: 'pending' },
  { id: '31', namaPksi: 'Enhancement SIP IKNB Modul Sanksi Lembaga Pembiayaan', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-02-12T14:45:00Z', linkDocsT01: 'https://docs.google.com/document/d/mno123', status: 'tidak_disetujui' },
  { id: '32', namaPksi: 'Enhancement Website OJK', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-02-12T16:00:00Z', linkDocsT01: 'https://docs.google.com/document/d/pqr456', status: 'disetujui' },
  { id: '33', namaPksi: 'Pejabat Pengelola Informasi dan Dokumentasi [PPID] OJK Mobile Apps', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-02-12T17:15:00Z', linkDocsT01: 'https://docs.google.com/document/d/stu789', status: 'pending' },
  { id: '34', namaPksi: 'Enhancement Sistem Pengolahan Data Program Satu Rekening Satu Pelajar (KEJAR)', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-02-13T08:00:00Z', linkDocsT01: 'https://docs.google.com/document/d/vwx012', status: 'disetujui' },
  { id: '35', namaPksi: 'Enhancement Aplikasi Portal Perlindungan Konsumen (APPK) Tahun 2024', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-02-13T09:30:00Z', linkDocsT01: 'https://docs.google.com/document/d/yza345', status: 'tidak_disetujui' },
  { id: '36', namaPksi: 'Sistem Pengawasan Perilaku Pelaku Usaha Jasa Keuangan', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-02-13T10:45:00Z', linkDocsT01: 'https://docs.google.com/document/d/bcd678', status: 'pending' },
  { id: '37', namaPksi: 'Sistem Informasi ARK Terintegrasi (CACM OJK)', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-02-13T12:00:00Z', linkDocsT01: 'https://docs.google.com/document/d/efg901', status: 'disetujui' },
  { id: '38', namaPksi: 'Sistem Informasi ARK Terintegrasi (GRC OJK)', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-02-13T13:15:00Z', linkDocsT01: 'https://docs.google.com/document/d/hij234', status: 'pending' },
  { id: '39', namaPksi: 'Sistem Informasi ARK Terintegrasi (E-KYE OJK)', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-02-13T14:30:00Z', linkDocsT01: 'https://docs.google.com/document/d/klm567', status: 'tidak_disetujui' },
  { id: '40', namaPksi: 'Enhancement Repository and Conversion Engine (RACE) Tahun 2024', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-02-13T15:45:00Z', linkDocsT01: 'https://docs.google.com/document/d/nop890', status: 'disetujui' },
  { id: '41', namaPksi: 'SIP Perbankan Modul Penyusunan KYBPR - KYBPRS', jangkaWaktu: 'Single Year', tanggalPengajuan: '2026-02-13T17:00:00Z', linkDocsT01: 'https://docs.google.com/document/d/qrs123', status: 'pending' },
  { id: '42', namaPksi: 'SIP Perbankan Modul Manajemen Pemeriksaan BPR/BPRS', jangkaWaktu: 'Single Year', tanggalPengajuan: '2026-02-14T08:30:00Z', linkDocsT01: 'https://docs.google.com/document/d/tuv456', status: 'disetujui' },
  { id: '43', namaPksi: 'Supervision Dashboard Perbankan', jangkaWaktu: 'Single Year', tanggalPengajuan: '2026-02-14T09:45:00Z', linkDocsT01: 'https://docs.google.com/document/d/wxy789', status: 'tidak_disetujui' },
  { id: '44', namaPksi: 'Sistem Informasi Pengawasan Konglomerasi Keuangan (SIPKK) Modul Financial Conglomerate Ratio (FICOR)', jangkaWaktu: 'Single Year', tanggalPengajuan: '2026-02-14T11:00:00Z', linkDocsT01: 'https://docs.google.com/document/d/zab012', status: 'pending' },
  { id: '45', namaPksi: 'Sistem Informasi Penanganan Dugaan Pelanggaran (SIPEDANG)', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-02-14T12:15:00Z', linkDocsT01: 'https://docs.google.com/document/d/cde345', status: 'disetujui' },
  { id: '46', namaPksi: 'Sistem Informasi Pengawasan Profesi Penunjang Akuntan Publik dan Kantor Akuntan Publik', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-02-14T13:30:00Z', linkDocsT01: 'https://docs.google.com/document/d/fgh678', status: 'pending' },
  { id: '47', namaPksi: 'Pengembangan Sistem Informasi Pengawasan Pasar Modal (SIPM) Tahun 2024 - Modul Profil Nasabah', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-02-14T14:45:00Z', linkDocsT01: 'https://docs.google.com/document/d/ijk901', status: 'tidak_disetujui' },
  { id: '48', namaPksi: 'Pengembangan Sistem Informasi Pengawasan Pasar Modal (SIPM) Tahun 2024 - Analisis Kinerja Perusahaan Efek dan MKBD Mingguan', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-02-14T16:00:00Z', linkDocsT01: 'https://docs.google.com/document/d/lmn234', status: 'pending' },
  { id: '49', namaPksi: 'Pengembangan Sistem Informasi Pengawasan Pasar Modal (SIPM) Tahun 2024 - Modul Pengawasan Profesi Penunjang Pasar Modal – Konsultan Hukum', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-02-14T17:15:00Z', linkDocsT01: 'https://docs.google.com/document/d/opq567', status: 'disetujui' },
  { id: '50', namaPksi: 'Pengembangan Sistem Informasi Pengawasan Pasar Modal (SIPM) Tahun 2024 - Modul Pengawasan Profesi Penunjang Pasar Modal - Penilai', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-02-15T08:00:00Z', linkDocsT01: 'https://docs.google.com/document/d/rst890', status: 'tidak_disetujui' },
  { id: '51', namaPksi: 'Pengembangan Sistem Informasi Pengawasan Pasar Modal (SIPM) Tahun 2024 - Modul Pengawasan Profesi Penunjang Pasar Modal - Notaris', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-02-15T09:30:00Z', linkDocsT01: 'https://docs.google.com/document/d/uvw123', status: 'pending' },
  { id: '52', namaPksi: 'Pengembangan Sistem Informasi Pengawasan Pasar Modal (SIPM) Tahun 2024 - Modul Pengawasan Industri Pengelolaan Investasi', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-02-15T10:45:00Z', linkDocsT01: 'https://docs.google.com/document/d/xyz456', status: 'disetujui' },
  { id: '53', namaPksi: 'Pengembangan Sistem Informasi Pengawasan Pasar Modal (SIPM) Tahun 2024 - Modul Pengawasan Laporan Keuangan Manajer Investasi', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-02-15T12:00:00Z', linkDocsT01: 'https://docs.google.com/document/d/abc789', status: 'tidak_disetujui' },
  { id: '54', namaPksi: 'Enhancement Sistem Informasi Pengawasan Pasar Modal (SIPM) Tahun 2024 - Modul Monitoring Laporan Emiten dan Perusahaan Publik (Tahap 3)', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-02-15T13:15:00Z', linkDocsT01: 'https://docs.google.com/document/d/def012', status: 'pending' },
  { id: '55', namaPksi: 'Pengembangan Sistem Informasi Pengawasan Pasar Modal (SIPM) Tahun 2024 - Modul Factbook SRO, Layanan Urun Dana (LUD), dan Lembaga Penunjang (Bank Kustodian, Biro Administrasi Efek, Wali Amanat, PPDES, Perusahaan Pemeringkat Efek)', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-02-15T14:30:00Z', linkDocsT01: 'https://docs.google.com/document/d/ghi345', status: 'disetujui' },
  { id: '56', namaPksi: 'Pengembangan Sistem Informasi Pengawasan Pasar Modal Terpadu (SIPM) - Modul Penanganan Keberatan', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-02-15T15:45:00Z', linkDocsT01: 'https://docs.google.com/document/d/jkl678', status: 'tidak_disetujui' },
  { id: '57', namaPksi: 'SIP IKNB - Enhancement Modul Pemeriksaan Langsung Asuransi dan Reasuransi Konvensional', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-02-15T17:00:00Z', linkDocsT01: 'https://docs.google.com/document/d/mno901', status: 'pending' },
  { id: '58', namaPksi: 'SIP IKNB - Enhancement Modul Pemeriksaan Langsung Asuransi dan Reasuransi Syariah', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-02-16T08:30:00Z', linkDocsT01: 'https://docs.google.com/document/d/pqr234', status: 'disetujui' },
  { id: '59', namaPksi: 'SIP IKNB - Enhancement Modul Sanksi Asuransi dan Reasuransi Konvensional', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-02-16T09:45:00Z', linkDocsT01: 'https://docs.google.com/document/d/stu567', status: 'tidak_disetujui' },
  { id: '60', namaPksi: 'SIP IKNB - Enhancement Modul Sanksi Asuransi dan Reasuransi Syariah', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-02-16T11:00:00Z', linkDocsT01: 'https://docs.google.com/document/d/vwx890', status: 'pending' },
  { id: '61', namaPksi: 'SIP IKNB - Enhancement Modul Tindak Lanjut Hasil Pengawasan (TLHP) Asuransi dan Reasuransi Konvensional', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-02-16T12:15:00Z', linkDocsT01: 'https://docs.google.com/document/d/yza123', status: 'disetujui' },
  { id: '62', namaPksi: 'SIP IKNB - Enhancement Modul Tindak Lanjut Hasil Pengawasan (TLHP) Asuransi dan Reasuransi Syariah', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-02-16T13:30:00Z', linkDocsT01: 'https://docs.google.com/document/d/bcd456', status: 'tidak_disetujui' },
  { id: '63', namaPksi: 'SIP IKNB - Pelaporan Tindak Lanjut Rekomendasi Hasil Pemeriksaan Langsung Dana Pensiun', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-02-16T14:45:00Z', linkDocsT01: 'https://docs.google.com/document/d/efg789', status: 'pending' },
  { id: '64', namaPksi: 'SIP IKNB ALB - Pengembangan Sistem Informasi Analisis Laporan Keuangan Perusahaan Asuransi dan Reasuransi', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-02-16T16:00:00Z', linkDocsT01: 'https://docs.google.com/document/d/hij012', status: 'disetujui' },
  { id: '65', namaPksi: 'SIP IKNB ALB - Pengembangan Sistem Informasi Analisis Laporan Keuangan Perusahaan Asuransi dan Reasuransi Syariah', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-02-16T17:15:00Z', linkDocsT01: 'https://docs.google.com/document/d/klm345', status: 'tidak_disetujui' },
  { id: '66', namaPksi: 'Enhancement SIP IKNB ALB Dana Pensiun - Syariah', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-02-17T08:00:00Z', linkDocsT01: 'https://docs.google.com/document/d/nop678', status: 'pending' },
  { id: '67', namaPksi: 'Pengembangan SI IKNB Modul Analisis Laporan Berkala Non Keuangan (ALB-NK) Jasa Penunjang', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-02-17T09:30:00Z', linkDocsT01: 'https://docs.google.com/document/d/qrs901', status: 'disetujui' },
  { id: '68', namaPksi: 'SIP IKNB ALB - Analisis Laporan Keuangan – Laporan Rencana Bisnis LPBBTI', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-02-17T10:45:00Z', linkDocsT01: 'https://docs.google.com/document/d/tuv234', status: 'tidak_disetujui' },
  { id: '69', namaPksi: 'SIP IKNB ALB - Analisis Laporan Keuangan (ALK ) - Laporan Berkala LPBBTI', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-02-17T12:00:00Z', linkDocsT01: 'https://docs.google.com/document/d/wxy567', status: 'pending' },
  { id: '70', namaPksi: 'SIP IKNB - Pengembangan SI IKNB Modul Monitoring Sanksi dan Rekomendasi Hasil Pemeriksaan', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-02-17T13:15:00Z', linkDocsT01: 'https://docs.google.com/document/d/zab890', status: 'disetujui' },
  { id: '71', namaPksi: 'Enhancement SIP IKNB Modul Sanksi Lembaga Pembiayaan', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-02-17T14:30:00Z', linkDocsT01: 'https://docs.google.com/document/d/cde123', status: 'tidak_disetujui' },
  { id: '72', namaPksi: 'Enhancement Website OJK', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-02-17T15:45:00Z', linkDocsT01: 'https://docs.google.com/document/d/fgh456', status: 'pending' },
  { id: '73', namaPksi: 'Pejabat Pengelola Informasi dan Dokumentasi [PPID] OJK Mobile Apps', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-02-17T17:00:00Z', linkDocsT01: 'https://docs.google.com/document/d/ijk789', status: 'disetujui' },
  { id: '74', namaPksi: 'Enhancement Sistem Pengolahan Data Program Satu Rekening Satu Pelajar (KEJAR)', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-02-18T08:30:00Z', linkDocsT01: 'https://docs.google.com/document/d/lmn012', status: 'tidak_disetujui' },
  { id: '75', namaPksi: 'Enhancement Aplikasi Portal Perlindungan Konsumen (APPK) Tahun 2024', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-02-18T09:45:00Z', linkDocsT01: 'https://docs.google.com/document/d/opq345', status: 'pending' },
  { id: '76', namaPksi: 'Sistem Pengawasan Perilaku Pelaku Usaha Jasa Keuangan', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-02-18T11:00:00Z', linkDocsT01: 'https://docs.google.com/document/d/rst678', status: 'disetujui' },
  { id: '77', namaPksi: 'Sistem Informasi ARK Terintegrasi (CACM OJK)', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-02-18T12:15:00Z', linkDocsT01: 'https://docs.google.com/document/d/uvw901', status: 'tidak_disetujui' },
  { id: '78', namaPksi: 'Sistem Informasi ARK Terintegrasi (GRC OJK)', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-02-18T13:30:00Z', linkDocsT01: 'https://docs.google.com/document/d/xyz234', status: 'pending' },
  { id: '79', namaPksi: 'Sistem Informasi ARK Terintegrasi (E-KYE OJK)', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-02-18T14:45:00Z', linkDocsT01: 'https://docs.google.com/document/d/abc567', status: 'disetujui' },
  { id: '80', namaPksi: 'Enhancement Repository and Conversion Engine (RACE) Tahun 2024', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-02-18T16:00:00Z', linkDocsT01: 'https://docs.google.com/document/d/def890', status: 'tidak_disetujui' },
  { id: '81', namaPksi: 'SIP Perbankan Modul Penyusunan KYBPR - KYBPRS', jangkaWaktu: 'Single Year', tanggalPengajuan: '2026-02-18T17:15:00Z', linkDocsT01: 'https://docs.google.com/document/d/ghi123', status: 'pending' },
  { id: '82', namaPksi: 'SIP Perbankan Modul Manajemen Pemeriksaan BPR/BPRS', jangkaWaktu: 'Single Year', tanggalPengajuan: '2026-02-19T08:00:00Z', linkDocsT01: 'https://docs.google.com/document/d/jkl456', status: 'disetujui' },
  { id: '83', namaPksi: 'Supervision Dashboard Perbankan', jangkaWaktu: 'Single Year', tanggalPengajuan: '2026-02-19T09:30:00Z', linkDocsT01: 'https://docs.google.com/document/d/mno789', status: 'tidak_disetujui' },
  { id: '84', namaPksi: 'Sistem Informasi Pengawasan Konglomerasi Keuangan (SIPKK) Modul Financial Conglomerate Ratio (FICOR)', jangkaWaktu: 'Single Year', tanggalPengajuan: '2026-02-19T10:45:00Z', linkDocsT01: 'https://docs.google.com/document/d/pqr012', status: 'pending' },
  { id: '85', namaPksi: 'Sistem Informasi Penanganan Dugaan Pelanggaran (SIPEDANG)', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-02-19T12:00:00Z', linkDocsT01: 'https://docs.google.com/document/d/stu345', status: 'disetujui' },
  { id: '86', namaPksi: 'Sistem Informasi Pengawasan Profesi Penunjang Akuntan Publik dan Kantor Akuntan Publik', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-02-19T13:15:00Z', linkDocsT01: 'https://docs.google.com/document/d/vwx678', status: 'tidak_disetujui' },
  { id: '87', namaPksi: 'Pengembangan Sistem Informasi Pengawasan Pasar Modal (SIPM) Tahun 2024 - Modul Profil Nasabah', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-02-19T14:30:00Z', linkDocsT01: 'https://docs.google.com/document/d/yza901', status: 'pending' },
  { id: '88', namaPksi: 'Pengembangan Sistem Informasi Pengawasan Pasar Modal (SIPM) Tahun 2024 - Analisis Kinerja Perusahaan Efek dan MKBD Mingguan', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-02-19T15:45:00Z', linkDocsT01: 'https://docs.google.com/document/d/bcd234', status: 'disetujui' },
  { id: '89', namaPksi: 'Pengembangan Sistem Informasi Pengawasan Pasar Modal (SIPM) Tahun 2024 - Modul Pengawasan Profesi Penunjang Pasar Modal – Konsultan Hukum', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-02-19T17:00:00Z', linkDocsT01: 'https://docs.google.com/document/d/efg567', status: 'tidak_disetujui' },
  { id: '90', namaPksi: 'Pengembangan Sistem Informasi Pengawasan Pasar Modal (SIPM) Tahun 2024 - Modul Pengawasan Profesi Penunjang Pasar Modal - Penilai', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-02-20T08:30:00Z', linkDocsT01: 'https://docs.google.com/document/d/hij890', status: 'pending' },
  { id: '91', namaPksi: 'Pengembangan Sistem Informasi Pengawasan Pasar Modal (SIPM) Tahun 2024 - Modul Pengawasan Profesi Penunjang Pasar Modal - Notaris', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-02-20T09:45:00Z', linkDocsT01: 'https://docs.google.com/document/d/klm123', status: 'disetujui' },
  { id: '92', namaPksi: 'Pengembangan Sistem Informasi Pengawasan Pasar Modal (SIPM) Tahun 2024 - Modul Pengawasan Industri Pengelolaan Investasi', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-02-20T11:00:00Z', linkDocsT01: 'https://docs.google.com/document/d/nop456', status: 'tidak_disetujui' },
  { id: '93', namaPksi: 'Pengembangan Sistem Informasi Pengawasan Pasar Modal (SIPM) Tahun 2024 - Modul Pengawasan Laporan Keuangan Manajer Investasi', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-02-20T12:15:00Z', linkDocsT01: 'https://docs.google.com/document/d/qrs789', status: 'pending' },
  { id: '94', namaPksi: 'Enhancement Sistem Informasi Pengawasan Pasar Modal (SIPM) Tahun 2024 - Modul Monitoring Laporan Emiten dan Perusahaan Publik (Tahap 3)', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-02-20T13:30:00Z', linkDocsT01: 'https://docs.google.com/document/d/tuv012', status: 'disetujui' },
  { id: '95', namaPksi: 'Pengembangan Sistem Informasi Pengawasan Pasar Modal (SIPM) Tahun 2024 - Modul Factbook SRO, Layanan Urun Dana (LUD), dan Lembaga Penunjang (Bank Kustodian, Biro Administrasi Efek, Wali Amanat, PPDES, Perusahaan Pemeringkat Efek)', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-02-20T14:45:00Z', linkDocsT01: 'https://docs.google.com/document/d/wxy345', status: 'tidak_disetujui' },
  { id: '96', namaPksi: 'Pengembangan Sistem Informasi Pengawasan Pasar Modal Terpadu (SIPM) - Modul Penanganan Keberatan', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-02-20T16:00:00Z', linkDocsT01: 'https://docs.google.com/document/d/zab678', status: 'pending' },
  { id: '97', namaPksi: 'SIP IKNB - Enhancement Modul Pemeriksaan Langsung Asuransi dan Reasuransi Konvensional', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-02-20T17:15:00Z', linkDocsT01: 'https://docs.google.com/document/d/cde901', status: 'disetujui' },
  { id: '98', namaPksi: 'SIP IKNB - Enhancement Modul Pemeriksaan Langsung Asuransi dan Reasuransi Syariah', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-02-21T08:00:00Z', linkDocsT01: 'https://docs.google.com/document/d/fgh234', status: 'tidak_disetujui' },
  { id: '99', namaPksi: 'SIP IKNB - Enhancement Modul Sanksi Asuransi dan Reasuransi Konvensional', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-02-21T09:30:00Z', linkDocsT01: 'https://docs.google.com/document/d/ijk567', status: 'pending' },
  { id: '100', namaPksi: 'Enhancement Repository and Conversion Engine (RACE) Tahun 2024', jangkaWaktu: 'Multiyears 2024-2025', tanggalPengajuan: '2026-02-21T10:45:00Z', linkDocsT01: 'https://docs.google.com/document/d/lmn890', status: 'disetujui' },
];

type Order = 'asc' | 'desc';

// Status label mapping
const STATUS_LABELS: Record<PksiData['status'], string> = {
  pending: 'Pending',
  disetujui: 'Disetujui',
  tidak_disetujui: 'Tidak Disetujui',
};

// Status color mapping
const getStatusColor = (status: PksiData['status']) => {
  switch (status) {
    case 'disetujui':
      return { bgcolor: 'rgba(46, 125, 50, 0.1)', color: '#2e7d32' };
    case 'tidak_disetujui':
      return { bgcolor: 'rgba(211, 47, 47, 0.1)', color: '#d32f2f' };
    default:
      return { bgcolor: 'rgba(237, 108, 2, 0.1)', color: '#ed6c02' };
  }
};

const UserList = () => {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [orderBy, setOrderBy] = useState<keyof PksiData>('namaPksi');
  const [order, setOrder] = useState<Order>('asc');
  const [pksiData, setPksiData] = useState<PksiData[]>(DUMMY_PKSI);
  
  // Menu state for status dropdown
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

  const handleChangePage = (_: unknown, newPage: number) => {
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
          Semua PKSI
        </Typography>
        <Typography variant="body1" sx={{ color: '#86868b' }}>
          Kelola data pengajuan PKSI dan dokumen T.01
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
            onClick={() => navigate('/add-pksi')}
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
          <Table sx={{ minWidth: '100%' }} stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ pl: 3, width: 60 }}>No</TableCell>
                <TableCell sx={{ minWidth: 200 }}>
                  <TableSortLabel
                    active={orderBy === 'namaPksi'}
                    direction={orderBy === 'namaPksi' ? order : 'asc'}
                    onClick={() => handleSort('namaPksi')}
                  >
                    Nama PKSI
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ minWidth: 150 }}>
                  <TableSortLabel
                    active={orderBy === 'jangkaWaktu'}
                    direction={orderBy === 'jangkaWaktu' ? order : 'asc'}
                    onClick={() => handleSort('jangkaWaktu')}
                  >
                    Jangka Waktu
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ minWidth: 150 }}>
                  <TableSortLabel
                    active={orderBy === 'tanggalPengajuan'}
                    direction={orderBy === 'tanggalPengajuan' ? order : 'asc'}
                    onClick={() => handleSort('tanggalPengajuan')}
                  >
                    Tanggal Pengajuan
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ minWidth: 180 }}>Lampiran Docs T.01</TableCell>
                <TableCell sx={{ minWidth: 180 }}>
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
              {paginatedPksi.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} sx={{ py: 8, textAlign: 'center' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <SearchIcon sx={{ fontSize: 48, color: '#d1d1d6', mb: 2 }} />
                      <Typography variant="body1" sx={{ color: '#86868b', fontWeight: 500 }}>
                        Data tidak ditemukan
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#aeaeb2' }}>
                        Coba sesuaikan kata kunci pencarian
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedPksi.map((item, index) => (
                  <TableRow
                    key={item.id}
                    sx={{
                      '&:last-child td': { borderBottom: 0 },
                    }}
                  >
                    <TableCell sx={{ pl: 3, color: '#86868b', fontSize: '0.875rem' }}>
                      {page * rowsPerPage + index + 1}
                    </TableCell>
                    <TableCell>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontWeight: 500, 
                          color: '#1d1d1f',
                        }}
                      >
                        {item.namaPksi}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box
                        sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          px: 1.5,
                          py: 0.5,
                          borderRadius: '6px',
                          bgcolor: item.jangkaWaktu.includes('Multiyears') 
                            ? 'rgba(63, 81, 181, 0.08)' 
                            : 'rgba(156, 39, 176, 0.08)',
                          color: item.jangkaWaktu.includes('Multiyears') 
                            ? '#3f51b5' 
                            : '#9c27b0',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                        }}
                      >
                        {item.jangkaWaktu}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: '#1d1d1f' }}>
                        {new Date(item.tanggalPengajuan).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={item.linkDocsT01}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 0.5,
                          color: '#DA251C',
                          textDecoration: 'none',
                          fontWeight: 500,
                          fontSize: '0.875rem',
                          '&:hover': {
                            textDecoration: 'underline',
                          },
                        }}
                      >
                        Lihat Dokumen
                        <OpenInNewIcon sx={{ fontSize: 16 }} />
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Klik untuk mengubah status">
                        <Button
                          onClick={(e) => handleStatusMenuOpen(e, item.id)}
                          endIcon={<ArrowDownIcon />}
                          sx={{
                            textTransform: 'none',
                            fontWeight: 500,
                            fontSize: '0.8125rem',
                            px: 1.5,
                            py: 0.5,
                            borderRadius: '8px',
                            ...getStatusColor(item.status),
                            '&:hover': {
                              ...getStatusColor(item.status),
                              filter: 'brightness(0.95)',
                            },
                          }}
                        >
                          {STATUS_LABELS[item.status]}
                        </Button>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Status Dropdown Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleStatusMenuClose}
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
              mt: 0.5,
              borderRadius: 2,
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            },
          }}
        >
          <MenuItem 
            onClick={() => handleStatusChange('disetujui')}
            sx={{ 
              color: '#2e7d32',
              '&:hover': { bgcolor: 'rgba(46, 125, 50, 0.08)' },
            }}
          >
            <Chip 
              label="Disetujui" 
              size="small"
              sx={{ 
                bgcolor: 'rgba(46, 125, 50, 0.1)', 
                color: '#2e7d32',
                fontWeight: 500,
              }} 
            />
          </MenuItem>
          <MenuItem 
            onClick={() => handleStatusChange('tidak_disetujui')}
            sx={{ 
              color: '#d32f2f',
              '&:hover': { bgcolor: 'rgba(211, 47, 47, 0.08)' },
            }}
          >
            <Chip 
              label="Tidak Disetujui" 
              size="small"
              sx={{ 
                bgcolor: 'rgba(211, 47, 47, 0.1)', 
                color: '#d32f2f',
                fontWeight: 500,
              }} 
            />
          </MenuItem>
        </Menu>

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
            Menampilkan {page * rowsPerPage + 1} sampai {Math.min((page + 1) * rowsPerPage, filteredPksi.length)} dari {filteredPksi.length} data
          </Typography>
          <TablePagination
            component="div"
            count={filteredPksi.length}
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
