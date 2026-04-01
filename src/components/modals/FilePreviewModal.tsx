import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Box,
  Typography,
  CircularProgress,
  Button,
} from '@mui/material';
import {
  Close as CloseIcon,
  Download as DownloadIcon,
  OpenInNew as OpenInNewIcon,
  InsertDriveFile as FileIcon,
} from '@mui/icons-material';
import { getAuthToken } from '../../api/authApi';

const API_KEY = 'da39b92f-a1b8-46d5-a10c-d08b1cc92218';
const BASE_URL = '/api';

interface FilePreviewModalProps {
  open: boolean;
  onClose: () => void;
  fileId: string | null;
  fileName: string;
  contentType: string;
  onDownload?: () => void;
  /** Custom download URL (e.g., /api/fs2/files/download/{id}) */
  downloadUrl?: string;
  /** Direct URL for external files (bypasses API fetch) */
  directUrl?: string;
}

const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  open,
  onClose,
  fileId,
  fileName,
  contentType,
  onDownload,
  downloadUrl,
  directUrl,
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let currentUrl: string | null = null;
    
    const fetchPreview = async () => {
      if (!open) return;
      
      // If directUrl is provided, use it directly (for external URLs)
      if (directUrl) {
        setPreviewUrl(directUrl);
        setIsLoading(false);
        return;
      }

      if (!fileId) return;

      setIsLoading(true);
      setError(null);

      try {
        const token = getAuthToken();
        if (!token) {
          throw new Error('No authentication token found');
        }

        // Use custom downloadUrl if provided, otherwise default to PKSI endpoint
        const fetchUrl = downloadUrl || `${BASE_URL}/pksi/files/download/${fileId}`;

        const response = await fetch(fetchUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'APIKey': API_KEY,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to load preview');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        currentUrl = url;
        setPreviewUrl(url);
      } catch (err) {
        console.error('Error loading preview:', err);
        setError('Gagal memuat preview file');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPreview();

    return () => {
      // Only revoke if it's not a directUrl (those aren't blob URLs)
      if (currentUrl && !directUrl) {
        window.URL.revokeObjectURL(currentUrl);
      }
    };
  }, [fileId, open, downloadUrl, directUrl]);

  const handleClose = () => {
    // Only revoke blob URLs, not directUrls
    if (previewUrl && !directUrl) {
      window.URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setError(null);
    onClose();
  };

  const handleOpenInNewTab = () => {
    if (previewUrl) {
      window.open(previewUrl, '_blank');
    }
  };

  const isImage = contentType?.startsWith('image/');
  const isPdf = contentType === 'application/pdf';
  const canPreview = isImage || isPdf;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '20px',
          maxHeight: '90vh',
          bgcolor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        },
      }}
      slotProps={{
        backdrop: {
          sx: {
            bgcolor: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(8px)',
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
          py: 1.5,
          px: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #DA251C 0%, #FF4D45 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(218, 37, 28, 0.25)',
            }}
          >
            <FileIcon sx={{ color: 'white', fontSize: 20 }} />
          </Box>
          <Box>
            <Typography
              sx={{
                fontWeight: 600,
                color: '#1d1d1f',
                fontSize: '1rem',
                maxWidth: 400,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {fileName || 'Preview File'}
            </Typography>
            <Typography sx={{ color: '#86868b', fontSize: '0.75rem' }}>
              {contentType || 'Unknown type'}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {previewUrl && (
            <>
              <IconButton
                onClick={handleOpenInNewTab}
                size="small"
                sx={{
                  color: '#0891B2',
                  '&:hover': { bgcolor: 'rgba(8, 145, 178, 0.1)' },
                }}
                title="Buka di tab baru"
              >
                <OpenInNewIcon fontSize="small" />
              </IconButton>
              {onDownload && (
                <IconButton
                  onClick={onDownload}
                  size="small"
                  sx={{
                    color: '#059669',
                    '&:hover': { bgcolor: 'rgba(5, 150, 105, 0.1)' },
                  }}
                  title="Download"
                >
                  <DownloadIcon fontSize="small" />
                </IconButton>
              )}
            </>
          )}
          <IconButton
            onClick={handleClose}
            size="small"
            sx={{
              color: '#86868b',
              '&:hover': {
                bgcolor: 'rgba(0, 0, 0, 0.06)',
                color: '#1d1d1f',
              },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent
        sx={{
          p: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 400,
          bgcolor: 'rgba(245, 245, 247, 0.8)',
        }}
      >
        {isLoading ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              py: 6,
            }}
          >
            <CircularProgress size={40} sx={{ color: '#DA251C' }} />
            <Typography sx={{ color: '#86868b' }}>Memuat preview...</Typography>
          </Box>
        ) : error ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              py: 6,
            }}
          >
            <Typography sx={{ color: '#FF3B30', fontWeight: 500 }}>{error}</Typography>
            {onDownload && (
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={onDownload}
                sx={{
                  borderColor: '#059669',
                  color: '#059669',
                  '&:hover': {
                    borderColor: '#047857',
                    bgcolor: 'rgba(5, 150, 105, 0.04)',
                  },
                }}
              >
                Download File
              </Button>
            )}
          </Box>
        ) : !canPreview ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              py: 6,
            }}
          >
            <FileIcon sx={{ fontSize: 64, color: '#86868b' }} />
            <Typography sx={{ color: '#86868b', textAlign: 'center' }}>
              Preview tidak tersedia untuk tipe file ini
            </Typography>
            {onDownload && (
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={onDownload}
                sx={{
                  bgcolor: '#059669',
                  '&:hover': { bgcolor: '#047857' },
                  borderRadius: '10px',
                  textTransform: 'none',
                  fontWeight: 600,
                }}
              >
                Download File
              </Button>
            )}
          </Box>
        ) : previewUrl ? (
          <Box
            sx={{
              width: '100%',
              height: '70vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            {isImage ? (
              <img
                src={previewUrl}
                alt={fileName}
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                }}
              />
            ) : isPdf ? (
              <iframe
                src={previewUrl}
                title={fileName}
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                }}
              />
            ) : null}
          </Box>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

export default FilePreviewModal;
