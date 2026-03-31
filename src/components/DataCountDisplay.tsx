import { Box, Typography } from '@mui/material';

export interface DataCountDisplayProps {
  /** Total count of data items */
  count: number;
  /** Whether data is still loading */
  isLoading?: boolean;
  /** Optional label prefix (default: "Total") */
  label?: string;
  /** Optional unit suffix (default: "data") */
  unit?: string;
}

/**
 * Display component untuk menampilkan jumlah total data
 * Ditempatkan antara section filter dan tabel
 * Clear, professional, dan mudah dibaca
 */
export const DataCountDisplay = ({
  count,
  isLoading = false,
  label = 'Total',
  unit = 'data',
}: DataCountDisplayProps) => {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        py: 1.5,
        px: 2,
        backgroundColor: '#F5F5F7',
        borderRadius: '8px',
        border: '1px solid rgba(0, 0, 0, 0.06)',
      }}
    >
      {/* Icon/Indicator */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 32,
          height: 32,
          borderRadius: '50%',
          backgroundColor: '#DA251C',
          color: 'white',
          fontWeight: 700,
          fontSize: '0.875rem',
        }}
      >
        {isLoading ? '...' : count}
      </Box>

      {/* Label + Unit */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        <Typography
          sx={{
            fontSize: '0.75rem',
            fontWeight: 500,
            color: '#86868b',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          {label}
        </Typography>
        <Typography
          sx={{
            fontSize: '0.875rem',
            fontWeight: 600,
            color: '#1d1d1f',
          }}
        >
          {isLoading ? 'Loading...' : `${count} ${unit}`}
        </Typography>
      </Box>
    </Box>
  );
};

export default DataCountDisplay;
