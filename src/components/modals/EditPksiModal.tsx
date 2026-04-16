import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box,
  Typography, Autocomplete, CircularProgress, Stack, Accordion, AccordionSummary,
  AccordionDetails, IconButton, Chip, styled, Popover, MenuItem, List, ListItem,
  ListItemIcon, ListItemText, ListItemSecondaryAction,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon, Close as CloseIcon, CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon, InsertDriveFile as FileIcon, Download as DownloadIcon,
  Visibility as VisibilityIcon, Add as AddIcon,
} from '@mui/icons-material';
import { getAllSkpa, type SkpaData } from '../../api/skpaApi';
import { getAllAplikasi, type AplikasiData } from '../../api/aplikasiApi';
import { getPksiDocumentById, updatePksiDocument, type PksiDocumentRequest } from '../../api/pksiApi';
import { getUserInfo } from '../../api/authApi';
import { getAllRbsi, getRbsiById, type RbsiResponse, type RbsiProgramResponse, type RbsiInisiatifResponse } from '../../api/rbsiApi';
import { uploadPksiFiles, getPksiFiles, deletePksiFile, downloadPksiFile, type PksiFileData } from '../../api/pksiFileApi';
import { StageSelector } from '../StageSelector';
import FilePreviewModal from './FilePreviewModal';

const GlassTextField = styled(TextField)({
  '& .MuiOutlinedInput-root': {
    borderRadius: '12px',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    backdropFilter: 'blur(10px)',
    transition: 'all 0.2s ease-in-out',
    '& fieldset': { borderColor: 'rgba(0, 0, 0, 0.08)', transition: 'all 0.2s ease-in-out' },
    '&:hover fieldset': { borderColor: 'rgba(0, 0, 0, 0.15)' },
    '&.Mui-focused fieldset': { borderColor: '#DA251C', borderWidth: '1.5px' },
    '&.Mui-focused': { backgroundColor: 'rgba(255, 255, 255, 0.9)', boxShadow: '0 4px 20px rgba(218, 37, 28, 0.1)' },
  },
  '& .MuiInputLabel-root': { color: '#86868b', fontWeight: 500, '&.Mui-focused': { color: '#DA251C' } },
  '& .MuiOutlinedInput-input': { color: '#1d1d1f' },
});

interface SkpaOption { id: string; kode_skpa: string; nama_skpa: string; }

interface PksiEditData {
  id: string; namaPksi: string; namaAplikasi: string; picSatkerBA: string;
  jangkaWaktu: string; tanggalPengajuan: string; linkDocsT01: string;
  status: 'pending' | 'disetujui' | 'tidak_disetujui';
}

interface EditPksiModalProps {
  open: boolean; onClose: () => void; pksiData: PksiEditData | null; onSuccess: () => void;
}

interface FormData {
  namaPksi: string; aplikasiId: string; tanggalPengajuan: string; picSatkerBA: string[];
  programInisiatifRBSI: string; jenisPksi: string;
}

interface FormErrors { [key: string]: string | undefined; }

interface TimelinePhases {
  usreq: string[];
  sit: string[];
  uat: string[];
  goLive: string[];
  pengadaan: string[];
  desain: string[];
  coding: string[];
  unitTest: string[];
  deployment: string[];
}

const lastDayOfMonth = (yearMonth: string): string => {
  if (!yearMonth) return '';
  const [y, m] = yearMonth.split('-').map(Number);
  const last = new Date(y, m, 0).getDate();
  return `${yearMonth}-${String(last).padStart(2, '0')}`;
};

const currentMonthValue = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return lastDayOfMonth(`${y}-${m}`);
};

const TIMELINE_CONFIGS = [
  { key: 'usreq' as const, label: 'Target Usreq', stage: 'USREQ', gradient: ['#6366F1', '#818CF8'], rgb: '99,102,241' },
  { key: 'sit' as const, label: 'Target SIT', stage: 'SIT', gradient: ['#8B5CF6', '#A78BFA'], rgb: '139,92,246' },
  { key: 'uat' as const, label: 'Target UAT/PDKK', stage: 'UAT', gradient: ['#F59E0B', '#FCD34D'], rgb: '245,158,11' },
  { key: 'goLive' as const, label: 'Target Go Live', stage: 'GO_LIVE', gradient: ['#10B981', '#34D399'], rgb: '16,185,129' },
  { key: 'pengadaan' as const, label: 'Target Pengadaan', stage: 'PENGADAAN', gradient: ['#EC4899', '#F472B6'], rgb: '236,72,153' },
  { key: 'desain' as const, label: 'Target Desain', stage: 'DESAIN', gradient: ['#06B6D4', '#22D3EE'], rgb: '6,182,212' },
  { key: 'coding' as const, label: 'Target Coding', stage: 'CODING', gradient: ['#8B5CF6', '#D8B4FE'], rgb: '139,92,246' },
  { key: 'unitTest' as const, label: 'Target Unit Test', stage: 'UNIT_TEST', gradient: ['#F59E0B', '#FBBF24'], rgb: '245,158,11' },
  { key: 'deployment' as const, label: 'Target Deployment', stage: 'DEPLOYMENT', gradient: ['#10B981', '#6EE7B7'], rgb: '16,185,129' },
];

interface TimelineStageProps {
  label: string;
  stages: string[];
  gradient: string[];
  rgb: string;
  onChange: (phaseIndex: number, value: string) => void;
  onAddPhase: () => void;
  onRemovePhase: (phaseIndex: number) => void;
  onRemoveStage?: () => void;
}

