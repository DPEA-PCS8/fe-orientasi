import { apiRequest } from './apiClient';

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
