import { apiRequest, type BaseApiResponse } from './apiClient';

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

