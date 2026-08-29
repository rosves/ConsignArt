import { UserRole } from "src/common/enum";
import { IsEmail, IsNotEmpty, IsIn, IsString } from "class-validator"

export class CreateUserDTO {
    @IsEmail()
    email!: string;
    @IsNotEmpty()
    @IsString()
    password!: string;
    @IsNotEmpty()
    @IsString()
    firstName!: string;
    @IsNotEmpty()
    @IsString()
    lastName!: string;
    @IsIn([UserRole.ARTIST,UserRole.COLLECTOR, UserRole.GALLERY])
    role!: UserRole;
}