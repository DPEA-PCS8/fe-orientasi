import { getAuthToken } from './authApi';

const API_KEY = 'da39b92f-a1b8-46d5-a10c-d08b1cc92218';
const BASE_URL = '/api';

// ==================== RESPONSE TYPES ====================

export interface Fs2FileData {
  id: string;
  fs2_id: string | null;
  file_name: string;
  original_name: string;
  content_type: string;
  file_size: number;
  blob_url: string;
  file_type: string; // ND, FS2, CD, FS2A, FS2B, F45, F46, NDBA
  created_at: string;
}

export interface Fs2FileResponse {
  code: number;
  message: string;
  data: Fs2FileData[] | Fs2FileData;
}

// ==================== API FUNCTIONS ====================

/**
 * Upload files for a F.S.2 document
 * @param fs2Id - The F.S.2 document ID
 * @param files - The files to upload
 * @param fileType - The file type: ND, FS2, CD, FS2A, FS2B, F45, F46, NDBA
 */
export async function uploadFs2Files(fs2Id: string, files: File[], fileType: string = 'FS2'): Promise<Fs2FileData[]> {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('No authentication token found');
  }

  const formData = new FormData();
  files.forEach((file) => {
    formData.append('files', file);
  });

  const response = await fetch(`${BASE_URL}/fs2/files/upload/${fs2Id}?fileType=${fileType}`, {
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

  const result: Fs2FileResponse = await response.json();
  return Array.isArray(result.data) ? result.data : [result.data];
}

/**
 * Upload files to temporary storage (before F.S.2 is created)
 * @param sessionId - The session ID for temp files
 * @param files - The files to upload
 * @param fileType - The file type: ND, FS2, CD, FS2A, FS2B, F45, F46, NDBA
 */
export async function uploadFs2TempFiles(sessionId: string, files: File[], fileType: string = 'FS2'): Promise<Fs2FileData[]> {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('No authentication token found');
  }

  const formData = new FormData();
  files.forEach((file) => {
    formData.append('files', file);
  });

  const response = await fetch(`${BASE_URL}/fs2/files/temp/upload/${sessionId}?fileType=${fileType}`, {
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

  const result: Fs2FileResponse = await response.json();
  return Array.isArray(result.data) ? result.data : [result.data];
}

/**
 * Move temporary files to permanent storage after F.S.2 is created
 */
export async function moveFs2TempFilesToPermanent(fs2Id: string, sessionId: string): Promise<Fs2FileData[]> {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${BASE_URL}/fs2/files/temp/move/${fs2Id}/${sessionId}`, {
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

  const result: Fs2FileResponse = await response.json();
  return Array.isArray(result.data) ? result.data : [];
}

/**
 * Delete temporary files by session ID
 */
export async function deleteFs2TempFiles(sessionId: string): Promise<void> {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${BASE_URL}/fs2/files/temp/${sessionId}`, {
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
 * Get all files for a F.S.2 document
 */
export async function getFs2Files(fs2Id: string): Promise<Fs2FileData[]> {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${BASE_URL}/fs2/files/fs2/${fs2Id}`, {
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

  const result: Fs2FileResponse = await response.json();
  return Array.isArray(result.data) ? result.data : [];
}

/**
 * Get file by ID
 */
export async function getFs2FileById(fileId: string): Promise<Fs2FileData> {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${BASE_URL}/fs2/files/${fileId}`, {
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

  const result: Fs2FileResponse = await response.json();
  return result.data as Fs2FileData;
}

/**
 * Download file - triggers browser download
 */
export async function downloadFs2File(fileId: string, fileName?: string): Promise<void> {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${BASE_URL}/fs2/files/download/${fileId}`, {
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
 * Delete a specific file
 */
export async function deleteFs2File(fileId: string): Promise<void> {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${BASE_URL}/fs2/files/${fileId}`, {
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
 * Delete all files for a F.S.2 document
 */
export async function deleteFs2FilesByFs2Id(fs2Id: string): Promise<void> {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${BASE_URL}/fs2/files/fs2/${fs2Id}`, {
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
