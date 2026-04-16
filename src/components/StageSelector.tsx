import React, { useState } from 'react';
import {
  Box,
  Button,
  Menu,
  MenuItem,
  Typography,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { TIMELINE_STAGE_OPTIONS } from '../api/pksiApi';

interface StageSelectorProps {
  selectedStages: Set<string>;
  onStagesChange: (stages: Set<string>) => void;
  disabled?: boolean;
}

export const StageSelector: React.FC<StageSelectorProps> = ({
  selectedStages,
  onStagesChange,
  disabled = false,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleAddStage = (key: string) => {
    const newSelected = new Set(selectedStages);
    newSelected.add(key);
    onStagesChange(newSelected);
    handleClose();
  };

  // Get available stages (not yet selected)
  const availableStages = TIMELINE_STAGE_OPTIONS.filter(
    option => !selectedStages.has(option.key)
  );

  if (availableStages.length === 0) {
    return null; // All stages already selected
  }

  return (
    <Box sx={{ mb: 2 }}>
      <Button
        variant="outlined"
        startIcon={<AddIcon />}
        onClick={handleClick}
        disabled={disabled}
        sx={{
          borderRadius: '10px',
          borderColor: 'rgba(139, 92, 246, 0.3)',
          color: '#8B5CF6',
          fontSize: '0.8rem',
          fontWeight: 500,
          textTransform: 'none',
          px: 2,
          py: 0.75,
          '&:hover': {
            borderColor: '#8B5CF6',
            bgcolor: 'rgba(139, 92, 246, 0.05)',
          },
        }}
      >
        Tambah Stage
      </Button>
      
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: {
            borderRadius: '12px',
            mt: 1,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
            maxHeight: 400,
          },
        }}
      >
        {availableStages.map((option) => (
          <MenuItem
            key={option.key}
            onClick={() => handleAddStage(option.key)}
            sx={{
              py: 1.5,
              px: 2.5,
              '&:hover': {
                bgcolor: `rgba(${option.rgb}, 0.08)`,
              },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: '8px',
                  background: `linear-gradient(135deg, ${option.gradient[0]}, ${option.gradient[1]})`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 2px 8px rgba(${option.rgb}, 0.25)`,
                }}
              >
                <AddIcon sx={{ color: 'white', fontSize: 18 }} />
              </Box>
              <Typography
                sx={{
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: '#1d1d1f',
                }}
              >
                {option.label}
              </Typography>
            </Box>
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
};
