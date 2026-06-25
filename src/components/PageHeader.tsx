import type { ReactNode } from 'react';
import { Box, Typography } from '@mui/material';
import { COLORS } from '../styles/theme';

interface PageHeaderProps {
  /** Small uppercase brand label above the title, e.g. "CONTROL CENTER". */
  eyebrow?: string;
  title: string;
  subtitle?: string;
  /** Optional actions rendered on the right (buttons, etc.). */
  actions?: ReactNode;
}

// Mirrors the admin-console page header band (Admin.Web _Layout.cshtml).
const PageHeader = ({ eyebrow = 'CONTROL CENTER', title, subtitle, actions }: PageHeaderProps) => {
  return (
    <Box
      sx={{
        background: `linear-gradient(to right, ${COLORS.SOFT} 0%, ${COLORS.SURFACE} 50%, rgba(${COLORS.PRIMARY_RGB}, 0.05) 100%)`,
        borderTop: `1px solid ${COLORS.BORDER}`,
        borderBottom: `1px solid ${COLORS.BORDER}`,
        px: { xs: 3, md: 4.5, xl: 6 },
        py: 3,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: { xs: 'flex-start', md: 'center' },
          justifyContent: 'space-between',
          flexDirection: { xs: 'column', md: 'row' },
          gap: 2,
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          {eyebrow && (
            <Typography
              sx={{
                fontSize: '11px',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: COLORS.PRIMARY,
                fontWeight: 600,
              }}
            >
              {eyebrow}
            </Typography>
          )}
          <Typography
            component="h1"
            sx={{
              mt: 0.5,
              fontSize: { xs: '1.75rem', md: '2.25rem' },
              fontWeight: 700,
              lineHeight: 1.15,
              color: COLORS.INK,
            }}
          >
            {title}
          </Typography>
          {subtitle && (
            <Typography sx={{ mt: 1, fontSize: '0.875rem', color: COLORS.TEXT_SECONDARY, maxWidth: 640 }}>
              {subtitle}
            </Typography>
          )}
        </Box>

        {actions && <Box sx={{ flexShrink: 0, display: 'flex', gap: 1.5, alignItems: 'center' }}>{actions}</Box>}
      </Box>
    </Box>
  );
};

export default PageHeader;
