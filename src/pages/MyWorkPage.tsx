import { useState, useEffect } from 'react';
import {
  Box, Grid, Card, CardContent, CardActions,
  Typography, Button, CircularProgress, Skeleton,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { getMyWork, type MyWorkData, type PksiCardItem, type Fs2CardItem } from '../api/myWorkApi';
import { getUserInfo } from '../api/authApi';
import StatusBadge from '../components/StatusBadge';
import PageHeader from '../components/PageHeader';
import { COLORS } from '../styles/theme';

// ─── helpers ────────────────────────────────────────────────────────────────

const PHASE_LABEL: Record<string, string> = {
  USREQ: 'User Requirement', PENGADAAN: 'Pengadaan', DESAIN: 'Desain',
  CODING: 'Coding', UNIT_TEST: 'Unit Test', SIT: 'SIT',
  UAT: 'UAT', DEPLOYMENT: 'Deployment', GO_LIVE: 'Go Live',
};

const FS2_PROGRES_LABEL: Record<string, string> = {
  ASESMEN: 'Asesmen', CODING: 'Pemrograman', PDKK: 'PDKK', DEPLOY_SELESAI: 'Selesai',
};

function fmtDate(d: string | null): string {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ─── sub-components ─────────────────────────────────────────────────────────

function SectionHeading({ title, count }: { title: string; count: number }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
      <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: COLORS.INK }}>
        {title}
      </Typography>
      <Box sx={{
        px: 1, py: 0.2, borderRadius: '12px',
        background: COLORS.PRIMARY, color: '#fff',
        fontSize: '0.72rem', fontWeight: 700,
      }}>
        {count}
      </Box>
    </Box>
  );
}

function CardRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <Box sx={{ display: 'flex', gap: 0.75, mb: 0.75, alignItems: 'flex-start' }}>
      <Typography sx={{ fontSize: '0.72rem', color: COLORS.TEXT_SUBTLE, minWidth: 88, pt: '1px' }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: '0.8rem', color: COLORS.TEXT_PRIMARY, fontWeight: 500 }}>
        {value || '-'}
      </Typography>
    </Box>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <Box sx={{
      py: 4, px: 3, borderRadius: 2,
      border: `1.5px dashed ${COLORS.BORDER}`,
      textAlign: 'center', color: COLORS.TEXT_SUBTLE,
      fontSize: '0.875rem',
    }}>
      {message}
    </Box>
  );
}

function PksiCard({ item, onNavigate }: { item: PksiCardItem; onNavigate: () => void }) {
  return (
    <Card variant="outlined" sx={{
      height: '100%', display: 'flex', flexDirection: 'column',
      borderColor: COLORS.BORDER,
      '&:hover': { boxShadow: COLORS.SHADOW_CARD, borderColor: COLORS.PRIMARY },
      transition: 'box-shadow 0.2s, border-color 0.2s',
    }}>
      <CardContent sx={{ flex: 1, pb: 1 }}>
        <Typography sx={{ fontSize: '0.875rem', fontWeight: 700, color: COLORS.INK, mb: 1.5, lineHeight: 1.35 }}>
          {item.nama_pksi}
        </Typography>
        <StatusBadge status={item.status} />
        <Box sx={{ mt: 1.5 }}>
          <CardRow label="Aplikasi" value={item.nama_aplikasi} />
          <CardRow label="Jenis" value={item.jenis_pksi} />
          <CardRow label="Tahapan" value={item.progress ? (PHASE_LABEL[item.progress] ?? item.progress) : null} />
          <CardRow label="Target Go Live" value={fmtDate(item.target_go_live)} />
          <CardRow label="Tim" value={item.team_name} />
        </Box>
      </CardContent>
      <CardActions sx={{ px: 2, pb: 1.5 }}>
        <Button size="small" variant="outlined" onClick={onNavigate}
          sx={{ fontSize: '0.75rem', borderColor: COLORS.BORDER, color: COLORS.TEXT_PRIMARY,
            '&:hover': { borderColor: COLORS.PRIMARY, color: COLORS.PRIMARY } }}>
          Lihat Detail
        </Button>
      </CardActions>
    </Card>
  );
}

