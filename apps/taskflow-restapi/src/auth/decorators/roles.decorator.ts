import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@taskflow/shared';

export const ROLES_KEY = 'roles';

/**
 * Attaches required roles metadata to route handlers or controllers.
 * Usage: @Roles(UserRole.TEACHER, UserRole.ADMIN)
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
