import { getAuthToken } from './authApi';
import type { BaseApiResponse } from './rbsiApi';

const API_KEY = 'da39b92f-a1b8-46d5-a10c-d08b1cc92218';
const BASE_URL = '/api';

export interface BidangData {
  id: string;
  kode_bidang: string;
  nama_bidang: string;
  created_at?: string;
  updated_at?: string;
}

export interface BidangRequest {
  kode_bidang: string;
  nama_bidang: string;
}

async function apiRequest<T>(
  url: string,
  method: string = 'GET',
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

export async function getAllBidang(): Promise<BidangData[]> {
  const response = await apiRequest<BidangData[]>(
    `${BASE_URL}/arsitektur/bidang`,
    'GET'
  );
  return response.data || [];
}

export async function searchBidang(query: string): Promise<BidangData[]> {
  const response = await apiRequest<BidangData[]>(
    `${BASE_URL}/arsitektur/bidang?search=${encodeURIComponent(query)}`,
    'GET'
  );
  return response.data || [];
}

export async function getBidangById(id: string): Promise<BidangData> {
  const response = await apiRequest<BidangData>(
    `${BASE_URL}/arsitektur/bidang/${id}`,
    'GET'
  );
  return response.data;
}

export async function createBidang(bidang: BidangRequest): Promise<BidangData> {
  const response = await apiRequest<BidangData>(
    `${BASE_URL}/arsitektur/bidang`,
    'POST',
    bidang
  );
  return response.data;
}

export async function updateBidang(
  id: string,
  bidang: BidangRequest
): Promise<BidangData> {
  const response = await apiRequest<BidangData>(
    `${BASE_URL}/arsitektur/bidang/${id}`,
    'PUT',
    bidang
  );
  return response.data;
}

export async function deleteBidang(id: string): Promise<void> {
  await apiRequest<null>(`${BASE_URL}/arsitektur/bidang/${id}`, 'DELETE');
}
