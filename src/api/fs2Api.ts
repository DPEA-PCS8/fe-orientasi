import { apiRequest } from './apiClient';

const BASE_URL = '/api';

// ==================== RESPONSE TYPES ====================

export interface Fs2DocumentData {
  id: string;
  user_id: string;
  user_name: string;
  aplikasi_id?: string;
  nama_aplikasi?: string;
  kode_aplikasi?: string;
  nama_fs2: string;
  tanggal_pengajuan?: string;
  bidang_id?: string;
  nama_bidang?: string;
  skpa_id?: string;
  nama_skpa?: string;
  kode_skpa?: string;
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
  target_pengujian?: string;
  target_deployment?: string;
  target_go_live?: string;
  
  // Pernyataan
  pernyataan_1?: boolean;
  pernyataan_2?: boolean;
  
  // Fields for F.S.2 Disetujui
  progres?: string;
  fase_pengajuan?: string;
  iku?: string;
  mekanisme?: string;
  pelaksanaan?: string;
  tahun?: number;
  tahun_mulai?: number;
  tahun_selesai?: number;
  pic_id?: string;
  pic_name?: string;
  dokumen_path?: string;
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
  nama_fs2: string;
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
  target_pengujian?: string;
  target_deployment?: string;
  target_go_live?: string;
  
  // Pernyataan
  pernyataan_1?: boolean;
  pernyataan_2?: boolean;
  
  // Fields for F.S.2 Disetujui
  progres?: string;
  fase_pengajuan?: string;
  iku?: string;
  mekanisme?: string;
  pelaksanaan?: string;
  tahun?: number;
  tahun_mulai?: number;
  tahun_selesai?: number;
  pic_id?: string;
  dokumen_path?: string;
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
  bidang_id?: string;
  skpa_id?: string;
  status?: string;
  page?: number;
  size?: number;
}): Promise<Fs2SearchResponse> {
  const queryParams = new URLSearchParams();
  if (params.search) queryParams.append('search', params.search);
  if (params.bidang_id) queryParams.append('bidang_id', params.bidang_id);
  if (params.skpa_id) queryParams.append('skpa_id', params.skpa_id);
  if (params.status) queryParams.append('status', params.status);
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
  fase_pengajuan?: string;
  mekanisme?: string;
  pelaksanaan?: string;
  page?: number;
  size?: number;
}): Promise<Fs2SearchResponse> {
  const queryParams = new URLSearchParams();
  if (params.search) queryParams.append('search', params.search);
  if (params.bidang_id) queryParams.append('bidang_id', params.bidang_id);
  if (params.skpa_id) queryParams.append('skpa_id', params.skpa_id);
  if (params.progres) queryParams.append('progres', params.progres);
  if (params.fase_pengajuan) queryParams.append('fase_pengajuan', params.fase_pengajuan);
  if (params.mekanisme) queryParams.append('mekanisme', params.mekanisme);
  if (params.pelaksanaan) queryParams.append('pelaksanaan', params.pelaksanaan);
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
export async function updateFs2Status(id: string, status: string): Promise<Fs2DocumentData> {
  const response = await apiRequest<Fs2DocumentData>(
    `${BASE_URL}/fs2/${id}/status?status=${encodeURIComponent(status)}`,
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
