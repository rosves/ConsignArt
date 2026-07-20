import { UserRole } from "src/common/enum"

export interface JwtPaylaod {
    sub : string,
    role : UserRole
}