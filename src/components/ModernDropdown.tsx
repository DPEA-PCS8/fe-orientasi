import React from 'react';
import { Autocomplete, TextField, InputAdornment, Box, Typography, Chip } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

export interface ModernDropdownOption {
  label: string;
  value: string;
  description?: string;
  group?: string;
  chipColor?: string;
}

interface ModernDropdownProps {
  options: ModernDropdownOption[];
  value: ModernDropdownOption | null;
  onChange: (value: ModernDropdownOption | null) => void;
  label?: string;
  placeholder?: string;
  groupBy?: (option: ModernDropdownOption) => string;
  renderOption?: (option: ModernDropdownOption, selected?: boolean) => React.ReactNode;
  renderGroup?: (params: any) => React.ReactNode;
  disabled?: boolean;
}

const ModernDropdown: React.FC<ModernDropdownProps> = ({
  options,
  value,
  onChange,
  label,
  placeholder,
  groupBy,
  renderOption,
  renderGroup,
  disabled,
}) => {
  return (
    <Autocomplete
      options={options}
      value={value}
      onChange={(_e, val) => onChange(val)}
      groupBy={groupBy}
      getOptionLabel={opt => opt.label}
      disabled={disabled}
      renderInput={params => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          size="small"
          InputProps={{
            ...params.InputProps,
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
      )}
      renderOption={(props, option, state) => (
        <li {...props} key={option.value}>
          {renderOption ? renderOption(option, state.selected) : (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {option.chipColor && <Chip label={option.label} size="small" sx={{ bgcolor: option.chipColor, color: 'white', fontWeight: 600 }} />}
              <Box>
                <Typography sx={{ fontWeight: 600 }}>{option.label}</Typography>
                {option.description && <Typography sx={{ fontSize: '0.8rem', color: '#86868b' }}>{option.description}</Typography>}
              </Box>
            </Box>
          )}
        </li>
      )}
      renderGroup={renderGroup}
      isOptionEqualToValue={(opt, val) => opt.value === val.value}
      ListboxProps={{ style: { maxHeight: 320 } }}
      noOptionsText="Tidak ada opsi"
      filterOptions={(opts, state) => opts.filter(o => `${o.label} ${o.description || ''}`.toLowerCase().includes(state.inputValue.toLowerCase()))}
    />
  );
};

export default ModernDropdown;
