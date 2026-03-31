import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, Paper, TextField, FormControl,
  InputLabel, Select, MenuItem, FormControlLabel, Switch, CircularProgress,
  Alert, IconButton, Divider, Skeleton, Autocomplete
} from '@mui/material';
import Grid from '@mui/material/Grid';
import type { SelectChangeEvent } from '@mui/material/Select';
import { ArrowBack, Save, Add, Delete, Apps, Lock } from '@mui/icons-material';
import {
  getAplikasiById, createAplikasi, updateAplikasi, getVariablesByKategori,
  type AplikasiRequest, type UrlRequest, type SatkerInternalRequest,
  type PenggunaEksternalRequest, type KomunikasiSistemRequest, type PenghargaanRequest,
  type VariableData, APPLICATION_STATUS, APPLICATION_STATUS_LABELS,
  ACCESS_TYPE_LABELS, KATEGORI_IDLE_LABELS, TIPE_SISTEM_LABELS
} from '../api/aplikasiApi';
import { getAllBidang, type BidangData } from '../api/bidangApi';
import { getAllSkpa, type SkpaData } from '../api/skpaApi';
import { usePermissions } from '../hooks/usePermissions';

const MENU_CODE = 'APLIKASI';

interface FormData extends Omit<AplikasiRequest, 'bidang_id' | 'skpa_id'> {
  bidang_id: string;
  skpa_id: string;
}

const initialForm: FormData = {
  kode_aplikasi: '',
  nama_aplikasi: '',
  deskripsi: '',
  status_aplikasi: APPLICATION_STATUS.AKTIF,
  bidang_id: '',
  skpa_id: '',
  tanggal_implementasi: '',
  akses: '',
  proses_data_pribadi: false,
  data_pribadi_diproses: '',
  kategori_idle: '',
  alasan_idle: '',
  rencana_pengakhiran: '',
  alasan_belum_diakhiri: '',
  urls: [],
  satker_internals: [],
  pengguna_eksternals: [],
  komunikasi_sistems: [],
  penghargaans: [],
};

const AplikasiFormPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState<FormData>(initialForm);
  const [bidangList, setBidangList] = useState<BidangData[]>([]);
  const [skpaList, setSkpaList] = useState<SkpaData[]>([]);
  const [kategoriPenghargaanList, setKategoriPenghargaanList] = useState<VariableData[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const { getMenuPermissions, permissionsLoaded } = usePermissions();
  const { canView, canCreate, canUpdate } = getMenuPermissions(MENU_CODE);
  const hasPermission = isEdit ? canUpdate : canCreate;

  useEffect(() => {
    const fetchFilters = async () => {
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
        console.error('Failed to load filter data:', err);
      }
    };

    fetchFilters();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!id || !isEdit) return;

      setLoading(true);
      setError(null);
      try {
        const data = await getAplikasiById(id);
        setForm({
          kode_aplikasi: data.kode_aplikasi,
          nama_aplikasi: data.nama_aplikasi,
          deskripsi: data.deskripsi || '',
          status_aplikasi: data.status_aplikasi,
          bidang_id: data.bidang?.id || '',
          skpa_id: data.skpa?.id || '',
          tanggal_implementasi: data.tanggal_implementasi || '',
          akses: data.akses || '',
          proses_data_pribadi: data.proses_data_pribadi,
          data_pribadi_diproses: data.data_pribadi_diproses || '',
          kategori_idle: data.kategori_idle || '',
          alasan_idle: data.alasan_idle || '',
          rencana_pengakhiran: data.rencana_pengakhiran || '',
          alasan_belum_diakhiri: data.alasan_belum_diakhiri || '',
          urls: data.urls?.map(u => ({
            url: u.url,
            tipe_akses: u.tipe_akses || '',
            keterangan: u.keterangan || '',
          })) || [],
          satker_internals: data.satker_internals?.map(s => ({
            nama_satker: s.nama_satker,
            keterangan: s.keterangan || '',
          })) || [],
          pengguna_eksternals: data.pengguna_eksternals?.map(p => ({
            nama_pengguna: p.nama_pengguna,
            keterangan: p.keterangan || '',
          })) || [],
          komunikasi_sistems: data.komunikasi_sistems?.map(k => ({
            nama_sistem: k.nama_sistem,
            tipe_sistem: k.tipe_sistem || '',
            deskripsi_komunikasi: k.deskripsi_komunikasi || '',
            keterangan: k.keterangan || '',
            is_planned: k.is_planned || false,
          })) || [],
          penghargaans: data.penghargaans?.map(p => ({
            kategori_id: p.kategori?.id || '',
            tanggal: p.tanggal || '',
            deskripsi: p.deskripsi || '',
          })) || [],
        });
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Gagal mengambil data aplikasi';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    if (permissionsLoaded && canView) {
      fetchData();
    }
  }, [id, isEdit, permissionsLoaded, canView]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: checked }));
  };

  // URL handlers
  const addUrl = () => {
    setForm(prev => ({
      ...prev,
      urls: [...(prev.urls || []), { url: '', tipe_akses: '', keterangan: '' }]
    }));
  };

  const updateUrl = (index: number, field: keyof UrlRequest, value: string) => {
    setForm(prev => ({
      ...prev,
      urls: prev.urls?.map((u, i) => i === index ? { ...u, [field]: value } : u)
    }));
  };

  const removeUrl = (index: number) => {
    setForm(prev => ({
      ...prev,
      urls: prev.urls?.filter((_, i) => i !== index)
    }));
  };

  // Satker Internal handlers
  const addSatker = () => {
    setForm(prev => ({
      ...prev,
      satker_internals: [...(prev.satker_internals || []), { nama_satker: '', keterangan: '' }]
    }));
  };

  const updateSatker = (index: number, field: keyof SatkerInternalRequest, value: string) => {
    setForm(prev => ({
      ...prev,
      satker_internals: prev.satker_internals?.map((s, i) => i === index ? { ...s, [field]: value } : s)
    }));
  };

  const removeSatker = (index: number) => {
    setForm(prev => ({
      ...prev,
      satker_internals: prev.satker_internals?.filter((_, i) => i !== index)
    }));
  };

  // Pengguna Eksternal handlers
  const addPengguna = () => {
    setForm(prev => ({
      ...prev,
      pengguna_eksternals: [...(prev.pengguna_eksternals || []), { nama_pengguna: '', keterangan: '' }]
    }));
  };

  const updatePengguna = (index: number, field: keyof PenggunaEksternalRequest, value: string) => {
    setForm(prev => ({
      ...prev,
      pengguna_eksternals: prev.pengguna_eksternals?.map((p, i) => i === index ? { ...p, [field]: value } : p)
    }));
  };

  const removePengguna = (index: number) => {
    setForm(prev => ({
      ...prev,
      pengguna_eksternals: prev.pengguna_eksternals?.filter((_, i) => i !== index)
    }));
  };

  // Komunikasi Sistem handlers
  const addKomunikasi = () => {
    setForm(prev => ({
      ...prev,
      komunikasi_sistems: [...(prev.komunikasi_sistems || []), {
        nama_sistem: '', tipe_sistem: '', deskripsi_komunikasi: '', keterangan: '', is_planned: false
      }]
    }));
  };

  const updateKomunikasi = (index: number, field: keyof KomunikasiSistemRequest, value: string | boolean) => {
    setForm(prev => ({
      ...prev,
      komunikasi_sistems: prev.komunikasi_sistems?.map((k, i) => i === index ? { ...k, [field]: value } : k)
    }));
  };

  const removeKomunikasi = (index: number) => {
    setForm(prev => ({
      ...prev,
      komunikasi_sistems: prev.komunikasi_sistems?.filter((_, i) => i !== index)
    }));
  };

  // Penghargaan handlers
  const addPenghargaan = () => {
    setForm(prev => ({
      ...prev,
      penghargaans: [...(prev.penghargaans || []), { kategori_id: '', tanggal: '', deskripsi: '' }]
    }));
  };

  const updatePenghargaan = (index: number, field: keyof PenghargaanRequest, value: string) => {
    setForm(prev => ({
      ...prev,
      penghargaans: prev.penghargaans?.map((p, i) => i === index ? { ...p, [field]: value } : p)
    }));
  };

  const removePenghargaan = (index: number) => {
    setForm(prev => ({
      ...prev,
      penghargaans: prev.penghargaans?.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async () => {
    // Reset errors
    const errors: Record<string, string> = {};

    // Validate required fields
    if (!form.kode_aplikasi?.trim()) {
      errors['kode_aplikasi'] = 'Kode Aplikasi wajib diisi';
    }

    if (!form.nama_aplikasi?.trim()) {
      errors['nama_aplikasi'] = 'Nama Aplikasi wajib diisi';
    }

    if (!form.status_aplikasi) {
      errors['status_aplikasi'] = 'Status Aplikasi wajib dipilih';
    }

    if (!form.proses_data_pribadi) {
      errors['proses_data_pribadi'] = 'Pilih apakah aplikasi memproses data pribadi';
    }

    // Validate URLs
    if ((form.urls?.length || 0) === 0) {
      errors['urls'] = 'Minimal 1 URL aplikasi wajib diisi';
    } else {
      const invalidUrls = form.urls?.filter((u, idx) => {
        if (!u.url?.trim()) {
          errors[`urls_${idx}`] = 'URL wajib diisi';
          return true;
        }
        return false;
      });
      if (invalidUrls?.length) {
        errors['urls_validation'] = `${invalidUrls.length} URL masih kosong`;
      }
    }

    if (form.status_aplikasi === APPLICATION_STATUS.IDLE && !form.kategori_idle) {
      errors['kategori_idle'] = 'Kategori Idle wajib dipilih';
    }

    // Validate nested arrays with required fields
    // Satker Internals - should not have empty nama_satker if exists
    if (form.satker_internals?.length) {
      form.satker_internals.forEach((satker, idx) => {
        if (!satker.nama_satker?.trim()) {
          errors[`satker_${idx}`] = 'Nama Satker wajib diisi';
        }
      });
    }

    // Pengguna Externals - should not have empty nama_pengguna if exists
    if (form.pengguna_eksternals?.length) {
      form.pengguna_eksternals.forEach((pengguna, idx) => {
        if (!pengguna.nama_pengguna?.trim()) {
          errors[`pengguna_${idx}`] = 'Nama Pengguna wajib diisi';
        }
      });
    }

    // Komunikasi Sistem - should not have empty nama_sistem if exists
    if (form.komunikasi_sistems?.length) {
      form.komunikasi_sistems.forEach((kom, idx) => {
        if (!kom.nama_sistem?.trim()) {
          errors[`komunikasi_${idx}`] = 'Nama Sistem wajib diisi';
        }
      });
    }

    // Penghargaan - should not have empty kategori_id or tanggal if exists
    if (form.penghargaans?.length) {
      form.penghargaans.forEach((penghargaan, idx) => {
        if (!penghargaan.kategori_id) {
          errors[`penghargaan_kategori_${idx}`] = 'Kategori Penghargaan wajib dipilih';
        }
        if (!penghargaan.tanggal) {
          errors[`penghargaan_tanggal_${idx}`] = 'Tanggal wajib diisi';
        }
      });
    }

    setFieldErrors(errors);

    // If there are errors, show them and don't submit
    if (Object.keys(errors).length > 0) {
      // Build detailed error message
      const errorMessages: string[] = [];
      
      if (errors['kode_aplikasi']) errorMessages.push('• Kode Aplikasi');
      if (errors['nama_aplikasi']) errorMessages.push('• Nama Aplikasi');
      if (errors['status_aplikasi']) errorMessages.push('• Status Aplikasi');
      if (errors['proses_data_pribadi']) errorMessages.push('• Proses Data Pribadi');
      if (errors['kategori_idle']) errorMessages.push('• Kategori Idle');
      if (errors['urls'] || errors['urls_validation']) errorMessages.push('• URL Aplikasi (ada yang kosong atau belum ditambahkan)');
      
      // Check nested items
      if (Object.keys(errors).some(k => k.startsWith('satker_'))) {
        errorMessages.push('• Satker Pengguna Internal (ada Nama Satker yang kosong)');
      }
      if (Object.keys(errors).some(k => k.startsWith('pengguna_'))) {
        errorMessages.push('• Pengguna Eksternal (ada Nama Pengguna yang kosong)');
      }
      if (Object.keys(errors).some(k => k.startsWith('komunikasi_'))) {
        errorMessages.push('• Komunikasi Sistem (ada Nama Sistem yang kosong)');
      }
      if (Object.keys(errors).some(k => k.startsWith('penghargaan_'))) {
        const hasKategoriError = Object.keys(errors).some(k => k.startsWith('penghargaan_kategori_'));
        const hasTanggalError = Object.keys(errors).some(k => k.startsWith('penghargaan_tanggal_'));
        if (hasKategoriError) errorMessages.push('• Penghargaan - Kategori Penghargaan (ada yang belum dipilih)');
        if (hasTanggalError) errorMessages.push('• Penghargaan - Tanggal (ada yang belum diisi)');
      }

      const detailedError = `Field yang wajib diisi:\n${errorMessages.join('\n')}`;
      setError(detailedError);
      window.scrollTo(0, 0);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload: AplikasiRequest = {
        ...form,
        bidang_id: form.bidang_id || undefined,
        skpa_id: form.skpa_id || undefined,
        tanggal_implementasi: form.tanggal_implementasi || undefined,
      };

      if (isEdit && id) {
        await updateAplikasi(id, payload);
      } else {
        await createAplikasi(payload);
      }

      navigate('/aplikasi');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Gagal menyimpan aplikasi';
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
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

  // No permission
  if (!hasPermission) {
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
            Anda tidak memiliki izin untuk {isEdit ? 'mengedit' : 'menambah'} aplikasi.
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

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/aplikasi')}
          >
            Kembali
          </Button>
          <Apps color="primary" />
          <Typography variant="h5" fontWeight={600}>
            {isEdit ? 'Edit Aplikasi' : 'Tambah Aplikasi'}
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            onClick={() => navigate('/aplikasi')}
          >
            Batal
          </Button>
          <Button
            variant="contained"
            startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <Save />}
            onClick={handleSubmit}
            disabled={submitting}
          >
            Simpan
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2, whiteSpace: 'pre-line' }} onClose={() => setError(null)}>
          <Typography component="div" sx={{ whiteSpace: 'pre-wrap', fontSize: '0.875rem', lineHeight: 1.6 }}>
            {error}
          </Typography>
        </Alert>
      )}

      {/* Basic Info */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Informasi Dasar</Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              required
              label="Kode Aplikasi (Singkatan)"
              name="kode_aplikasi"
              value={form.kode_aplikasi}
              onChange={handleTextChange}
              error={!!fieldErrors['kode_aplikasi']}
              helperText={fieldErrors['kode_aplikasi'] || 'Singkatan/akronim unik aplikasi'}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 8 }}>
            <TextField
              fullWidth
              required
              label="Nama Aplikasi"
              name="nama_aplikasi"
              value={form.nama_aplikasi}
              onChange={handleTextChange}
              error={!!fieldErrors['nama_aplikasi']}
              helperText={fieldErrors['nama_aplikasi']}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Deskripsi"
              name="deskripsi"
              value={form.deskripsi}
              onChange={handleTextChange}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <FormControl fullWidth required error={!!fieldErrors['status_aplikasi']}>
              <InputLabel>Status Aplikasi</InputLabel>
              <Select
                name="status_aplikasi"
                value={form.status_aplikasi}
                label="Status Aplikasi"
                onChange={handleSelectChange}
              >
                {Object.entries(APPLICATION_STATUS_LABELS).map(([key, label]) => (
                  <MenuItem key={key} value={key}>{label}</MenuItem>
                ))}
              </Select>
              {fieldErrors['status_aplikasi'] && (
                <Typography sx={{ fontSize: '0.75rem', color: '#d32f2f', mt: 0.5 }}>
                  {fieldErrors['status_aplikasi']}
                </Typography>
              )}
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Autocomplete
              options={bidangList}
              getOptionLabel={(option) => `${option.kode_bidang} - ${option.nama_bidang}`}
              value={bidangList.find(b => b.id === form.bidang_id) || null}
              onChange={(_, newValue) => setForm({ ...form, bidang_id: newValue?.id || '' })}
              renderInput={(params) => (
                <TextField {...params} label="Bidang" placeholder="Cari bidang..." />
              )}
              renderOption={(props, option) => (
                <Box component="li" {...props}>
                  <Box>
                    <Typography sx={{ fontWeight: 600, fontSize: '0.85rem' }}>{option.kode_bidang}</Typography>
                    <Typography sx={{ fontSize: '0.7rem', color: '#86868b' }}>{option.nama_bidang}</Typography>
                  </Box>
                </Box>
              )}
              filterOptions={(options, { inputValue }) => {
                const search = inputValue.toLowerCase();
                return options.filter(opt => 
                  opt.kode_bidang.toLowerCase().includes(search) ||
                  opt.nama_bidang.toLowerCase().includes(search)
                );
              }}
              fullWidth
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Autocomplete
              options={skpaList}
              getOptionLabel={(option) => `${option.kode_skpa} - ${option.nama_skpa}`}
              value={skpaList.find(s => s.id === form.skpa_id) || null}
              onChange={(_, newValue) => setForm({ ...form, skpa_id: newValue?.id || '' })}
              renderInput={(params) => (
                <TextField {...params} label="SKPA" placeholder="Cari SKPA..." />
              )}
              renderOption={(props, option) => (
                <Box component="li" {...props}>
                  <Box>
                    <Typography sx={{ fontWeight: 600, fontSize: '0.85rem' }}>{option.kode_skpa}</Typography>
                    <Typography sx={{ fontSize: '0.7rem', color: '#86868b' }}>{option.nama_skpa}</Typography>
                  </Box>
                </Box>
              )}
              filterOptions={(options, { inputValue }) => {
                const search = inputValue.toLowerCase();
                return options.filter(opt => 
                  opt.kode_skpa.toLowerCase().includes(search) ||
                  opt.nama_skpa.toLowerCase().includes(search)
                );
              }}
              fullWidth
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              type="date"
              label="Tanggal Implementasi"
              name="tanggal_implementasi"
              value={form.tanggal_implementasi || ''}
              onChange={handleTextChange}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <FormControl fullWidth>
              <InputLabel>Akses</InputLabel>
              <Select
                name="akses"
                value={form.akses}
                label="Akses"
                onChange={handleSelectChange}
              >
                <MenuItem value="">-</MenuItem>
                {Object.entries(ACCESS_TYPE_LABELS).map(([key, label]) => (
                  <MenuItem key={key} value={key}>{label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Box>
              <FormControlLabel
                control={
                  <Switch
                    name="proses_data_pribadi"
                    checked={form.proses_data_pribadi}
                    onChange={handleSwitchChange}
                  />
                }
                label="Melakukan Pemrosesan Data Pribadi"
              />
              {fieldErrors['proses_data_pribadi'] && (
                <Typography sx={{ fontSize: '0.75rem', color: '#d32f2f', ml: 1 }}>
                  {fieldErrors['proses_data_pribadi']}
                </Typography>
              )}
            </Box>
          </Grid>
          {form.proses_data_pribadi && (
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Data Pribadi yang Diproses"
                name="data_pribadi_diproses"
                value={form.data_pribadi_diproses}
                onChange={handleTextChange}
              />
            </Grid>
          )}
        </Grid>
      </Paper>

      {/* Idle Info (conditional) */}
      {form.status_aplikasi === APPLICATION_STATUS.IDLE && (
        <Paper sx={{ p: 3, mb: 3, border: fieldErrors['kategori_idle'] ? '1px solid #d32f2f' : undefined }}>
          <Typography variant="h6" gutterBottom>Informasi Status Idle</Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth required error={!!fieldErrors['kategori_idle']}>
                <InputLabel>Kategori Idle</InputLabel>
                <Select
                  name="kategori_idle"
                  value={form.kategori_idle}
                  label="Kategori Idle"
                  onChange={handleSelectChange}
                >
                  {Object.entries(KATEGORI_IDLE_LABELS).map(([key, label]) => (
                    <MenuItem key={key} value={key}>{label}</MenuItem>
                  ))}
                </Select>
                {fieldErrors['kategori_idle'] && (
                  <Typography sx={{ fontSize: '0.75rem', color: '#d32f2f', mt: 0.5 }}>
                    {fieldErrors['kategori_idle']}
                  </Typography>
                )}
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Penjelasan Latar Belakang/Alasan Idle"
                name="alasan_idle"
                value={form.alasan_idle}
                onChange={handleTextChange}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Rencana Timeline Pengakhiran"
                name="rencana_pengakhiran"
                value={form.rencana_pengakhiran}
                onChange={handleTextChange}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Alasan Belum/Tidak Bisa Diakhiri"
                name="alasan_belum_diakhiri"
                value={form.alasan_belum_diakhiri}
                onChange={handleTextChange}
              />
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* URLs */}
      <Paper sx={{ p: 3, mb: 3, border: fieldErrors['urls'] ? '1px solid #d32f2f' : undefined }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box>
            <Typography variant="h6">URL Aplikasi *</Typography>
            {fieldErrors['urls'] && (
              <Typography sx={{ fontSize: '0.875rem', color: '#d32f2f', mt: 0.5 }}>
                {fieldErrors['urls']}
              </Typography>
            )}
          </Box>
          <Button startIcon={<Add />} onClick={addUrl} variant="outlined" size="small">
            Tambah URL
          </Button>
        </Box>
        {form.urls?.map((url, index) => (
          <Box key={index} mb={2}>
            <Grid container spacing={2} alignItems="center">
              <Grid size={{ xs: 12, md: 5 }}>
                <TextField
                  fullWidth
                  required
                  label="URL"
                  value={url.url}
                  onChange={(e) => updateUrl(index, 'url', e.target.value)}
                  placeholder="https://..."
                  error={!!fieldErrors[`urls_${index}`]}
                  helperText={fieldErrors[`urls_${index}`]}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <FormControl fullWidth>
                  <InputLabel>Tipe Akses</InputLabel>
                  <Select
                    value={url.tipe_akses || ''}
                    label="Tipe Akses"
                    onChange={(e) => updateUrl(index, 'tipe_akses', e.target.value)}
                  >
                    <MenuItem value="">-</MenuItem>
                    {Object.entries(ACCESS_TYPE_LABELS).filter(([k]) => k !== 'BOTH').map(([key, label]) => (
                      <MenuItem key={key} value={key}>{label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label="Keterangan"
                  value={url.keterangan || ''}
                  onChange={(e) => updateUrl(index, 'keterangan', e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 1 }}>
                <IconButton color="error" onClick={() => removeUrl(index)}>
                  <Delete />
                </IconButton>
              </Grid>
            </Grid>
            {index < (form.urls?.length || 0) - 1 && <Divider sx={{ mt: 2 }} />}
          </Box>
        ))}
        {(form.urls?.length || 0) === 0 && (
          <Typography color="text.secondary" textAlign="center" py={2}>
            Belum ada URL. Klik "Tambah URL" untuk menambahkan.
          </Typography>
        )}
      </Paper>

      {/* Satker Internal */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Satker Pengguna Internal</Typography>
          <Button startIcon={<Add />} onClick={addSatker} variant="outlined" size="small">
            Tambah Satker
          </Button>
        </Box>
        {form.satker_internals?.map((satker, index) => (
          <Box key={index} mb={2}>
            <Grid container spacing={2} alignItems="center">
              <Grid size={{ xs: 12, md: 5 }}>
                <TextField
                  fullWidth
                  required
                  label="Nama Satker"
                  value={satker.nama_satker}
                  onChange={(e) => updateSatker(index, 'nama_satker', e.target.value)}
                  error={!!fieldErrors[`satker_${index}`]}
                  helperText={fieldErrors[`satker_${index}`]}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Keterangan"
                  value={satker.keterangan || ''}
                  onChange={(e) => updateSatker(index, 'keterangan', e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 1 }}>
                <IconButton color="error" onClick={() => removeSatker(index)}>
                  <Delete />
                </IconButton>
              </Grid>
            </Grid>
          </Box>
        ))}
        {(form.satker_internals?.length || 0) === 0 && (
          <Typography color="text.secondary" textAlign="center" py={2}>
            Tidak ada satker pengguna internal.
          </Typography>
        )}
      </Paper>

      {/* Pengguna Eksternal */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Pengguna Eksternal</Typography>
          <Button startIcon={<Add />} onClick={addPengguna} variant="outlined" size="small">
            Tambah Pengguna
          </Button>
        </Box>
        {form.pengguna_eksternals?.map((pengguna, index) => (
          <Box key={index} mb={2}>
            <Grid container spacing={2} alignItems="center">
              <Grid size={{ xs: 12, md: 5 }}>
                <TextField
                  fullWidth
                  required
                  label="Nama Pengguna"
                  value={pengguna.nama_pengguna}
                  onChange={(e) => updatePengguna(index, 'nama_pengguna', e.target.value)}
                  error={!!fieldErrors[`pengguna_${index}`]}
                  helperText={fieldErrors[`pengguna_${index}`]}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Keterangan"
                  value={pengguna.keterangan || ''}
                  onChange={(e) => updatePengguna(index, 'keterangan', e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 1 }}>
                <IconButton color="error" onClick={() => removePengguna(index)}>
                  <Delete />
                </IconButton>
              </Grid>
            </Grid>
          </Box>
        ))}
        {(form.pengguna_eksternals?.length || 0) === 0 && (
          <Typography color="text.secondary" textAlign="center" py={2}>
            Tidak ada pengguna eksternal.
          </Typography>
        )}
      </Paper>

      {/* Komunikasi Sistem */}
      <Paper sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Komunikasi dengan Sistem Lain</Typography>
          <Button startIcon={<Add />} onClick={addKomunikasi} variant="outlined" size="small">
            Tambah Sistem
          </Button>
        </Box>
        {form.komunikasi_sistems?.map((kom, index) => (
          <Box key={index} mb={2}>
            <Grid container spacing={2} alignItems="center">
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  fullWidth
                  required
                  label="Nama Sistem"
                  value={kom.nama_sistem}
                  onChange={(e) => updateKomunikasi(index, 'nama_sistem', e.target.value)}
                  error={!!fieldErrors[`komunikasi_${index}`]}
                  helperText={fieldErrors[`komunikasi_${index}`]}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <FormControl fullWidth>
                  <InputLabel>Tipe Sistem</InputLabel>
                  <Select
                    value={kom.tipe_sistem || ''}
                    label="Tipe Sistem"
                    onChange={(e) => updateKomunikasi(index, 'tipe_sistem', e.target.value)}
                  >
                    <MenuItem value="">-</MenuItem>
                    {Object.entries(TIPE_SISTEM_LABELS).map(([key, label]) => (
                      <MenuItem key={key} value={key}>{label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  fullWidth
                  label="Deskripsi Komunikasi"
                  value={kom.deskripsi_komunikasi || ''}
                  onChange={(e) => updateKomunikasi(index, 'deskripsi_komunikasi', e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <TextField
                  fullWidth
                  label="Keterangan"
                  value={kom.keterangan || ''}
                  onChange={(e) => updateKomunikasi(index, 'keterangan', e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 1 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={kom.is_planned || false}
                      onChange={(e) => updateKomunikasi(index, 'is_planned', e.target.checked)}
                    />
                  }
                  label="Planned"
                />
              </Grid>
              <Grid size={{ xs: 12, md: 1 }}>
                <IconButton color="error" onClick={() => removeKomunikasi(index)}>
                  <Delete />
                </IconButton>
              </Grid>
            </Grid>
            {index < (form.komunikasi_sistems?.length || 0) - 1 && <Divider sx={{ mt: 2 }} />}
          </Box>
        ))}
        {(form.komunikasi_sistems?.length || 0) === 0 && (
          <Typography color="text.secondary" textAlign="center" py={2}>
            Tidak ada komunikasi dengan sistem lain.
          </Typography>
        )}
      </Paper>

      {/* Penghargaan Aplikasi */}
      <Paper sx={{ p: 3, mt: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Penghargaan Aplikasi</Typography>
          <Button startIcon={<Add />} onClick={addPenghargaan} variant="outlined" size="small">
            Tambah Penghargaan
          </Button>
        </Box>
        {form.penghargaans?.map((penghargaan, index) => (
          <Box key={index} mb={2}>
            <Grid container spacing={2} alignItems="center">
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth required error={!!fieldErrors[`penghargaan_kategori_${index}`]}>
                  <InputLabel>Kategori Penghargaan</InputLabel>
                  <Select
                    value={penghargaan.kategori_id || ''}
                    label="Kategori Penghargaan"
                    onChange={(e) => updatePenghargaan(index, 'kategori_id', e.target.value)}
                  >
                    {kategoriPenghargaanList.map((kategori) => (
                      <MenuItem key={kategori.id} value={kategori.id}>
                        {kategori.nama}
                      </MenuItem>
                    ))}
                  </Select>
                  {fieldErrors[`penghargaan_kategori_${index}`] && (
                    <Typography sx={{ fontSize: '0.75rem', color: '#d32f2f', mt: 0.5 }}>
                      {fieldErrors[`penghargaan_kategori_${index}`]}
                    </Typography>
                  )}
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  fullWidth
                  required
                  type="date"
                  label="Tanggal"
                  value={penghargaan.tanggal || ''}
                  onChange={(e) => updatePenghargaan(index, 'tanggal', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  error={!!fieldErrors[`penghargaan_tanggal_${index}`]}
                  helperText={fieldErrors[`penghargaan_tanggal_${index}`]}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label="Deskripsi"
                  value={penghargaan.deskripsi || ''}
                  onChange={(e) => updatePenghargaan(index, 'deskripsi', e.target.value)}
                  multiline
                  rows={1}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 1 }}>
                <IconButton color="error" onClick={() => removePenghargaan(index)}>
                  <Delete />
                </IconButton>
              </Grid>
            </Grid>
            {index < (form.penghargaans?.length || 0) - 1 && <Divider sx={{ mt: 2 }} />}
          </Box>
        ))}
        {(form.penghargaans?.length || 0) === 0 && (
          <Typography color="text.secondary" textAlign="center" py={2}>
            Tidak ada penghargaan aplikasi.
          </Typography>
        )}
      </Paper>
    </Box>
  );
};

export default AplikasiFormPage;
