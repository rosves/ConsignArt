import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../enum';

export const ROLES_KEY = 'roles';
// ...roles : permets d'avoir plusieurs rôles ! 
export const Roles = (...roles : UserRole[]) => SetMetadata(ROLES_KEY,roles);