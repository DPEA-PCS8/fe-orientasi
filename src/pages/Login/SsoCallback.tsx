import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, CircularProgress, Button } from '@mui/material';
import Alert from '@mui/material/Alert';
import { storeAuthData } from '../../api/authApi';
import type { LoginResponse } from '../../types/auth.types';

// Same APIKey used by apiClient.ts for all BE requests.
const API_KEY = 'da39b92f-a1b8-46d5-a10c-d08b1cc92218';

interface ExchangeResponse {
  status: number;
  message: string;
  data: LoginResponse;
}

const SsoCallback = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  // StrictMode mounts effects twice in dev; guard the one-time exchange so the
  // single-use SSO code isn't consumed twice.
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const params = new URLSearchParams(window.location.search);
    const ssoError = params.get('error');
    const errorDescription = params.get('error_description');
    const code = params.get('code');
    const state = params.get('state');

    // SSO returned an error (e.g. user denied, invalid request).
    if (ssoError) {
      setError(errorDescription || `Login SSO gagal: ${ssoError}`);
      return;
    }

    if (!code || !state) {
      setError('Parameter SSO tidak lengkap. Silakan ulangi proses login.');
      return;
    }

    const exchange = async () => {
      try {
        const response = await fetch('/api/auth/sso/exchange', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            APIKey: API_KEY,
          },
          body: JSON.stringify({ code, state }),
        });

        const result: ExchangeResponse = await response.json();

        if (!response.ok) {
          throw new Error(result?.message || 'Pertukaran token SSO gagal.');
        }

        storeAuthData(result.data.token, result.data.user_info);
        navigate('/', { replace: true });
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Terjadi kesalahan saat menyelesaikan login SSO.'
        );
      }
    };

    exchange();
  }, [navigate]);

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
        background: '#f5f5f7',
        px: 2,
      }}
    >
      {error ? (
        <>
          <Alert
            severity="error"
            sx={{
              maxWidth: 420,
              width: '100%',
              borderRadius: 2,
              backgroundColor: '#fff2f2',
              border: '1px solid #ffcdd2',
            }}
          >
            {error}
          </Alert>
          <Button
            variant="contained"
            onClick={() => navigate('/login', { replace: true })}
            sx={{
              textTransform: 'none',
              borderRadius: 2,
              backgroundColor: '#0071e3',
              boxShadow: 'none',
              '&:hover': { backgroundColor: '#0077ed', boxShadow: 'none' },
            }}
          >
            Kembali ke halaman login
          </Button>
        </>
      ) : (
        <>
          <CircularProgress sx={{ color: '#0071e3' }} />
          <Typography sx={{ color: '#86868b' }}>
            Menyelesaikan proses login SSO...
          </Typography>
        </>
      )}
    </Box>
  );
};

export default SsoCallback;
