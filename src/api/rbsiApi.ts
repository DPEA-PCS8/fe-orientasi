import { apiRequest, type BaseApiResponse } from './apiClient';

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
  group_id: string | null;
  program_id: string;
  tahun: number;
  nomor_inisiatif: string;
  nama_inisiatif: string;
  created_at: string;
  updated_at: string;
}

/**
 * Get all RBSI
 */
export async function getAllRbsi(): Promise<BaseApiResponse<RbsiResponse[]>> {
  return apiRequest<RbsiResponse[]>(`${BASE_URL}/rbsi`, 'GET');
}

/**
 * Get all inisiatifs (flattened from all RBSI → Programs → Inisiatifs)
 */
export interface FlattenedInisiatif {
  id: string;
  program_id: string;
  program_nama: string;
  nomor_program: string;
  rbsi_id: string;
  rbsi_periode: string;
  tahun: number;
  nomor_inisiatif: string;
  nama_inisiatif: string;
  label: string; // Combined label for display
}

export async function getAllInisiatifs(): Promise<FlattenedInisiatif[]> {
  const response = await getAllRbsi();
  const rbsiList = response.data || [];
  const inisiatifs: FlattenedInisiatif[] = [];

  for (const rbsi of rbsiList) {
    if (rbsi.programs) {
      for (const program of rbsi.programs) {
        if (program.inisiatifs) {
          for (const inisiatif of program.inisiatifs) {
            inisiatifs.push({
              id: inisiatif.id,
              program_id: inisiatif.program_id,
              program_nama: program.nama_program,
              nomor_program: program.nomor_program,
              rbsi_id: rbsi.id,
              rbsi_periode: rbsi.periode,
              tahun: inisiatif.tahun,
              nomor_inisiatif: inisiatif.nomor_inisiatif,
              nama_inisiatif: inisiatif.nama_inisiatif,
              label: `${inisiatif.nomor_inisiatif} - ${inisiatif.nama_inisiatif} (${program.nomor_program})`,
            });
          }
        }
      }
    }
  }

  return inisiatifs;
}

/**
 * Get RBSI by ID
 */
export async function getRbsiById(id: string, tahun?: number): Promise<BaseApiResponse<RbsiResponse>> {
  const url = tahun ? `${BASE_URL}/rbsi/${id}?tahun=${tahun}` : `${BASE_URL}/rbsi/${id}`;
  return apiRequest<RbsiResponse>(url, 'GET');
}

/**
 * Create RBSI
 */
export async function createRbsi(periode: string): Promise<BaseApiResponse<RbsiResponse>> {
  return apiRequest<RbsiResponse>(`${BASE_URL}/rbsi`, 'POST', { periode });
}

/**
 * Update RBSI
 */
export async function updateRbsi(id: string, periode: string): Promise<BaseApiResponse<RbsiResponse>> {
  return apiRequest<RbsiResponse>(`${BASE_URL}/rbsi/${id}`, 'PUT', { periode });
}

/**
 * Delete RBSI
 */
export async function deleteRbsi(id: string): Promise<BaseApiResponse<null>> {
  return apiRequest<null>(`${BASE_URL}/rbsi/${id}`, 'DELETE');
}

/**
 * Get programs by RBSI ID
 */
export async function getProgramsByRbsi(rbsiId: string, tahun?: number): Promise<BaseApiResponse<RbsiProgramResponse[]>> {
  const url = tahun ? `${BASE_URL}/rbsi/${rbsiId}/programs?tahun=${tahun}` : `${BASE_URL}/rbsi/${rbsiId}/programs`;
  return apiRequest<RbsiProgramResponse[]>(url, 'GET');
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
  return apiRequest<RbsiProgramResponse>(`${BASE_URL}/rbsi/programs`, 'POST', request);
}

export interface CreateInisiatifRequest {
  program_id: string;
  tahun: number;
  nomor_inisiatif: string;
  nama_inisiatif: string;
  group_id?: string; // Optional: link to existing initiative group
}

export interface InisiatifGroupResponse {
  id: string;
  rbsi_id: string;
  nama_inisiatif: string;
  keterangan: string | null;
  tahun_list: number[];
  nomor_inisiatif_by_year: {
    tahun: number;
    nomor_inisiatif: string;
    program_nomor: string;
  }[];
}

