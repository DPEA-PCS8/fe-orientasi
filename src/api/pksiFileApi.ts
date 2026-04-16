import { getAuthToken } from './authApi';

const API_KEY = 'da39b92f-a1b8-46d5-a10c-d08b1cc92218';
const BASE_URL = '/api';

// ==================== RESPONSE TYPES ====================

export interface PksiFileData {
  id: string;
  pksi_id: string | null;
  file_name: string;
  original_name: string;
  content_type: string;
  file_size: number;
  blob_url: string;
  file_type: string; // T01 = Rencana PKSI, T11 = Spesifikasi Kebutuhan, T01_ND, T11_ND
  created_at: string;
  tanggal_dokumen: string | null;
  version: number;
  file_group_id: string | null;
  display_name: string | null;
  is_latest_version: boolean;
}

export interface PksiFileResponse {
  code: number;
  message: string;
  data: PksiFileData[] | PksiFileData;
}

// ==================== API FUNCTIONS ====================

/**
 * Upload files for a PKSI document
 * @param pksiId - The PKSI document ID
 * @param files - The files to upload
 * @param fileType - The file type: T01 (Rencana PKSI) or T11 (Spesifikasi Kebutuhan)
 */
export async function uploadPksiFiles(pksiId: string, files: File[], fileType: string = 'T01', tanggalDokumen?: string): Promise<PksiFileData[]> {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('No authentication token found');
  }

  const formData = new FormData();
  files.forEach((file) => {
    formData.append('files', file);
  });
  if (tanggalDokumen) {
    formData.append('tanggal_dokumen', tanggalDokumen);
  }

  const response = await fetch(`${BASE_URL}/pksi/files/upload/${pksiId}?fileType=${fileType}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'APIKey': API_KEY,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Upload failed: ${response.statusText}`);
  }

  const result: PksiFileResponse = await response.json();
  return Array.isArray(result.data) ? result.data : [result.data];
}

/**
 * Upload files to temporary storage (before PKSI is created)
 * @param sessionId - The session ID for temp files
 * @param files - The files to upload
 * @param fileType - The file type: T01 (Rencana PKSI) or T11 (Spesifikasi Kebutuhan)
 */
export async function uploadPksiTempFiles(sessionId: string, files: File[], fileType: string = 'T01', tanggalDokumen?: string): Promise<PksiFileData[]> {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('No authentication token found');
  }

  const formData = new FormData();
  files.forEach((file) => {
    formData.append('files', file);
  });
  if (tanggalDokumen) {
    formData.append('tanggal_dokumen', tanggalDokumen);
  }

  const response = await fetch(`${BASE_URL}/pksi/files/temp/upload/${sessionId}?fileType=${fileType}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'APIKey': API_KEY,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Upload failed: ${response.statusText}`);
  }

  const result: PksiFileResponse = await response.json();
  return Array.isArray(result.data) ? result.data : [result.data];
}

/**
 * Move temporary files to permanent storage after PKSI is created
 */
export async function movePksiTempFilesToPermanent(pksiId: string, sessionId: string): Promise<PksiFileData[]> {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${BASE_URL}/pksi/files/temp/move/${pksiId}/${sessionId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'APIKey': API_KEY,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Move failed: ${response.statusText}`);
  }

  const result: PksiFileResponse = await response.json();
  return Array.isArray(result.data) ? result.data : [];
}

/**
 * Delete temporary files by session ID
 */
export async function deletePksiTempFiles(sessionId: string): Promise<void> {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${BASE_URL}/pksi/files/temp/${sessionId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'APIKey': API_KEY,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Delete failed: ${response.statusText}`);
  }
}

/**
 * Get all files for a PKSI document
 */
export async function getPksiFiles(pksiId: string): Promise<PksiFileData[]> {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${BASE_URL}/pksi/files/pksi/${pksiId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'APIKey': API_KEY,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Get files failed: ${response.statusText}`);
  }

  const result: PksiFileResponse = await response.json();
  return Array.isArray(result.data) ? result.data : [];
}

/**
 * Get file by ID
 */
export async function getPksiFileById(fileId: string): Promise<PksiFileData> {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${BASE_URL}/pksi/files/${fileId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'APIKey': API_KEY,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Get file failed: ${response.statusText}`);
  }

  const result: PksiFileResponse = await response.json();
  return result.data as PksiFileData;
}

