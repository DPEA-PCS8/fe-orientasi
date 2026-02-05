export interface User {
  uuid: string;
  username: string;
  fullName: string;
  email: string;
  department: string;
  title: string;
  lastLoginAt: string;
  createdAt: string;
}

export interface UserListResponse {
  status: number;
  message: string;
  data: {
    content: User[];
    totalPages: number;
    totalElements: number;
    size: number;
    number: number; // current page index
  };
}
