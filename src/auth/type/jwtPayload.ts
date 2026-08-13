import { UserRole } from "src/common/enum"
export interface JwtPaylaod {
    sub : string,
    role : UserRole
}

export interface UserType { 
    id : string,
    role : UserRole
}