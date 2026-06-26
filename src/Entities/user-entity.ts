import { UserRole } from "src/common/enum";

export class User { 
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  hashedRefreshToken: string | null;
}

