import Badge, { type BadgeVariant } from './Badge';

// DRY status → color mapping shared by all list/detail pages.
// Keyword-based so it tolerates label variants ("Disetujui", "disetujui", "Sudah Disetujui").
const GREEN = ['disetujui', 'selesai', 'aktif', 'active', 'approved', 'done', 'lengkap', 'sukses', 'berhasil', 'completed'];
const AMBER = ['pending', 'proses', 'progress', 'menunggu', 'review', 'draft', 'diajukan', 'on_progress', 'berjalan'];
const RED = ['tidak_disetujui', 'ditolak', 'rejected', 'gagal', 'failed', 'nonaktif', 'inactive', 'expired', 'terlambat', 'batal'];

export const statusToVariant = (status?: string | null): BadgeVariant => {
  if (!status) return 'slate';
  const s = status.toLowerCase().replace(/\s+/g, '_');
  if (GREEN.some((k) => s.includes(k))) return 'green';
  if (RED.some((k) => s.includes(k))) return 'red';
  if (AMBER.some((k) => s.includes(k))) return 'amber';
  return 'slate';
};

interface StatusBadgeProps {
  /** Raw status value; used both for color mapping and (by default) the visible label. */
  status?: string | null;
  /** Explicit display label; falls back to `status`. */
  label?: string;
  /** Force a variant, bypassing keyword mapping. */
  variant?: BadgeVariant;
}

const StatusBadge = ({ status, label, variant }: StatusBadgeProps) => (
  <Badge variant={variant ?? statusToVariant(status)}>{label ?? status ?? '-'}</Badge>
);

export default StatusBadge;
