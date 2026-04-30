import { apiRequest, type BaseApiResponse } from './apiClient';

const BASE_URL = '/api';

// ==================== RESPONSE TYPES ====================

export interface AplikasiResponse {
  id: string;
  kode_aplikasi: string;
  nama_aplikasi: string;
  status_aplikasi?: string;
  sub_kategori?: { id: string; kode: string; nama: string } | null;
  skpa?: { id: string; kode_skpa: string; nama_skpa: string } | null;
  created_at: string;
  updated_at: string;
}

export interface SkpaResponse {
  id: string;
  kode_skpa: string;
  nama_skpa: string;
  keterangan?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubKategoriResponse {
  id: string;
  kode: string;
  nama: string;
  category_code: string;
  created_at: string;
  updated_at: string;
}

export interface InisiatifGroupSimpleResponse {
  id: string;
  nama_inisiatif: string;
  keterangan?: string | null;
}

export interface ArsitekturRbsiResponse {
  id: string;
  rbsi_id: string;
  rbsi_periode: string;
  sub_kategori: SubKategoriResponse | null;
  aplikasi: AplikasiResponse | null;
  aplikasi_baseline: string | null;
  aplikasi_target: string | null;
  action: string;
  year_statuses: string;
  inisiatif_group: InisiatifGroupSimpleResponse | null;
  skpa: SkpaResponse | null;
  keterangan: string | null;
  created_at: string;
  updated_at: string;
}

export interface SnapshotArsitekturRbsiResponse {
  id: string;
  rbsi_id: string;
  snapshot_date: string;
  arsitektur_id: string;
  sub_kategori_kode: string | null;
  sub_kategori_nama: string | null;
  aplikasi_kode: string | null;
  aplikasi_nama: string | null;
  aplikasi_baseline_kode: string | null;
  aplikasi_baseline_nama: string | null;
  aplikasi_target_kode: string | null;
  aplikasi_target_nama: string | null;
  action: string | null;
  year_statuses: string | null;
  inisiatif_group_id: string | null;
  inisiatif_group_nama: string | null;
  skpa_kode: string | null;
  skpa_nama: string | null;
  keterangan: string | null;
  changes: string | null;
  created_at: string;
}

export interface SnapshotGroup {
  snapshot_date: string;
  total_items: number;
  changed_items: number;
  items: SnapshotArsitekturRbsiResponse[];
}

// ==================== REQUEST TYPES ====================

export interface AplikasiRequest {
  kode_aplikasi: string;
  nama_aplikasi: string;
}

export interface SubKategoriRequest {
  kode: string;
  nama: string;
  category_code: string;
}

export interface ArsitekturRbsiRequest {
  rbsi_id: string;
  aplikasi_id?: string;
  sub_kategori_id?: string;
  skpa_id?: string;
  aplikasi_baseline?: string;
  aplikasi_target?: string;
  action?: string;
  year_statuses?: string;
  inisiatif_group_id?: string;
  keterangan?: string;
}

// ==================== APLIKASI API ====================

export async function getAllAplikasi(): Promise<BaseApiResponse<AplikasiResponse[]>> {
  return apiRequest(`${BASE_URL}/arsitektur/aplikasi/dropdown`, 'GET');
}

export async function getAplikasiById(id: string): Promise<BaseApiResponse<AplikasiResponse>> {
  return apiRequest(`${BASE_URL}/arsitektur/aplikasi/${id}`, 'GET');
}

export async function getAplikasiByKode(kode: string): Promise<BaseApiResponse<AplikasiResponse>> {
  return apiRequest(`${BASE_URL}/arsitektur/aplikasi/kode/${kode}`, 'GET');
}

export async function createAplikasi(request: AplikasiRequest): Promise<BaseApiResponse<AplikasiResponse>> {
  return apiRequest(`${BASE_URL}/arsitektur/aplikasi`, 'POST', request);
}

export async function updateAplikasi(id: string, request: AplikasiRequest): Promise<BaseApiResponse<AplikasiResponse>> {
  return apiRequest(`${BASE_URL}/arsitektur/aplikasi/${id}`, 'PUT', request);
}

export async function deleteAplikasi(id: string): Promise<BaseApiResponse<null>> {
  return apiRequest(`${BASE_URL}/arsitektur/aplikasi/${id}`, 'DELETE');
}

// ==================== SUB KATEGORI API ====================

export async function getAllSubKategori(categoryCode?: string): Promise<BaseApiResponse<SubKategoriResponse[]>> {
  const url = categoryCode
    ? `${BASE_URL}/arsitektur/sub-kategori?categoryCode=${categoryCode}`
    : `${BASE_URL}/arsitektur/sub-kategori`;
  return apiRequest(url, 'GET');
}

export async function getSubKategoriById(id: string): Promise<BaseApiResponse<SubKategoriResponse>> {
  return apiRequest(`${BASE_URL}/arsitektur/sub-kategori/${id}`, 'GET');
}

export async function getAllCategoryCodes(): Promise<BaseApiResponse<string[]>> {
  return apiRequest(`${BASE_URL}/arsitektur/sub-kategori/category-codes`, 'GET');
}

export async function createSubKategori(request: SubKategoriRequest): Promise<BaseApiResponse<SubKategoriResponse>> {
  return apiRequest(`${BASE_URL}/arsitektur/sub-kategori`, 'POST', request);
}

export async function updateSubKategori(id: string, request: SubKategoriRequest): Promise<BaseApiResponse<SubKategoriResponse>> {
  return apiRequest(`${BASE_URL}/arsitektur/sub-kategori/${id}`, 'PUT', request);
}

export async function deleteSubKategori(id: string): Promise<BaseApiResponse<null>> {
  return apiRequest(`${BASE_URL}/arsitektur/sub-kategori/${id}`, 'DELETE');
}

// ==================== ARSITEKTUR RBSI API ====================

export async function getArsitekturByRbsiId(rbsiId: string): Promise<BaseApiResponse<ArsitekturRbsiResponse[]>> {
  return apiRequest(`${BASE_URL}/arsitektur/rbsi?rbsiId=${rbsiId}`, 'GET');
}

export async function getArsitekturById(id: string): Promise<BaseApiResponse<ArsitekturRbsiResponse>> {
  return apiRequest(`${BASE_URL}/arsitektur/rbsi/${id}`, 'GET');
}

export async function createArsitektur(request: ArsitekturRbsiRequest): Promise<BaseApiResponse<ArsitekturRbsiResponse>> {
  return apiRequest(`${BASE_URL}/arsitektur/rbsi`, 'POST', request);
}

export async function bulkCreateArsitektur(requests: ArsitekturRbsiRequest[]): Promise<BaseApiResponse<ArsitekturRbsiResponse[]>> {
  return apiRequest(`${BASE_URL}/arsitektur/rbsi/bulk`, 'POST', requests);
}

export async function updateArsitektur(id: string, request: ArsitekturRbsiRequest): Promise<BaseApiResponse<ArsitekturRbsiResponse>> {
  return apiRequest(`${BASE_URL}/arsitektur/rbsi/${id}`, 'PUT', request);
}

export async function deleteArsitektur(id: string): Promise<BaseApiResponse<null>> {
  return apiRequest(`${BASE_URL}/arsitektur/rbsi/${id}`, 'DELETE');
}

export async function deleteArsitekturByRbsiId(rbsiId: string): Promise<BaseApiResponse<null>> {
  return apiRequest(`${BASE_URL}/arsitektur/rbsi/by-rbsi/${rbsiId}`, 'DELETE');
}

// Snapshot + sinkronisasi year_status dengan status aplikasi aktual
export async function updateArsitekturData(rbsiId: string): Promise<BaseApiResponse<ArsitekturRbsiResponse[]>> {
  return apiRequest(`${BASE_URL}/arsitektur/rbsi/update-data/${rbsiId}`, 'POST');
}

// Riwayat snapshot per tanggal
export async function getArsitekturSnapshots(rbsiId: string): Promise<BaseApiResponse<SnapshotGroup[]>> {
  return apiRequest(`${BASE_URL}/arsitektur/rbsi/snapshots/${rbsiId}`, 'GET');
}
