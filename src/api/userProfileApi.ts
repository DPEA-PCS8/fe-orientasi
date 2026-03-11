import { apiRequest, type BaseApiResponse } from './apiClient';

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

// API function
export const getUserProfile = async (
  uuid: string
): Promise<BaseApiResponse<UserProfileResponse>> => {
  return apiRequest<UserProfileResponse>(`${BASE_URL}/users/profile/${uuid}`, 'GET');
};

export default {
  getUserProfile,
};
