import { apiRequest } from './apiClient';

const BASE_URL = '/api';

// ==================== RESPONSE TYPES ====================

export interface PksiDocumentData {
  id: string;
  user_id: string;
  user_name: string;
  // Header
  aplikasi_id?: string;
  nama_aplikasi?: string;
  kode_aplikasi?: string;
  nama_pksi: string;
  tanggal_pengajuan?: string;
  // Section 1
  deskripsi_pksi?: string;
  mengapa_pksi_diperlukan?: string;
  kapan_harus_diselesaikan?: string;
  pic_satker_ba?: string;
  // Section 2
  kegunaan_pksi?: string;
  tujuan_pksi?: string;
  target_pksi?: string;
  // Section 3
  ruang_lingkup?: string;
  batasan_pksi?: string;
  hubungan_sistem_lain?: string;
  asumsi?: string;
  // Section 4
  batasan_desain?: string;
  risiko_bisnis?: string;
  risiko_sukses_pksi?: string;
  pengendalian_risiko?: string;
  // Section 5
  pengelola_aplikasi?: string;
  pengguna_aplikasi?: string;
  program_inisiatif_rbsi?: string;
  fungsi_aplikasi?: string;
  informasi_yang_dikelola?: string;
  dasar_peraturan?: string;
  // Section 6
  tahap1_awal?: string;
  tahap1_akhir?: string;
  tahap5_awal?: string;
  tahap5_akhir?: string;
  tahap7_awal?: string;
  tahap7_akhir?: string;
  // Section 7
  rencana_pengelolaan?: string;
  // Status & Metadata
  status: string;
  created_at?: string;
  updated_at?: string;
  // Approval fields (set when status = DISETUJUI)
  iku?: string;
  inhouse_outsource?: string;
  pic_approval?: string;
  anggota_tim?: string;
  // Legacy
  tujuan_pengajuan?: string;
  kapan_diselesaikan?: string;
  pic_satker?: string;
}

export interface PksiSearchResponse {
  content: PksiDocumentData[];
  total_elements: number;
  total_pages: number;
  page: number;
  size: number;
  has_next: boolean;
  has_previous: boolean;
}

// ==================== REQUEST TYPES ====================

export interface PksiDocumentRequest {
  aplikasi_id?: string;
  nama_pksi: string;
  tanggal_pengajuan?: string;
  // Section 1
  deskripsi_pksi: string;
  mengapa_pksi_diperlukan: string;
  kapan_harus_diselesaikan?: string;
  pic_satker_ba: string;
  // Section 2
  kegunaan_pksi: string;
  tujuan_pksi: string;
  target_pksi?: string;
  // Section 3
  ruang_lingkup?: string;
  batasan_pksi?: string;
  hubungan_sistem_lain?: string;
  asumsi?: string;
  // Section 4
  batasan_desain?: string;
  risiko_bisnis?: string;
  risiko_sukses_pksi?: string;
  pengendalian_risiko?: string;
  // Section 5
  pengelola_aplikasi: string;
  pengguna_aplikasi?: string;
  program_inisiatif_rbsi?: string;
  fungsi_aplikasi: string;
  informasi_yang_dikelola?: string;
  dasar_peraturan?: string;
  // Section 6
  tahap1_awal?: string;
  tahap1_akhir?: string;
  tahap5_awal?: string;
  tahap5_akhir?: string;
  tahap7_awal?: string;
  tahap7_akhir?: string;
  // Section 7
  rencana_pengelolaan?: string;
  // User ID (optional - backend extracts from JWT token)
  user_id?: string;
}

export interface UpdateStatusRequest {
  status: 'PENDING' | 'DISETUJUI' | 'DITOLAK' | 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'REVISION';
  // Approval fields (required when status = DISETUJUI)
  iku?: string;
  inhouse_outsource?: string;
  pic_approval?: string;
  anggota_tim?: string;
}

// ==================== PKSI API ====================

/**
 * Create a new PKSI document
 */
export async function createPksiDocument(data: PksiDocumentRequest): Promise<PksiDocumentData> {
  const response = await apiRequest<PksiDocumentData>(`${BASE_URL}/pksi`, 'POST', data);
  return response.data;
}

/**
 * Get all PKSI documents
 */
export async function getAllPksiDocuments(): Promise<PksiDocumentData[]> {
  const response = await apiRequest<PksiDocumentData[]>(`${BASE_URL}/pksi`, 'GET');
  return response.data || [];
}

/**
 * Search PKSI documents with pagination
 */
