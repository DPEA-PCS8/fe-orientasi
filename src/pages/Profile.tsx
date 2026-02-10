import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Business as BusinessIcon,
  Phone as PhoneIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';

// Interface untuk PKSI yang ter-assign ke user
interface AssignedPksi {
  id: string;
  namaPksi: string;
  status: 'pending' | 'disetujui' | 'tidak_disetujui' | 'dalam_proses';
  tanggalAssign: string;
  role: 'PIC' | 'Reviewer' | 'Approver';
}

// Dummy data PKSI yang ter-assign ke user untuk simulasi
const DUMMY_ASSIGNED_PKSI: AssignedPksi[] = [
  {
    id: 'PKSI-001',
    namaPksi: 'Sistem Monitoring Pasar Modal',
    status: 'dalam_proses',
    tanggalAssign: '2026-01-15',
    role: 'PIC',
  },
  {
    id: 'PKSI-002',
    namaPksi: 'Aplikasi Pelaporan IKNB',
    status: 'pending',
    tanggalAssign: '2026-01-20',
    role: 'Reviewer',
  },
  {
    id: 'PKSI-003',
    namaPksi: 'Portal Pengaduan Konsumen',
    status: 'disetujui',
    tanggalAssign: '2025-12-10',
    role: 'PIC',
  },
  {
    id: 'PKSI-004',
    namaPksi: 'Dashboard Analitik Perbankan',
    status: 'tidak_disetujui',
    tanggalAssign: '2025-11-05',
    role: 'Approver',
  },
];

