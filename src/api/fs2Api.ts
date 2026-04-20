import { apiRequest } from './apiClient';
import { getAuthToken } from './authApi';

const BASE_URL = '/api';

// ==================== RESPONSE TYPES ====================

export interface Fs2TimelineData {
  phase: number;
  target_date: string;
  stage: string;
}

export interface Fs2DocumentData {
  id: string;
  user_id: string;
  user_name: string;
  aplikasi_id?: string;
  nama_aplikasi?: string;
  kode_aplikasi?: string;
  nama_fs2?: string;
  tanggal_pengajuan?: string;
  bidang_id?: string;
  nama_bidang?: string;
  skpa_id?: string;
  nama_skpa?: string;
  kode_skpa?: string;
  // PKSI Reference (for Desain status)
  pksi_id?: string;
  pksi_nama?: string;
  status: string;
  
  // Form fields from requirement point 6
  deskripsi_pengubahan?: string;
  alasan_pengubahan?: string;
  status_tahapan?: string; // DESAIN, PEMELIHARAAN
  urgensi?: string; // RENDAH, SEDANG, TINGGI
  
  // Kesesuaian Kriteria (4 checkboxes)
  kriteria_1?: boolean;
  kriteria_2?: boolean;
  kriteria_3?: boolean;
  kriteria_4?: boolean;
  
  // Aspek Perubahan
  aspek_sistem_ada?: string;
  aspek_sistem_terkait?: string;
  aspek_alur_kerja?: string;
  aspek_struktur_organisasi?: string;
  
  // Dokumentasi
  dok_t01_sebelum?: string;
  dok_t01_sesudah?: string;
  dok_t11_sebelum?: string;
  dok_t11_sesudah?: string;
  
  // Penggunaan Sistem
  pengguna_sebelum?: string;
  pengguna_sesudah?: string;
  akses_bersamaan_sebelum?: string;
  akses_bersamaan_sesudah?: string;
  pertumbuhan_data_sebelum?: string;
  pertumbuhan_data_sesudah?: string;
  
  // Jadwal Pelaksanaan
  target_pemrograman?: string;
  target_pengujian?: string;
  target_deployment?: string;
  target_go_live?: string;
  
  // Pernyataan
  pernyataan_1?: boolean;
  pernyataan_2?: boolean;
  
  // Fields for F.S.2 Disetujui
  progres?: string;
  progres_status?: string;
  tanggal_progres?: string;
  fase_pengajuan?: string;
  iku?: string;
  mekanisme?: string;
  pelaksanaan?: string;
  tahun?: number;
  tahun_mulai?: number;
  tahun_selesai?: number;
  pic_id?: string;
  pic_name?: string;
  // Team Structure
  team_id?: string;
  team_name?: string;
  anggota_tim?: string;
  anggota_tim_names?: string;
  dokumen_path?: string;
  
  // Monitoring Fields - Dokumen Pengajuan F.S.2
  nomor_nd?: string;
  tanggal_nd?: string;
  berkas_nd?: string;
  berkas_fs2?: string;
  tanggal_berkas_fs2?: string;
  
  // Monitoring Fields - CD Prinsip
  nomor_cd?: string;
  tanggal_cd?: string;
  berkas_cd?: string;
  berkas_fs2a?: string;
  tanggal_berkas_fs2a?: string;
  berkas_fs2b?: string;
  tanggal_berkas_fs2b?: string;
  
  // Monitoring Fields - Pengujian
  realisasi_pengujian?: string;
  berkas_f45?: string;
  tanggal_berkas_f45?: string;
  berkas_f46?: string;
  tanggal_berkas_f46?: string;
  
  // Monitoring Fields - Deployment
  realisasi_deployment?: string;
  berkas_nd_ba_deployment?: string;
  tanggal_berkas_nd_ba?: string;
  
  // Monitoring Fields - Keterangan
  keterangan?: string;
  
  // Tahapan Status & Tanggal fields
  tahapan_status_pengajuan?: string;
  tanggal_pengajuan_selesai?: string;
  tahapan_status_asesmen?: string;
  tanggal_asesmen?: string;
  tahapan_status_pemrograman?: string;
  tanggal_pemrograman?: string;
  tahapan_status_pengujian?: string;
  tanggal_pengujian_selesai?: string;
  tahapan_status_deployment?: string;
  tanggal_deployment_selesai?: string;
  tahapan_status_go_live?: string;
  tanggal_go_live?: string;
  
  // Timelines for Progres Tahapan tracking
  timelines?: Fs2TimelineData[];
  
  created_at?: string;
  updated_at?: string;
}

export interface Fs2SearchResponse {
  content: Fs2DocumentData[];
  total_elements: number;
  total_pages: number;
  page: number;
  size: number;
  has_next: boolean;
  has_previous: boolean;
}