export async function searchPksiDocuments(params: {
  search?: string;
  status?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}): Promise<PksiSearchResponse> {
  const queryParams = new URLSearchParams();
  
  if (params.search) queryParams.append('search', params.search);
  if (params.status) queryParams.append('status', params.status);
  if (params.page !== undefined) queryParams.append('page', params.page.toString());
  if (params.size !== undefined) queryParams.append('size', params.size.toString());
  if (params.sortBy) queryParams.append('sortBy', params.sortBy);
  if (params.sortDir) queryParams.append('sortDir', params.sortDir);

  const response = await apiRequest<PksiSearchResponse>(
    `${BASE_URL}/pksi/search?${queryParams.toString()}`,
    'GET'
  );
  return response.data;
}

/**
 * Get PKSI document by ID
 */
export async function getPksiDocumentById(id: string): Promise<PksiDocumentData> {
  const response = await apiRequest<PksiDocumentData>(`${BASE_URL}/pksi/${id}`, 'GET');
  return response.data;
}

/**
 * Get PKSI documents by user ID
 */
export async function getPksiDocumentsByUser(userId: string): Promise<PksiDocumentData[]> {
  const response = await apiRequest<PksiDocumentData[]>(`${BASE_URL}/pksi/user/${userId}`, 'GET');
  return response.data || [];
}

/**
 * Update PKSI document
 */
export async function updatePksiDocument(id: string, data: PksiDocumentRequest): Promise<PksiDocumentData> {
  const response = await apiRequest<PksiDocumentData>(`${BASE_URL}/pksi/${id}`, 'PUT', data);
  return response.data;
}

/**
 * Update PKSI document status
 */
export async function updatePksiStatus(
  id: string, 
  status: UpdateStatusRequest['status'],
  approvalData?: {
    iku?: string;
    inhouse_outsource?: string;
    pic_approval?: string;
    anggota_tim?: string;
  }
): Promise<PksiDocumentData> {
  const payload: UpdateStatusRequest = { status, ...approvalData };
  const response = await apiRequest<PksiDocumentData>(`${BASE_URL}/pksi/${id}/status`, 'PATCH', payload);
  return response.data;
}

/**
 * Delete PKSI document
 */