const Profile = () => {
  const [assignedPksi, setAssignedPksi] = useState<AssignedPksi[]>([]);
  const [loading, setLoading] = useState(true);

  // Extended user data dengan dummy data
  const extendedUserData = {
    full_name: 'Sample Name',
    division: 'Departemen Pengembangan Aplikasi',
    email: 'user.profil@gmail.com',
    phoneNumber: '081234567890',
  };

  useEffect(() => {
    // Simulasi fetch PKSI yang ter-assign ke user
    const fetchAssignedPksi = async () => {
      setLoading(true);
      // Simulasi delay API
      await new Promise((resolve) => setTimeout(resolve, 800));
      setAssignedPksi(DUMMY_ASSIGNED_PKSI);
      setLoading(false);
    };

    fetchAssignedPksi();
  }, []);

  const getStatusColor = (status: AssignedPksi['status']) => {
    switch (status) {
      case 'disetujui':
        return '#31A24C';
      case 'pending':
        return '#FF9500';
      case 'tidak_disetujui':
        return '#FF3B30';
      case 'dalam_proses':
        return '#007AFF';
      default:
        return '#86868b';
    }
  };

  const getStatusLabel = (status: AssignedPksi['status']) => {
    switch (status) {
      case 'disetujui':
        return 'Disetujui';
      case 'pending':
        return 'Pending';
      case 'tidak_disetujui':
        return 'Tidak Disetujui';
      case 'dalam_proses':
        return 'Dalam Proses';
      default:
        return status;
    }
  };

  const getRoleColor = (role: AssignedPksi['role']) => {
    switch (role) {
      case 'PIC':
        return '#DA251C';
      case 'Reviewer':
        return '#FF9500';
      case 'Approver':
        return '#007AFF';
      default:
        return '#86868b';
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <Box sx={{ 
      p: 3.5,
      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.4) 0%, rgba(240, 245, 250, 0.3) 100%)',
      minHeight: '100vh',
    }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography 
          variant="h4" 
          sx={{ 
            fontWeight: 700, 
            color: '#1d1d1f',
            letterSpacing: '-0.02em',
            mb: 0.5,
          }}
        >
          Profil Pengguna
        </Typography>
        <Typography variant="body1" sx={{ color: '#86868b' }}>
          Informasi detail pengguna dan PKSI yang ditugaskan
        </Typography>
      </Box>

      {/* Info Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            borderRadius: 2,
            border: '1px solid rgba(0, 0, 0, 0.08)',
            transition: 'all 0.2s ease',
            '&:hover': {
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
              transform: 'translateY(-2px)',
            },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 1.5,
                background: 'linear-gradient(135deg, #DA251C 0%, #FF4D45 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <PersonIcon sx={{ color: '#fff', fontSize: 20 }} />
            </Box>
          </Box>
          <Typography variant="caption" sx={{ color: '#86868b', display: 'block', mb: 0.5 }}>
            Nama Lengkap
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 600, color: '#1d1d1f' }}>
            {extendedUserData.full_name}
          </Typography>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            borderRadius: 2,
            border: '1px solid rgba(0, 0, 0, 0.08)',
            transition: 'all 0.2s ease',
            '&:hover': {
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
              transform: 'translateY(-2px)',
            },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 1.5,
                background: 'linear-gradient(135deg, #007AFF 0%, #0051D5 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <BusinessIcon sx={{ color: '#fff', fontSize: 20 }} />
            </Box>
          </Box>
          <Typography variant="caption" sx={{ color: '#86868b', display: 'block', mb: 0.5 }}>
            Departemen
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 600, color: '#1d1d1f' }}>
            {extendedUserData.division}
          </Typography>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            borderRadius: 2,
            border: '1px solid rgba(0, 0, 0, 0.08)',
            transition: 'all 0.2s ease',
            '&:hover': {
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
              transform: 'translateY(-2px)',
            },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 1.5,
                background: 'linear-gradient(135deg, #FF9500 0%, #FF6300 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <EmailIcon sx={{ color: '#fff', fontSize: 20 }} />
            </Box>
          </Box>
          <Typography variant="caption" sx={{ color: '#86868b', display: 'block', mb: 0.5 }}>
            Email
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 600, color: '#1d1d1f', fontSize: '0.9rem' }}>
            {extendedUserData.email}
          </Typography>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            borderRadius: 2,
            border: '1px solid rgba(0, 0, 0, 0.08)',
            transition: 'all 0.2s ease',
            '&:hover': {
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
              transform: 'translateY(-2px)',
            },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 1.5,
                background: 'linear-gradient(135deg, #34C759 0%, #28A745 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <PhoneIcon sx={{ color: '#fff', fontSize: 20 }} />
            </Box>
          </Box>
          <Typography variant="caption" sx={{ color: '#86868b', display: 'block', mb: 0.5 }}>
            Nomor HP
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 600, color: '#1d1d1f' }}>
            {extendedUserData.phoneNumber}
          </Typography>
        </Paper>
      </Box>

      {/* PKSI Table */}
      <Paper
        elevation={0}
        sx={{
          width: '100%',
          borderRadius: 2,
          border: '1px solid rgba(0, 0, 0, 0.08)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <Box
          sx={{
            p: 2.5,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 1.5,
                background: 'linear-gradient(135deg, #DA251C 0%, #FF4D45 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AssignmentIcon sx={{ color: '#fff', fontSize: 18 }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#1d1d1f', lineHeight: 1.2 }}>
                PKSI yang Ditugaskan
              </Typography>
              <Typography variant="caption" sx={{ color: '#86868b' }}>
                {assignedPksi.length} tugas aktif
              </Typography>
            </Box>
          </Box>
          <Chip
            label={assignedPksi.length}
            size="small"
            sx={{
              bgcolor: '#DA251C15',
              color: '#DA251C',
              fontWeight: 600,
              fontSize: '0.75rem',
            }}
          />
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress sx={{ color: '#DA251C' }} />
          </Box>
        ) : assignedPksi.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <AssignmentIcon sx={{ fontSize: 56, color: '#d1d1d6', mb: 2 }} />
            <Typography sx={{ color: '#86868b', fontSize: '1rem', mb: 0.5 }}>
              Tidak ada PKSI yang ditugaskan
            </Typography>
            <Typography sx={{ color: '#aeaeb2', fontSize: '0.875rem' }}>
              Anda belum memiliki tugas PKSI
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#fafafa' }}>
                  <TableCell sx={{ fontWeight: 600, color: '#1d1d1f' }}>ID PKSI</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#1d1d1f' }}>Nama PKSI</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#1d1d1f' }}>Role</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#1d1d1f' }}>Tanggal Assign</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#1d1d1f' }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {assignedPksi.map((pksi) => (
                  <TableRow
                    key={pksi.id}
                    sx={{ 
                      '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.02)' },
                      transition: 'background-color 0.2s ease',
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#1d1d1f', fontFamily: 'monospace' }}>
                        {pksi.id}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: '#1d1d1f', fontWeight: 500 }}>
                        {pksi.namaPksi}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={pksi.role}
                        size="small"
                        sx={{
                          bgcolor: `${getRoleColor(pksi.role)}15`,
                          color: getRoleColor(pksi.role),
                          fontWeight: 500,
                          fontSize: '0.75rem',
                          height: 24,
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: '#86868b', fontSize: '0.85rem' }}>
                        {formatDate(pksi.tanggalAssign)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusLabel(pksi.status)}
                        size="small"
                        sx={{
                          bgcolor: `${getStatusColor(pksi.status)}15`,
                          color: getStatusColor(pksi.status),
                          fontWeight: 500,
                          fontSize: '0.75rem',
                          height: 24,
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
};

export default Profile;