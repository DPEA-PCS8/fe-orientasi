import { Box, Typography, CircularProgress } from '@mui/material';
import type { ReactNode } from 'react';

export interface ListPageHeaderProps {
  title: string;
  totalCount?: number;
  isLoading?: boolean;
  icon?: ReactNode;
  description?: string;
  actionButton?: ReactNode;
}

/**
 * Reusable header component untuk semua list pages
 * Menampilkan title, count, icon, dan action button dengan konsistensi UI/UX
 */
export const ListPageHeader = ({
  title,
  totalCount,
  isLoading = false,
  icon,
  description,
  actionButton,
}: ListPageHeaderProps) => {
  return (
    <Box display="flex" justifyContent="space-between" alignItems={description ? 'flex-start' : 'center'} mb={3}>
      {/* Left side: Title + Count */}
      <Box display="flex" alignItems="center" gap={1.5}>
        {icon && (
          <Box sx={{ display: 'flex', alignItems: 'center', color: 'primary.main' }}>
            {icon}
          </Box>
        )}
        <Box>
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="h5" fontWeight={600}>
              {title}
            </Typography>
            {totalCount !== undefined && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: 32,
                  height: 32,
                  borderRadius: '50%',
                  backgroundColor: 'primary.lighter',
                  color: 'primary.main',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                }}
              >
                {isLoading ? <CircularProgress size={14} color="inherit" /> : totalCount}
              </Box>
            )}
          </Box>
          {description && (
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
              {description}
            </Typography>
          )}
        </Box>
      </Box>

      {/* Right side: Action Button */}
      {actionButton && (
        <Box>
          {actionButton}
        </Box>
      )}
    </Box>
  );
};

export default ListPageHeader;
