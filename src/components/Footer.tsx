import { Box, Typography } from '@mui/material';
import { COLORS } from '../styles/theme';
import DpeaLogo from '../assets/DPEA-Digital2.png';
import FooterMotif from '../assets/footer-hd.png';

// Mirrors the admin-console footer (Admin.Web/Views/Shared/_Layout.cshtml).
// slate-500 = #64748B, brand = COLORS.PRIMARY.
const SLATE_500 = '#64748B';

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        position: 'relative',
        mt: 'auto',
        overflow: 'hidden',
        borderTop: '1px solid rgba(0, 0, 0, 0.06)',
        background: `linear-gradient(to right, #F8FAFC 0%, #FFFFFF 50%, ${COLORS.PRIMARY}0D 100%)`,
      }}
    >
      {/* Batik motif, top-right, hidden on mobile */}
      <Box
        component="img"
        src={FooterMotif}
        alt=""
        aria-hidden
        sx={{
          display: { xs: 'none', md: 'block' },
          pointerEvents: 'none',
          position: 'absolute',
          top: 0,
          right: 0,
          width: { md: 224, lg: 256 },
          height: 'auto',
          objectFit: 'contain',
          opacity: 0.9,
        }}
      />

      <Box sx={{ maxWidth: 1800, mx: 'auto', px: { xs: 3, md: 4.5, xl: 6 }, py: 2.5, position: 'relative' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
          {/* Brand */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box component="img" src={DpeaLogo} alt="DPEA Digital Logo" sx={{ height: 48, objectFit: 'contain' }} />
            <Box sx={{ display: 'grid', alignContent: 'center', rowGap: '2px', minHeight: 36 }}>
              <Typography
                component="span"
                sx={{ fontSize: '1.125rem', fontWeight: 700, lineHeight: 1.08, letterSpacing: '0.01em', color: COLORS.TEXT_PRIMARY }}
              >
                DPEA Digital
              </Typography>
              <Typography
                component="span"
                sx={{ fontSize: '11px', lineHeight: 1.1, fontWeight: 500, letterSpacing: '0.08em', color: SLATE_500 }}
              >
                Powering the Digital Era
              </Typography>
            </Box>
          </Box>

          <Typography sx={{ fontSize: '1rem', fontWeight: 600, color: SLATE_500, mt: 0.5 }}>
            Departemen Pengembangan Aplikasi
          </Typography>

          <Typography sx={{ fontSize: '0.875rem', fontWeight: 400, lineHeight: 1.6, color: SLATE_500 }}>
            Gd. Wisma Mulia 2 Lt.19
            <br />
            Jl. Gatot Subroto Kav.42, Jakarta Selatan
          </Typography>

          <Typography sx={{ fontSize: '0.875rem', color: SLATE_500 }}>
            © {new Date().getFullYear()}. All rights reserved.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default Footer;
