import { apiRequest, type BaseApiResponse } from './apiClient';

const BASE_URL = '/api';

// ==================== RESPONSE TYPES ====================

export interface BidangInfo {
  id: string;
  kode_bidang: string;
  nama_bidang: string;
}

export interface SkpaInfo {
  id: string;
  kode_skpa: string;
  nama_skpa: string;
}

export interface UrlInfo {
  id?: string;
  url: string;
  tipe_akses?: string;
  keterangan?: string;
}

export interface SatkerInternalInfo {
  id?: string;
  nama_satker: string;
  keterangan?: string;
}

export interface PenggunaEksternalInfo {
  id?: string;
  nama_pengguna: string;
  keterangan?: string;
}

export interface KomunikasiSistemInfo {
  id?: string;
  nama_sistem: string;
  tipe_sistem?: string;
  deskripsi_komunikasi?: string;
  keterangan?: string;
  is_planned?: boolean;
}

export interface VariableInfo {
  id: string;
  kode: string;
  nama: string;
}

export interface PenghargaanInfo {
  id?: string;
  kategori: VariableInfo;
  tanggal: string;
  deskripsi?: string;
}

export interface AplikasiData {
  id: string;
  kode_aplikasi: string;
  nama_aplikasi: string;
  deskripsi?: string;
  status_aplikasi: string;
  tanggal_status?: string;
  bidang?: BidangInfo | null;
  skpa?: SkpaInfo | null;
  tanggal_implementasi?: string;
  akses?: string;
  proses_data_pribadi: boolean;
  data_pribadi_diproses?: string;
  kategori_idle?: string;
  alasan_idle?: string;
  rencana_pengakhiran?: string;
  alasan_belum_diakhiri?: string;
  urls?: UrlInfo[];
  satker_internals?: SatkerInternalInfo[];
  pengguna_eksternals?: PenggunaEksternalInfo[];
  komunikasi_sistems?: KomunikasiSistemInfo[];
  penghargaans?: PenghargaanInfo[];
  created_at?: string;
  updated_at?: string;
}

export interface AplikasiSearchResponse {
  content: AplikasiData[];
  total_elements: number;
  total_pages: number;
  page: number;
  size: number;
}

// ==================== REQUEST TYPES ====================

export interface UrlRequest {
  url: string;
  tipe_akses?: string;
  keterangan?: string;
}

export interface SatkerInternalRequest {
  nama_satker: string;
  keterangan?: string;
}

export interface PenggunaEksternalRequest {
  nama_pengguna: string;
  keterangan?: string;
}

export interface KomunikasiSistemRequest {
  nama_sistem: string;
  tipe_sistem?: string;
  deskripsi_komunikasi?: string;
  keterangan?: string;
  is_planned?: boolean;
}

export interface PenghargaanRequest {
  kategori_id: string;
  tanggal: string;
  deskripsi?: string;
}

export interface AplikasiRequest {
  kode_aplikasi: string;
  nama_aplikasi: string;
  deskripsi?: string;
  status_aplikasi: string;
  bidang_id?: string;
  skpa_id?: string;
  tanggal_implementasi?: string;
  akses?: string;
  proses_data_pribadi: boolean;
  data_pribadi_diproses?: string;
  kategori_idle?: string;
  alasan_idle?: string;
  rencana_pengakhiran?: string;
  alasan_belum_diakhiri?: string;
  urls?: UrlRequest[];
  satker_internals?: SatkerInternalRequest[];
  pengguna_eksternals?: PenggunaEksternalRequest[];
  komunikasi_sistems?: KomunikasiSistemRequest[];
  penghargaans?: PenghargaanRequest[];
}

export interface AplikasiSearchParams {
  search?: string;
  bidang_id?: string;
  skpa_id?: string;
  status?: string;
  page?: number;
  size?: number;
}

// ==================== CONSTANTS ====================

export const APPLICATION_STATUS = {
  AKTIF: 'AKTIF',
  IDLE: 'IDLE',
  DIAKHIRI: 'DIAKHIRI',
} as const;

export const APPLICATION_STATUS_LABELS: Record<string, string> = {
  AKTIF: 'Aktif',
  IDLE: 'Idle',
  DIAKHIRI: 'Diakhiri',
};

export const ACCESS_TYPE = {
  INTERNET: 'INTERNET',
  INTRANET: 'INTRANET',
  EXTRANET: 'EXTRANET',
  DESKTOP_APP: 'DESKTOP_APP',
  MOBILE_APP: 'MOBILE_APP',
  OTHER: 'OTHER',
} as const;

export const ACCESS_TYPE_LABELS: Record<string, string> = {
  INTERNET: 'Internet',
  INTRANET: 'Intranet',
  EXTRANET: 'Extranet',
  DESKTOP_APP: 'Desktop Application/Install',
  MOBILE_APP: 'Mobile Application',
  OTHER: 'Lainnya',
};

export const KATEGORI_IDLE = {
  TIDAK_DIGUNAKAN: 'TIDAK_DIGUNAKAN',
  HISTORIS: 'HISTORIS',
  LAINNYA: 'LAINNYA',
} as const;