export async function deletePksiDocument(id: string): Promise<void> {
  await apiRequest<null>(`${BASE_URL}/pksi/${id}`, 'DELETE');
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Convert frontend form data to API request format
 */
export function formDataToRequest(formData: {
  namaPksi: string;
  tanggalPengajuan?: string;
  deskripsiPksi: string;
  mengapaPksiDiperlukan: string;
  kapanHarusDiselesaikan?: string;
  picSatkerBA: string;
  kegunaanPksi: string;
  tujuanPksi: string;
  targetPksi?: string;
  ruangLingkup?: string;
  batasanPksi?: string;
  hubunganSistemLain?: string;
  asumsi?: string;
  batasanDesain?: string;
  riskoBisnis?: string;
  risikoSuksesPksi?: string;
  pengendalianRisiko?: string;
  pengelolaAplikasi: string;
  penggunaAplikasi?: string;
  programInisiatifRBSI?: string;
  fungsiAplikasi: string;
  informasiYangDikelola?: string;
  dasarPeraturan?: string;
  tahap1Awal?: string;
  tahap1Akhir?: string;
  tahap5Awal?: string;
  tahap5Akhir?: string;
  tahap7Awal?: string;
  tahap7Akhir?: string;
  rencanaPengelolaan?: string;
}, userId: string): PksiDocumentRequest {
  return {
    nama_pksi: formData.namaPksi,
    tanggal_pengajuan: formData.tanggalPengajuan,
    deskripsi_pksi: formData.deskripsiPksi,
    mengapa_pksi_diperlukan: formData.mengapaPksiDiperlukan,
    kapan_harus_diselesaikan: formData.kapanHarusDiselesaikan,
    pic_satker_ba: formData.picSatkerBA,
    kegunaan_pksi: formData.kegunaanPksi,
    tujuan_pksi: formData.tujuanPksi,
    target_pksi: formData.targetPksi,
    ruang_lingkup: formData.ruangLingkup,
    batasan_pksi: formData.batasanPksi,
    hubungan_sistem_lain: formData.hubunganSistemLain,
    asumsi: formData.asumsi,
    batasan_desain: formData.batasanDesain,
    risiko_bisnis: formData.riskoBisnis,
    risiko_sukses_pksi: formData.risikoSuksesPksi,
    pengendalian_risiko: formData.pengendalianRisiko,
    pengelola_aplikasi: formData.pengelolaAplikasi,
    pengguna_aplikasi: formData.penggunaAplikasi,
    program_inisiatif_rbsi: formData.programInisiatifRBSI,
    fungsi_aplikasi: formData.fungsiAplikasi,
    informasi_yang_dikelola: formData.informasiYangDikelola,
    dasar_peraturan: formData.dasarPeraturan,
    tahap1_awal: formData.tahap1Awal,
    tahap1_akhir: formData.tahap1Akhir,
    tahap5_awal: formData.tahap5Awal,
    tahap5_akhir: formData.tahap5Akhir,
    tahap7_awal: formData.tahap7Awal,
    tahap7_akhir: formData.tahap7Akhir,
    rencana_pengelolaan: formData.rencanaPengelolaan,
    user_id: userId,
  };
}

/**
 * Convert API response data to frontend form format
 */
export function responseToFormData(data: PksiDocumentData): {
  namaPksi: string;
  tanggalPengajuan: string;
  deskripsiPksi: string;
  mengapaPksiDiperlukan: string;
  kapanHarusDiselesaikan: string;
  picSatkerBA: string;
  kegunaanPksi: string;
  tujuanPksi: string;
  targetPksi: string;
  ruangLingkup: string;
  batasanPksi: string;
  hubunganSistemLain: string;
  asumsi: string;
  batasanDesain: string;
  riskoBisnis: string;
  risikoSuksesPksi: string;
  pengendalianRisiko: string;
  pengelolaAplikasi: string;
  penggunaAplikasi: string;
  programInisiatifRBSI: string;
  fungsiAplikasi: string;
  informasiYangDikelola: string;
  dasarPeraturan: string;
  tahap1Awal: string;
  tahap1Akhir: string;
  tahap5Awal: string;
  tahap5Akhir: string;
  tahap7Awal: string;
  tahap7Akhir: string;
  rencanaPengelolaan: string;
} {
  return {
    namaPksi: data.nama_pksi || '',
    tanggalPengajuan: data.tanggal_pengajuan || '',
    deskripsiPksi: data.deskripsi_pksi || '',
    mengapaPksiDiperlukan: data.mengapa_pksi_diperlukan || '',
    kapanHarusDiselesaikan: data.kapan_harus_diselesaikan || data.kapan_diselesaikan || '',
    picSatkerBA: data.pic_satker_ba || data.pic_satker || '',
    kegunaanPksi: data.kegunaan_pksi || '',
    tujuanPksi: data.tujuan_pksi || '',
    targetPksi: data.target_pksi || '',
    ruangLingkup: data.ruang_lingkup || '',
    batasanPksi: data.batasan_pksi || '',
    hubunganSistemLain: data.hubungan_sistem_lain || '',
    asumsi: data.asumsi || '',
    batasanDesain: data.batasan_desain || '',
    riskoBisnis: data.risiko_bisnis || '',
    risikoSuksesPksi: data.risiko_sukses_pksi || '',
    pengendalianRisiko: data.pengendalian_risiko || '',
    pengelolaAplikasi: data.pengelola_aplikasi || '',
    penggunaAplikasi: data.pengguna_aplikasi || '',
    programInisiatifRBSI: data.program_inisiatif_rbsi || '',
    fungsiAplikasi: data.fungsi_aplikasi || '',
    informasiYangDikelola: data.informasi_yang_dikelola || '',
    dasarPeraturan: data.dasar_peraturan || '',
    tahap1Awal: data.tahap1_awal || '',
    tahap1Akhir: data.tahap1_akhir || '',
    tahap5Awal: data.tahap5_awal || '',
    tahap5Akhir: data.tahap5_akhir || '',
    tahap7Awal: data.tahap7_awal || '',
    tahap7Akhir: data.tahap7_akhir || '',
    rencanaPengelolaan: data.rencana_pengelolaan || '',
  };
}

/**
 * Get status display label
 */
export function getStatusLabel(status: string): string {
  const statusMap: Record<string, string> = {
    'PENDING': 'Menunggu',
    'DISETUJUI': 'Disetujui',
    'DITOLAK': 'Ditolak',
    'DRAFT': 'Draft',
    'SUBMITTED': 'Diajukan',
    'APPROVED': 'Disetujui',
    'REJECTED': 'Ditolak',
    'REVISION': 'Revisi',
  };
  return statusMap[status] || status;
}

/**
 * Get status color for UI
 */
export function getStatusColor(status: string): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' {
  const colorMap: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
    'PENDING': 'warning',
    'DISETUJUI': 'success',
    'DITOLAK': 'error',
    'DRAFT': 'default',
    'SUBMITTED': 'info',
    'APPROVED': 'success',
    'REJECTED': 'error',
    'REVISION': 'warning',
  };
  return colorMap[status] || 'default';
}
