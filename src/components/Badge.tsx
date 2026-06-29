import type { ReactNode } from 'react';
import { Box } from '@mui/material';

export type BadgeVariant = 'green' | 'amber' | 'red' | 'slate';

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
}

// Status badge mirroring admin-console (Admin.Web/wwwroot/css/components/badges.css).
const VARIANTS: Record<BadgeVariant, { color: string; border: string; bg: string }> = {
  green: { color: '#15803D', border: '#BBF7D0', bg: '#F0FDF4' },
  amber: { color: '#B45309', border: '#FDE68A', bg: '#FFFBEB' },
  red: { color: '#B91C1C', border: '#FECACA', bg: '#FEF2F2' },
  slate: { color: '#475569', border: '#E2E8F0', bg: '#F8FAFC' },
};

const Badge = ({ variant = 'slate', children }: BadgeProps) => {
  const v = VARIANTS[variant];
  return (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        borderRadius: '9px',
        padding: '0.22rem 0.65rem',
        fontSize: '0.72rem',
        fontWeight: 600,
        whiteSpace: 'nowrap',
        border: `1px solid ${v.border}`,
        color: v.color,
        backgroundColor: v.bg,
      }}
    >
      {children}
    </Box>
  );
};

export default Badge;
