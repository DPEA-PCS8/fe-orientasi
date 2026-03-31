import { apiRequest } from './apiClient';

// ==================== TYPES ====================

export interface TeamMember {
  uuid: string;
  username: string;
  fullName: string;
  email: string;
  department: string;
  title?: string;
  avatar?: string;
}

export interface Team {
  id: string;
  name: string;
  description: string;
  pic: TeamMember | null;
  members: TeamMember[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateTeamRequest {
  name: string;
  description: string;
  picUuid: string | null;
  memberUuids: string[];
}

export interface UpdateTeamRequest {
  name?: string;
  description?: string;
  picUuid?: string | null;
  memberUuids?: string[];
}

// ==================== API RESPONSE TYPES ====================

interface ApiTeamMember {
  uuid: string;
  username: string;
  full_name: string;
  email: string;
  department: string;
  title?: string;
}

interface ApiTeamResponse {
  id: string;
  name: string;
  description: string;
  pic: ApiTeamMember | null;
  members: ApiTeamMember[];
  created_at: string;
  updated_at: string;
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Map API team member response to frontend TeamMember
 */
function mapApiMemberToTeamMember(apiMember: ApiTeamMember): TeamMember {
  return {
    uuid: apiMember.uuid,
    username: apiMember.username,
    fullName: apiMember.full_name,
    email: apiMember.email,
    department: apiMember.department,
    title: apiMember.title,
  };
}

/**
 * Map API team response to frontend Team
 */
function mapApiTeamToTeam(apiTeam: ApiTeamResponse): Team {
  return {
    id: apiTeam.id,
    name: apiTeam.name,
    description: apiTeam.description || '',
    pic: apiTeam.pic ? mapApiMemberToTeamMember(apiTeam.pic) : null,
    members: apiTeam.members?.map(mapApiMemberToTeamMember) || [],
    createdAt: apiTeam.created_at,
    updatedAt: apiTeam.updated_at,
  };
}

// ==================== API FUNCTIONS ====================

/**
 * Get all users available for team assignment
 */
export async function getAvailableUsers(): Promise<TeamMember[]> {
  const response = await apiRequest<ApiTeamMember[]>('/api/teams/available-users', 'GET');
  return response.data.map(mapApiMemberToTeamMember);
}

/**
 * Get all teams
 */
export async function getAllTeams(): Promise<Team[]> {
  const response = await apiRequest<ApiTeamResponse[]>('/api/teams', 'GET');
  return response.data.map(mapApiTeamToTeam);
}

/**
 * Get team by ID
 */
export async function getTeamById(teamId: string): Promise<Team | null> {
  try {
    const response = await apiRequest<ApiTeamResponse>(`/api/teams/${teamId}`, 'GET');
    return mapApiTeamToTeam(response.data);
  } catch {
    return null;
  }
}

/**
 * Create a new team
 */
export async function createTeam(request: CreateTeamRequest): Promise<Team> {
  const payload = {
    name: request.name,
    description: request.description,
    pic_uuid: request.picUuid,
    member_uuids: request.memberUuids,
  };
  
  const response = await apiRequest<ApiTeamResponse>('/api/teams', 'POST', payload);
  return mapApiTeamToTeam(response.data);
}

/**
 * Update a team
 */
export async function updateTeam(teamId: string, request: UpdateTeamRequest): Promise<Team> {
  const payload = {
    name: request.name,
    description: request.description,
    pic_uuid: request.picUuid,
    member_uuids: request.memberUuids,
  };
  
  const response = await apiRequest<ApiTeamResponse>(`/api/teams/${teamId}`, 'PUT', payload);
  return mapApiTeamToTeam(response.data);
}

/**
 * Delete a team
 */
export async function deleteTeam(teamId: string): Promise<void> {
  await apiRequest<void>(`/api/teams/${teamId}`, 'DELETE');}