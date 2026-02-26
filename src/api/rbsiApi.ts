import { getAuthToken } from './authApi';

const API_KEY = 'da39b92f-a1b8-46d5-a10c-d08b1cc92218';
const BASE_URL = '/api';

export interface RbsiResponse {
  id: string;
  periode: string;
  created_at: string;
  updated_at: string;
  programs: RbsiProgramResponse[] | null;
}

export interface RbsiProgramResponse {
  id: string;
  rbsi_id: string;
  tahun: number;
  nomor_program: string;
  nama_program: string;
  created_at: string;
  updated_at: string;
  inisiatifs: RbsiInisiatifResponse[] | null;
}

export interface RbsiInisiatifResponse {
  id: string;
  program_id: string;
  tahun: number;
  nomor_inisiatif: string;
  nama_inisiatif: string;
  created_at: string;
  updated_at: string;
}

export interface BaseApiResponse<T> {
  status_code: number;
  message: string;
  data: T;
}

/**
 * Get all RBSI
 */
export async function getAllRbsi(): Promise<BaseApiResponse<RbsiResponse[]>> {
  const token = getAuthToken();
  
  const response = await fetch(`${BASE_URL}/rbsi`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'APIKey': API_KEY,
      'Authorization': `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch RBSI list');
  }

  return data;
}

/**
 * Get RBSI by ID
 */
export async function getRbsiById(id: string, tahun?: number): Promise<BaseApiResponse<RbsiResponse>> {
  const token = getAuthToken();
  const url = tahun ? `${BASE_URL}/rbsi/${id}?tahun=${tahun}` : `${BASE_URL}/rbsi/${id}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'APIKey': API_KEY,
      'Authorization': `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch RBSI');
  }

  return data;
}

/**
 * Create RBSI
 */
export async function createRbsi(periode: string): Promise<BaseApiResponse<RbsiResponse>> {
  const token = getAuthToken();
  
  const response = await fetch(`${BASE_URL}/rbsi`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'APIKey': API_KEY,
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ periode }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to create RBSI');
  }

  return data;
}

/**
 * Update RBSI
 */
export async function updateRbsi(id: string, periode: string): Promise<BaseApiResponse<RbsiResponse>> {
  const token = getAuthToken();
  
  const response = await fetch(`${BASE_URL}/rbsi/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'APIKey': API_KEY,
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ periode }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to update RBSI');
  }

  return data;
}

/**
 * Delete RBSI
 */
export async function deleteRbsi(id: string): Promise<BaseApiResponse<null>> {
  const token = getAuthToken();
  
  const response = await fetch(`${BASE_URL}/rbsi/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'APIKey': API_KEY,
      'Authorization': `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to delete RBSI');
  }

  return data;
}

/**
 * Get programs by RBSI ID
 */
export async function getProgramsByRbsi(rbsiId: string, tahun?: number): Promise<BaseApiResponse<RbsiProgramResponse[]>> {
  const token = getAuthToken();
  const url = tahun ? `${BASE_URL}/rbsi/${rbsiId}/programs?tahun=${tahun}` : `${BASE_URL}/rbsi/${rbsiId}/programs`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'APIKey': API_KEY,
      'Authorization': `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch programs');
  }

  return data;
}

export interface CreateProgramRequest {
  rbsi_id: string;
  tahun: number;
  nomor_program: string;
  nama_program: string;
  inisiatifs?: {
    nomor_inisiatif: string;
    nama_inisiatif: string;
  }[];
}

/**
 * Create or Update Program
 */
export async function createProgram(request: CreateProgramRequest): Promise<BaseApiResponse<RbsiProgramResponse>> {
  const token = getAuthToken();
  
  const response = await fetch(`${BASE_URL}/rbsi/programs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'APIKey': API_KEY,
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(request),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to create program');
  }

  return data;
}

export interface CreateInisiatifRequest {
  program_id: string;
  tahun: number;
  nomor_inisiatif: string;
  nama_inisiatif: string;
}

/**
 * Create or Update Inisiatif
 */