// ==================== REQUEST TYPES ====================

export interface Fs2DocumentRequest {
  aplikasi_id?: string;
  nama_fs2?: string;
  tanggal_pengajuan?: string;
  bidang_id?: string;
  skpa_id?: string;
  status?: string;
  
  // Form fields from requirement point 6
  deskripsi_pengubahan?: string;
  alasan_pengubahan?: string;
  status_tahapan?: string; // DESAIN, PEMELIHARAAN
  urgensi?: string; // RENDAH, SEDANG, TINGGI
  
  // Kesesuaian Kriteria (4 checkboxes)
  kriteria_1?: boolean;
  kriteria_2?: boolean;
  kriteria_3?: boolean;
  kriteria_4?: boolean;
  
  // Aspek Perubahan
  aspek_sistem_ada?: string;
  aspek_sistem_terkait?: string;
  aspek_alur_kerja?: string;
  aspek_struktur_organisasi?: string;
  
  // Dokumentasi
  dok_t01_sebelum?: string;
  dok_t01_sesudah?: string;
  dok_t11_sebelum?: string;
  dok_t11_sesudah?: string;
  
  // Penggunaan Sistem
  pengguna_sebelum?: string;
  pengguna_sesudah?: string;
  akses_bersamaan_sebelum?: string;
  akses_bersamaan_sesudah?: string;
  pertumbuhan_data_sebelum?: string;
  pertumbuhan_data_sesudah?: string;
  
  // Jadwal Pelaksanaan
  target_pemrograman?: string;
  target_pengujian?: string;
  target_deployment?: string;
  target_go_live?: string;
  
  // Pernyataan
  pernyataan_1?: boolean;
  pernyataan_2?: boolean;
  
  // Fields for F.S.2 Disetujui
  progres?: string;
  progres_status?: string;
  tanggal_progres?: string;
  fase_pengajuan?: string;
  iku?: string;
  mekanisme?: string;
  pelaksanaan?: string;
  tahun?: number;
  tahun_mulai?: number;
  tahun_selesai?: number;
  pic_id?: string;
  // Team Structure
  team_id?: string;
  anggota_tim?: string;
  anggota_tim_names?: string;
  dokumen_path?: string;
  
  // PKSI Reference (for Desain status)
  pksi_id?: string;
  
  // Monitoring Fields - Dokumen Pengajuan F.S.2
  nomor_nd?: string;
  tanggal_nd?: string;
  berkas_nd?: string;
  berkas_fs2?: string;
  tanggal_berkas_fs2?: string;
  
  // Monitoring Fields - CD Prinsip
  nomor_cd?: string;
  tanggal_cd?: string;
  berkas_cd?: string;
  berkas_fs2a?: string;
  tanggal_berkas_fs2a?: string;
  berkas_fs2b?: string;
  tanggal_berkas_fs2b?: string;
  
  // Monitoring Fields - Pengujian
  realisasi_pengujian?: string;
  berkas_f45?: string;
  tanggal_berkas_f45?: string;
  berkas_f46?: string;
  tanggal_berkas_f46?: string;
  
  // Monitoring Fields - Deployment
  realisasi_deployment?: string;
  berkas_nd_ba_deployment?: string;
  tanggal_berkas_nd_ba?: string;
  
  // Monitoring Fields - Keterangan
  keterangan?: string;
  
  // Tahapan Status & Tanggal fields
  tahapan_status_pengajuan?: string;
  tanggal_pengajuan_selesai?: string;
  tahapan_status_asesmen?: string;
  tanggal_asesmen?: string;
  tahapan_status_pemrograman?: string;
  tanggal_pemrograman?: string;
  tahapan_status_pengujian?: string;
  tanggal_pengujian_selesai?: string;
  tahapan_status_deployment?: string;
  tanggal_deployment_selesai?: string;
  tahapan_status_go_live?: string;
  tanggal_go_live?: string;
}

// ==================== API FUNCTIONS ====================

/**
 * Create a new F.S.2 document
 */
export async function createFs2Document(request: Fs2DocumentRequest): Promise<Fs2DocumentData> {
  const response = await apiRequest<Fs2DocumentData>(
    `${BASE_URL}/fs2`,
    'POST',
    request
  );
  return response.data;
}

/**
 * Get all F.S.2 documents
 */
export async function getAllFs2Documents(): Promise<Fs2DocumentData[]> {
  const response = await apiRequest<Fs2DocumentData[]>(`${BASE_URL}/fs2`);
  return response.data;
}

/**
 * Get F.S.2 document by ID
 */
export async function getFs2DocumentById(id: string): Promise<Fs2DocumentData> {
  const response = await apiRequest<Fs2DocumentData>(`${BASE_URL}/fs2/${id}`);
  return response.data;
}

