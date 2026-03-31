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
export async function uploadPksiTempFiles(sessionId: string, files: File[]): Promise<PksiFileData[]> {
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
export async function downloadPksiFile(fileId: string): Promise<Blob> {
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

  return response.blob();
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
