import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, Paper, Chip, CircularProgress, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Divider, Skeleton, Card, CardContent, Avatar, Stack, alpha, IconButton,
  TextField, Select, MenuItem, FormControl, InputLabel, FormControlLabel, Checkbox,
  Autocomplete
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  ArrowBack, Edit, Apps, Link as LinkIcon, Business, People,
  SyncAlt, Lock, Description, Security, Category, AccessTime,
  OpenInNew, Info, Save, Close, Add, Delete, EmojiEvents, CalendarMonth
} from '@mui/icons-material';
import {
  getAplikasiById, updateAplikasi, type AplikasiData, type AplikasiRequest,
  type UrlRequest, type SatkerInternalRequest, type PenggunaEksternalRequest, type KomunikasiSistemRequest,
  type PenghargaanRequest, getVariablesByKategori, type VariableData,
  APPLICATION_STATUS_LABELS, ACCESS_TYPE_LABELS,
  KATEGORI_IDLE_LABELS, TIPE_SISTEM_LABELS
} from '../api/aplikasiApi';
import { getAllBidang, type BidangData } from '../api/bidangApi';
import { getAllSkpa, type SkpaData } from '../api/skpaApi';
import { usePermissions } from '../hooks/usePermissions';

const MENU_CODE = 'APLIKASI';

// Helper component for info item
const InfoItem = ({ label, value, icon }: { label: string; value: React.ReactNode; icon?: React.ReactNode }) => (
  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
    {icon && (
      <Box sx={{ 
        color: 'primary.main', 
        bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
        borderRadius: 1,
        p: 0.75,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {icon}
      </Box>
    )}
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.25, fontWeight: 500 }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 500 }}>
        {value || '-'}
      </Typography>
    </Box>
  </Box>
);

// Section header component with optional edit button
const SectionHeader = ({ 
  icon, 
  title, 
  count, 
  canEdit = false, 
  onEdit 
}: { 
  icon: React.ReactNode; 
  title: string; 
  count?: number;
  canEdit?: boolean;
  onEdit?: () => void;
}) => (
  <Box sx={{ 
    display: 'flex', 
    alignItems: 'center', 
    gap: 1.5,
    mb: 2,
    pb: 1.5,
    borderBottom: '2px solid',
    borderColor: 'primary.main'
  }}>
    <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36 }}>
      {icon}
    </Avatar>
    <Typography variant="h6" fontWeight={600}>{title}</Typography>
    {count !== undefined && (
      <Chip 
        label={count} 
        size="small" 
        color="primary" 
        sx={{ fontWeight: 600 }} 
      />
    )}
    {canEdit && onEdit && (
      <IconButton 
        size="small" 
        onClick={onEdit}
        sx={{ 
          ml: 'auto',
          color: 'primary.main',
          bgcolor: 'rgba(218, 37, 28, 0.08)',
          '&:hover': { bgcolor: 'rgba(218, 37, 28, 0.15)' }
        }}
      >
        <Edit sx={{ fontSize: 18 }} />
      </IconButton>
    )}
  </Box>
);

const AplikasiDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [aplikasi, setAplikasi] = useState<AplikasiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Dropdown data
  const [bidangList, setBidangList] = useState<BidangData[]>([]);
  const [skpaList, setSkpaList] = useState<SkpaData[]>([]);
  const [kategoriPenghargaanList, setKategoriPenghargaanList] = useState<VariableData[]>([]);

  // Edit mode states
  type EditSection = 'info' | 'urls' | 'komunikasi' | 'satker' | 'pengguna' | 'penghargaan' | null;
  const [editSection, setEditSection] = useState<EditSection>(null);

  // Form data states
  const [infoForm, setInfoForm] = useState({
    deskripsi: '',
    bidang_id: '',
    skpa_id: '',
    tanggal_implementasi: '',
    akses: '',
    proses_data_pribadi: false,
    data_pribadi_diproses: ''
  });

  const [urlsForm, setUrlsForm] = useState<UrlRequest[]>([]);
  const [komunikasiForm, setKomunikasiForm] = useState<KomunikasiSistemRequest[]>([]);
  const [satkerForm, setSatkerForm] = useState<SatkerInternalRequest[]>([]);
  const [penggunaForm, setPenggunaForm] = useState<PenggunaEksternalRequest[]>([]);
  const [penghargaanForm, setPenghargaanForm] = useState<PenghargaanRequest[]>([]);

  const { getMenuPermissions, permissionsLoaded } = usePermissions();
  const { canView, canUpdate } = getMenuPermissions(MENU_CODE);

  const fetchDropdowns = useCallback(async () => {
    try {
      const [bidangRes, skpaRes, kategoriRes] = await Promise.all([
        getAllBidang(),
        getAllSkpa(),
        getVariablesByKategori('KATEGORI_PENGHARGAAN')
      ]);
      setBidangList(bidangRes || []);
      setSkpaList(skpaRes.data || []);
      setKategoriPenghargaanList(kategoriRes || []);
    } catch (err) {
      console.error('Failed to fetch dropdowns', err);
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      setLoading(true);
      setError(null);
      try {
        const data = await getAplikasiById(id);
        setAplikasi(data);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Gagal mengambil data aplikasi';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    if (permissionsLoaded && canView) {
      fetchData();
      fetchDropdowns();
    }
  }, [id, permissionsLoaded, canView, fetchDropdowns]);

  // Initialize form data when starting edit
  const startEditSection = (section: EditSection) => {
    if (!aplikasi) return;
    
    switch (section) {
      case 'info':
        setInfoForm({
          deskripsi: aplikasi.deskripsi || '',
          bidang_id: aplikasi.bidang?.id || '',
          skpa_id: aplikasi.skpa?.id || '',
          tanggal_implementasi: aplikasi.tanggal_implementasi || '',
          akses: aplikasi.akses || '',
          proses_data_pribadi: aplikasi.proses_data_pribadi || false,
          data_pribadi_diproses: aplikasi.data_pribadi_diproses || ''
        });
        break;
      case 'urls':
        setUrlsForm(aplikasi.urls?.map(u => ({ url: u.url, tipe_akses: u.tipe_akses, keterangan: u.keterangan })) || []);
        break;
      case 'komunikasi':
        setKomunikasiForm(aplikasi.komunikasi_sistems?.map(k => ({
          nama_sistem: k.nama_sistem,
          tipe_sistem: k.tipe_sistem,
          deskripsi_komunikasi: k.deskripsi_komunikasi,
          keterangan: k.keterangan,
          is_planned: k.is_planned
        })) || []);
        break;
      case 'satker':
        setSatkerForm(aplikasi.satker_internals?.map(s => ({ nama_satker: s.nama_satker, keterangan: s.keterangan })) || []);
        break;
      case 'pengguna':
        setPenggunaForm(aplikasi.pengguna_eksternals?.map(p => ({ nama_pengguna: p.nama_pengguna, keterangan: p.keterangan })) || []);
        break;
      case 'penghargaan':
        setPenghargaanForm(aplikasi.penghargaans?.map(p => ({
          kategori_id: p.kategori?.id || '',
          tanggal: p.tanggal || '',
          deskripsi: p.deskripsi
        })) || []);
        break;
    }
    setEditSection(section);
  };

  const cancelEdit = () => {
    setEditSection(null);
  };

  const saveSection = async () => {
    if (!aplikasi || !id) return;

    setSaving(true);
    try {
      const baseRequest: AplikasiRequest = {
        kode_aplikasi: aplikasi.kode_aplikasi,
        nama_aplikasi: aplikasi.nama_aplikasi,
        deskripsi: aplikasi.deskripsi,
        status_aplikasi: aplikasi.status_aplikasi,
        bidang_id: aplikasi.bidang?.id,
        skpa_id: aplikasi.skpa?.id,
        tanggal_implementasi: aplikasi.tanggal_implementasi,
        akses: aplikasi.akses,
        proses_data_pribadi: aplikasi.proses_data_pribadi,
        data_pribadi_diproses: aplikasi.data_pribadi_diproses,
        kategori_idle: aplikasi.kategori_idle,
        alasan_idle: aplikasi.alasan_idle,
        rencana_pengakhiran: aplikasi.rencana_pengakhiran,
        alasan_belum_diakhiri: aplikasi.alasan_belum_diakhiri,
        urls: aplikasi.urls?.map(u => ({ url: u.url, tipe_akses: u.tipe_akses, keterangan: u.keterangan })),
        satker_internals: aplikasi.satker_internals?.map(s => ({ nama_satker: s.nama_satker, keterangan: s.keterangan })),
        pengguna_eksternals: aplikasi.pengguna_eksternals?.map(p => ({ nama_pengguna: p.nama_pengguna, keterangan: p.keterangan })),
        komunikasi_sistems: aplikasi.komunikasi_sistems?.map(k => ({
          nama_sistem: k.nama_sistem,
          tipe_sistem: k.tipe_sistem,
          deskripsi_komunikasi: k.deskripsi_komunikasi,
          keterangan: k.keterangan,
          is_planned: k.is_planned
        })),
        penghargaans: aplikasi.penghargaans?.map(p => ({
          kategori_id: p.kategori?.id || '',
          tanggal: p.tanggal,
          deskripsi: p.deskripsi
        }))
      };

      // Apply changes based on section
      switch (editSection) {
        case 'info':
          baseRequest.deskripsi = infoForm.deskripsi;
          baseRequest.bidang_id = infoForm.bidang_id || undefined;
          baseRequest.skpa_id = infoForm.skpa_id || undefined;
          baseRequest.tanggal_implementasi = infoForm.tanggal_implementasi || undefined;
          baseRequest.akses = infoForm.akses || undefined;
          baseRequest.proses_data_pribadi = infoForm.proses_data_pribadi;
          baseRequest.data_pribadi_diproses = infoForm.proses_data_pribadi ? infoForm.data_pribadi_diproses : undefined;
          break;
        case 'urls':
          baseRequest.urls = urlsForm;
          break;
        case 'komunikasi':
          baseRequest.komunikasi_sistems = komunikasiForm;
          break;
        case 'satker':
          baseRequest.satker_internals = satkerForm;
          break;
        case 'pengguna':
          baseRequest.pengguna_eksternals = penggunaForm;
          break;
        case 'penghargaan':
          baseRequest.penghargaans = penghargaanForm;
          break;
      }

      const updatedData = await updateAplikasi(id, baseRequest);
      setAplikasi(updatedData);
      setEditSection(null);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Gagal menyimpan perubahan';
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const getStatusConfig = (status: string) => {
    const statusConfig: Record<string, { gradient: string; badge: string; textColor: string }> = {
      AKTIF: { 
        gradient: 'linear-gradient(135deg, #DA251C 0%, #4caf50 100%)',
        badge: '#4caf50',
        textColor: 'white'
      },
      IDLE: { 
        gradient: 'linear-gradient(135deg, #DA251C 0%, #ffa726 100%)',
        badge: '#ffa726',
        textColor: 'white'
      },
      DIAKHIRI: { 
        gradient: 'linear-gradient(135deg, #DA251C 0%, #424242 100%)',
        badge: '#757575',
        textColor: 'white'
      },
    };
    return statusConfig[status] || { 
      gradient: 'linear-gradient(135deg, #DA251C 0%, #ff6b6b 100%)',
      badge: '#DA251C',
      textColor: 'white'
    };
  };

  // Loading state for permissions
  if (!permissionsLoaded) {
    return (
      <Box p={3}>
        <Skeleton variant="text" width={200} height={40} />
        <Skeleton variant="rectangular" height={400} sx={{ mt: 2 }} />
      </Box>
    );
  }

  // No view permission
  if (!canView) {
    return (
      <Box p={3}>
        <Alert
          severity="error"
          icon={<Lock />}
          sx={{
            borderRadius: 2,
            '& .MuiAlert-icon': { alignItems: 'center' }
          }}
        >
          <Typography variant="h6" gutterBottom>
            Akses Ditolak
          </Typography>
          <Typography variant="body2">
            Anda tidak memiliki izin untuk mengakses halaman ini.
          </Typography>
        </Alert>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box p={3} display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !aplikasi) {
    return (
      <Box p={3}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/aplikasi')}
          sx={{ mb: 2 }}
        >
          Kembali ke Daftar
        </Button>
        <Alert severity="error">{error || 'Aplikasi tidak ditemukan'}</Alert>
      </Box>
    );
  }

  return (
    <Box p={3} sx={{ bgcolor: '#f8f9fa', minHeight: '100vh' }}>
      {/* Header */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          mb: 3, 
          borderRadius: 3,
          background: getStatusConfig(aplikasi.status_aplikasi).gradient,
          color: getStatusConfig(aplikasi.status_aplikasi).textColor,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Box sx={{ position: 'absolute', right: -50, top: -50, opacity: 0.1 }}>
          <Apps sx={{ fontSize: 200 }} />
        </Box>
        {/* Status Badge - Top Right */}
        <Box sx={{ 
          position: 'absolute', 
          top: 16, 
          right: 16, 
          bgcolor: 'rgba(255,255,255,0.95)', 
          borderRadius: 2,
          px: 2,
          py: 1,
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          zIndex: 2
        }}>
          <Typography 
            variant="body2" 
            fontWeight={700} 
            sx={{ 
              color: getStatusConfig(aplikasi.status_aplikasi).badge,
              fontSize: '0.875rem',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}
          >
            {APPLICATION_STATUS_LABELS[aplikasi.status_aplikasi] || aplikasi.status_aplikasi}
          </Typography>
        </Box>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" position="relative" zIndex={1}>
          <Box sx={{ flex: 1 }}>
            <Button
              startIcon={<ArrowBack />}
              onClick={() => navigate('/aplikasi')}
              sx={{ 
                color: 'white', 
                mb: 2,
                '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
              }}
            >
              Kembali ke Daftar
            </Button>
            <Box display="flex" alignItems="center" gap={2} mb={1}>
              <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                <Apps sx={{ fontSize: 32 }} />
              </Avatar>
              <Box>
                <Typography variant="h4" fontWeight={700} sx={{ textShadow: '0 2px 4px rgba(0,0,0,0.1)', mb: 0.5 }}>
                  {aplikasi.nama_aplikasi}
                </Typography>
                <Box display="flex" alignItems="center" gap={1.5} flexWrap="wrap">
                  {aplikasi.kode_aplikasi && aplikasi.kode_aplikasi !== aplikasi.nama_aplikasi && (
                    <Chip
                      label={aplikasi.kode_aplikasi}
                      size="small"
                      sx={{ 
                        bgcolor: 'rgba(255,255,255,0.25)',
                        color: 'white',
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        border: '1px solid rgba(255,255,255,0.3)'
                      }}
                    />
                  )}
                  {aplikasi.kode_aplikasi && aplikasi.kode_aplikasi !== aplikasi.nama_aplikasi && aplikasi.tanggal_status && (
                    <Divider orientation="vertical" flexItem sx={{ borderColor: 'rgba(255,255,255,0.4)', height: 20, alignSelf: 'center' }} />
                  )}
                  {aplikasi.tanggal_status && (
                    <Box display="flex" alignItems="center" sx={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.875rem' }}>
                      <CalendarMonth sx={{ fontSize: 16, mr: 0.5 }} />
                      <span style={{ fontWeight: 500 }}>
                        {aplikasi.status_aplikasi === 'AKTIF' && 'Aktif sejak'}
                        {aplikasi.status_aplikasi === 'IDLE' && 'Idle sejak'}
                        {aplikasi.status_aplikasi === 'DIAKHIRI' && 'Diakhiri sejak'}
                        {': '}
                        {new Date(aplikasi.tanggal_status).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                    </Box>
                  )}
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      </Paper>

      <Grid container spacing={3}>
        {/* Left Column - Main Info */}
        <Grid size={{ xs: 12, lg: 7 }}>
          {/* Informasi Umum */}
          <Card sx={{ mb: 3, borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
            <CardContent sx={{ p: 3 }}>
              <SectionHeader 
                icon={<Info sx={{ fontSize: 20 }} />} 
                title="Informasi Umum"
                canEdit={canUpdate && editSection !== 'info'}
                onEdit={() => startEditSection('info')}
              />
              {editSection === 'info' ? (
                <Box>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Deskripsi"
                        value={infoForm.deskripsi}
                        onChange={(e) => setInfoForm(prev => ({ ...prev, deskripsi: e.target.value }))}
                        multiline
                        rows={4}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Autocomplete
                        size="small"
                        options={bidangList}
                        getOptionLabel={(option) => `${option.kode_bidang} - ${option.nama_bidang}`}
                        value={bidangList.find(b => b.id === infoForm.bidang_id) || null}
                        onChange={(_, value) => setInfoForm(prev => ({ ...prev, bidang_id: value?.id || '' }))}
                        renderInput={(params) => <TextField {...params} label="Bidang" />}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Autocomplete
                        size="small"
                        options={skpaList}
                        getOptionLabel={(option) => `${option.kode_skpa} - ${option.nama_skpa}`}
                        value={skpaList.find(s => s.id === infoForm.skpa_id) || null}
                        onChange={(_, value) => setInfoForm(prev => ({ ...prev, skpa_id: value?.id || '' }))}
                        renderInput={(params) => <TextField {...params} label="SKPA" />}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        size="small"
                        type="date"
                        label="Tanggal Implementasi"
                        InputLabelProps={{ shrink: true }}
                        value={infoForm.tanggal_implementasi}
                        onChange={(e) => setInfoForm(prev => ({ ...prev, tanggal_implementasi: e.target.value }))}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Tipe Akses</InputLabel>
                        <Select
                          value={infoForm.akses}
                          label="Tipe Akses"
                          onChange={(e) => setInfoForm(prev => ({ ...prev, akses: e.target.value }))}
                        >
                          {Object.entries(ACCESS_TYPE_LABELS).map(([key, label]) => (
                            <MenuItem key={key} value={key}>{label}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={infoForm.proses_data_pribadi}
                            onChange={(e) => setInfoForm(prev => ({ ...prev, proses_data_pribadi: e.target.checked }))}
                          />
                        }
                        label="Proses Data Pribadi"
                      />
                    </Grid>
                    {infoForm.proses_data_pribadi && (
                      <Grid size={{ xs: 12 }}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Data Pribadi yang Diproses"
                          value={infoForm.data_pribadi_diproses}
                          onChange={(e) => setInfoForm(prev => ({ ...prev, data_pribadi_diproses: e.target.value }))}
                          multiline
                          rows={3}
                        />
                      </Grid>
                    )}
                  </Grid>
                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 2 }}>
                    <Button size="small" onClick={cancelEdit} disabled={saving} startIcon={<Close />}>
                      Batal
                    </Button>
                    <Button size="small" variant="contained" onClick={saveSection} disabled={saving} startIcon={saving ? <CircularProgress size={16} /> : <Save />}>
                      Simpan
                    </Button>
                  </Box>
                </Box>
              ) : (
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12 }}>
                    <InfoItem 
                      label="Deskripsi" 
                      value={aplikasi.deskripsi || 'Tidak ada deskripsi'}
                      icon={<Description sx={{ fontSize: 18 }} />}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <InfoItem 
                      label="Bidang" 
                      value={
                        aplikasi.bidang ? (
                          <Box>
                            <Typography variant="body2" fontWeight={600}>{aplikasi.bidang.kode_bidang}</Typography>
                            <Typography variant="caption" color="text.secondary">{aplikasi.bidang.nama_bidang}</Typography>
                          </Box>
                        ) : '-'
                      }
                      icon={<Category sx={{ fontSize: 18 }} />}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <InfoItem 
                      label="SKPA" 
                      value={
                        aplikasi.skpa ? (
                          <Box>
                            <Typography variant="body2" fontWeight={600}>{aplikasi.skpa.kode_skpa}</Typography>
                            <Typography variant="caption" color="text.secondary">{aplikasi.skpa.nama_skpa}</Typography>
                          </Box>
                        ) : '-'
                      }
                      icon={<Business sx={{ fontSize: 18 }} />}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <InfoItem 
                      label="Tanggal Implementasi" 
                      value={aplikasi.tanggal_implementasi ? new Date(aplikasi.tanggal_implementasi).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                      icon={<CalendarMonth sx={{ fontSize: 18 }} />}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <InfoItem 
                      label="Tipe Akses" 
                      value={
                        aplikasi.akses ? (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {aplikasi.akses.split(',').map((aksesItem, idx) => {
                              const trimmed = aksesItem.trim();
                              // Handle OTHER:custom_text format
                              if (trimmed.startsWith('OTHER:')) {
                                const customText = trimmed.substring(6);
                                return (
                                  <Chip
                                    key={idx}
                                    label={`Lainnya: ${customText}`}
                                    size="small"
                                    sx={{ fontSize: '0.75rem' }}
                                  />
                                );
                              }
                              return (
                                <Chip
                                  key={idx}
                                  label={ACCESS_TYPE_LABELS[trimmed] || trimmed}
                                  size="small"
                                  sx={{ fontSize: '0.75rem' }}
                                />
                              );
                            })}
                          </Box>
                        ) : '-'
                      }
                      icon={<AccessTime sx={{ fontSize: 18 }} />}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <InfoItem 
                      label="Proses Data Pribadi" 
                      value={
                        <Chip
                          label={aplikasi.proses_data_pribadi ? 'Ya' : 'Tidak'}
                          color={aplikasi.proses_data_pribadi ? 'warning' : 'default'}
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                      }
                      icon={<Security sx={{ fontSize: 18 }} />}
                    />
                  </Grid>
                  {aplikasi.proses_data_pribadi && aplikasi.data_pribadi_diproses && (
                    <Grid size={{ xs: 12 }}>
                      <InfoItem 
                        label="Data Pribadi yang Diproses" 
                        value={aplikasi.data_pribadi_diproses}
                        icon={<Description sx={{ fontSize: 18 }} />}
                      />
                    </Grid>
                  )}
                </Grid>
              )}
            </CardContent>
          </Card>

          {/* Idle Info */}
          {aplikasi.status_aplikasi === 'IDLE' && (
            <Card sx={{ mb: 3, borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', borderLeft: '4px solid #ff9800' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={600} color="warning.main" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AccessTime /> Informasi Status Idle
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <InfoItem label="Kategori Idle" value={KATEGORI_IDLE_LABELS[aplikasi.kategori_idle || ''] || aplikasi.kategori_idle || '-'} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <InfoItem label="Alasan Idle" value={aplikasi.alasan_idle || '-'} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <InfoItem label="Rencana Pengakhiran" value={aplikasi.rencana_pengakhiran || '-'} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <InfoItem label="Alasan Belum Diakhiri" value={aplikasi.alasan_belum_diakhiri || '-'} />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}

          {/* URLs */}
          <Card sx={{ mb: 3, borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
            <CardContent sx={{ p: 3 }}>
              <SectionHeader 
                icon={<LinkIcon sx={{ fontSize: 20 }} />} 
                title="URL Aplikasi" 
                count={editSection === 'urls' ? urlsForm.length : (aplikasi.urls?.length || 0)}
                canEdit={canUpdate && editSection !== 'urls'}
                onEdit={() => startEditSection('urls')}
              />
              {editSection === 'urls' ? (
                <Box>
                  <Stack spacing={2}>
                    {urlsForm.map((url, idx) => (
                      <Paper key={idx} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                        <Grid container spacing={2} alignItems="center">
                          <Grid size={{ xs: 12, sm: 5 }}>
                            <TextField
                              fullWidth
                              size="small"
                              label="URL"
                              value={url.url}
                              onChange={(e) => {
                                const newUrls = [...urlsForm];
                                newUrls[idx] = { ...newUrls[idx], url: e.target.value };
                                setUrlsForm(newUrls);
                              }}
                            />
                          </Grid>
                          <Grid size={{ xs: 12, sm: 3 }}>
                            <FormControl fullWidth size="small">
                              <InputLabel>Tipe Akses</InputLabel>
                              <Select
                                value={url.tipe_akses || ''}
                                label="Tipe Akses"
                                onChange={(e) => {
                                  const newUrls = [...urlsForm];
                                  newUrls[idx] = { ...newUrls[idx], tipe_akses: e.target.value };
                                  setUrlsForm(newUrls);
                                }}
                              >
                                {Object.entries(ACCESS_TYPE_LABELS).map(([key, label]) => (
                                  <MenuItem key={key} value={key}>{label}</MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </Grid>
                          <Grid size={{ xs: 12, sm: 3 }}>
                            <TextField
                              fullWidth
                              size="small"
                              label="Keterangan"
                              value={url.keterangan || ''}
                              onChange={(e) => {
                                const newUrls = [...urlsForm];
                                newUrls[idx] = { ...newUrls[idx], keterangan: e.target.value };
                                setUrlsForm(newUrls);
                              }}
                            />
                          </Grid>
                          <Grid size={{ xs: 12, sm: 1 }}>
                            <IconButton size="small" color="error" onClick={() => setUrlsForm(urlsForm.filter((_, i) => i !== idx))}>
                              <Delete />
                            </IconButton>
                          </Grid>
                        </Grid>
                      </Paper>
                    ))}
                    <Button
                      startIcon={<Add />}
                      onClick={() => setUrlsForm([...urlsForm, { url: '', tipe_akses: '', keterangan: '' }])}
                      sx={{ alignSelf: 'flex-start' }}
                    >
                      Tambah URL
                    </Button>
                  </Stack>
                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 2 }}>
                    <Button size="small" onClick={cancelEdit} disabled={saving} startIcon={<Close />}>
                      Batal
                    </Button>
                    <Button size="small" variant="contained" onClick={saveSection} disabled={saving} startIcon={saving ? <CircularProgress size={16} /> : <Save />}>
                      Simpan
                    </Button>
                  </Box>
                </Box>
              ) : aplikasi.urls && aplikasi.urls.length > 0 ? (
                <TableContainer sx={{ borderRadius: 2, border: '1px solid #e0e0e0' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                        <TableCell sx={{ fontWeight: 600 }}>URL</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Tipe Akses</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Keterangan</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {aplikasi.urls.map((url, idx) => (
                        <TableRow key={url.id || idx} sx={{ '&:hover': { bgcolor: '#fafafa' } }}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <a 
                                href={url.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                style={{ color: '#DA251C', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
                              >
                                {url.url}
                                <OpenInNew sx={{ fontSize: 14 }} />
                              </a>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={ACCESS_TYPE_LABELS[url.tipe_akses || ''] || url.tipe_akses || '-'} 
                              size="small" 
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>{url.keterangan || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                  <LinkIcon sx={{ fontSize: 48, opacity: 0.3, mb: 1 }} />
                  <Typography>Tidak ada URL terdaftar</Typography>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Komunikasi Sistem */}
          <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
            <CardContent sx={{ p: 3 }}>
              <SectionHeader 
                icon={<SyncAlt sx={{ fontSize: 20 }} />} 
                title="Komunikasi dengan Sistem Lain" 
                count={editSection === 'komunikasi' ? komunikasiForm.length : (aplikasi.komunikasi_sistems?.length || 0)}
                canEdit={canUpdate && editSection !== 'komunikasi'}
                onEdit={() => startEditSection('komunikasi')}
              />
              {editSection === 'komunikasi' ? (
                <Box>
                  <Stack spacing={2}>
                    {komunikasiForm.map((kom, idx) => (
                      <Paper key={idx} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                        <Grid container spacing={2} alignItems="center">
                          <Grid size={{ xs: 12, sm: 3 }}>
                            <TextField
                              fullWidth
                              size="small"
                              label="Nama Sistem"
                              value={kom.nama_sistem}
                              onChange={(e) => {
                                const newKom = [...komunikasiForm];
                                newKom[idx] = { ...newKom[idx], nama_sistem: e.target.value };
                                setKomunikasiForm(newKom);
                              }}
                            />
                          </Grid>
                          <Grid size={{ xs: 12, sm: 2 }}>
                            <FormControl fullWidth size="small">
                              <InputLabel>Tipe</InputLabel>
                              <Select
                                value={kom.tipe_sistem || ''}
                                label="Tipe"
                                onChange={(e) => {
                                  const newKom = [...komunikasiForm];
                                  newKom[idx] = { ...newKom[idx], tipe_sistem: e.target.value };
                                  setKomunikasiForm(newKom);
                                }}
                              >
                                {Object.entries(TIPE_SISTEM_LABELS).map(([key, label]) => (
                                  <MenuItem key={key} value={key}>{label}</MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </Grid>
                          <Grid size={{ xs: 12, sm: 4 }}>
                            <TextField
                              fullWidth
                              size="small"
                              label="Deskripsi"
                              value={kom.deskripsi_komunikasi || ''}
                              onChange={(e) => {
                                const newKom = [...komunikasiForm];
                                newKom[idx] = { ...newKom[idx], deskripsi_komunikasi: e.target.value };
                                setKomunikasiForm(newKom);
                              }}
                              multiline
                              rows={2}
                            />
                          </Grid>
                          <Grid size={{ xs: 12, sm: 2 }}>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  size="small"
                                  checked={kom.is_planned || false}
                                  onChange={(e) => {
                                    const newKom = [...komunikasiForm];
                                    newKom[idx] = { ...newKom[idx], is_planned: e.target.checked };
                                    setKomunikasiForm(newKom);
                                  }}
                                />
                              }
                              label="Rencana"
                            />
                          </Grid>
                          <Grid size={{ xs: 12, sm: 1 }}>
                            <IconButton size="small" color="error" onClick={() => setKomunikasiForm(komunikasiForm.filter((_, i) => i !== idx))}>
                              <Delete />
                            </IconButton>
                          </Grid>
                        </Grid>
                      </Paper>
                    ))}
                    <Button
                      startIcon={<Add />}
                      onClick={() => setKomunikasiForm([...komunikasiForm, { nama_sistem: '', tipe_sistem: '', deskripsi_komunikasi: '', is_planned: false }])}
                      sx={{ alignSelf: 'flex-start' }}
                    >
                      Tambah Komunikasi
                    </Button>
                  </Stack>
                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 2 }}>
                    <Button size="small" onClick={cancelEdit} disabled={saving} startIcon={<Close />}>
                      Batal
                    </Button>
                    <Button size="small" variant="contained" onClick={saveSection} disabled={saving} startIcon={saving ? <CircularProgress size={16} /> : <Save />}>
                      Simpan
                    </Button>
                  </Box>
                </Box>
              ) : aplikasi.komunikasi_sistems && aplikasi.komunikasi_sistems.length > 0 ? (
                <TableContainer sx={{ borderRadius: 2, border: '1px solid #e0e0e0' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                        <TableCell sx={{ fontWeight: 600 }}>Nama Sistem</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Tipe</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Deskripsi</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {aplikasi.komunikasi_sistems.map((kom, idx) => (
                        <TableRow key={kom.id || idx} sx={{ '&:hover': { bgcolor: '#fafafa' } }}>
                          <TableCell sx={{ fontWeight: 500 }}>{kom.nama_sistem}</TableCell>
                          <TableCell>
                            <Chip 
                              label={TIPE_SISTEM_LABELS[kom.tipe_sistem || ''] || kom.tipe_sistem || '-'} 
                              size="small" 
                              color="primary"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>{kom.deskripsi_komunikasi || '-'}</TableCell>
                          <TableCell>
                            <Chip
                              label={kom.is_planned ? 'Direncanakan' : 'Aktif'}
                              color={kom.is_planned ? 'warning' : 'success'}
                              size="small"
                              sx={{ fontWeight: 500 }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                  <SyncAlt sx={{ fontSize: 48, opacity: 0.3, mb: 1 }} />
                  <Typography>Tidak ada komunikasi dengan sistem lain</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column - Stakeholders */}
        <Grid size={{ xs: 12, lg: 5 }}>
          {/* Satker Internal */}
          <Card sx={{ mb: 3, borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
            <CardContent sx={{ p: 3 }}>
              <SectionHeader 
                icon={<Business sx={{ fontSize: 20 }} />} 
                title="Satker Internal" 
                count={editSection === 'satker' ? satkerForm.length : (aplikasi.satker_internals?.length || 0)}
                canEdit={canUpdate && editSection !== 'satker'}
                onEdit={() => startEditSection('satker')}
              />
              {editSection === 'satker' ? (
                <Box>
                  <Stack spacing={2}>
                    {satkerForm.map((satker, idx) => (
                      <Paper key={idx} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                        <Grid container spacing={2} alignItems="center">
                          <Grid size={{ xs: 12, sm: 5 }}>
                            <TextField
                              fullWidth
                              size="small"
                              label="Nama Satker"
                              value={satker.nama_satker}
                              onChange={(e) => {
                                const newSatker = [...satkerForm];
                                newSatker[idx] = { ...newSatker[idx], nama_satker: e.target.value };
                                setSatkerForm(newSatker);
                              }}
                            />
                          </Grid>
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                              fullWidth
                              size="small"
                              label="Keterangan"
                              value={satker.keterangan || ''}
                              onChange={(e) => {
                                const newSatker = [...satkerForm];
                                newSatker[idx] = { ...newSatker[idx], keterangan: e.target.value };
                                setSatkerForm(newSatker);
                              }}
                              multiline
                              rows={2}
                            />
                          </Grid>
                          <Grid size={{ xs: 12, sm: 1 }}>
                            <IconButton size="small" color="error" onClick={() => setSatkerForm(satkerForm.filter((_, i) => i !== idx))}>
                              <Delete />
                            </IconButton>
                          </Grid>
                        </Grid>
                      </Paper>
                    ))}
                    <Button
                      startIcon={<Add />}
                      onClick={() => setSatkerForm([...satkerForm, { nama_satker: '', keterangan: '' }])}
                      sx={{ alignSelf: 'flex-start' }}
                    >
                      Tambah Satker
                    </Button>
                  </Stack>
                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 2 }}>
                    <Button size="small" onClick={cancelEdit} disabled={saving} startIcon={<Close />}>
                      Batal
                    </Button>
                    <Button size="small" variant="contained" onClick={saveSection} disabled={saving} startIcon={saving ? <CircularProgress size={16} /> : <Save />}>
                      Simpan
                    </Button>
                  </Box>
                </Box>
              ) : aplikasi.satker_internals && aplikasi.satker_internals.length > 0 ? (
                <Stack spacing={1.5}>
                  {aplikasi.satker_internals.map((satker, idx) => (
                    <Paper key={satker.id || idx} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                      <Typography variant="body2" fontWeight={600}>{satker.nama_satker}</Typography>
                      {satker.keterangan && (
                        <Typography variant="caption" color="text.secondary">{satker.keterangan}</Typography>
                      )}
                    </Paper>
                  ))}
                </Stack>
              ) : (
                <Box sx={{ textAlign: 'center', py: 3, color: 'text.secondary' }}>
                  <Business sx={{ fontSize: 40, opacity: 0.3, mb: 1 }} />
                  <Typography variant="body2">Tidak ada satker internal</Typography>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Pengguna Eksternal */}
          <Card sx={{ mb: 3, borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
            <CardContent sx={{ p: 3 }}>
              <SectionHeader 
                icon={<People sx={{ fontSize: 20 }} />} 
                title="Pengguna Eksternal" 
                count={editSection === 'pengguna' ? penggunaForm.length : (aplikasi.pengguna_eksternals?.length || 0)}
                canEdit={canUpdate && editSection !== 'pengguna'}
                onEdit={() => startEditSection('pengguna')}
              />
              {editSection === 'pengguna' ? (
                <Box>
                  <Stack spacing={2}>
                    {penggunaForm.map((pengguna, idx) => (
                      <Paper key={idx} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                        <Grid container spacing={2} alignItems="center">
                          <Grid size={{ xs: 12, sm: 5 }}>
                            <TextField
                              fullWidth
                              size="small"
                              label="Nama Pengguna"
                              value={pengguna.nama_pengguna}
                              onChange={(e) => {
                                const newPengguna = [...penggunaForm];
                                newPengguna[idx] = { ...newPengguna[idx], nama_pengguna: e.target.value };
                                setPenggunaForm(newPengguna);
                              }}
                            />
                          </Grid>
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                              fullWidth
                              size="small"
                              label="Keterangan"
                              value={pengguna.keterangan || ''}
                              onChange={(e) => {
                                const newPengguna = [...penggunaForm];
                                newPengguna[idx] = { ...newPengguna[idx], keterangan: e.target.value };
                                setPenggunaForm(newPengguna);
                              }}
                              multiline
                              rows={2}
                            />
                          </Grid>
                          <Grid size={{ xs: 12, sm: 1 }}>
                            <IconButton size="small" color="error" onClick={() => setPenggunaForm(penggunaForm.filter((_, i) => i !== idx))}>
                              <Delete />
                            </IconButton>
                          </Grid>
                        </Grid>
                      </Paper>
                    ))}
                    <Button
                      startIcon={<Add />}
                      onClick={() => setPenggunaForm([...penggunaForm, { nama_pengguna: '', keterangan: '' }])}
                      sx={{ alignSelf: 'flex-start' }}
                    >
                      Tambah Pengguna
                    </Button>
                  </Stack>
                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 2 }}>
                    <Button size="small" onClick={cancelEdit} disabled={saving} startIcon={<Close />}>
                      Batal
                    </Button>
                    <Button size="small" variant="contained" onClick={saveSection} disabled={saving} startIcon={saving ? <CircularProgress size={16} /> : <Save />}>
                      Simpan
                    </Button>
                  </Box>
                </Box>
              ) : aplikasi.pengguna_eksternals && aplikasi.pengguna_eksternals.length > 0 ? (
                <Stack spacing={1.5}>
                  {aplikasi.pengguna_eksternals.map((pengguna, idx) => (
                    <Paper key={pengguna.id || idx} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                      <Typography variant="body2" fontWeight={600}>{pengguna.nama_pengguna}</Typography>
                      {pengguna.keterangan && (
                        <Typography variant="caption" color="text.secondary">{pengguna.keterangan}</Typography>
                      )}
                    </Paper>
                  ))}
                </Stack>
              ) : (
                <Box sx={{ textAlign: 'center', py: 3, color: 'text.secondary' }}>
                  <People sx={{ fontSize: 40, opacity: 0.3, mb: 1 }} />
                  <Typography variant="body2">Tidak ada pengguna eksternal</Typography>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Penghargaan Aplikasi */}
          <Card sx={{ mb: 3, borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
            <CardContent sx={{ p: 3 }}>
              <SectionHeader 
                icon={<EmojiEvents sx={{ fontSize: 20 }} />} 
                title="Penghargaan Aplikasi" 
                count={editSection === 'penghargaan' ? penghargaanForm.length : (aplikasi.penghargaans?.length || 0)}
                canEdit={canUpdate && editSection !== 'penghargaan'}
                onEdit={() => startEditSection('penghargaan')}
              />
              {editSection === 'penghargaan' ? (
                <Box>
                  <Stack spacing={2}>
                    {penghargaanForm.map((penghargaan, idx) => (
                      <Paper key={idx} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                        <Grid container spacing={2}>
                          <Grid size={{ xs: 12, md: 6 }}>
                            <Autocomplete
                              size="small"
                              options={kategoriPenghargaanList}
                              getOptionLabel={(option) => option.nama}
                              value={kategoriPenghargaanList.find(k => k.id === penghargaan.kategori_id) || null}
                              onChange={(_, value) => {
                                const newForm = [...penghargaanForm];
                                newForm[idx] = { ...newForm[idx], kategori_id: value?.id || '' };
                                setPenghargaanForm(newForm);
                              }}
                              renderInput={(params) => <TextField {...params} label="Kategori" />}
                            />
                          </Grid>
                          <Grid size={{ xs: 12, md: 4 }}>
                            <TextField
                              fullWidth
                              size="small"
                              type="date"
                              label="Tanggal"
                              InputLabelProps={{ shrink: true }}
                              value={penghargaan.tanggal}
                              onChange={(e) => {
                                const newForm = [...penghargaanForm];
                                newForm[idx] = { ...newForm[idx], tanggal: e.target.value };
                                setPenghargaanForm(newForm);
                              }}
                            />
                          </Grid>
                          <Grid size={{ xs: 12, md: 2 }} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                            <IconButton size="small" color="error" onClick={() => setPenghargaanForm(penghargaanForm.filter((_, i) => i !== idx))}>
                              <Delete />
                            </IconButton>
                          </Grid>
                          <Grid size={{ xs: 12 }}>
                            <TextField
                              fullWidth
                              size="small"
                              label="Deskripsi"
                              value={penghargaan.deskripsi || ''}
                              onChange={(e) => {
                                const newForm = [...penghargaanForm];
                                newForm[idx] = { ...newForm[idx], deskripsi: e.target.value };
                                setPenghargaanForm(newForm);
                              }}
                              multiline
                              rows={3}
                            />
                          </Grid>
                        </Grid>
                      </Paper>
                    ))}
                    <Button
                      startIcon={<Add />}
                      onClick={() => setPenghargaanForm([...penghargaanForm, { kategori_id: '', tanggal: '', deskripsi: '' }])}
                      sx={{ alignSelf: 'flex-start' }}
                    >
                      Tambah Penghargaan
                    </Button>
                  </Stack>
                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 2 }}>
                    <Button size="small" onClick={cancelEdit} disabled={saving} startIcon={<Close />}>
                      Batal
                    </Button>
                    <Button size="small" variant="contained" onClick={saveSection} disabled={saving} startIcon={saving ? <CircularProgress size={16} /> : <Save />}>
                      Simpan
                    </Button>
                  </Box>
                </Box>
              ) : aplikasi.penghargaans && aplikasi.penghargaans.length > 0 ? (
                <Stack spacing={1.5}>
                  {aplikasi.penghargaans.map((penghargaan, idx) => (
                    <Paper key={penghargaan.id || idx} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box>
                          <Chip 
                            label={penghargaan.kategori?.nama || 'N/A'} 
                            size="small" 
                            color="primary"
                            sx={{ mb: 1 }}
                          />
                          <Typography variant="body2" fontWeight={600}>
                            {penghargaan.deskripsi || 'Tidak ada deskripsi'}
                          </Typography>
                        </Box>
                        <Chip 
                          icon={<CalendarMonth sx={{ fontSize: 14 }} />}
                          label={penghargaan.tanggal ? new Date(penghargaan.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    </Paper>
                  ))}
                </Stack>
              ) : (
                <Box sx={{ textAlign: 'center', py: 3, color: 'text.secondary' }}>
                  <EmojiEvents sx={{ fontSize: 40, opacity: 0.3, mb: 1 }} />
                  <Typography variant="body2">Tidak ada penghargaan</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AplikasiDetailPage;
