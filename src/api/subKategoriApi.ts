import { apiRequest } from './apiClient';

const BASE_URL = '/api';

// ==================== TYPES ====================

export interface SubKategoriData {
  id: string;
  kode: string;
  nama: string;
  category_code: string;
  category_name: string;
  created_at?: string;
  updated_at?: string;
}

export interface SubKategoriSnapshotData {
  id: string;
  snapshot_year: number;
  sub_kategori_id: string;
  kode: string;
  nama: string;
  category_code: string;
  category_name: string;
  snapshot_date: string;
  change_type: string;
  created_at: string;
  created_by?: string;
}

export interface SubKategoriRequest {
  kode: string;
  nama: string;
  category_code: string;
  category_name: string;
}

// ==================== CONSTANTS ====================

export const CATEGORY_CODES = {
  CS: 'Core System',
  SP: 'Supporting System',
  DA: 'Data Analytics',
  DM: 'Data Management',
} as const;

export const CATEGORY_CODE_OPTIONS = Object.entries(CATEGORY_CODES).map(([code, name]) => ({
  code,
  name,
}));

// ==================== API FUNCTIONS ====================

/**
 * Get all sub kategori, optionally filtered by category code
 */
export const getAllSubKategori = async (categoryCode?: string): Promise<SubKategoriData[]> => {
  let url = `${BASE_URL}/arsitektur/sub-kategori`;
  if (categoryCode) {
    url += `?categoryCode=${encodeURIComponent(categoryCode)}`;
  }
  const response = await apiRequest<SubKategoriData[]>(url, 'GET');
  return response.data || [];
};

/**
 * Get sub kategori by ID
 */
export const getSubKategoriById = async (id: string): Promise<SubKategoriData> => {
  const response = await apiRequest<SubKategoriData>(
    `${BASE_URL}/arsitektur/sub-kategori/${id}`,
    'GET'
  );
  return response.data;
};

/**
 * Create new sub kategori
 */
export const createSubKategori = async (request: SubKategoriRequest): Promise<SubKategoriData> => {
  const response = await apiRequest<SubKategoriData>(
    `${BASE_URL}/arsitektur/sub-kategori`,
    'POST',
    request
  );
  return response.data;
};

/**
 * Bulk create multiple sub kategori at once
 */
export const bulkCreateSubKategori = async (requests: SubKategoriRequest[]): Promise<SubKategoriData[]> => {
  const response = await apiRequest<SubKategoriData[]>(
    `${BASE_URL}/arsitektur/sub-kategori/bulk`,
    'POST',
    requests
  );
  return response.data || [];
};

/**
 * Update existing sub kategori
 */
export const updateSubKategori = async (id: string, request: SubKategoriRequest): Promise<SubKategoriData> => {
  const response = await apiRequest<SubKategoriData>(
    `${BASE_URL}/arsitektur/sub-kategori/${id}`,
    'PUT',
    request
  );
  return response.data;
};

/**
 * Delete sub kategori
 */
export const deleteSubKategori = async (id: string): Promise<void> => {
  await apiRequest<null>(
    `${BASE_URL}/arsitektur/sub-kategori/${id}`,
    'DELETE'
  );
};

/**
 * Get all distinct category codes
 */
export const getAllCategoryCodes = async (): Promise<string[]> => {
  const response = await apiRequest<string[]>(
    `${BASE_URL}/arsitektur/sub-kategori/category-codes`,
    'GET'
  );
  return response.data || [];
};

/**
 * Get all category codes with names
 */
export const getCategoryCodesWithNames = async (): Promise<Record<string, string>> => {
  const response = await apiRequest<Record<string, string>>(
    `${BASE_URL}/arsitektur/sub-kategori/category-codes-with-names`,
    'GET'
  );
  return response.data || {};
};

// ==================== SNAPSHOT API FUNCTIONS ====================

/**
 * Create yearly snapshot
 */
export const createYearlySnapshot = async (year: number): Promise<void> => {
  await apiRequest<null>(
    `${BASE_URL}/arsitektur/sub-kategori/snapshot/${year}`,
    'POST'
  );
};

/**
 * Get snapshots by year
 */
export const getSnapshotsByYear = async (year: number): Promise<SubKategoriSnapshotData[]> => {
  const response = await apiRequest<SubKategoriSnapshotData[]>(
    `${BASE_URL}/arsitektur/sub-kategori/snapshot/${year}`,
    'GET'
  );
  return response.data || [];
};

/**
 * Get all distinct snapshot years
 */
export const getDistinctSnapshotYears = async (): Promise<number[]> => {
  const response = await apiRequest<number[]>(
    `${BASE_URL}/arsitektur/sub-kategori/snapshot/years`,
    'GET'
  );
  return response.data || [];
};

/**
 * Get snapshot history for a specific sub kategori
 */
export const getSnapshotHistory = async (subKategoriId: string): Promise<SubKategoriSnapshotData[]> => {
  const response = await apiRequest<SubKategoriSnapshotData[]>(
    `${BASE_URL}/arsitektur/sub-kategori/snapshot/history/${subKategoriId}`,
    'GET'
  );
  return response.data || [];
};
