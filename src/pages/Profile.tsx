import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Chip,
  Divider,
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
        return 'success';
      case 'pending':
        return 'warning';
      case 'tidak_disetujui':
        return 'error';
      case 'dalam_proses':
        return 'info';
      default:
        return 'default';
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
        return 'primary';
      case 'Reviewer':
        return 'secondary';
      case 'Approver':
        return 'info';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <Typography variant="h4" sx={{ fontWeight: 600, mb: 3, color: '#1d1d1f' }}>
        Profil Pengguna
      </Typography>

      {/* Detail Info Card */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 3,
          border: '1px solid rgba(0, 0, 0, 0.08)',
          mb: 3,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
          Informasi Detail
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <PersonIcon sx={{ color: '#667eea' }} />
              <Box>
                <Typography variant="caption" sx={{ color: '#86868b' }}>
                  Nama Lengkap
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {extendedUserData.full_name}
                </Typography>
              </Box>
            </CardContent>
          </Card>

          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <BusinessIcon sx={{ color: '#667eea' }} />
              <Box>
                <Typography variant="caption" sx={{ color: '#86868b' }}>
                  Departemen
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {extendedUserData.division}
                </Typography>
              </Box>
            </CardContent>
          </Card>

          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <EmailIcon sx={{ color: '#667eea' }} />
              <Box>
                <Typography variant="caption" sx={{ color: '#86868b' }}>
                  Email
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {extendedUserData.email}
                </Typography>
              </Box>
            </CardContent>
          </Card>

          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <PhoneIcon sx={{ color: '#667eea' }} />
              <Box>
                <Typography variant="caption" sx={{ color: '#86868b' }}>
                  Nomor HP
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {extendedUserData.phoneNumber}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Paper>

      {/* Assigned PKSI Table */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 3,
          border: '1px solid rgba(0, 0, 0, 0.08)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <AssignmentIcon sx={{ color: '#667eea' }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            PKSI yang Ditugaskan
          </Typography>
          <Chip
            label={assignedPksi.length}
            size="small"
            color="primary"
            sx={{ ml: 1 }}
          />
        </Box>
        <Divider sx={{ mb: 2 }} />

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : assignedPksi.length === 0 ? (
          <Typography sx={{ textAlign: 'center', py: 4, color: '#86868b' }}>
            Tidak ada PKSI yang ditugaskan
          </Typography>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>ID PKSI</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Nama PKSI</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Role</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Tanggal Assign</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {assignedPksi.map((pksi) => (
                  <TableRow
                    key={pksi.id}
                    sx={{ '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.02)' } }}
                  >
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {pksi.id}
                      </Typography>
                    </TableCell>
                    <TableCell>{pksi.namaPksi}</TableCell>
                    <TableCell>
                      <Chip
                        label={pksi.role}
                        size="small"
                        color={getRoleColor(pksi.role)}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(pksi.tanggalAssign).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusLabel(pksi.status)}
                        size="small"
                        color={getStatusColor(pksi.status)}
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