/**
 * Download file - returns blob for download
 */
export async function downloadPksiFile(fileId: string, fileName?: string): Promise<void> {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${BASE_URL}/pksi/files/download/${fileId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'APIKey': API_KEY,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Download failed: ${response.statusText}`);
  }

  const blob = await response.blob();
  
  // Create download link
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName || 'download';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/**
 * Preview file - opens in new tab
 */
export async function previewPksiFile(fileId: string): Promise<void> {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${BASE_URL}/pksi/files/download/${fileId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'APIKey': API_KEY,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Preview failed: ${response.statusText}`);
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  window.open(url, '_blank');
}

/**
 * Delete a specific file
 */
export async function deletePksiFile(fileId: string): Promise<void> {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${BASE_URL}/pksi/files/${fileId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'APIKey': API_KEY,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Delete failed: ${response.statusText}`);
  }
}

/**
 * Delete all files for a PKSI document
 */
export async function deletePksiFilesByPksiId(pksiId: string): Promise<void> {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${BASE_URL}/pksi/files/pksi/${pksiId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'APIKey': API_KEY,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Delete failed: ${response.statusText}`);
  }
}

// ==================== VERSIONING API FUNCTIONS ====================

/**
 * Upload a new version of a file
 * @param pksiId - The PKSI document ID
 * @param file - The file to upload
 * @param fileType - The file type: T01, T11, T01_ND, T11_ND
 */
export async function uploadPksiFileVersion(pksiId: string, file: File, fileType: string, tanggalDokumen?: string): Promise<PksiFileData> {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('No authentication token found');
  }

  const formData = new FormData();
  formData.append('file', file);
  if (tanggalDokumen) {
    formData.append('tanggal_dokumen', tanggalDokumen);
  }

  const response = await fetch(`${BASE_URL}/pksi/files/version/${pksiId}?fileType=${fileType}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'APIKey': API_KEY,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Upload version failed: ${response.statusText}`);
  }

  const result: PksiFileResponse = await response.json();
  return result.data as PksiFileData;
}

/**
 * Get latest version files for a PKSI document (one per file type)
 */
export async function getPksiLatestFiles(pksiId: string): Promise<PksiFileData[]> {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${BASE_URL}/pksi/files/latest/${pksiId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'APIKey': API_KEY,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Get latest files failed: ${response.statusText}`);
  }

  const result: PksiFileResponse = await response.json();
  return Array.isArray(result.data) ? result.data : [];
}

/**
 * Get file version history for a specific file type
 */
export async function getPksiFileHistory(pksiId: string, fileType: string): Promise<PksiFileData[]> {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${BASE_URL}/pksi/files/history/${pksiId}/${fileType}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'APIKey': API_KEY,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Get history failed: ${response.statusText}`);
  }

  const result: PksiFileResponse = await response.json();
  return Array.isArray(result.data) ? result.data : [];
}

/**
 * Get all versions of a file by file group ID
 */
export async function getPksiFilesByGroupId(fileGroupId: string): Promise<PksiFileData[]> {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${BASE_URL}/pksi/files/group/${fileGroupId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'APIKey': API_KEY,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Get files by group failed: ${response.statusText}`);
  }

  const result: PksiFileResponse = await response.json();
  return Array.isArray(result.data) ? result.data : [];
}

/**
 * Download a specific version of a file
 */
export async function downloadPksiFileVersion(pksiId: string, fileType: string, version: number, fileName?: string): Promise<void> {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${BASE_URL}/pksi/files/download/${pksiId}/${fileType}/${version}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'APIKey': API_KEY,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Download version failed: ${response.statusText}`);
  }

  const blob = await response.blob();
  
  // Create download link
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName || `file_v${version}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