/**
 * Search F.S.2 documents with pagination
 */
export async function searchFs2Documents(params: {
  search?: string;
  aplikasi_id?: string;
  status_tahapan?: string;
  skpa_id?: string;
  status?: string;
  year?: number;
  start_month?: number;
  end_month?: number;
  page?: number;
  size?: number;
}): Promise<Fs2SearchResponse> {
  const queryParams = new URLSearchParams();
  if (params.search) queryParams.append('search', params.search);
  if (params.aplikasi_id) queryParams.append('aplikasi_id', params.aplikasi_id);
  if (params.status_tahapan) queryParams.append('status_tahapan', params.status_tahapan);
  if (params.skpa_id) queryParams.append('skpa_id', params.skpa_id);
  if (params.status) queryParams.append('status', params.status);
  if (params.year !== undefined) queryParams.append('year', params.year.toString());
  if (params.start_month !== undefined) queryParams.append('start_month', params.start_month.toString());
  if (params.end_month !== undefined) queryParams.append('end_month', params.end_month.toString());
  if (params.page !== undefined) queryParams.append('page', params.page.toString());
  if (params.size !== undefined) queryParams.append('size', params.size.toString());

  const response = await apiRequest<Fs2SearchResponse>(
    `${BASE_URL}/fs2/search?${queryParams.toString()}`
  );
  return response.data;
}

/**
 * Search approved F.S.2 documents with pagination
 */
export async function searchApprovedFs2Documents(params: {
  search?: string;
  bidang_id?: string;
  skpa_id?: string;
  progres?: string;
  progres_status?: string;
  fase_pengajuan?: string;
  mekanisme?: string;
  pelaksanaan?: string;
  year?: number;
  start_month?: number;
  end_month?: number;
  page?: number;
  size?: number;
}): Promise<Fs2SearchResponse> {
  const queryParams = new URLSearchParams();
  if (params.search) queryParams.append('search', params.search);
  if (params.bidang_id) queryParams.append('bidang_id', params.bidang_id);
  if (params.skpa_id) queryParams.append('skpa_id', params.skpa_id);
  if (params.progres) queryParams.append('progres', params.progres);
  if (params.progres_status) queryParams.append('progres_status', params.progres_status);
  if (params.fase_pengajuan) queryParams.append('fase_pengajuan', params.fase_pengajuan);
  if (params.mekanisme) queryParams.append('mekanisme', params.mekanisme);
  if (params.pelaksanaan) queryParams.append('pelaksanaan', params.pelaksanaan);
  if (params.year !== undefined) queryParams.append('year', params.year.toString());
  if (params.start_month !== undefined) queryParams.append('start_month', params.start_month.toString());
  if (params.end_month !== undefined) queryParams.append('end_month', params.end_month.toString());
  if (params.page !== undefined) queryParams.append('page', params.page.toString());
  if (params.size !== undefined) queryParams.append('size', params.size.toString());

  const response = await apiRequest<Fs2SearchResponse>(
    `${BASE_URL}/fs2/search/approved?${queryParams.toString()}`
  );
  return response.data;
}

/**
 * Update F.S.2 document
 */
export async function updateFs2Document(id: string, request: Fs2DocumentRequest): Promise<Fs2DocumentData> {
  const response = await apiRequest<Fs2DocumentData>(
    `${BASE_URL}/fs2/${id}`,
    'PUT',
    request
  );
  return response.data;
}

/**
 * Update F.S.2 document status
 */
export async function updateFs2Status(
  id: string, 
  status: string
): Promise<Fs2DocumentData> {
  const response = await apiRequest<Fs2DocumentData>(
    `${BASE_URL}/fs2/${id}/status?status=${status}`,
    'PATCH'
  );
  return response.data;
}

/**
 * Delete F.S.2 document
 */
export async function deleteFs2Document(id: string): Promise<void> {
  await apiRequest<void>(`${BASE_URL}/fs2/${id}`, 'DELETE');
}

// ==================== CHANGELOG TYPES ====================

export interface Fs2ChangelogEntry {
  id: string;
  field_name: string;
  field_label: string;
  old_value: string | null;
  new_value: string | null;
  updated_by: string;
  updated_by_name: string;
  updated_at: string;
}

export interface Fs2ChangelogsResponse {
  changelogs: Fs2ChangelogEntry[];
}

/**
 * Get changelogs for an F.S.2 document
 */
export async function getFs2Changelogs(fs2Id: string): Promise<Fs2ChangelogsResponse> {
  const response = await apiRequest<Fs2ChangelogEntry[]>(
    `${BASE_URL}/fs2/${fs2Id}/changelogs`
  );
  return { changelogs: response.data };
}

/**
 * Download all F.S.2 documents as Excel file
 */
