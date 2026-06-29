import { apiRequest } from './apiClient';

export interface TeamSummary {
  id: string;
  name: string;
}

export interface PksiCardItem {
  id: string;
  nama_pksi: string;
  nama_aplikasi: string | null;
  status: string;
  progress: string | null;
  target_go_live: string | null;
  team_name: string | null;
  jenis_pksi: string | null;
}

export interface Fs2CardItem {
  id: string;
  nama_fs2: string;
  nama_aplikasi: string | null;
  status: string;
  progres: string | null;
  progres_status: string | null;
  target_go_live: string | null;
  team_name: string | null;
  fase_pengajuan: string | null;
}

export interface MyWorkData {
  teams: TeamSummary[];
  pksi_list: PksiCardItem[];
  fs2_list: Fs2CardItem[];
}

export async function getMyWork(): Promise<MyWorkData> {
  const res = await apiRequest<MyWorkData>('/api/me/work');
  return res.data;
}
