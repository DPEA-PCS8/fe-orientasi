import { getAuthToken } from './authApi';
import type { BaseApiResponse } from './rbsiApi';
import type { 
  BidangInfo, 
  SkpaInfo, 
  UrlInfo, 
  SatkerInternalInfo, 
  PenggunaEksternalInfo, 
  KomunikasiSistemInfo, 
  PenghargaanInfo 
} from './aplikasiApi';

const API_KEY = 'da39b92f-a1b8-46d5-a10c-d08b1cc92218';
const BASE_URL = '/api';

// ==================== RESPONSE TYPES ====================

export interface IdleInfo {
  kategori_idle?: string;
  alasan_idle?: string;
  rencana_pengakhiran?: string;
  alasan_belum_diakhiri?: string;
}

export interface ChangelogInfo {
  id: string;
  tanggal_perubahan: string;
  keterangan: string;
  perubahan_detail?: string;
  created_at?: string;
}

export interface AplikasiSnapshotData {
  id: string;
  aplikasi_id: string;
  tahun: number;
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
  idle_info?: IdleInfo;
  urls?: UrlInfo[];
  satker_internals?: SatkerInternalInfo[];
  pengguna_eksternals?: PenggunaEksternalInfo[];
  komunikasi_sistems?: KomunikasiSistemInfo[];
  penghargaans?: PenghargaanInfo[];
  changelogs?: ChangelogInfo[];
  snapshot_date?: string;
  snapshot_type?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AplikasiHistorisListData {
  aplikasi_id: string;
  kode_aplikasi: string;
  nama_aplikasi: string;
  bidang_kode?: string;
  bidang_nama?: string;
  skpa_kode?: string;
  skpa_nama?: string;
  status_aplikasi: string;
  keterangan_historis?: string;
  tahun: number;
  snapshot_date?: string;
}

export interface AplikasiStatistikData {
  tahun: number;
  total_aplikasi: number;
  by_status: Record<string, number>;
}

export interface GenerateSnapshotResult {
  tahun: number;
  total_generated: number;
  snapshots: AplikasiSnapshotData[];
}

// ==================== REQUEST TYPES ====================

export interface ChangelogRequest {
  tanggal_perubahan: string;
  keterangan: string;
}

export interface GenerateSnapshotRequest {
  tahun: number;
}

export interface UpdateSnapshotRequest {
  kode_aplikasi?: string;
  nama_aplikasi?: string;
  deskripsi?: string;
  status_aplikasi?: string;
  bidang_id?: string;
  skpa_id?: string;
  tanggal_implementasi?: string;
  akses?: string;
  proses_data_pribadi?: boolean;
  keterangan_historis?: string;
  // Optional changelog fields - if provided, creates a changelog entry
  changelog_tanggal?: string;
  changelog_keterangan?: string;
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

// ==================== HISTORIS APLIKASI API ====================

/**
 * Get list of snapshots for a specific year
 */
export async function getHistorisByTahun(tahun: number): Promise<BaseApiResponse<AplikasiHistorisListData[]>> {
  return apiRequest<AplikasiHistorisListData[]>(`${BASE_URL}/arsitektur/historis-aplikasi/tahun/${tahun}`, 'GET');
}

/**
 * Get list of snapshots for a period
 */
export async function getHistorisByPeriode(startYear: number, endYear: number): Promise<BaseApiResponse<AplikasiHistorisListData[]>> {
  return apiRequest<AplikasiHistorisListData[]>(
    `${BASE_URL}/arsitektur/historis-aplikasi/periode?start_year=${startYear}&end_year=${endYear}`,
    'GET'
  );
}

/**
 * Get all available years that have snapshots
 */
export async function getAvailableYears(): Promise<BaseApiResponse<number[]>> {
  return apiRequest<number[]>(`${BASE_URL}/arsitektur/historis-aplikasi/years`, 'GET');
}

/**
 * Get snapshot detail by ID
 */
export async function getSnapshotById(id: string): Promise<BaseApiResponse<AplikasiSnapshotData>> {
  return apiRequest<AplikasiSnapshotData>(`${BASE_URL}/arsitektur/historis-aplikasi/${id}`, 'GET');
}

/**
 * Get snapshot by aplikasi ID and year
 */
export async function getSnapshotByAplikasiAndTahun(aplikasiId: string, tahun: number): Promise<BaseApiResponse<AplikasiSnapshotData>> {
  return apiRequest<AplikasiSnapshotData>(
    `${BASE_URL}/arsitektur/historis-aplikasi/aplikasi/${aplikasiId}/tahun/${tahun}`,
    'GET'
  );
}

/**
 * Get all snapshots for an aplikasi
 */
export async function getSnapshotsByAplikasiId(aplikasiId: string): Promise<BaseApiResponse<AplikasiSnapshotData[]>> {
  return apiRequest<AplikasiSnapshotData[]>(`${BASE_URL}/arsitektur/historis-aplikasi/aplikasi/${aplikasiId}`, 'GET');
}

/**
 * Get statistics for a specific year
 */
export async function getStatistikByTahun(tahun: number): Promise<BaseApiResponse<AplikasiStatistikData>> {
  return apiRequest<AplikasiStatistikData>(`${BASE_URL}/arsitektur/historis-aplikasi/statistik/tahun/${tahun}`, 'GET');
}

/**
 * Get statistics for a period
 */
export async function getStatistikByPeriode(startYear: number, endYear: number): Promise<BaseApiResponse<AplikasiStatistikData[]>> {
  return apiRequest<AplikasiStatistikData[]>(
    `${BASE_URL}/arsitektur/historis-aplikasi/statistik/periode?start_year=${startYear}&end_year=${endYear}`,
    'GET'
  );
}

/**
 * Generate snapshots for all applications for a specific year
 */
export async function generateSnapshots(tahun: number): Promise<BaseApiResponse<GenerateSnapshotResult>> {
  return apiRequest<GenerateSnapshotResult>(
    `${BASE_URL}/arsitektur/historis-aplikasi/generate`,
    'POST',
    { tahun }
  );
}

/**
 * Create or update snapshot for a specific aplikasi and year
 */
export async function createOrUpdateSnapshot(aplikasiId: string, tahun: number): Promise<BaseApiResponse<AplikasiSnapshotData>> {
  return apiRequest<AplikasiSnapshotData>(
    `${BASE_URL}/arsitektur/historis-aplikasi/aplikasi/${aplikasiId}/tahun/${tahun}`,
    'POST'
  );
}

/**
 * Update existing snapshot
 */
export async function updateSnapshot(snapshotId: string, request: UpdateSnapshotRequest): Promise<BaseApiResponse<AplikasiSnapshotData>> {
  return apiRequest<AplikasiSnapshotData>(
    `${BASE_URL}/arsitektur/historis-aplikasi/${snapshotId}`,
    'PUT',
    request
  );
}

/**
 * Add changelog to a snapshot
 */
export async function addChangelog(snapshotId: string, request: ChangelogRequest): Promise<BaseApiResponse<ChangelogInfo>> {
  return apiRequest<ChangelogInfo>(
    `${BASE_URL}/arsitektur/historis-aplikasi/${snapshotId}/changelog`,
    'POST',
    request
  );
}

/**
 * Get changelogs for a snapshot
 */
export async function getChangelogsBySnapshotId(snapshotId: string): Promise<BaseApiResponse<ChangelogInfo[]>> {
  return apiRequest<ChangelogInfo[]>(`${BASE_URL}/arsitektur/historis-aplikasi/${snapshotId}/changelog`, 'GET');
}

/**
 * Delete a changelog entry
 */
export async function deleteChangelog(changelogId: string): Promise<BaseApiResponse<null>> {
  return apiRequest<null>(`${BASE_URL}/arsitektur/historis-aplikasi/changelog/${changelogId}`, 'DELETE');
}

/**
 * Delete a snapshot
 */
export async function deleteSnapshot(id: string): Promise<BaseApiResponse<null>> {
  return apiRequest<null>(`${BASE_URL}/arsitektur/historis-aplikasi/${id}`, 'DELETE');
}