const TimelineStage = ({ label, stages, gradient, rgb, onChange, onAddPhase, onRemovePhase, onRemoveStage }: TimelineStageProps) => {
  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{
            width: 32, height: 32, borderRadius: '10px',
            background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 2px 12px rgba(${rgb},0.35)`,
          }}>
            <Typography sx={{ color: 'white', fontWeight: 700, fontSize: '0.75rem' }}>
              {stages.length}
            </Typography>
          </Box>
          <Typography sx={{ fontWeight: 600, fontSize: '0.9rem', color: '#1d1d1f', letterSpacing: '-0.01em' }}>
            {label}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            size="small"
            startIcon={<AddIcon />}
            onClick={onAddPhase}
            sx={{
              borderRadius: '10px',
              borderColor: `rgba(${rgb},0.25)`,
              color: gradient[0],
              fontWeight: 600,
              fontSize: '0.7rem',
              px: 1.5,
              py: 0.4,
              textTransform: 'none',
              background: `rgba(${rgb},0.04)`,
              border: `1px solid rgba(${rgb},0.25)`,
              '&:hover': {
                borderColor: gradient[0],
                background: `rgba(${rgb},0.08)`,
              },
            }}
          >
            Tambah Fase
          </Button>
          {onRemoveStage && (
            <IconButton
              size="small"
              onClick={onRemoveStage}
              sx={{
                color: '#EF4444',
                '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.1)' },
              }}
            >
              <CloseIcon sx={{ fontSize: 18 }} />
            </IconButton>
          )}
        </Box>
      </Box>

      <Stack spacing={1.2}>
        {stages.map((date, phaseIndex) => (
          <Box
            key={phaseIndex}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.2,
              p: 1.5,
              borderRadius: '12px',
              background: 'rgba(255,255,255,0.7)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.9)',
              boxShadow: '0 3px 12px rgba(0,0,0,0.04)',
              transition: 'all 0.2s ease',
              '&:hover': {
                boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                borderColor: `rgba(${rgb},0.2)`,
              },
            }}
          >
            <Box sx={{
              minWidth: 32,
              height: 32,
              borderRadius: '8px',
              background: `rgba(${rgb},0.1)`,
              border: `1.5px solid rgba(${rgb},0.25)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Typography sx={{ fontWeight: 700, fontSize: '0.8rem', color: gradient[0] }}>
                {phaseIndex + 1}
              </Typography>
            </Box>

            <TextField
              fullWidth
              size="small"
              type="month"
              value={date ? date.substring(0, 7) : ''}
              onChange={(e) => onChange(phaseIndex, e.target.value)}
              InputLabelProps={{ shrink: true }}
              placeholder="Pilih bulan"
              sx={{
                flex: 1,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                  background: `rgba(${rgb},0.04)`,
                  '& fieldset': { border: `1px solid rgba(${rgb},0.15)` },
                  '&:hover fieldset': { borderColor: `rgba(${rgb},0.3)` },
                  '&.Mui-focused fieldset': { borderColor: gradient[0], borderWidth: '1.5px' },
                },
                '& .MuiInputBase-input': { fontSize: '0.8rem', color: '#1d1d1f', fontWeight: 500, py: 1 },
              }}
            />

            {stages.length > 1 && (
              <IconButton
                size="small"
                onClick={() => onRemovePhase(phaseIndex)}
                sx={{
                  width: 28,
                  height: 28,
                  color: '#86868b',
                  '&:hover': { color: '#DC2626', bgcolor: 'rgba(220,38,38,0.06)' },
                }}
              >
                <CloseIcon sx={{ fontSize: 17 }} />
              </IconButton>
            )}
          </Box>
        ))}
      </Stack>
    </Box>
  );
};

