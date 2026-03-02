import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  TextField,
  Chip,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Tooltip,
  InputAdornment,
  Tabs,
  Tab,
  Stack,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Close as CloseIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Check as CheckIcon,
  Search as SearchIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import {
  createSubKategori,
  updateSubKategori,
  deleteSubKategori,
} from '../../api/arsitekturApi';

export interface SubKategoriItem {
  id?: string;
  code: string;
  name: string;
}

export interface SubKategoriCategory {
  code: string;
  name: string;
  color: string;
  items: SubKategoriItem[];
}

interface SubKategoriModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (item: SubKategoriItem, category: SubKategoriCategory) => void;
  selectedValue?: string;
  categories: SubKategoriCategory[];
  onCategoriesChange?: (categories: SubKategoriCategory[]) => void;
}

const COLORS = ['#2196F3', '#4CAF50', '#FF9800', '#9C27B0', '#f44336', '#00BCD4', '#795548', '#607D8B'];

const SubKategoriModal: React.FC<SubKategoriModalProps> = ({
  open,
  onClose,
  onSelect,
  selectedValue,
  categories,
  onCategoriesChange,
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add sub kategori state - only the suffix part (e.g., "1", "2")
  const [newItemCodeSuffix, setNewItemCodeSuffix] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [addingToCategory, setAddingToCategory] = useState<string | null>(null);

  // Edit sub kategori state
  const [editingItem, setEditingItem] = useState<{ catCode: string; itemCode: string; itemId?: string } | null>(null);
  const [editItemCode, setEditItemCode] = useState('');
  const [editItemName, setEditItemName] = useState('');

  // Add category state
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryCode, setNewCategoryCode] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState(COLORS[0]);

  const handleSelectItem = (item: SubKategoriItem, category: SubKategoriCategory) => {
    if (editMode) return;
    onSelect(item, category);
    onClose();
  };

  const handleAddItem = async (categoryCode: string) => {
    if (!newItemCodeSuffix.trim() || !newItemName.trim() || !onCategoriesChange) return;

    // Build full code: category prefix + suffix (e.g., CS + 1 = CS1)
    const fullCode = `${categoryCode}${newItemCodeSuffix.trim().toUpperCase()}`;

    setLoading(true);
    setError(null);

    try {
      // Call API to create sub kategori
      const response = await createSubKategori({
        kode: fullCode,
        nama: newItemName.trim(),
        category_code: categoryCode,
      });

      // Update local state with API response
      const newItem: SubKategoriItem = {
        id: response.data.id,
        code: response.data.kode,
        name: response.data.nama,
      };

      const updatedCategories = categories.map(cat => {
        if (cat.code === categoryCode) {
          return {
            ...cat,
            items: [...cat.items, newItem],
          };
        }
        return cat;
      });

      onCategoriesChange(updatedCategories);
      setNewItemCodeSuffix('');
      setNewItemName('');
      setAddingToCategory(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menambahkan sub kategori');
    } finally {
      setLoading(false);
    }
  };

  const handleEditItem = async (catCode: string, oldItemCode: string) => {
    if (!editItemCode.trim() || !editItemName.trim() || !onCategoriesChange) return;

    // Ensure the code starts with the category prefix
    let finalCode = editItemCode.trim().toUpperCase();
    if (!finalCode.startsWith(catCode)) {
      finalCode = `${catCode}${finalCode}`;
    }

    // Find the item to get its ID
    const category = categories.find(c => c.code === catCode);
    const item = category?.items.find(i => i.code === oldItemCode);

    if (!item?.id) {
      // No API id, just update locally (for default items)
      const updatedCategories = categories.map(cat => {
        if (cat.code === catCode) {
          return {
            ...cat,
            items: cat.items.map(i =>
              i.code === oldItemCode
                ? { ...i, code: finalCode, name: editItemName.trim() }
                : i
            ),
          };
        }
        return cat;
      });
      onCategoriesChange(updatedCategories);
      setEditingItem(null);
      setEditItemCode('');
      setEditItemName('');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await updateSubKategori(item.id, {
        kode: finalCode,
        nama: editItemName.trim(),
        category_code: catCode,
      });

      const updatedCategories = categories.map(cat => {
        if (cat.code === catCode) {
          return {
            ...cat,
            items: cat.items.map(i =>
              i.code === oldItemCode
                ? { id: response.data.id, code: response.data.kode, name: response.data.nama }
                : i
            ),
          };
        }
        return cat;
      });

      onCategoriesChange(updatedCategories);
      setEditingItem(null);
      setEditItemCode('');
      setEditItemName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengubah sub kategori');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (catCode: string, itemCode: string) => {
    if (!onCategoriesChange) return;

    // Find the item to get its ID
    const category = categories.find(c => c.code === catCode);
    const item = category?.items.find(i => i.code === itemCode);

    if (!item?.id) {
      // No API id, just delete locally
      const updatedCategories = categories.map(cat => {
        if (cat.code === catCode) {
          return {
            ...cat,
            items: cat.items.filter(i => i.code !== itemCode),
          };
        }
        return cat;
      });
      onCategoriesChange(updatedCategories);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await deleteSubKategori(item.id);

      const updatedCategories = categories.map(cat => {
        if (cat.code === catCode) {
          return {
            ...cat,
            items: cat.items.filter(i => i.code !== itemCode),
          };
        }
        return cat;
      });

      onCategoriesChange(updatedCategories);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus sub kategori');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = () => {
    if (!newCategoryCode.trim() || !newCategoryName.trim() || !onCategoriesChange) return;

    const exists = categories.some(c => c.code === newCategoryCode.toUpperCase());
    if (exists) return;

    const newCategory: SubKategoriCategory = {
      code: newCategoryCode.toUpperCase(),
      name: newCategoryName.trim(),
      color: newCategoryColor,
      items: [],
    };

    onCategoriesChange([...categories, newCategory]);
    setNewCategoryCode('');
    setNewCategoryName('');
    setNewCategoryColor(COLORS[0]);
    setShowAddCategory(false);
    setActiveTab(categories.length);
  };

  const handleDeleteCategory = (catCode: string) => {
    if (!onCategoriesChange) return;
    onCategoriesChange(categories.filter(c => c.code !== catCode));
    if (activeTab >= categories.length - 1) {
      setActiveTab(Math.max(0, categories.length - 2));
    }
  };

  const currentCategory = categories[activeTab];

  const filteredItems =
    currentCategory?.items.filter(
      item =>
        !searchKeyword ||
        item.code.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        item.name.toLowerCase().includes(searchKeyword.toLowerCase())
    ) || [];

  const handleClose = () => {
    setEditMode(false);
    setShowAddCategory(false);
    setAddingToCategory(null);
    setEditingItem(null);
    setSearchKeyword('');
    setError(null);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: '16px', maxHeight: '80vh' } }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #e5e5e7',
          pb: 2,
          bgcolor: 'white',
        }}
      >
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#1d1d1f' }}>
            Pilih Sub Kategori
          </Typography>
          <Typography variant="body2" sx={{ color: '#86868b' }}>
            Pilih sub kategori arsitektur untuk aplikasi
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {onCategoriesChange && (
            <Tooltip title={editMode ? 'Selesai Edit' : 'Mode Edit'}>
              <IconButton
                size="small"
                onClick={() => {
                  setEditMode(!editMode);
                  setShowAddCategory(false);
                  setAddingToCategory(null);
                  setEditingItem(null);
                }}
                sx={{
                  color: editMode ? 'white' : '#86868b',
                  bgcolor: editMode ? '#DA251C' : 'transparent',
                  '&:hover': {
                    bgcolor: editMode ? '#B91C14' : 'rgba(0,0,0,0.04)',
                  },
                }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          <IconButton size="small" onClick={handleClose} sx={{ color: '#86868b' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </DialogTitle>

      <Box sx={{ borderBottom: '1px solid #e5e5e7', bgcolor: 'white' }}>
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            minHeight: 44,
            px: 2,
            '& .MuiTab-root': {
              minHeight: 44,
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.85rem',
            },
          }}
        >
          {categories.map(cat => (
            <Tab
              key={cat.code}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: cat.color }} />
                  {cat.code}
                </Box>
              }
            />
          ))}
          {editMode && onCategoriesChange && (
            <Tab
              icon={<AddIcon sx={{ fontSize: 18 }} />}
              onClick={() => setShowAddCategory(true)}
              sx={{ minWidth: 48 }}
            />
          )}
        </Tabs>
      </Box>

      <DialogContent sx={{ p: 0, bgcolor: 'white' }}>
        {/* Add Category Form */}
        {showAddCategory && editMode && (
          <Box sx={{ p: 2.5, borderBottom: '1px solid #e5e5e7' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: '#1d1d1f' }}>
              Tambah Kategori Baru
            </Typography>
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', gap: 1.5 }}>
                <TextField
                  size="small"
                  label="Kode"
                  placeholder="CS"
                  value={newCategoryCode}
                  onChange={e => setNewCategoryCode(e.target.value.toUpperCase().slice(0, 3))}
                  sx={{ width: 100 }}
                />
                <TextField
                  size="small"
                  label="Nama Kategori"
                  placeholder="Core System"
                  value={newCategoryName}
                  onChange={e => setNewCategoryName(e.target.value)}
                  sx={{ flex: 1 }}
                />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: '#86868b', mb: 1, display: 'block' }}>
                  Pilih Warna
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {COLORS.map(color => (
                    <Box
                      key={color}
                      onClick={() => setNewCategoryColor(color)}
                      sx={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        bgcolor: color,
                        cursor: 'pointer',
                        border: newCategoryColor === color ? '3px solid #1d1d1f' : '2px solid transparent',
                        transition: 'all 0.15s ease',
                        '&:hover': { transform: 'scale(1.1)' },
                      }}
                    />
                  ))}
                </Box>
              </Box>
            </Stack>
            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
              <Button
                size="small"
                variant="contained"
                onClick={handleAddCategory}
                disabled={!newCategoryCode.trim() || !newCategoryName.trim()}
                sx={{
                  background: 'linear-gradient(135deg, #DA251C 0%, #FF4D45 100%)',
                  '&:hover': { background: 'linear-gradient(135deg, #B91C14 0%, #D83A32 100%)' },
                }}
              >
                Simpan
              </Button>
              <Button size="small" onClick={() => setShowAddCategory(false)} sx={{ color: '#86868b' }}>
                Batal
              </Button>
            </Box>
          </Box>
        )}

        {/* Category Header */}
        {currentCategory && !showAddCategory && (
          <Box
            sx={{
              p: 2,
              bgcolor: `${currentCategory.color}08`,
              borderBottom: '1px solid #e5e5e7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Chip
                label={currentCategory.code}
                size="small"
                sx={{ bgcolor: currentCategory.color, color: 'white', fontWeight: 700 }}
              />
              <Typography sx={{ fontWeight: 600, color: '#1d1d1f' }}>{currentCategory.name}</Typography>
              <Chip
                label={`${currentCategory.items.length} item`}
                size="small"
                variant="outlined"
                sx={{ height: 22, fontSize: '0.7rem' }}
              />
            </Box>
            {editMode && categories.length > 1 && (
              <Tooltip title="Hapus Kategori">
                <IconButton size="small" onClick={() => handleDeleteCategory(currentCategory.code)} sx={{ color: '#f44336' }}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        )}

        {/* Search */}
        {!showAddCategory && (
          <Box sx={{ p: 2, pb: 1 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Cari sub kategori..."
              value={searchKeyword}
              onChange={e => setSearchKeyword(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#86868b', fontSize: 18 }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                },
              }}
            />
          </Box>
        )}

        {/* Items List */}
        {currentCategory && !showAddCategory && (
          <List disablePadding sx={{ maxHeight: 280, overflow: 'auto' }}>
            {filteredItems.length === 0 && !editMode ? (
              <ListItem>
                <Typography variant="body2" sx={{ color: '#86868b', py: 3, textAlign: 'center', width: '100%' }}>
                  {searchKeyword ? 'Tidak ada hasil pencarian' : 'Belum ada sub kategori'}
                </Typography>
              </ListItem>
            ) : (
              filteredItems.map(item => (
                <ListItem
                  key={item.code}
                  disablePadding
                  sx={{ borderBottom: '1px solid #f0f0f0' }}
                >
                  {editingItem?.catCode === currentCategory.code && editingItem?.itemCode === item.code ? (
                    // Edit Mode Row
                    <Box sx={{ display: 'flex', gap: 1, p: 1.5, width: '100%', alignItems: 'center' }}>
                      <TextField
                        size="small"
                        label="Kode"
                        value={editItemCode}
                        onChange={e => setEditItemCode(e.target.value.toUpperCase())}
                        sx={{ width: 80 }}
                      />
                      <TextField
                        size="small"
                        label="Nama"
                        value={editItemName}
                        onChange={e => setEditItemName(e.target.value)}
                        sx={{ flex: 1 }}
                        autoFocus
                      />
                      <IconButton
                        size="small"
                        onClick={() => handleEditItem(currentCategory.code, item.code)}
                        disabled={!editItemCode.trim() || !editItemName.trim()}
                        sx={{ color: '#4CAF50' }}
                      >
                        <CheckIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => {
                          setEditingItem(null);
                          setEditItemCode('');
                          setEditItemName('');
                        }}
                        sx={{ color: '#86868b' }}
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ) : (
                    // Normal Row
                    <ListItemButton
                      selected={selectedValue === `${item.code}: ${item.name}`}
                      onClick={() => handleSelectItem(item, currentCategory)}
                      sx={{
                        py: 1.5,
                        pr: editMode ? 10 : 2,
                        '&.Mui-selected': {
                          bgcolor: `${currentCategory.color}12`,
                          '&:hover': { bgcolor: `${currentCategory.color}18` },
                        },
                        '&:hover': { bgcolor: '#f8f9fa' },
                      }}
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Chip
                              label={item.code}
                              size="small"
                              sx={{
                                bgcolor: currentCategory.color,
                                color: 'white',
                                fontWeight: 600,
                                fontSize: '0.75rem',
                                height: 24,
                              }}
                            />
                            <Typography sx={{ fontSize: '0.9rem', color: '#1d1d1f' }}>{item.name}</Typography>
                          </Box>
                        }
                      />
                      {selectedValue === `${item.code}: ${item.name}` && !editMode && (
                        <CheckIcon sx={{ color: currentCategory.color, fontSize: 20 }} />
                      )}
                      {editMode && (
                        <Box sx={{ position: 'absolute', right: 8, display: 'flex', gap: 0.5 }}>
                          <IconButton
                            size="small"
                            onClick={e => {
                              e.stopPropagation();
                              setEditingItem({ catCode: currentCategory.code, itemCode: item.code });
                              setEditItemCode(item.code);
                              setEditItemName(item.name);
                            }}
                            sx={{ color: '#86868b', '&:hover': { color: '#2196F3' } }}
                          >
                            <EditIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={e => {
                              e.stopPropagation();
                              handleDeleteItem(currentCategory.code, item.code);
                            }}
                            sx={{ color: '#86868b', '&:hover': { color: '#f44336' } }}
                          >
                            <DeleteIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Box>
                      )}
                    </ListItemButton>
                  )}
                </ListItem>
              ))
            )}

            {/* Add Item */}
            {editMode && (
              <ListItem sx={{ py: 1.5, px: 2 }}>
                {addingToCategory === currentCategory.code ? (
                  <Box sx={{ display: 'flex', gap: 1, width: '100%', alignItems: 'center' }}>
                    <TextField
                      size="small"
                      label="Kode"
                      placeholder="1"
                      value={newItemCodeSuffix}
                      onChange={e => setNewItemCodeSuffix(e.target.value.toUpperCase())}
                      sx={{ width: 120 }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Chip
                              label={currentCategory.code}
                              size="small"
                              sx={{
                                bgcolor: currentCategory.color,
                                color: 'white',
                                fontWeight: 600,
                                fontSize: '0.7rem',
                                height: 20,
                              }}
                            />
                          </InputAdornment>
                        ),
                      }}
                    />
                    <TextField
                      size="small"
                      label="Nama Sub Kategori"
                      value={newItemName}
                      onChange={e => setNewItemName(e.target.value)}
                      sx={{ flex: 1 }}
                      autoFocus
                    />
                    <IconButton
                      size="small"
                      onClick={() => handleAddItem(currentCategory.code)}
                      disabled={!newItemCodeSuffix.trim() || !newItemName.trim()}
                      sx={{ color: '#4CAF50' }}
                    >
                      <CheckIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => {
                        setAddingToCategory(null);
                        setNewItemCodeSuffix('');
                        setNewItemName('');
                      }}
                      sx={{ color: '#86868b' }}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ) : (
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() => setAddingToCategory(currentCategory.code)}
                    sx={{
                      color: currentCategory.color,
                      borderColor: currentCategory.color,
                      borderStyle: 'dashed',
                      '&:hover': { bgcolor: `${currentCategory.color}08`, borderColor: currentCategory.color },
                    }}
                  >
                    Tambah Sub Kategori
                  </Button>
                )}
              </ListItem>
            )}
          </List>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, borderTop: '1px solid #e5e5e7', bgcolor: 'white', flexDirection: 'column', alignItems: 'stretch', gap: 1 }}>
        {error && (
          <Alert severity="error" onClose={() => setError(null)} sx={{ width: '100%' }}>
            {error}
          </Alert>
        )}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          {editMode && (
            <Alert severity="info" sx={{ py: 0 }}>
              <Typography variant="caption">Mode edit aktif</Typography>
            </Alert>
          )}
          {loading && <CircularProgress size={20} sx={{ mr: 'auto' }} />}
          {!editMode && !loading && <Box />}
          <Button
            variant="outlined"
            onClick={handleClose}
            disabled={loading}
            sx={{
              borderColor: '#86868b',
              color: '#86868b',
              '&:hover': { borderColor: '#1d1d1f', bgcolor: 'transparent' },
            }}
          >
            {editMode ? 'Selesai' : 'Batal'}
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default SubKategoriModal;
