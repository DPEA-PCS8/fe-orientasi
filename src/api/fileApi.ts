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
  file_type?: string;
  created_at: string;
}

export interface PksiFileResponse {
  code: number;
  message: string;
  data: PksiFileData[] | PksiFileData;
}

// ==================== API FUNCTIONS ====================

/**
 * Upload files for a PKSI document
 */
export async function uploadPksiFiles(pksiId: string, files: File[]): Promise<PksiFileData[]> {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('No authentication token found');
  }

  const formData = new FormData();
  files.forEach((file) => {
    formData.append('files', file);
  });

  const response = await fetch(`${BASE_URL}/pksi/files/upload/${pksiId}`, {
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
 */
export async function uploadTempFiles(sessionId: string, files: File[]): Promise<PksiFileData[]> {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('No authentication token found');
  }

  const formData = new FormData();
  files.forEach((file) => {
    formData.append('files', file);
  });

  const response = await fetch(`${BASE_URL}/pksi/files/temp/upload/${sessionId}`, {
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
export async function moveTempFilesToPermanent(pksiId: string, sessionId: string): Promise<PksiFileData[]> {
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
export async function deleteTempFiles(sessionId: string): Promise<void> {
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
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to get files: ${response.statusText}`);
  }

  const result: PksiFileResponse = await response.json();
  return Array.isArray(result.data) ? result.data : [];
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
    throw new Error(errorData.message || `Failed to delete file: ${response.statusText}`);
  }
}

/**
 * Get download URL for a file
 */
export function getFileDownloadUrl(fileId: string): string {
  return `${BASE_URL}/pksi/files/download/${fileId}`;
}

/**
 * Download a file (triggers browser download)
 */
export async function downloadPksiFile(fileId: string, fileName: string): Promise<void> {
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
    throw new Error(errorData.message || `Failed to download file: ${response.statusText}`);
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

/**
 * Preview a file - opens in new tab
 */
export async function previewPksiFile(fileId: string): Promise<void> {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${BASE_URL}/pksi/files/preview/${fileId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'APIKey': API_KEY,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to preview file: ${response.statusText}`);
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  window.open(url, '_blank');
}

/**
 * Format file size to human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