function Fs2Card({ item, onNavigate }: { item: Fs2CardItem; onNavigate: () => void }) {
  return (
    <Card variant="outlined" sx={{
      height: '100%', display: 'flex', flexDirection: 'column',
      borderColor: COLORS.BORDER,
      '&:hover': { boxShadow: COLORS.SHADOW_CARD, borderColor: COLORS.PRIMARY },
      transition: 'box-shadow 0.2s, border-color 0.2s',
    }}>
      <CardContent sx={{ flex: 1, pb: 1 }}>
        <Typography sx={{ fontSize: '0.875rem', fontWeight: 700, color: COLORS.INK, mb: 1.5, lineHeight: 1.35 }}>
          {item.nama_fs2 || '—'}
        </Typography>
        <StatusBadge status={item.status} />
        <Box sx={{ mt: 1.5 }}>
          <CardRow label="Aplikasi" value={item.nama_aplikasi} />
          <CardRow label="Fase" value={item.fase_pengajuan} />
          <CardRow label="Progres" value={item.progres ? (FS2_PROGRES_LABEL[item.progres] ?? item.progres) : null} />
          <CardRow label="Target Go Live" value={fmtDate(item.target_go_live)} />
          <CardRow label="Tim" value={item.team_name} />
        </Box>
      </CardContent>
      <CardActions sx={{ px: 2, pb: 1.5 }}>
        <Button size="small" variant="outlined" onClick={onNavigate}
          sx={{ fontSize: '0.75rem', borderColor: COLORS.BORDER, color: COLORS.TEXT_PRIMARY,
            '&:hover': { borderColor: COLORS.PRIMARY, color: COLORS.PRIMARY } }}>
          Lihat Detail
        </Button>
      </CardActions>
    </Card>
  );
}

function CardGridSkeleton() {
  return (
    <Grid container spacing={2.5}>
      {[1, 2, 3].map((i) => (
        <Grid item xs={12} sm={6} lg={4} key={i}>
          <Skeleton variant="rounded" height={220} />
        </Grid>
      ))}
    </Grid>
  );
}

// ─── main page ───────────────────────────────────────────────────────────────

export default function MyWorkPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<MyWorkData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const userInfo = getUserInfo();
  const teamNames = data?.teams.map((t) => t.name).join(', ') || '—';

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
        title={`Selamat datang, ${userInfo?.fullName ?? userInfo?.username ?? 'Pengembang'}`}
        subtitle={`Tim: ${teamNames}`}
      />

      <Box sx={{ px: { xs: 3, md: 4.5, xl: 6 }, py: 4, maxWidth: 1400, mx: 'auto' }}>
        {error && (
          <Box sx={{ p: 2, borderRadius: 2, background: '#FEF2F2', color: COLORS.ERROR, mb: 3, fontSize: '0.875rem' }}>
            {error}
          </Box>
        )}

        {/* PKSI section */}
        <Box sx={{ mb: 5 }}>
          {loading
            ? <Skeleton variant="text" width={200} height={32} sx={{ mb: 2.5 }} />
            : <SectionHeading title="PKSI Aktif Tim Saya" count={data?.pksi_list.length ?? 0} />}

          {loading ? (
            <CardGridSkeleton />
          ) : data?.pksi_list.length === 0 ? (
            <EmptyState message="Tidak ada PKSI aktif untuk tim kamu saat ini." />
          ) : (
            <Grid container spacing={2.5}>
              {data!.pksi_list.map((item) => (
                <Grid item xs={12} sm={6} lg={4} key={item.id}>
                  <PksiCard item={item} onNavigate={() => navigate(`/pksi/${item.id}`)} />
                </Grid>
              ))}
            </Grid>
          )}
        </Box>

        {/* FS2 section */}
        <Box>
          {loading
            ? <Skeleton variant="text" width={200} height={32} sx={{ mb: 2.5 }} />
            : <SectionHeading title="FS2 Aktif Tim Saya" count={data?.fs2_list.length ?? 0} />}

          {loading ? (
            <CardGridSkeleton />
          ) : data?.fs2_list.length === 0 ? (
            <EmptyState message="Tidak ada FS2 aktif untuk tim kamu saat ini." />
          ) : (
            <Grid container spacing={2.5}>
              {data!.fs2_list.map((item) => (
                <Grid item xs={12} sm={6} lg={4} key={item.id}>
                  <Fs2Card item={item} onNavigate={() => navigate('/fs2-disetujui')} />
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      </Box>
    </Box>
  );
}