const EditPksiModal: React.FC<EditPksiModalProps> = ({ open, onClose, pksiData, onSuccess }) => {
  const [expandedSection, setExpandedSection] = useState<string | false>('jadwal');
  const [formData, setFormData] = useState<FormData>({
    namaPksi: '', aplikasiId: '', tanggalPengajuan: '', picSatkerBA: [], programInisiatifRBSI: '', jenisPksi: 'Reguler',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [skpaOptions, setSkpaOptions] = useState<SkpaOption[]>([]);
  const [aplikasiOptions, setAplikasiOptions] = useState<AplikasiData[]>([]);
  const [rbsiOptions, setRbsiOptions] = useState<RbsiResponse[]>([]);
  const [programOptions, setProgramOptions] = useState<RbsiProgramResponse[]>([]);
  const [selectedRbsi, setSelectedRbsi] = useState<RbsiResponse | null>(null);
  const [selectedProgram, setSelectedProgram] = useState<RbsiProgramResponse | null>(null);
  const [selectedInisiatif, setSelectedInisiatif] = useState<RbsiInisiatifResponse | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [inisiatifPopoverAnchor, setInisiatifPopoverAnchor] = useState<HTMLElement | null>(null);
  const [popoverWidth, setPopoverWidth] = useState<number>(0);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [loadedInisiatifId, setLoadedInisiatifId] = useState<string | null>(null);
  const [timelinePhases, setTimelinePhases] = useState<TimelinePhases>({
    usreq: [currentMonthValue()],
    sit: [currentMonthValue()],
    uat: [currentMonthValue()],
    goLive: [currentMonthValue()],
    pengadaan: [currentMonthValue()],
    desain: [currentMonthValue()],
    coding: [currentMonthValue()],
    unitTest: [currentMonthValue()],
    deployment: [currentMonthValue()],
  });

  // Selected stages to display in timeline (for dynamic form)
  const [selectedStages, setSelectedStages] = useState<Set<string>>(
    new Set(['usreq', 'sit', 'uat', 'goLive'])
  );

  const handleTimelineChange = (stage: keyof TimelinePhases, phaseIndex: number, value: string) => {
    setTimelinePhases(prev => {
      const updated = { ...prev };
      const newDates = [...updated[stage]];
      newDates[phaseIndex] = value ? lastDayOfMonth(value) : '';
      updated[stage] = newDates;
      return updated;
    });
  };

  const handleAddPhase = (stage: keyof TimelinePhases) => {
    setTimelinePhases(prev => ({
      ...prev,
      [stage]: [...prev[stage], currentMonthValue()],
    }));
  };

  const handleRemovePhase = (stage: keyof TimelinePhases, phaseIndex: number) => {
    setTimelinePhases(prev => ({
      ...prev,
      [stage]: prev[stage].filter((_, i) => i !== phaseIndex),
    }));
  };

  const [filesT01, setFilesT01] = useState<PksiFileData[]>([]);
  const [filesT11, setFilesT11] = useState<PksiFileData[]>([]);
  const [isUploadingT01, setIsUploadingT01] = useState(false);
  const [isUploadingT11, setIsUploadingT11] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [downloadingFileId, setDownloadingFileId] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<PksiFileData | null>(null);

  const periodYears = useMemo(() => {
    if (!selectedRbsi) return [];
    const [startYear, endYear] = selectedRbsi.periode.split('-').map(Number);
    const years: number[] = [];
    for (let year = startYear; year <= endYear; year++) years.push(year);
    return years;
  }, [selectedRbsi]);

  const groupedInisiatifs = useMemo(() => {
    if (!programOptions.length) return [];
    return programOptions.map(program => {
      const inisiatifs = (program.inisiatifs || []).filter(i => !selectedYear || i.tahun === selectedYear);
      return { program, inisiatifs };
    }).filter(g => g.inisiatifs.length > 0);
  }, [programOptions, selectedYear]);

  const handleAccordionChange = (panel: string) => (_: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedSection(isExpanded ? panel : false);
  };

  const handleFileUploadT01 = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0 && pksiData?.id) {
      setIsUploadingT01(true); setErrorMessage('');
      try {
        await uploadPksiFiles(pksiData.id, [files[0]], 'T01');
        const all = await getPksiFiles(pksiData.id);
        setFilesT01(all.filter(f => f.file_type === 'T01' || !f.file_type));
        setFilesT11(all.filter(f => f.file_type === 'T11'));
      } catch (error) { console.error('Upload T01 failed:', error); setErrorMessage('Gagal mengupload file T01.'); }
      finally { setIsUploadingT01(false); }
    }
    event.target.value = '';
  };

  const handleFileUploadT11 = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0 && pksiData?.id) {
      setIsUploadingT11(true); setErrorMessage('');
      try {
        await uploadPksiFiles(pksiData.id, [files[0]], 'T11');
        const all = await getPksiFiles(pksiData.id);
        setFilesT01(all.filter(f => f.file_type === 'T01' || !f.file_type));
        setFilesT11(all.filter(f => f.file_type === 'T11'));
      } catch (error) { console.error('Upload T11 failed:', error); setErrorMessage('Gagal mengupload file T11.'); }
      finally { setIsUploadingT11(false); }
    }
    event.target.value = '';
  };

  const handleRemoveFile = async (fileId: string, fileType: string) => {
    try {
      await deletePksiFile(fileId);
      if (fileType === 'T11') setFilesT11(prev => prev.filter(f => f.id !== fileId));
      else setFilesT01(prev => prev.filter(f => f.id !== fileId));
    } catch (error) { console.error('Delete failed:', error); setErrorMessage('Gagal menghapus file.'); }
  };

  const handleDownload = async (file: PksiFileData) => {
    setDownloadingFileId(file.id);
    try { await downloadPksiFile(file.id, file.original_name); }
    catch (error) { console.error('Download error:', error); }
    finally { setDownloadingFileId(null); }
  };

  const handlePreview = (file: PksiFileData) => { setPreviewFile(file); setPreviewOpen(true); };
  const handlePreviewClose = () => { setPreviewOpen(false); setPreviewFile(null); };
  const handlePreviewDownload = async () => { if (previewFile) await handleDownload(previewFile); };
  const isPreviewable = (ct: string) => ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(ct);
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024; const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const skpaResp = await getAllSkpa();
        setSkpaOptions((skpaResp.data || []).map((s: SkpaData) => ({ id: s.id, kode_skpa: s.kode_skpa, nama_skpa: s.nama_skpa })));
        const appResp = await getAllAplikasi(); setAplikasiOptions(appResp.data || []);
        const rbsiResp = await getAllRbsi(); setRbsiOptions(rbsiResp.data || []);
      } catch (error) { console.error('Error fetching options:', error); }
    };
    if (open) fetchOptions();
  }, [open]);

  useEffect(() => {
    const fetchPksiDetails = async () => {
      if (!pksiData?.id || !open) return;
      setIsLoadingData(true);
      try {
        const data = await getPksiDocumentById(pksiData.id);
        
        // Initialize timeline phases from timelines
        let phases: TimelinePhases = {
          usreq: [currentMonthValue()],
          sit: [currentMonthValue()],
          uat: [currentMonthValue()],
          goLive: [currentMonthValue()],
          pengadaan: [currentMonthValue()],
          desain: [currentMonthValue()],
          coding: [currentMonthValue()],
          unitTest: [currentMonthValue()],
          deployment: [currentMonthValue()],
        };
        
        let selectedStagesSet = new Set(['usreq', 'sit', 'uat', 'goLive']);
        
        if (data.timelines && data.timelines.length > 0) {
          // Group timelines by stage
          const stageMap: Record<string, Map<number, string>> = {
            USREQ: new Map(),
            SIT: new Map(),
            UAT: new Map(),
            GO_LIVE: new Map(),
            PENGADAAN: new Map(),
            DESAIN: new Map(),
            CODING: new Map(),
            UNIT_TEST: new Map(),
            DEPLOYMENT: new Map(),
          };
          
          data.timelines.forEach(timeline => {
            if (stageMap[timeline.stage]) {
              stageMap[timeline.stage].set(timeline.phase, timeline.target_date.split('T')[0]);
              // Track which stages have data
              const keyMap: Record<string, string> = {
                'USREQ': 'usreq', 'SIT': 'sit', 'UAT': 'uat', 'GO_LIVE': 'goLive',
                'PENGADAAN': 'pengadaan', 'DESAIN': 'desain', 'CODING': 'coding',
                'UNIT_TEST': 'unitTest', 'DEPLOYMENT': 'deployment',
              };
              if (keyMap[timeline.stage]) {
                selectedStagesSet.add(keyMap[timeline.stage]);
              }
            }
          });
          
          // Convert maps to arrays sorted by phase
          phases = {
            usreq: Array.from(stageMap.USREQ.entries()).sort((a, b) => a[0] - b[0]).map(([_, date]) => date),
            sit: Array.from(stageMap.SIT.entries()).sort((a, b) => a[0] - b[0]).map(([_, date]) => date),
            uat: Array.from(stageMap.UAT.entries()).sort((a, b) => a[0] - b[0]).map(([_, date]) => date),
            goLive: Array.from(stageMap.GO_LIVE.entries()).sort((a, b) => a[0] - b[0]).map(([_, date]) => date),
            pengadaan: Array.from(stageMap.PENGADAAN.entries()).sort((a, b) => a[0] - b[0]).map(([_, date]) => date),
            desain: Array.from(stageMap.DESAIN.entries()).sort((a, b) => a[0] - b[0]).map(([_, date]) => date),
            coding: Array.from(stageMap.CODING.entries()).sort((a, b) => a[0] - b[0]).map(([_, date]) => date),
            unitTest: Array.from(stageMap.UNIT_TEST.entries()).sort((a, b) => a[0] - b[0]).map(([_, date]) => date),
            deployment: Array.from(stageMap.DEPLOYMENT.entries()).sort((a, b) => a[0] - b[0]).map(([_, date]) => date),
          };
          
          // Ensure at least one phase per stage
          if (phases.usreq.length === 0) phases.usreq = [currentMonthValue()];
          if (phases.sit.length === 0) phases.sit = [currentMonthValue()];
          if (phases.uat.length === 0) phases.uat = [currentMonthValue()];
          if (phases.goLive.length === 0) phases.goLive = [currentMonthValue()];
          if (phases.pengadaan.length === 0) phases.pengadaan = [currentMonthValue()];
          if (phases.desain.length === 0) phases.desain = [currentMonthValue()];
          if (phases.coding.length === 0) phases.coding = [currentMonthValue()];
          if (phases.unitTest.length === 0) phases.unitTest = [currentMonthValue()];
          if (phases.deployment.length === 0) phases.deployment = [currentMonthValue()];
        } else {
          // Fallback to legacy fields if no timelines
          phases = {
            usreq: [data.target_usreq ? data.target_usreq.split('T')[0] : currentMonthValue()],
            sit: [data.target_sit ? data.target_sit.split('T')[0] : currentMonthValue()],
            uat: [data.target_uat ? data.target_uat.split('T')[0] : currentMonthValue()],
            goLive: [data.target_go_live ? data.target_go_live.split('T')[0] : currentMonthValue()],
            pengadaan: [currentMonthValue()],
            desain: [currentMonthValue()],
            coding: [currentMonthValue()],
            unitTest: [currentMonthValue()],
            deployment: [currentMonthValue()],
          };
        }
        setTimelinePhases(phases);
        setSelectedStages(selectedStagesSet);
        
        setFormData({
          namaPksi: data.nama_pksi || '', aplikasiId: data.aplikasi_id || '',
          tanggalPengajuan: data.tanggal_pengajuan ? data.tanggal_pengajuan.split('T')[0] : '',
          picSatkerBA: data.pic_satker_ba ? data.pic_satker_ba.split(/[,]\s*/).filter(Boolean) : [],
          programInisiatifRBSI: data.program_inisiatif_rbsi || '',
          jenisPksi: data.jenis_pksi || 'Reguler',
        });
        
        setTimelinePhases(phases);
        
        if (data.inisiatif_id) setLoadedInisiatifId(data.inisiatif_id);
        try {
          const existingFiles = await getPksiFiles(pksiData.id);
          setFilesT01(existingFiles.filter(f => f.file_type === 'T01' || !f.file_type));
          setFilesT11(existingFiles.filter(f => f.file_type === 'T11'));
        } catch (fileErr) { console.error('Error fetching files:', fileErr); }
      } catch (error) { console.error('Error fetching PKSI details:', error); }
      finally { setIsLoadingData(false); }
    };
    fetchPksiDetails();
  }, [pksiData?.id, open]);

  useEffect(() => {
    if (!loadedInisiatifId || !programOptions.length) return;
    for (const program of programOptions) {
      const match = program.inisiatifs?.find(i => i.id === loadedInisiatifId);
      if (match) { setSelectedInisiatif(match); setSelectedProgram(program); setLoadedInisiatifId(null); break; }
    }
  }, [loadedInisiatifId, programOptions]);

  useEffect(() => {
    const autoSelectRbsi = async () => {
      if (!loadedInisiatifId || !rbsiOptions.length || selectedRbsi) return;
      for (const rbsi of rbsiOptions) {
        try {
          const resp = await getRbsiById(rbsi.id);
          const programs = resp.data?.programs || [];
          if (programs.some(p => p.inisiatifs?.some(i => i.id === loadedInisiatifId))) {
            setSelectedRbsi(rbsi); setProgramOptions(programs); break;
          }
        } catch (error) { console.error('Error checking RBSI:', error); }
      }
    };
    autoSelectRbsi();
  }, [loadedInisiatifId, rbsiOptions, selectedRbsi]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: undefined }));
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.namaPksi.trim()) newErrors.namaPksi = 'Nama PKSI wajib diisi';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm() || !pksiData?.id) return;
    setIsSubmitting(true);
    try {
      // Convert timeline data to new structure
      const timelines: any[] = [];
      
      // Only add stages that are selected
      if (selectedStages.has('usreq')) {
        timelinePhases.usreq.forEach((date, index) => {
          if (date) {
            timelines.push({ phase: index + 1, target_date: date, stage: 'USREQ' });
          }
        });
      }
      
      // Add SIT phases (skip if Mendesak)
      if (selectedStages.has('sit') && formData.jenisPksi !== 'Mendesak') {
        timelinePhases.sit.forEach((date, index) => {
          if (date) {
            timelines.push({ phase: index + 1, target_date: date, stage: 'SIT' });
          }
        });
      }
      
      // Add UAT phases
      if (selectedStages.has('uat')) {
        timelinePhases.uat.forEach((date, index) => {
          if (date) {
            timelines.push({ phase: index + 1, target_date: date, stage: 'UAT' });
          }
        });
      }
      
      // Add GO_LIVE phases
      if (selectedStages.has('goLive')) {
        timelinePhases.goLive.forEach((date, index) => {
          if (date) {
            timelines.push({ phase: index + 1, target_date: date, stage: 'GO_LIVE' });
          }
        });
      }

      // Add PENGADAAN phases
      if (selectedStages.has('pengadaan')) {
        timelinePhases.pengadaan.forEach((date, index) => {
          if (date) {
            timelines.push({ phase: index + 1, target_date: date, stage: 'PENGADAAN' });
          }
        });
      }

      // Add DESAIN phases
      if (selectedStages.has('desain')) {
        timelinePhases.desain.forEach((date, index) => {
          if (date) {
            timelines.push({ phase: index + 1, target_date: date, stage: 'DESAIN' });
          }
        });
      }

      // Add CODING phases
      if (selectedStages.has('coding')) {
        timelinePhases.coding.forEach((date, index) => {
          if (date) {
            timelines.push({ phase: index + 1, target_date: date, stage: 'CODING' });
          }
        });
      }

      // Add UNIT_TEST phases
      if (selectedStages.has('unitTest')) {
        timelinePhases.unitTest.forEach((date, index) => {
          if (date) {
            timelines.push({ phase: index + 1, target_date: date, stage: 'UNIT_TEST' });
          }
        });
      }

      // Add DEPLOYMENT phases
      if (selectedStages.has('deployment')) {
        timelinePhases.deployment.forEach((date, index) => {
          if (date) {
            timelines.push({ phase: index + 1, target_date: date, stage: 'DEPLOYMENT' });
          }
        });
      }

      const requestData: PksiDocumentRequest = {
        aplikasi_id: formData.aplikasiId || undefined, inisiatif_id: selectedInisiatif?.id || undefined,
        nama_pksi: formData.namaPksi, jenis_pksi: formData.jenisPksi, tanggal_pengajuan: formData.tanggalPengajuan || undefined,
        pic_satker_ba: formData.picSatkerBA.length > 0 ? formData.picSatkerBA.join(',') : undefined,
        program_inisiatif_rbsi: formData.programInisiatifRBSI || undefined,
        timelines: timelines.length > 0 ? timelines : undefined,
        user_id: getUserInfo()?.uuid || '',
      };
      await updatePksiDocument(pksiData.id, requestData);
      onSuccess(); handleClose();
    } catch (error) { console.error('Error updating PKSI:', error); }
    finally { setIsSubmitting(false); }
  };

  const handleClose = () => {
    setFormData({ namaPksi: '', aplikasiId: '', tanggalPengajuan: '', picSatkerBA: [], programInisiatifRBSI: '', jenisPksi: 'Reguler' });
    setTimelinePhases({ 
      usreq: [currentMonthValue()], 
      sit: [currentMonthValue()], 
      uat: [currentMonthValue()], 
      goLive: [currentMonthValue()],
      pengadaan: [currentMonthValue()],
      desain: [currentMonthValue()],
      coding: [currentMonthValue()],
      unitTest: [currentMonthValue()],
      deployment: [currentMonthValue()],
    });
    setSelectedStages(new Set(['usreq', 'sit', 'uat', 'goLive']));
    setErrors({}); setExpandedSection('jadwal'); setFilesT01([]); setFilesT11([]);
    setIsUploadingT01(false); setIsUploadingT11(false); setErrorMessage('');
    setPreviewOpen(false); setPreviewFile(null);
    setSelectedRbsi(null); setSelectedProgram(null); setSelectedInisiatif(null);
    setSelectedYear(null); setLoadedInisiatifId(null); onClose();
  };

  const renderFileSection = (title: string, fileType: string, files: PksiFileData[], isUploading: boolean, handleUpload: (e: React.ChangeEvent<HTMLInputElement>) => void, uploadId: string, iconColor: string) => (
    <Box>
      <Typography variant="subtitle1" sx={{ mb: 1.5, fontWeight: 600, color: '#1d1d1f' }}>{title}</Typography>
      <Box sx={{ border: '2px dashed #e5e5e7', borderRadius: 2, p: 3, textAlign: 'center', cursor: isUploading ? 'not-allowed' : 'pointer', opacity: isUploading ? 0.7 : 1, transition: 'all 0.2s ease-in-out', '&:hover': { borderColor: isUploading ? '#e5e5e7' : iconColor, bgcolor: isUploading ? 'transparent' : `${iconColor}08` } }}
        onClick={() => !isUploading && document.getElementById(uploadId)?.click()}>
        <input id={uploadId} type="file" hidden onChange={handleUpload} accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg" disabled={isUploading} />
        {isUploading ? (<><CircularProgress size={48} sx={{ color: iconColor, mb: 1 }} /><Typography variant="body1" sx={{ color: '#1d1d1f', fontWeight: 500 }}>Mengupload file...</Typography></>) : (<><CloudUploadIcon sx={{ fontSize: 48, color: '#86868b', mb: 1 }} /><Typography variant="body1" sx={{ color: '#1d1d1f', fontWeight: 500 }}>Klik untuk upload file {title}</Typography><Typography variant="body2" sx={{ color: '#86868b', mt: 0.5 }}>atau drag & drop file di sini</Typography><Typography variant="caption" sx={{ color: '#86868b', display: 'block', mt: 1 }}>Format: PDF, Word, Excel, Gambar (max 20MB)</Typography></>)}
      </Box>
      {files.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: '#1d1d1f' }}>File {title} ({files.length})</Typography>
          <List sx={{ bgcolor: 'rgba(245, 245, 247, 0.8)', borderRadius: '12px' }}>
            {files.map((file, index) => (
              <ListItem key={file.id} sx={{ borderBottom: index < files.length - 1 ? '1px solid #e5e5e7' : 'none' }}>
                <ListItemIcon><FileIcon sx={{ color: iconColor }} /></ListItemIcon>
                <ListItemText primary={file.original_name} secondary={formatFileSize(file.file_size)} primaryTypographyProps={{ sx: { fontWeight: 500, color: '#1d1d1f' } }} secondaryTypographyProps={{ sx: { color: '#86868b' } }} />
                <ListItemSecondaryAction sx={{ display: 'flex', gap: 0.5 }}>
                  {isPreviewable(file.content_type) && <IconButton edge="end" size="small" onClick={() => handlePreview(file)} sx={{ color: '#0891B2', '&:hover': { bgcolor: 'rgba(8, 145, 178, 0.1)' } }} title="Preview"><VisibilityIcon fontSize="small" /></IconButton>}
                  <IconButton edge="end" size="small" onClick={() => handleDownload(file)} disabled={downloadingFileId === file.id} sx={{ color: '#059669', '&:hover': { bgcolor: 'rgba(5, 150, 105, 0.1)' } }} title="Download">{downloadingFileId === file.id ? <CircularProgress size={18} sx={{ color: '#059669' }} /> : <DownloadIcon fontSize="small" />}</IconButton>
                  <IconButton edge="end" size="small" onClick={() => handleRemoveFile(file.id, fileType)} disabled={isUploading} sx={{ color: '#86868b', '&:hover': { color: '#DA251C' } }} title="Hapus"><DeleteIcon fontSize="small" /></IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </Box>
      )}
    </Box>
  );

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth
      PaperProps={{ sx: { borderRadius: '20px', maxHeight: '90vh', bgcolor: 'rgba(255, 255, 255, 0.75)', backdropFilter: 'blur(40px) saturate(180%)', WebkitBackdropFilter: 'blur(40px) saturate(180%)', border: '1px solid rgba(255, 255, 255, 0.3)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.1) inset' } }}
      slotProps={{ backdrop: { sx: { bgcolor: 'rgba(0, 0, 0, 0.3)', backdropFilter: 'blur(8px)' } } }}>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0, 0, 0, 0.06)', pb: 2, bgcolor: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: '#1d1d1f', letterSpacing: '-0.02em' }}>Edit PKSI</Typography>
        <IconButton onClick={handleClose} size="small" sx={{ color: '#86868b', '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' } }}><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent sx={{ pt: 3, pb: 4, background: 'linear-gradient(135deg, rgba(245, 245, 247, 0.9) 0%, rgba(250, 250, 250, 0.95) 100%)' }}>
        {isLoadingData ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}><CircularProgress sx={{ color: '#DA251C' }} /></Box>
        ) : (
          <Stack spacing={3} sx={{ mt: 2 }}>
            {/* Informasi Dasar */}
            <Box sx={{ p: 3, borderRadius: '20px', bgcolor: 'rgba(255, 255, 255, 0.6)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.8)', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.8)', transition: 'all 0.3s ease', '&:hover': { boxShadow: '0 12px 40px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.9)' } }}>
              <Typography variant="subtitle1" sx={{ mb: 2.5, fontWeight: 600, color: '#1d1d1f', letterSpacing: '-0.01em', fontSize: '1rem' }}>Informasi Dasar</Typography>
              <Stack spacing={2.5}>
                <GlassTextField fullWidth label="Nama PKSI" name="namaPksi" value={formData.namaPksi} onChange={handleInputChange} error={!!errors.namaPksi} helperText={errors.namaPksi} size="small" />
                <GlassTextField select fullWidth label="Jenis PKSI" name="jenisPksi" value={formData.jenisPksi} onChange={handleInputChange} size="small">
                  <MenuItem value="Reguler">Reguler</MenuItem>
                  <MenuItem value="Mendesak">Mendesak</MenuItem>
                </GlassTextField>
                <Autocomplete fullWidth options={aplikasiOptions} getOptionLabel={(o) => `${o.kode_aplikasi} - ${o.nama_aplikasi}`} value={aplikasiOptions.find(a => a.id === formData.aplikasiId) || null} onChange={(_, v) => setFormData(prev => ({ ...prev, aplikasiId: v?.id || '' }))} renderInput={(params) => <GlassTextField {...params} label="Nama Aplikasi" size="small" />} size="small" />
                <Autocomplete multiple fullWidth options={skpaOptions} getOptionLabel={(o) => `${o.kode_skpa} - ${o.nama_skpa}`} value={skpaOptions.filter(s => formData.picSatkerBA.includes(s.id))} onChange={(_, v) => setFormData(prev => ({ ...prev, picSatkerBA: v.map(s => s.id) }))}
                  renderInput={(params) => <GlassTextField {...params} label="SKPA (Satuan Kerja Pemilik Aplikasi)" size="small" />}
                  renderTags={(value, getTagProps) => value.map((option, index) => (<Chip {...getTagProps({ index })} key={option.id} label={option.kode_skpa} size="small" sx={{ bgcolor: '#DA251C', color: 'white', '& .MuiChip-deleteIcon': { color: 'rgba(255, 255, 255, 0.7)', '&:hover': { color: 'white' } } }} />))}
                  isOptionEqualToValue={(o, v) => o.id === v.id} size="small" />
                {/* RBSI Cascading Selection */}
                <Box sx={{ mt: 2, p: 2, borderRadius: '12px', bgcolor: 'rgba(218, 37, 28, 0.03)', border: '1px solid rgba(218, 37, 28, 0.1)' }}>
                  <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: '#DA251C', fontSize: '0.85rem' }}>Program Inisiatif RBSI</Typography>
                  <Stack spacing={2}>
                    <Autocomplete fullWidth options={rbsiOptions} getOptionLabel={(o) => o.periode} value={selectedRbsi}
                      onChange={async (_, v) => { setSelectedRbsi(v); setSelectedProgram(null); setSelectedInisiatif(null); setSelectedYear(null); setProgramOptions([]); setFormData(prev => ({ ...prev, programInisiatifRBSI: '' })); if (v) { try { const r = await getRbsiById(v.id); setProgramOptions(r.data.programs || []); } catch (e) { console.error('Error:', e); } } }}
                      renderInput={(params) => <GlassTextField {...params} label="Pilih RBSI (Periode)" size="small" />} size="small" />
                    <Box>
                      <Box onClick={(e) => { if (selectedRbsi) { setPopoverWidth(e.currentTarget.offsetWidth); setInisiatifPopoverAnchor(e.currentTarget); } }}
                        sx={{ cursor: selectedRbsi ? 'pointer' : 'not-allowed', py: 1.5, px: 1.5, borderRadius: '12px', border: '1px solid rgba(0, 0, 0, 0.08)', bgcolor: selectedRbsi ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.04)', backdropFilter: 'blur(10px)', '&:hover': selectedRbsi ? { bgcolor: 'rgba(255, 255, 255, 0.8)', borderColor: 'rgba(0, 0, 0, 0.2)' } : {}, minHeight: 40, display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: selectedRbsi ? 1 : 0.6 }}>
                        {selectedInisiatif && selectedProgram ? (
                          <Box sx={{ overflow: 'hidden', flex: 1 }}>
                            <Typography sx={{ fontSize: '0.875rem', color: '#1d1d1f', fontWeight: 500, wordWrap: 'break-word', whiteSpace: 'normal' }}>{selectedInisiatif.nomor_inisiatif} - {selectedInisiatif.nama_inisiatif}</Typography>
                            <Typography sx={{ fontSize: '0.7rem', color: '#86868b', wordWrap: 'break-word', whiteSpace: 'normal' }}>{selectedProgram.nomor_program} - {selectedProgram.nama_program}</Typography>
                          </Box>
                        ) : (<Typography sx={{ fontSize: '0.875rem', color: '#86868b' }}>Pilih Program & Inisiatif...</Typography>)}
                        <ExpandMoreIcon sx={{ color: '#86868b', fontSize: '1.2rem' }} />
                      </Box>
                      <Popover open={Boolean(inisiatifPopoverAnchor)} anchorEl={inisiatifPopoverAnchor} onClose={() => setInisiatifPopoverAnchor(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }} transformOrigin={{ vertical: 'top', horizontal: 'left' }} PaperProps={{ sx: { borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', width: popoverWidth || 'auto', maxHeight: 450, mt: 0.5 } }}>
                        <Box sx={{ py: 1 }}>
                          <Box sx={{ px: 2, pb: 1, borderBottom: '1px solid #e0e0e0' }}>
                            <Typography variant="caption" sx={{ color: '#86868b', mb: 0.5, display: 'block', fontWeight: 600 }}>Filter berdasarkan tahun</Typography>
                            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                              <Chip label="Semua" size="small" onClick={() => setSelectedYear(null)} sx={{ bgcolor: selectedYear === null ? '#DA251C' : '#f5f5f5', color: selectedYear === null ? 'white' : '#666', fontSize: '0.7rem', height: 24, '&:hover': { opacity: 0.8 } }} />
                              {periodYears.map(yr => <Chip key={yr} label={yr} size="small" onClick={() => setSelectedYear(yr)} sx={{ bgcolor: selectedYear === yr ? '#DA251C' : '#f5f5f5', color: selectedYear === yr ? 'white' : '#666', fontSize: '0.7rem', height: 24, '&:hover': { opacity: 0.8 } }} />)}
                            </Box>
                          </Box>
                          <Box sx={{ maxHeight: 330, overflow: 'auto' }}>
                            {groupedInisiatifs.length === 0 ? (
                              <Box sx={{ px: 2, py: 3, textAlign: 'center' }}><Typography variant="body2" sx={{ color: '#86868b' }}>{selectedYear ? `Tidak ada inisiatif untuk tahun ${selectedYear}` : 'Tidak ada program & inisiatif'}</Typography></Box>
                            ) : groupedInisiatifs.map(({ program, inisiatifs }) => (
                              <Box key={program.id}>
                                <Box sx={{ px: 2, py: 1, bgcolor: '#f8f8f8', borderBottom: '1px solid #e0e0e0', position: 'sticky', top: 0, zIndex: 1 }}>
                                  <Typography sx={{ fontWeight: 600, fontSize: '0.8rem', color: '#DA251C', wordWrap: 'break-word', whiteSpace: 'normal' }}>{program.nomor_program} - {program.nama_program}</Typography>
                                </Box>
                                {inisiatifs.map(inisiatif => (
                                  <MenuItem key={inisiatif.id} selected={selectedInisiatif?.id === inisiatif.id}
                                    onClick={() => { setSelectedProgram(program); setSelectedInisiatif(inisiatif); setFormData(prev => ({ ...prev, programInisiatifRBSI: `${inisiatif.nomor_inisiatif} - ${inisiatif.nama_inisiatif} (${program.nomor_program})` })); setInisiatifPopoverAnchor(null); }}
                                    sx={{ fontSize: '0.85rem', py: 1.5, px: 2, pl: 3, borderLeft: '3px solid transparent', '&.Mui-selected': { borderLeftColor: '#DA251C', bgcolor: 'rgba(218, 37, 28, 0.08)' }, '&:hover': { borderLeftColor: '#DA251C' } }}>
                                    <Box>
                                      <Typography sx={{ fontWeight: 500, fontSize: '0.85rem', wordWrap: 'break-word', whiteSpace: 'normal' }}>{inisiatif.nomor_inisiatif} - {inisiatif.nama_inisiatif}</Typography>
                                      <Typography sx={{ fontSize: '0.7rem', color: '#86868b' }}>Tahun {inisiatif.tahun}</Typography>
                                    </Box>
                                  </MenuItem>
                                ))}
                              </Box>
                            ))}
                          </Box>
                        </Box>
                      </Popover>
                    </Box>
                  </Stack>
                </Box>
                <GlassTextField fullWidth label="Tanggal Pengajuan" name="tanggalPengajuan" type="date" value={formData.tanggalPengajuan} onChange={handleInputChange} InputLabelProps={{ shrink: true }} size="small" />
              </Stack>
            </Box>

            {/* Usulan Jadwal Pelaksanaan */}
            <Accordion expanded={expandedSection === 'jadwal'} onChange={handleAccordionChange('jadwal')} sx={{ mt: expandedSection === 'jadwal' ? 1 : 0, borderRadius: '16px !important', bgcolor: 'rgba(255, 255, 255, 0.72)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', boxShadow: '0 4px 30px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.6)', '&::before': { display: 'none' }, '&.Mui-expanded': { margin: 0 } }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#86868b' }} />} sx={{ borderRadius: '16px', '&.Mui-expanded': { minHeight: 48 } }}>
                <Typography sx={{ fontWeight: 600, color: '#1d1d1f', fontSize: '0.9rem', letterSpacing: '-0.01em' }}>Usulan Jadwal Pelaksanaan</Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 1.5, pb: 2, px: 2 }}>
                {/* Stage Selector for Dynamic Timeline */}
                <StageSelector 
                  selectedStages={selectedStages}
                  onStagesChange={setSelectedStages}
                />

                {TIMELINE_CONFIGS
                  .filter(config => 
                    selectedStages.has(config.key) && 
                    (formData.jenisPksi !== 'Mendesak' || config.key !== 'sit')
                  )
                  .map((config) => (
                    <TimelineStage
                      key={config.key}
                      label={config.label}
                      stages={timelinePhases[config.key]}
                      gradient={config.gradient}
                      rgb={config.rgb}
                      onChange={(phaseIndex, value) => handleTimelineChange(config.key, phaseIndex, value)}
                      onAddPhase={() => handleAddPhase(config.key)}
                      onRemovePhase={(phaseIndex) => handleRemovePhase(config.key, phaseIndex)}
                      onRemoveStage={() => {
                        const newSelected = new Set(selectedStages);
                        newSelected.delete(config.key);
                        setSelectedStages(newSelected);
                      }}
                    />
                  ))}
              </AccordionDetails>
            </Accordion>

            {/* Upload Dokumen */}
            <Accordion expanded={expandedSection === 'upload'} onChange={handleAccordionChange('upload')} sx={{ borderRadius: '20px !important', bgcolor: 'rgba(255, 255, 255, 0.6)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.8)', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.8)', '&::before': { display: 'none' }, '&.Mui-expanded': { margin: '0 !important' }, transition: 'all 0.3s ease', '&:hover': { boxShadow: '0 12px 40px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.9)' } }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#86868b' }} />} sx={{ borderRadius: '20px', px: 2.5, '&.Mui-expanded': { minHeight: 56 }, '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.01)' } }}>
                <Typography sx={{ fontWeight: 600, color: '#1d1d1f', fontSize: '0.95rem', letterSpacing: '-0.01em' }}>Upload Dokumen T.01 & Nota Dinas</Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 2.5, pb: 2.5 }}>
                <Stack spacing={3}>
                  {errorMessage && <Typography color="error" variant="body2">{errorMessage}</Typography>}
                  {renderFileSection('Rencana PKSI (T01/T02)', 'T01', filesT01, isUploadingT01, handleFileUploadT01, 'edit-pksi-file-upload-t01', '#DA251C')}
                  {renderFileSection('Spesifikasi Kebutuhan (T11)', 'T11', filesT11, isUploadingT11, handleFileUploadT11, 'edit-pksi-file-upload-t11', '#0891B2')}
                </Stack>
              </AccordionDetails>
            </Accordion>
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid rgba(0, 0, 0, 0.06)', bgcolor: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
        <Button variant="outlined" onClick={handleClose} disabled={isSubmitting} sx={{ borderColor: 'rgba(0, 0, 0, 0.12)', color: '#86868b', borderRadius: 2, px: 3, fontWeight: 500, '&:hover': { borderColor: 'rgba(0, 0, 0, 0.24)', bgcolor: 'rgba(0, 0, 0, 0.02)' } }}>Batal</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={isSubmitting || isLoadingData} sx={{ background: 'linear-gradient(135deg, #DA251C 0%, #FF4D45 100%)', fontWeight: 500, borderRadius: 2, px: 3, boxShadow: '0 4px 14px rgba(218, 37, 28, 0.25)', '&:hover': { background: 'linear-gradient(135deg, #B91C14 0%, #D83A32 100%)', boxShadow: '0 6px 20px rgba(218, 37, 28, 0.35)' }, '&.Mui-disabled': { background: '#e5e5e7' } }}>
          {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
        </Button>
      </DialogActions>
      <FilePreviewModal open={previewOpen} onClose={handlePreviewClose} fileId={previewFile?.id || null} fileName={previewFile?.original_name || ''} contentType={previewFile?.content_type || ''} onDownload={handlePreviewDownload} downloadUrl={previewFile ? `/api/pksi/files/download/${previewFile.id}` : undefined} />
    </Dialog>
  );
};

export default EditPksiModal;
