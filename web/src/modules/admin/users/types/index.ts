export interface Role {
  id: string;
  name: string;
  description: string | null;
}

export interface UserRole {
  roleId: string;
  role: Role;
}

export interface User {
  id: string;
  email: string;
  username: string | null;
  full_name: string | null;
  avatar: string | null;
  userRoles: UserRole[];
  created_at: string;
}

export interface AdminUserState {
  users: User[];
  roles: Role[];
  loading: boolean;
  error: string | null;
}