export async function downloadAllFs2Excel(params?: {
  search?: string;
  aplikasi_id?: string;
  status_tahapan?: string;
  skpa_id?: string;
  status?: string;
  year?: number;
  start_month?: number;
  end_month?: number;
}): Promise<void> {
  const token = getAuthToken();
  const API_KEY = 'da39b92f-a1b8-46d5-a10c-d08b1cc92218';
  
  // Build query string
  const queryParams = new URLSearchParams();
  if (params?.search) queryParams.append('search', params.search);
  if (params?.aplikasi_id) queryParams.append('aplikasi_id', params.aplikasi_id);
  if (params?.status_tahapan) queryParams.append('status_tahapan', params.status_tahapan);
  if (params?.skpa_id) queryParams.append('skpa_id', params.skpa_id);
  if (params?.status) queryParams.append('status', params.status);
  if (params?.year) queryParams.append('year', params.year.toString());
  if (params?.start_month) queryParams.append('start_month', params.start_month.toString());
  if (params?.end_month) queryParams.append('end_month', params.end_month.toString());
  
  const queryString = queryParams.toString();
  const url = `${BASE_URL}/fs2/export${queryString ? `?${queryString}` : ''}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'APIKey': API_KEY,
      'Authorization': `Bearer ${token}`,
    },
  });

  if (response.status === 401) {
    throw new Error('Sesi telah berakhir. Silakan login kembali.');
  }

  if (!response.ok) {
    let errorMessage = 'Gagal mengunduh file Excel';
    try {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      }
    } catch {
      // Ignore JSON parse error, use default message
    }
    throw new Error(errorMessage);
  }

  // Verify response is actually a file (not JSON error)
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Gagal mengunduh file Excel');
  }

  // Get filename from Content-Disposition header or use default
  const contentDisposition = response.headers.get('Content-Disposition');
  let filename = `Semua_FS2_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.xlsx`;
  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
    if (filenameMatch && filenameMatch[1]) {
      filename = filenameMatch[1].replace(/['"]/g, '');
    }
  }

  // Create blob and trigger download
  const blob = await response.blob();
  const urlBlob = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = urlBlob;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(urlBlob);
}

/**
 * Download approved F.S.2 documents (Monitoring) as Excel file
 */
export async function downloadApprovedFs2Excel(params?: {
  search?: string;
  bidang_id?: string;
  skpa_id?: string;
  progres?: string;
  progres_status?: string;
  fase_pengajuan?: string;
  mekanisme?: string;
  pelaksanaan?: string;
  year?: number;
  start_month?: number;
  end_month?: number;
}): Promise<void> {
  const token = getAuthToken();
  const API_KEY = 'da39b92f-a1b8-46d5-a10c-d08b1cc92218';
  
  // Build query string
  const queryParams = new URLSearchParams();
  if (params?.search) queryParams.append('search', params.search);
  if (params?.bidang_id) queryParams.append('bidang_id', params.bidang_id);
  if (params?.skpa_id) queryParams.append('skpa_id', params.skpa_id);
  if (params?.progres) queryParams.append('progres', params.progres);
  if (params?.progres_status) queryParams.append('progres_status', params.progres_status);
  if (params?.fase_pengajuan) queryParams.append('fase_pengajuan', params.fase_pengajuan);
  if (params?.mekanisme) queryParams.append('mekanisme', params.mekanisme);
  if (params?.pelaksanaan) queryParams.append('pelaksanaan', params.pelaksanaan);
  if (params?.year) queryParams.append('year', params.year.toString());
  if (params?.start_month) queryParams.append('start_month', params.start_month.toString());
  if (params?.end_month) queryParams.append('end_month', params.end_month.toString());
  
  const queryString = queryParams.toString();
  const url = `${BASE_URL}/fs2/approved/export${queryString ? `?${queryString}` : ''}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'APIKey': API_KEY,
      'Authorization': `Bearer ${token}`,
    },
  });

  if (response.status === 401) {
    throw new Error('Sesi telah berakhir. Silakan login kembali.');
  }

  if (!response.ok) {
    let errorMessage = 'Gagal mengunduh file Excel';
    try {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      }
    } catch {
      // Ignore JSON parse error, use default message
    }
    throw new Error(errorMessage);
  }

  // Verify response is actually a file (not JSON error)
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Gagal mengunduh file Excel');
  }

  // Get filename from Content-Disposition header or use default
  const contentDisposition = response.headers.get('Content-Disposition');
  let filename = `Monitoring_FS2_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.xlsx`;
  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
    if (filenameMatch && filenameMatch[1]) {
      filename = filenameMatch[1].replace(/['"]/g, '');
    }
  }

  // Create blob and trigger download
  const blob = await response.blob();
  const urlBlob = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = urlBlob;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(urlBlob);
}
