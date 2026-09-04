import { UserRole } from '@taskflow/shared';

export interface AuthResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    name?: string;
    role?: UserRole;
    phone?: string;
    isApproved?: boolean;
  };
}
