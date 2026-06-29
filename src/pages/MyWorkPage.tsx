import { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, Tabs, Tab, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, IconButton,
  InputAdornment, TextField, Skeleton, Chip, Tooltip,
} from '@mui/material';
import {
  OpenInNew as OpenInNewIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { getMyWork, type MyWorkData, type PksiCardItem, type Fs2CardItem } from '../api/myWorkApi';
import { getUserInfo } from '../api/authApi';
import PageHeader from '../components/PageHeader';
import { COLORS } from '../styles/theme';

// ─── helpers ─────────────────────────────────────────────────────────────────

const PHASE_LABEL: Record<string, string> = {
  USREQ: 'User Requirement', PENGADAAN: 'Pengadaan', DESAIN: 'Desain',
  CODING: 'Coding', UNIT_TEST: 'Unit Test', SIT: 'SIT',
  UAT: 'UAT', DEPLOYMENT: 'Deployment', GO_LIVE: 'Go Live',
};

const FS2_PROGRES_LABEL: Record<string, string> = {
  ASESMEN: 'Asesmen', CODING: 'Pemrograman', PDKK: 'PDKK', DEPLOY_SELESAI: 'Selesai',
};

const STATUS_COLOR: Record<string, { bg: string; color: string; label: string }> = {
  DISETUJUI:                  { bg: 'rgba(21,128,61,0.1)',  color: '#15803D', label: 'Disetujui' },
  DIKERJAKAN_DENGAN_CARA_LAIN:{ bg: 'rgba(37,99,235,0.1)',  color: '#2563EB', label: 'Cara Lain' },
  PENDING:                    { bg: 'rgba(217,119,6,0.1)',  color: '#D97706', label: 'Pending' },
  DITOLAK:                    { bg: 'rgba(220,38,38,0.1)',  color: '#DC2626', label: 'Ditolak' },
};

function statusChip(status: string) {
  const s = STATUS_COLOR[status] ?? { bg: 'rgba(107,114,128,0.1)', color: '#6B7280', label: status };
  return (
    <Chip
      label={s.label}
      size="small"
      sx={{ bgcolor: s.bg, color: s.color, fontWeight: 600, fontSize: '0.7rem', height: 20, borderRadius: '6px' }}
    />
  );
}

function fmtDate(d: string | null): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

function isOverdue(d: string | null): boolean {
  if (!d) return false;
  return new Date(d) < new Date();
}

// ─── table components ────────────────────────────────────────────────────────

const TH_SX = { fontWeight: 700, fontSize: '0.72rem', color: '#6B7280', textTransform: 'uppercase' as const, letterSpacing: '0.05em', py: 1.2, whiteSpace: 'nowrap' as const };
const TD_SX = { fontSize: '0.82rem', py: 1, color: COLORS.INK };

function TableSkeleton({ cols }: { cols: number }) {
  return (
    <>
      {[1, 2, 3, 4].map(i => (
        <TableRow key={i}>
          {Array.from({ length: cols }).map((_, j) => (
            <TableCell key={j}><Skeleton variant="text" width={j === 0 ? 180 : 80} /></TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

function EmptyRow({ cols }: { cols: number }) {
  return (
    <TableRow>
      <TableCell colSpan={cols} sx={{ textAlign: 'center', py: 5, color: '#9CA3AF', fontSize: '0.875rem', border: 0 }}>
        Tidak ada data aktif untuk tim kamu saat ini.
      </TableCell>
    </TableRow>
  );
}

function PksiTable({ items, loading, onOpen }: {
  items: PksiCardItem[];
  loading: boolean;
  onOpen: (id: string) => void;
}) {
  const [q, setQ] = useState('');
  const filtered = useMemo(() =>
    items.filter(i =>
      !q || i.nama_pksi.toLowerCase().includes(q.toLowerCase()) ||
      (i.nama_aplikasi ?? '').toLowerCase().includes(q.toLowerCase())
    ), [items, q]);

  return (
    <Box>
      <Box sx={{ mb: 2 }}>
        <TextField
          size="small"
          placeholder="Cari nama PKSI atau aplikasi…"
          value={q}
          onChange={e => setQ(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 16, color: '#9CA3AF' }} /></InputAdornment> }}
          sx={{ width: 300, '& .MuiOutlinedInput-root': { fontSize: '0.82rem' } }}
        />
      </Box>
      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '10px', borderColor: COLORS.BORDER }}>
        <Table size="small">
          <TableHead sx={{ bgcolor: '#F9FAFB' }}>
            <TableRow>
              <TableCell sx={TH_SX}>Nama PKSI</TableCell>
              <TableCell sx={TH_SX}>Aplikasi</TableCell>
              <TableCell sx={TH_SX}>Status</TableCell>
              <TableCell sx={TH_SX}>Tahapan</TableCell>
              <TableCell sx={TH_SX}>Jenis</TableCell>
              <TableCell sx={TH_SX}>Target Go Live</TableCell>
              <TableCell sx={TH_SX}>Tim</TableCell>
              <TableCell sx={{ ...TH_SX, width: 40 }} />
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableSkeleton cols={8} />
            ) : filtered.length === 0 ? (
              <EmptyRow cols={8} />
            ) : (
              filtered.map(item => (
                <TableRow
                  key={item.id}
                  hover
                  sx={{ cursor: 'pointer', '&:last-child td': { border: 0 } }}
                  onClick={() => onOpen(item.id)}
                >
                  <TableCell sx={{ ...TD_SX, fontWeight: 600, maxWidth: 260 }}>
                    <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: COLORS.INK, lineHeight: 1.3 }}>
                      {item.nama_pksi}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ ...TD_SX, color: '#6B7280' }}>{item.nama_aplikasi ?? '—'}</TableCell>
                  <TableCell sx={TD_SX}>{statusChip(item.status)}</TableCell>
                  <TableCell sx={{ ...TD_SX, color: '#6B7280' }}>
                    {item.progress ? (PHASE_LABEL[item.progress] ?? item.progress) : '—'}
                  </TableCell>
                  <TableCell sx={{ ...TD_SX, color: '#6B7280' }}>{item.jenis_pksi ?? '—'}</TableCell>
                  <TableCell sx={{ ...TD_SX, color: isOverdue(item.target_go_live) ? '#DC2626' : TD_SX.color, fontWeight: isOverdue(item.target_go_live) ? 600 : 400 }}>
                    {fmtDate(item.target_go_live)}
                  </TableCell>
                  <TableCell sx={{ ...TD_SX, color: '#6B7280' }}>{item.team_name ?? '—'}</TableCell>
                  <TableCell sx={{ py: 0.5, pr: 1 }}>
                    <Tooltip title="Lihat Detail">
                      <IconButton size="small" onClick={e => { e.stopPropagation(); onOpen(item.id); }}
                        sx={{ color: '#9CA3AF', '&:hover': { color: COLORS.PRIMARY } }}>
                        <OpenInNewIcon sx={{ fontSize: 15 }} />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

function Fs2Table({ items, loading, onOpen }: {
  items: Fs2CardItem[];
  loading: boolean;
  onOpen: (id: string) => void;
}) {
  const [q, setQ] = useState('');
  const filtered = useMemo(() =>
    items.filter(i =>
      !q || (i.nama_fs2 ?? '').toLowerCase().includes(q.toLowerCase()) ||
      (i.nama_aplikasi ?? '').toLowerCase().includes(q.toLowerCase())
    ), [items, q]);

  return (
    <Box>
      <Box sx={{ mb: 2 }}>
        <TextField
          size="small"
          placeholder="Cari nama FS2 atau aplikasi…"
          value={q}
          onChange={e => setQ(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 16, color: '#9CA3AF' }} /></InputAdornment> }}
          sx={{ width: 300, '& .MuiOutlinedInput-root': { fontSize: '0.82rem' } }}
        />
      </Box>
      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '10px', borderColor: COLORS.BORDER }}>
        <Table size="small">
          <TableHead sx={{ bgcolor: '#F9FAFB' }}>
            <TableRow>
              <TableCell sx={TH_SX}>Nama FS2</TableCell>
              <TableCell sx={TH_SX}>Aplikasi</TableCell>
              <TableCell sx={TH_SX}>Status</TableCell>
              <TableCell sx={TH_SX}>Fase</TableCell>
              <TableCell sx={TH_SX}>Progres</TableCell>
              <TableCell sx={TH_SX}>Target Go Live</TableCell>
              <TableCell sx={TH_SX}>Tim</TableCell>
              <TableCell sx={{ ...TH_SX, width: 40 }} />
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableSkeleton cols={8} />
            ) : filtered.length === 0 ? (
              <EmptyRow cols={8} />
            ) : (
              filtered.map(item => (
                <TableRow
                  key={item.id}
                  hover
                  sx={{ cursor: 'pointer', '&:last-child td': { border: 0 } }}
                  onClick={() => onOpen(item.id)}
                >
                  <TableCell sx={{ ...TD_SX, maxWidth: 260 }}>
                    <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: COLORS.INK, lineHeight: 1.3 }}>
                      {item.nama_fs2 || '—'}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ ...TD_SX, color: '#6B7280' }}>{item.nama_aplikasi ?? '—'}</TableCell>
                  <TableCell sx={TD_SX}>{statusChip(item.status)}</TableCell>
                  <TableCell sx={{ ...TD_SX, color: '#6B7280' }}>{item.fase_pengajuan ?? '—'}</TableCell>
                  <TableCell sx={{ ...TD_SX, color: '#6B7280' }}>
                    {item.progres ? (FS2_PROGRES_LABEL[item.progres] ?? item.progres) : '—'}
                  </TableCell>
                  <TableCell sx={{ ...TD_SX, color: isOverdue(item.target_go_live) ? '#DC2626' : TD_SX.color, fontWeight: isOverdue(item.target_go_live) ? 600 : 400 }}>
                    {fmtDate(item.target_go_live)}
                  </TableCell>
                  <TableCell sx={{ ...TD_SX, color: '#6B7280' }}>{item.team_name ?? '—'}</TableCell>
                  <TableCell sx={{ py: 0.5, pr: 1 }}>
                    <Tooltip title="Lihat Detail">
                      <IconButton size="small" onClick={e => { e.stopPropagation(); onOpen(item.id); }}
                        sx={{ color: '#9CA3AF', '&:hover': { color: COLORS.PRIMARY } }}>
                        <OpenInNewIcon sx={{ fontSize: 15 }} />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────

export default function MyWorkPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<MyWorkData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState(0);

  const userInfo = getUserInfo();
  const teamNames = data?.teams.map(t => t.name).join(', ') || '—';
  const pksiCount = data?.pksi_list.length ?? 0;
  const fs2Count = data?.fs2_list.length ?? 0;

  useEffect(() => {
    getMyWork()
      .then(setData)
      .catch(() => setError('Gagal memuat data. Silakan refresh halaman.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Box sx={{ minHeight: '100vh', background: COLORS.BACKGROUND }}>
      <PageHeader
        eyebrow="DASHBOARD PENGEMBANG"
        title={`Selamat datang, ${userInfo?.full_name ?? userInfo?.username ?? 'Pengembang'}`}
        subtitle={`Tim: ${teamNames}`}
      />

      <Box sx={{ px: { xs: 3, md: 4.5, xl: 6 }, py: 4,  mx: 'auto' }}>
        {error && (
          <Box sx={{ p: 2, borderRadius: 2, background: '#FEF2F2', color: COLORS.ERROR, mb: 3, fontSize: '0.875rem' }}>
            {error}
          </Box>
        )}

        {/* Tabs */}
        <Box sx={{ borderBottom: `1px solid ${COLORS.BORDER}`, mb: 3 }}>
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            sx={{
              minHeight: 40,
              '& .MuiTab-root': { minHeight: 40, fontSize: '0.82rem', fontWeight: 600, textTransform: 'none', px: 2 },
              '& .MuiTabs-indicator': { bgcolor: COLORS.PRIMARY },
            }}
          >
            <Tab
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  PKSI
                  {!loading && (
                    <Box sx={{ px: 0.8, py: 0.1, borderRadius: '10px', bgcolor: tab === 0 ? COLORS.PRIMARY : '#E5E7EB', color: tab === 0 ? '#fff' : '#6B7280', fontSize: '0.68rem', fontWeight: 700, lineHeight: 1.6 }}>
                      {pksiCount}
                    </Box>
                  )}
                </Box>
              }
            />
            <Tab
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  FS2
                  {!loading && (
                    <Box sx={{ px: 0.8, py: 0.1, borderRadius: '10px', bgcolor: tab === 1 ? COLORS.PRIMARY : '#E5E7EB', color: tab === 1 ? '#fff' : '#6B7280', fontSize: '0.68rem', fontWeight: 700, lineHeight: 1.6 }}>
                      {fs2Count}
                    </Box>
                  )}
                </Box>
              }
            />
          </Tabs>
        </Box>

        {/* Tab panels */}
        {tab === 0 && (
          <PksiTable
            items={data?.pksi_list ?? []}
            loading={loading}
            onOpen={id => navigate(`/pksi/${id}`)}
          />
        )}
        {tab === 1 && (
          <Fs2Table
            items={data?.fs2_list ?? []}
            loading={loading}
            onOpen={id => navigate(`/fs2/${id}`)}
          />
        )}
      </Box>
    </Box>
  );
}
