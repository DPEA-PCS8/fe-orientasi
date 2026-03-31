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

// ==================== LOCAL STORAGE HELPER ====================
// Using localStorage as temporary storage until backend is ready

const TEAMS_STORAGE_KEY = 'orientasi_teams';

const getStoredTeams = (): Team[] => {
  try {
    const stored = localStorage.getItem(TEAMS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const setStoredTeams = (teams: Team[]): void => {
  localStorage.setItem(TEAMS_STORAGE_KEY, JSON.stringify(teams));
};

// ==================== API FUNCTIONS ====================

/**
 * Get all users available for team assignment
 */
export async function getAvailableUsers(): Promise<TeamMember[]> {
  try {
    // Try to get real users from the backend
    interface UserResponse {
      uuid?: string;
      id?: string;
      username: string;
      fullName?: string;
      full_name?: string;
      email: string;
      department?: string;
      title?: string;
      avatar?: string;
    }
    const response = await apiRequest<UserResponse[]>('/api/roles/users', 'GET');
    return response.data.map((user) => ({
      uuid: user.uuid || user.id || '',
      username: user.username,
      fullName: user.fullName || user.full_name || '',
      email: user.email,
      department: user.department || 'Unknown',
      title: user.title,
      avatar: user.avatar,
    }));
  } catch {
    console.warn('Failed to fetch users from API, using fallback');
    // Return empty array - no fallback dummy data
    return [];
  }
}

/**
 * Get all teams
 */
export async function getAllTeams(): Promise<Team[]> {
  // For now, use localStorage. Replace with API call when backend is ready
  // const response = await apiRequest<Team[]>('/api/teams', 'GET');
  // return response.data;
  return getStoredTeams();
}

/**
 * Get team by ID
 */
export async function getTeamById(teamId: string): Promise<Team | null> {
  const teams = getStoredTeams();
  return teams.find(t => t.id === teamId) || null;
}

/**
 * Create a new team
 */
export async function createTeam(request: CreateTeamRequest, availableUsers: TeamMember[]): Promise<Team> {
  const teams = getStoredTeams();
  
  const pic = request.picUuid 
    ? availableUsers.find(u => u.uuid === request.picUuid) || null
    : null;
  
  const members = request.memberUuids
    .map(uuid => availableUsers.find(u => u.uuid === uuid))
    .filter((u): u is TeamMember => u !== undefined);

  const newTeam: Team = {
    id: `team_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: request.name,
    description: request.description,
    pic,
    members,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  teams.push(newTeam);
  setStoredTeams(teams);
  
  return newTeam;
}

/**
 * Update a team
 */
export async function updateTeam(
  teamId: string, 
  request: UpdateTeamRequest, 
  availableUsers: TeamMember[]
): Promise<Team> {
  const teams = getStoredTeams();
  const teamIndex = teams.findIndex(t => t.id === teamId);
  
  if (teamIndex === -1) {
    throw new Error('Team not found');
  }

  const existingTeam = teams[teamIndex];

  const pic = request.picUuid !== undefined
    ? (request.picUuid ? availableUsers.find(u => u.uuid === request.picUuid) || null : null)
    : existingTeam.pic;

  const members = request.memberUuids !== undefined
    ? request.memberUuids
        .map(uuid => availableUsers.find(u => u.uuid === uuid))
        .filter((u): u is TeamMember => u !== undefined)
    : existingTeam.members;

  const updatedTeam: Team = {
    ...existingTeam,
    name: request.name ?? existingTeam.name,
    description: request.description ?? existingTeam.description,
    pic,
    members,
    updatedAt: new Date().toISOString(),
  };

  teams[teamIndex] = updatedTeam;
  setStoredTeams(teams);
  
  return updatedTeam;
}

/**
 * Delete a team
 */
export async function deleteTeam(teamId: string): Promise<void> {
  const teams = getStoredTeams();
  const filteredTeams = teams.filter(t => t.id !== teamId);
  setStoredTeams(filteredTeams);
}

/**
 * Add member to team
 */
export async function addMemberToTeam(
  teamId: string, 
  memberUuid: string, 
  availableUsers: TeamMember[]
): Promise<Team> {
  const teams = getStoredTeams();
  const teamIndex = teams.findIndex(t => t.id === teamId);
  
  if (teamIndex === -1) {
    throw new Error('Team not found');
  }

  const member = availableUsers.find(u => u.uuid === memberUuid);
  if (!member) {
    throw new Error('User not found');
  }

  const team = teams[teamIndex];
  if (!team.members.some(m => m.uuid === memberUuid)) {
    team.members.push(member);
    team.updatedAt = new Date().toISOString();
    setStoredTeams(teams);
  }

  return team;
}

/**
 * Remove member from team
 */
export async function removeMemberFromTeam(teamId: string, memberUuid: string): Promise<Team> {
  const teams = getStoredTeams();
  const teamIndex = teams.findIndex(t => t.id === teamId);
  
  if (teamIndex === -1) {
    throw new Error('Team not found');
  }

  const team = teams[teamIndex];
  team.members = team.members.filter(m => m.uuid !== memberUuid);
  team.updatedAt = new Date().toISOString();
  setStoredTeams(teams);

  return team;
}

/**
 * Set PIC for team
 */
export async function setTeamPic(
  teamId: string, 
  picUuid: string | null, 
  availableUsers: TeamMember[]
): Promise<Team> {
  const teams = getStoredTeams();
  const teamIndex = teams.findIndex(t => t.id === teamId);
  
  if (teamIndex === -1) {
    throw new Error('Team not found');
  }

  const team = teams[teamIndex];
  team.pic = picUuid ? availableUsers.find(u => u.uuid === picUuid) || null : null;
  team.updatedAt = new Date().toISOString();
  setStoredTeams(teams);

  return team;
}
