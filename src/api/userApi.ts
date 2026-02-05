import type { UserListResponse } from '../types/User';

// API_BASE_URL will be used when connecting to real backend
// const API_BASE_URL = '/api';

const DUMMY_USERS = [
  {
    uuid: '1',
    username: 'jdoe',
    fullName: 'John Doe',
    email: 'john.doe@example.com',
    department: 'IT',
    title: 'Software Engineer',
    lastLoginAt: '2023-10-27T10:00:00Z',
    createdAt: '2023-01-01T00:00:00Z'
  },
  {
    uuid: '2',
    username: 'asmith',
    fullName: 'Alice Smith',
    email: 'alice.smith@example.com',
    department: 'HR',
    title: 'HR Manager',
    lastLoginAt: '2023-10-26T14:30:00Z',
    createdAt: '2023-02-15T00:00:00Z'
  },
  {
    uuid: '3',
    username: 'bwayne',
    fullName: 'Bruce Wayne',
    email: 'bruce.wayne@example.com',
    department: 'Finance',
    title: 'CFO',
    lastLoginAt: '2023-10-25T09:15:00Z',
    createdAt: '2023-03-10T00:00:00Z'
  }
];

export const getUsers = async (
  page: number = 0,
  size: number = 10,
  keyword: string = '',
  sortBy: string = 'createdAt'
): Promise<UserListResponse> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Filter dummy data
  let filteredUsers = DUMMY_USERS.filter(user => 
    user.username.toLowerCase().includes(keyword.toLowerCase()) ||
    user.fullName.toLowerCase().includes(keyword.toLowerCase())
  );

  // Simple sorting simulation
  if (sortBy) {
    filteredUsers.sort((a, b) => {
      const fieldA = (a as any)[sortBy];
      const fieldB = (b as any)[sortBy];
      if (fieldA < fieldB) return -1;
      if (fieldA > fieldB) return 1;
      return 0;
    });
  }

  // Pagination simulation
  const start = page * size;
  const end = start + size;
  const content = filteredUsers.slice(start, end);

  return {
    status: 200,
    message: 'Success',
    data: {
      content: content,
      totalPages: Math.ceil(filteredUsers.length / size),
      totalElements: filteredUsers.length,
      size: size,
      number: page
    }
  };
/*
  const queryParams = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
    sort: sortBy,
    keyword: keyword,
  });

  try {
    const response = await fetch(`${API_BASE_URL}/users?${queryParams}`);
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status} - ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to fetch users:', error);
    throw error;
  }
*/
};