export const KATEGORI_IDLE_LABELS: Record<string, string> = {
  TIDAK_DIGUNAKAN: 'Aplikasi sudah tidak digunakan/diakses',
  HISTORIS: 'Aplikasi hanya diakses untuk melihat data historis',
  LAINNYA: 'Lainnya',
};

export const TIPE_SISTEM = {
  INTERNAL: 'INTERNAL',
  EKSTERNAL: 'EKSTERNAL',
} as const;

export const TIPE_SISTEM_LABELS: Record<string, string> = {
  INTERNAL: 'Internal OJK',
  EKSTERNAL: 'Eksternal',
};

// ==================== APLIKASI API ====================

export async function getAllAplikasi(): Promise<BaseApiResponse<AplikasiData[]>> {
  return apiRequest<AplikasiData[]>(`${BASE_URL}/arsitektur/aplikasi`, 'GET');
}

export async function searchAplikasi(params: AplikasiSearchParams): Promise<BaseApiResponse<AplikasiSearchResponse>> {
  const queryParams = new URLSearchParams();
  
  if (params.search) queryParams.append('search', params.search);
  if (params.bidang_id) queryParams.append('bidang_id', params.bidang_id);
  if (params.skpa_id) queryParams.append('skpa_id', params.skpa_id);
  if (params.status) queryParams.append('status', params.status);
  if (params.page !== undefined) queryParams.append('page', params.page.toString());
  if (params.size !== undefined) queryParams.append('size', params.size.toString());
  
  const queryString = queryParams.toString();
  const url = `${BASE_URL}/arsitektur/aplikasi/search${queryString ? `?${queryString}` : ''}`;
  
  return apiRequest<AplikasiSearchResponse>(url, 'GET');
}

export async function getAplikasiList(params: AplikasiSearchParams): Promise<BaseApiResponse<AplikasiData[]>> {
  const queryParams = new URLSearchParams();
  
  if (params.search) queryParams.append('search', params.search);
  if (params.bidang_id) queryParams.append('bidang_id', params.bidang_id);
  if (params.skpa_id) queryParams.append('skpa_id', params.skpa_id);
  if (params.status) queryParams.append('status', params.status);
  
  const queryString = queryParams.toString();
  const url = `${BASE_URL}/arsitektur/aplikasi/list${queryString ? `?${queryString}` : ''}`;
  
  return apiRequest<AplikasiData[]>(url, 'GET');
}

export async function getAplikasiById(id: string): Promise<AplikasiData> {
  const response = await apiRequest<AplikasiData>(`${BASE_URL}/arsitektur/aplikasi/${id}`, 'GET');
  return response.data;
}

export async function getAplikasiByKode(kode: string): Promise<AplikasiData> {
  const response = await apiRequest<AplikasiData>(`${BASE_URL}/arsitektur/aplikasi/kode/${kode}`, 'GET');
  return response.data;
}

export async function createAplikasi(data: AplikasiRequest): Promise<AplikasiData> {
  const response = await apiRequest<AplikasiData>(`${BASE_URL}/arsitektur/aplikasi`, 'POST', data);
  return response.data;
}

export async function updateAplikasi(id: string, data: AplikasiRequest): Promise<AplikasiData> {
  const response = await apiRequest<AplikasiData>(`${BASE_URL}/arsitektur/aplikasi/${id}`, 'PUT', data);
  return response.data;
}

export interface AplikasiStatusUpdateRequest {
  status: string;
  tanggal_status?: string;
  kategori_idle?: string;
  alasan_idle?: string;
  rencana_pengakhiran?: string;
  alasan_belum_diakhiri?: string;
}

export async function updateAplikasiStatus(id: string, status: string): Promise<AplikasiData> {
  const response = await apiRequest<AplikasiData>(
    `${BASE_URL}/arsitektur/aplikasi/${id}/status?status=${encodeURIComponent(status)}`,
    'PATCH'
  );
  return response.data;
}

export async function updateAplikasiStatusWithDetails(id: string, request: AplikasiStatusUpdateRequest): Promise<AplikasiData> {
  const response = await apiRequest<AplikasiData>(
    `${BASE_URL}/arsitektur/aplikasi/${id}/status`,
    'PATCH',
    request
  );
  return response.data;
}

export async function deleteAplikasi(id: string): Promise<void> {
  await apiRequest<void>(`${BASE_URL}/arsitektur/aplikasi/${id}`, 'DELETE');
}

// ==================== VARIABLE API ====================

export interface VariableData {
  id: string;
  kategori: string;
  kode: string;
  nama: string;
  deskripsi?: string;
  urutan?: number;
}

export async function getVariablesByKategori(kategori: string): Promise<VariableData[]> {
  const response = await apiRequest<VariableData[]>(
    `${BASE_URL}/arsitektur/variable?kategori=${encodeURIComponent(kategori)}`,
    'GET'
  );
  return response.data;
}

export async function getAllVariables(): Promise<VariableData[]> {
  const response = await apiRequest<VariableData[]>(
    `${BASE_URL}/arsitektur/variable/all`,
    'GET'
  );
  return response.data;
}