/**
 * Get initiative groups by RBSI ID (for linking initiatives across years)
 */
export async function getInisiatifGroups(rbsiId: string): Promise<BaseApiResponse<InisiatifGroupResponse[]>> {
  return apiRequest<InisiatifGroupResponse[]>(`${BASE_URL}/rbsi/${rbsiId}/inisiatif-groups`, 'GET');
}

/**
 * Create or Update Inisiatif
 */
export async function createInisiatif(request: CreateInisiatifRequest): Promise<BaseApiResponse<RbsiInisiatifResponse>> {
  return apiRequest<RbsiInisiatifResponse>(`${BASE_URL}/rbsi/inisiatifs`, 'POST', request);
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
  return apiRequest<RbsiProgramResponse>(`${BASE_URL}/rbsi/programs/${programId}`, 'PUT', request);
}

export interface UpdateInisiatifRequest {
  program_id: string;
  tahun: number;
  nomor_inisiatif: string;
  nama_inisiatif: string;
  group_id?: string | null; // Always sent: null = create new group, UUID = use/change to that group
}

/**
 * Update Inisiatif
 */
export async function updateInisiatif(
  inisiatifId: string,
  request: UpdateInisiatifRequest
): Promise<BaseApiResponse<RbsiInisiatifResponse>> {
  return apiRequest<RbsiInisiatifResponse>(`${BASE_URL}/rbsi/inisiatifs/${inisiatifId}`, 'PUT', request);
}

/**
 * Delete Program (soft delete)
 */
export async function deleteProgram(programId: string): Promise<BaseApiResponse<null>> {
  return apiRequest<null>(`${BASE_URL}/rbsi/programs/${programId}`, 'DELETE');
}

/**
 * Delete Inisiatif (soft delete)
 */
export async function deleteInisiatif(inisiatifId: string): Promise<BaseApiResponse<null>> {
  return apiRequest<null>(`${BASE_URL}/rbsi/inisiatifs/${inisiatifId}`, 'DELETE');
}

/**
 * Copy programs from one year to another
 */
export async function copyProgramsFromYear(
  rbsiId: string,
  fromTahun: number,
  toTahun: number
): Promise<BaseApiResponse<RbsiProgramResponse[]>> {
  return apiRequest<RbsiProgramResponse[]>(
    `${BASE_URL}/rbsi/${rbsiId}/copy-programs?fromTahun=${fromTahun}&toTahun=${toTahun}`,
    'POST'
  );
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
  let url = `${BASE_URL}/rbsi/programs/${programId}/copy?toTahun=${toTahun}`;
  if (newNomorProgram) {
    url += `&newNomorProgram=${encodeURIComponent(newNomorProgram)}`;
  }
  return apiRequest<RbsiProgramResponse>(url, 'POST');
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
  let url = `${BASE_URL}/rbsi/inisiatifs/${inisiatifId}/copy?toProgramId=${toProgramId}`;
  if (newNomorInisiatif) {
    url += `&newNomorInisiatif=${encodeURIComponent(newNomorInisiatif)}`;
  }
  return apiRequest<RbsiInisiatifResponse>(url, 'POST');
}

export interface RbsiHistoryResponse {
  tahun: number;
  programs: RbsiProgramResponse[];
}

/**
 * Get RBSI history (all years)
 */
