import { getAuthToken } from './authApi';
import type { BaseApiResponse } from './rbsiApi';

const API_KEY = 'da39b92f-a1b8-46d5-a10c-d08b1cc92218';
const BASE_URL = '/api';

// ==================== RESPONSE TYPES ====================

export interface BidangInfo {
  id: string;
  kode_bidang: string;
  nama_bidang: string;
  created_at?: string;
  updated_at?: string;
}

export interface SkpaData {
  id: string;
  kode_skpa: string;
  nama_skpa: string;
  keterangan?: string | null;
  bidang?: BidangInfo | null;
  created_at?: string;
  updated_at?: string;
}

// ==================== REQUEST TYPES ====================

export interface SkpaRequest {
  kode_skpa: string;
  nama_skpa: string;
  keterangan?: string | null;
  bidang_id?: string;
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

// ==================== SKPA API ====================

export async function getAllSkpa(): Promise<BaseApiResponse<SkpaData[]>> {
  return apiRequest<SkpaData[]>(`${BASE_URL}/arsitektur/skpa`, 'GET');
}

export async function searchSkpa(query: string): Promise<SkpaData[]> {
  try {
    const response = await apiRequest<SkpaData[]>(
      `${BASE_URL}/arsitektur/skpa?search=${encodeURIComponent(query)}`,
      'GET'
    );
    return response.data || [];
  } catch (error) {
    throw error;
  }
}

export async function getSkpaById(id: string): Promise<SkpaData> {
  try {
    const response = await apiRequest<SkpaData>(`${BASE_URL}/arsitektur/skpa/${id}`, 'GET');
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function getSkpaByKode(kode: string): Promise<SkpaData> {
  try {
    const response = await apiRequest<SkpaData>(`${BASE_URL}/arsitektur/skpa/kode/${kode}`, 'GET');
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function createSkpa(data: SkpaRequest): Promise<SkpaData> {
  try {
    const response = await apiRequest<SkpaData>(`${BASE_URL}/arsitektur/skpa`, 'POST', data);
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function updateSkpa(id: string, data: SkpaRequest): Promise<SkpaData> {
  try {
    const response = await apiRequest<SkpaData>(`${BASE_URL}/arsitektur/skpa/${id}`, 'PUT', data);
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function deleteSkpa(id: string): Promise<void> {
  try {
    await apiRequest(`${BASE_URL}/arsitektur/skpa/${id}`, 'DELETE');
  } catch (error) {
    throw error;
  }
}

