/**
 * Formasi Efektif API Client
 * Handles all API calls for Formasi Efektif feature
 */

import { apiRequest, type BaseApiResponse } from './apiClient';

const BASE_URL = '/api/formasi-efektif';

// ==================== TYPES ====================

export interface FormasiByLevel {
  manajer: number;
  asisten_manajer: number;
  total: number;
}

export interface FormasiSummary {
  formasi_efektif: FormasiByLevel;
  formasi_saat_ini: FormasiByLevel;
  kebutuhan: FormasiByLevel;
}

export interface DeveloperItem {
  id: string;
  full_name: string;
  username: string;
  title: string;
  level: 'MANAJER' | 'ASISTEN_MANAJER' | 'LAINNYA';
  pksi_count: number;
  fs2_count: number;
  pksi_list: WorkItem[];
  fs2_list: WorkItem[];
}

export interface WorkItem {
  id: string;
  name: string;
  team_name: string | null;
}

export interface ParameterItem {
  id: string;
  kode: string;
  nama: string;
  deskripsi: string;
  nilai: string;
  urutan: number;
}

export interface FormasiEfektifDashboardResponse {
  selected_tahun: number;
  available_years: number[];
  summary: FormasiSummary;
  developer_list: DeveloperItem[];
  parameters: ParameterItem[];
}

// ==================== DETAIL TYPES ====================

export interface ManHourByLevel {
  manajer: number;
  asisten_manajer: number;
  total: number;
}

export interface CalculationSummary {
  pksi_man_hour: ManHourByLevel;
  fs2_man_hour: ManHourByLevel;
  maintenance_man_hour: ManHourByLevel;
  maintenance_base_count: number;
  total_man_hour: ManHourByLevel;
  formasi_efektif: FormasiByLevel;
  formasi_saat_ini: FormasiByLevel;
  kebutuhan: FormasiByLevel;
}

export interface PksiDetailItem {
  id: string;
  nama_pksi: string;
  nama_aplikasi: string | null;
  jenis_pksi: string | null;
  inhouse_outsource: string | null;
  workload_pct: number;
  usreq_date: string | null;
  uat_date: string | null;
  duration_months: number;
  man_hour: number;
  man_hour_manajer: number;
  man_hour_asman: number;
}

export interface Fs2DetailItem {
  id: string;
  nama_aplikasi: string | null;
  deskripsi_pengubahan: string | null;
  mekanisme: string | null;
  workload_pct: number;
  tanggal_pengajuan: string | null;
  target_go_live: string | null;
  duration_months: number;
  man_hour: number;
  man_hour_manajer: number;
  man_hour_asman: number;
}

export interface FormasiEfektifDetailResponse {
  selected_tahun: number;
  available_years: number[];
  summary: CalculationSummary;
  pksi_details: PksiDetailItem[];
  fs2_details: Fs2DetailItem[];
  parameters: ParameterItem[];
}

// ==================== API FUNCTIONS ====================

/**
 * Get dashboard data with summary calculations
 */
export async function getDashboard(tahun?: number): Promise<BaseApiResponse<FormasiEfektifDashboardResponse>> {
  const url = tahun ? `${BASE_URL}/dashboard?tahun=${tahun}` : `${BASE_URL}/dashboard`;
  return apiRequest<FormasiEfektifDashboardResponse>(url);
}

/**
 * Get detail data with calculation breakdowns
 */
export async function getDetail(tahun?: number): Promise<BaseApiResponse<FormasiEfektifDetailResponse>> {
  const url = tahun ? `${BASE_URL}/detail?tahun=${tahun}` : `${BASE_URL}/detail`;
  return apiRequest<FormasiEfektifDetailResponse>(url);
}

/**
 * Get configuration parameters
 */
export async function getParameters(): Promise<BaseApiResponse<ParameterItem[]>> {
  return apiRequest<ParameterItem[]>(`${BASE_URL}/parameters`);
}

/**
 * Update configuration parameters
 */
export async function updateParameters(parameters: ParameterItem[]): Promise<BaseApiResponse<ParameterItem[]>> {
  return apiRequest<ParameterItem[]>(`${BASE_URL}/parameters`, 'PUT', parameters);
}
