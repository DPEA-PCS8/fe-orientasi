import { apiRequest, type BaseApiResponse } from './apiClient';

const BASE_URL = '/api';

// ==================== TYPES ====================

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE';

export interface AuditLogData {
  id: string;
  entity_name: string;
  entity_id: string;
  action: AuditAction;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  changed_fields: string[] | null;
  user_id: string | null;
  username: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface AuditLogSearchResponse {
  content: AuditLogData[];
  total_elements: number;
  total_pages: number;
  page: number;
  size: number;
}

export interface AuditLogSearchParams {
  entity_name?: string;
  entity_id?: string;
  action?: AuditAction;
  user_id?: string;
  username?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  size?: number;
}

export interface AuditStatistics {
  total_count: number;
  by_entity: Record<string, number>;
  by_action: Record<string, number>;
}

export interface EntityOption {
  value: string;
  label: string;
}

// ==================== CONSTANTS ====================

export const ACTION_LABELS: Record<AuditAction, { label: string; color: 'success' | 'warning' | 'error' }> = {
  CREATE: { label: 'Create', color: 'success' },
  UPDATE: { label: 'Update', color: 'warning' },
  DELETE: { label: 'Delete', color: 'error' },
};

// ==================== API FUNCTIONS ====================

/**
 * Search audit logs with filters and pagination
 */
export async function searchAuditLogs(
  params: AuditLogSearchParams
): Promise<BaseApiResponse<AuditLogSearchResponse>> {
  const queryParams = new URLSearchParams();
  if (params.entity_name) queryParams.append('entity_name', params.entity_name);
  if (params.entity_id) queryParams.append('entity_id', params.entity_id);
  if (params.action) queryParams.append('action', params.action);
  if (params.user_id) queryParams.append('user_id', params.user_id);
  if (params.username) queryParams.append('username', params.username);
  if (params.start_date) queryParams.append('start_date', params.start_date);
  if (params.end_date) queryParams.append('end_date', params.end_date);
  if (params.page !== undefined) queryParams.append('page', params.page.toString());
  if (params.size !== undefined) queryParams.append('size', params.size.toString());

  return apiRequest<AuditLogSearchResponse>(
    `${BASE_URL}/audit-logs/search?${queryParams.toString()}`,
    'GET'
  );
}

/**
 * Get all audit logs with pagination (no filters)
 */
export async function getAllAuditLogs(
  page: number = 0,
  size: number = 20
): Promise<BaseApiResponse<AuditLogSearchResponse>> {
  return apiRequest<AuditLogSearchResponse>(
    `${BASE_URL}/audit-logs?page=${page}&size=${size}`,
    'GET'
  );
}

/**
 * Get audit log by ID
 */
export async function getAuditLogById(id: string): Promise<BaseApiResponse<AuditLogData>> {
  return apiRequest<AuditLogData>(
    `${BASE_URL}/audit-logs/${id}`,
    'GET'
  );
}

/**
 * Get audit logs for a specific entity
 */
export async function getAuditLogsByEntity(
  entityName: string,
  entityId: string,
  page: number = 0,
  size: number = 20
): Promise<BaseApiResponse<AuditLogSearchResponse>> {
  return apiRequest<AuditLogSearchResponse>(
    `${BASE_URL}/audit-logs/entity/${entityName}/${entityId}?page=${page}&size=${size}`,
    'GET'
  );
}

/**
 * Get recent audit logs for a specific entity (last 10)
 */
export async function getRecentAuditLogs(
  entityName: string,
  entityId: string
): Promise<BaseApiResponse<AuditLogData[]>> {
  return apiRequest<AuditLogData[]>(
    `${BASE_URL}/audit-logs/entity/${entityName}/${entityId}/recent`,
    'GET'
  );
}

/**
 * Get audit statistics
 */
export async function getAuditStatistics(): Promise<BaseApiResponse<AuditStatistics>> {
  return apiRequest<AuditStatistics>(
    `${BASE_URL}/audit-logs/statistics`,
    'GET'
  );
}

/**
 * Get distinct entity names from audit logs
 */
export async function getDistinctEntityNames(): Promise<BaseApiResponse<string[]>> {
  return apiRequest<string[]>(
    `${BASE_URL}/audit-logs/entities`,
    'GET'
  );
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Format date to locale string
 */
export function formatAuditDate(dateString: string): string {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return date.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
}

/**
 * Convert entity name to readable label (fallback if not found)
 */
export function getEntityLabel(entityName: string): string {
  // Map common entity names to readable labels
  const labelMap: Record<string, string> = {
    'Aplikasi': 'Aplikasi',
    'Bidang': 'Bidang',
    'Skpa': 'SKPA',
    'User': 'User',
    'Role': 'Role',
    'RolePermission': 'Role Permission',
    'Rbsi': 'RBSI',
    'RbsiProgram': 'Program RBSI',
    'RbsiInisiatif': 'Inisiatif RBSI',
    'ArsitekturRbsi': 'Arsitektur RBSI',
    'PksiDocument': 'Dokumen PKSI',
  };
  return labelMap[entityName] || entityName;
}

/**
 * Convert entity names array to EntityOption array
 */
export function mapEntityNamesToOptions(entityNames: string[]): EntityOption[] {
  return entityNames.map(name => ({
    value: name,
    label: getEntityLabel(name),
  }));
}

/**
 * Truncate user agent string for display
 */
export function truncateUserAgent(userAgent: string | null, maxLength: number = 50): string {
  if (!userAgent) return '-';
  if (userAgent.length <= maxLength) return userAgent;
  return userAgent.substring(0, maxLength) + '...';
}