export async function getRbsiHistory(rbsiId: string): Promise<BaseApiResponse<RbsiHistoryResponse[]>> {
  return apiRequest<RbsiHistoryResponse[]>(`${BASE_URL}/rbsi/${rbsiId}/history`, 'GET');
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

export interface BatchKepProgressUpdate {
  kep_id: string;
  group_id: string;
  yearly_progress: Array<{
    tahun: number;
    status: 'none' | 'planned' | 'realized';
  }>;
}

export interface BatchKepProgressRequest {
  updates: BatchKepProgressUpdate[];
}

export interface BatchKepProgressResponse {
  total_updated: number;
  updated_progress: KepProgressResponse[];
  message: string;
}

/**
 * Get KEP list by RBSI
 */
export async function getKepList(rbsiId: string): Promise<BaseApiResponse<RbsiKepResponse[]>> {
  return apiRequest<RbsiKepResponse[]>(`${BASE_URL}/rbsi/${rbsiId}/kep`, 'GET');
}

/**
 * Create new KEP
 */
export async function createKep(rbsiId: string, request: CreateKepRequest): Promise<BaseApiResponse<RbsiKepResponse>> {
  return apiRequest<RbsiKepResponse>(`${BASE_URL}/rbsi/${rbsiId}/kep`, 'POST', request);
}

/**
 * Get KEP progress by RBSI
 */
export async function getKepProgress(rbsiId: string, tahun?: number): Promise<BaseApiResponse<KepProgressFullResponse>> {
  const url = tahun ? `${BASE_URL}/rbsi/${rbsiId}/kep-progress?tahun=${tahun}` : `${BASE_URL}/rbsi/${rbsiId}/kep-progress`;
  return apiRequest<KepProgressFullResponse>(url, 'GET');
}

/**
 * Update KEP progress
 */
export async function updateKepProgress(
  rbsiId: string,
  kepId: string,
  request: UpdateKepProgressRequest
): Promise<BaseApiResponse<KepProgressResponse>> {
  return apiRequest<KepProgressResponse>(`${BASE_URL}/rbsi/${rbsiId}/kep/${kepId}/progress`, 'PUT', request);
}

/**
 * Batch update KEP progress (optimized for multiple updates)
 */
export async function batchUpdateKepProgress(
  rbsiId: string,
  request: BatchKepProgressRequest
): Promise<BaseApiResponse<BatchKepProgressResponse>> {
  return apiRequest<BatchKepProgressResponse>(`${BASE_URL}/rbsi/${rbsiId}/kep-progress/batch`, 'PUT', request);
}

// Monitoring API - Pre-structured data for performance
export interface RbsiMonitoringResponse {
  kep_list: KepInfo[];
  programs: ProgramMonitoring[];
}

export interface KepInfo {
  id: string;
  nomor_kep: string;
  nama_kep: string;
  tahun_pelaporan: number;
}

export interface ProgramMonitoring {
  nomor_program: string;
  versions_by_year: Record<number, ProgramVersion>;
  initiatives: InitiativeMonitoring[];
}

export interface ProgramVersion {
  id: string;
  nama_program: string;
  tahun: number;
}

export interface InitiativeMonitoring {
  group_id: string;
  nomor_inisiatif: string;
  versions_by_year: Record<number, InitiativeVersion>;
  progress_by_kep: Record<string, KepProgressInfo>;
}

export interface InitiativeVersion {
  id: string;
  nomor_inisiatif: string;
  nama_inisiatif: string;
  tahun: number;
  status_badge?: 'new' | 'modified' | 'deleted' | null;
}

export interface KepProgressInfo {
  yearly_progress: YearlyProgressInfo[];
}

export interface YearlyProgressInfo {
  tahun: number;
  status: string;
}

/**
 * Get monitoring data - Pre-structured for optimal rendering
 */
export async function getMonitoringData(rbsiId: string): Promise<BaseApiResponse<RbsiMonitoringResponse>> {
  return apiRequest<RbsiMonitoringResponse>(`${BASE_URL}/rbsi/${rbsiId}/monitoring`, 'GET');
}

// Analytics API
export interface RbsiAnalyticsRequest {
  tahun_1: number;
  tahun_2: number;
}

export interface YearChange {
  added: number;
  removed: number;
  summary: string;
  added_initiatives?: InitiativeDetail[];
  removed_initiatives?: InitiativeDetail[];
}

export interface InitiativeDetail {
  group_id: string;
  nomor_inisiatif: string;
  nama_inisiatif: string;
  nomor_program: string;
}

export interface ProgressChanges {
  has_changes: boolean;
  changes_by_year: Record<number, YearChange>;
}

export interface KepEvaluation {
  kep_id: string;
  nomor_kep: string;
  tahun_pelaporan: number;
  total: number;
  count_by_year: Record<number, number>;
  changes?: ProgressChanges;
}

export interface RbsiAnalyticsResponse {
  rbsi_id: string;
  periode: string;
  evaluations: KepEvaluation[];
}

/**
 * Get analytics data - Compare 2 KEPs for progress changes
 */
export async function getAnalytics(
  rbsiId: string,
  request: RbsiAnalyticsRequest
): Promise<BaseApiResponse<RbsiAnalyticsResponse>> {
  return apiRequest<RbsiAnalyticsResponse>(`${BASE_URL}/rbsi/${rbsiId}/analytics`, 'POST', request);
}
