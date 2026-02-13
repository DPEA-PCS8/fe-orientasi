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