export async function createInisiatif(request: CreateInisiatifRequest): Promise<BaseApiResponse<RbsiInisiatifResponse>> {
  const token = getAuthToken();
  
  const response = await fetch(`${BASE_URL}/rbsi/inisiatifs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'APIKey': API_KEY,
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(request),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to create inisiatif');
  }

  return data;
}

export interface UpdateProgramRequest {
  rbsi_id: string;
  tahun: number;
  nomor_program: string;
  nama_program: string;
}

/**
 * Update Program
 */
export async function updateProgram(
  programId: string,
  request: UpdateProgramRequest
): Promise<BaseApiResponse<RbsiProgramResponse>> {
  const token = getAuthToken();

  const response = await fetch(`${BASE_URL}/rbsi/programs/${programId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'APIKey': API_KEY,
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(request),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to update program');
  }

  return data;
}

export interface UpdateInisiatifRequest {
  program_id: string;
  tahun: number;
  nomor_inisiatif: string;
  nama_inisiatif: string;
}

/**
 * Update Inisiatif
 */
export async function updateInisiatif(
  inisiatifId: string,
  request: UpdateInisiatifRequest
): Promise<BaseApiResponse<RbsiInisiatifResponse>> {
  const token = getAuthToken();

  const response = await fetch(`${BASE_URL}/rbsi/inisiatifs/${inisiatifId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'APIKey': API_KEY,
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(request),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to update inisiatif');
  }

  return data;
}

/**
 * Copy programs from one year to another
 */
export async function copyProgramsFromYear(
  rbsiId: string,
  fromTahun: number,
  toTahun: number
): Promise<BaseApiResponse<RbsiProgramResponse[]>> {
  const token = getAuthToken();
  
  const response = await fetch(
    `${BASE_URL}/rbsi/${rbsiId}/copy-programs?fromTahun=${fromTahun}&toTahun=${toTahun}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'APIKey': API_KEY,
        'Authorization': `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to copy programs');
  }

  return data;
}

/**
 * Copy a single program to target year
 * @param programId - Source program ID
 * @param toTahun - Target year
 * @param newNomorProgram - Optional new program number (for renumbering)
 */
export async function copyProgram(
  programId: string,
  toTahun: number,
  newNomorProgram?: string
): Promise<BaseApiResponse<RbsiProgramResponse>> {
  const token = getAuthToken();
  
  let url = `${BASE_URL}/rbsi/programs/${programId}/copy?toTahun=${toTahun}`;
  if (newNomorProgram) {
    url += `&newNomorProgram=${encodeURIComponent(newNomorProgram)}`;
  }
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'APIKey': API_KEY,
      'Authorization': `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to copy program');
  }

  return data;
}

/**
 * Copy a single inisiatif to target program
 * @param inisiatifId - Source inisiatif ID
 * @param toProgramId - Target program ID
 * @param newNomorInisiatif - Optional new inisiatif number (for renumbering)
 */
export async function copyInisiatif(
  inisiatifId: string,
  toProgramId: string,
  newNomorInisiatif?: string
): Promise<BaseApiResponse<RbsiInisiatifResponse>> {
  const token = getAuthToken();
  
  let url = `${BASE_URL}/rbsi/inisiatifs/${inisiatifId}/copy?toProgramId=${toProgramId}`;
  if (newNomorInisiatif) {
    url += `&newNomorInisiatif=${encodeURIComponent(newNomorInisiatif)}`;
  }
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'APIKey': API_KEY,
      'Authorization': `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to copy inisiatif');
  }

  return data;
}

export interface RbsiHistoryResponse {
  tahun: number;
  programs: RbsiProgramResponse[];
}

/**
 * Get RBSI history (all years)
 */
export async function getRbsiHistory(rbsiId: string): Promise<BaseApiResponse<RbsiHistoryResponse[]>> {
  const token = getAuthToken();

  const response = await fetch(`${BASE_URL}/rbsi/${rbsiId}/history`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'APIKey': API_KEY,
      'Authorization': `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch RBSI history');
  }

  return data;
}

// ==================== KEP API ====================

export interface RbsiKepResponse {
  id: string;
  rbsi_id: string;
  nomor_kep: string;
  tahun_pelaporan: number;
  created_at: string;
  updated_at: string;
}

export interface YearlyProgress {
  tahun: number;
  status: 'none' | 'planned' | 'realized';
}

export interface KepProgressItem {
  kep_id: string;
  nomor_kep: string;
  tahun_pelaporan: number;
  yearly_progress: YearlyProgress[];
}

export interface InisiatifKepProgress {
  inisiatif_id: string;
  kep_progress: KepProgressItem[];
}

export interface KepProgressFullResponse {
  rbsi_id: string;
  periode: string;
  kep_list: RbsiKepResponse[];
  progress: InisiatifKepProgress[];
}

export interface KepProgressResponse {
  id?: string;
  kep_id: string;
  nomor_kep: string;
  inisiatif_id: string;
  yearly_progress: YearlyProgress[];
  updated_at?: string;
}

export interface CreateKepRequest {
  nomor_kep: string;
  tahun_pelaporan: number;
  copy_from_latest?: boolean;
}

export interface UpdateKepProgressRequest {
  inisiatif_id: string;
  yearly_progress: YearlyProgress[];
}

/**
 * Get KEP list by RBSI
 */
export async function getKepList(rbsiId: string): Promise<BaseApiResponse<RbsiKepResponse[]>> {
  const token = getAuthToken();

  const response = await fetch(`${BASE_URL}/rbsi/${rbsiId}/kep`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'APIKey': API_KEY,
      'Authorization': `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch KEP list');
  }

  return data;
}

/**
 * Create new KEP
 */
export async function createKep(rbsiId: string, request: CreateKepRequest): Promise<BaseApiResponse<RbsiKepResponse>> {
  const token = getAuthToken();

  const response = await fetch(`${BASE_URL}/rbsi/${rbsiId}/kep`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'APIKey': API_KEY,
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(request),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to create KEP');
  }

  return data;
}

/**
 * Get KEP progress by RBSI
 */
export async function getKepProgress(rbsiId: string, tahun?: number): Promise<BaseApiResponse<KepProgressFullResponse>> {
  const token = getAuthToken();
  const url = tahun ? `${BASE_URL}/rbsi/${rbsiId}/kep-progress?tahun=${tahun}` : `${BASE_URL}/rbsi/${rbsiId}/kep-progress`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'APIKey': API_KEY,
      'Authorization': `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch KEP progress');
  }

  return data;
}

/**
 * Update KEP progress
 */
export async function updateKepProgress(
  rbsiId: string,
  kepId: string,
  request: UpdateKepProgressRequest
): Promise<BaseApiResponse<KepProgressResponse>> {
  const token = getAuthToken();

  const response = await fetch(`${BASE_URL}/rbsi/${rbsiId}/kep/${kepId}/progress`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'APIKey': API_KEY,
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(request),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to update KEP progress');
  }

  return data;
}
