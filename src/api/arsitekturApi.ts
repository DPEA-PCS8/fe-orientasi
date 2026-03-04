import { getAuthToken } from './authApi';
import type { BaseApiResponse } from './rbsiApi';

const API_KEY = 'da39b92f-a1b8-46d5-a10c-d08b1cc92218';
const BASE_URL = '/api';

// ==================== RESPONSE TYPES ====================

export interface AplikasiResponse {
  id: string;
  kode_aplikasi: string;
  nama_aplikasi: string;
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

export interface InisiatifSimpleResponse {
  id: string;
  nomor_inisiatif: string;
  nama_inisiatif: string;
  program_id: string;
  nama_program: string;
}

export interface ArsitekturRbsiResponse {
  id: string;
  rbsi_id: string;
  rbsi_periode: string;
  sub_kategori: SubKategoriResponse | null;
  aplikasi_baseline: AplikasiResponse | null;
  aplikasi_target: AplikasiResponse | null;
  action: string;
  year_statuses: string;
  inisiatif: InisiatifSimpleResponse | null;
  skpa: SkpaResponse | null;
  created_at: string;
  updated_at: string;
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
  sub_kategori_id: string;
  aplikasi_baseline_id?: string;
  aplikasi_target_id?: string;
  action?: string;
  year_statuses?: string;
  inisiatif_id?: string;
  skpa_id?: string;
}

// ==================== HELPER ====================

async function apiRequest<T>(
  url: string,
  method: string,
  body?: unknown
): Promise<BaseApiResponse<T>> {
  const token = getAuthToken();

  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'APIKey': API_KEY,
      'Authorization': `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Request failed');
  }

  return data;
}

// ==================== APLIKASI API ====================

export async function getAllAplikasi(): Promise<BaseApiResponse<AplikasiResponse[]>> {
  return apiRequest(`${BASE_URL}/arsitektur/aplikasi`, 'GET');
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

// ==================== SKPA API ====================
// SKPA API functions are centralized in skpaApi.ts for better organization and consistency
// Import from skpaApi.ts instead:
// import { getAllSkpa, getSkpaById, getSkpaByKode, createSkpa, updateSkpa, deleteSkpa } from './skpaApi';


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
