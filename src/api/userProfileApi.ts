import { getAuthToken } from './authApi';

const API_KEY = 'da39b92f-a1b8-46d5-a10c-d08b1cc92218';
const BASE_URL = '/api';

// Type definitions
export type UserProfileResponse = {
  uuid: string;
  full_name: string;
  departemen: string;
  title: string;
  email: string;
  pksi_list: unknown[];
};

export type BaseApiResponse<T> = {
  status: number;
  message: string;
  data: T;
};

// API function
export const getUserProfile = async (
  uuid: string
): Promise<BaseApiResponse<UserProfileResponse>> => {
  const token = getAuthToken();

  const response = await fetch(`${BASE_URL}/users/profile/${uuid}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      APIKey: API_KEY,
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch user profile');
  }

  return data;
};

export default {
  getUserProfile,
};
