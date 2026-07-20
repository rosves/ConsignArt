import { UserRole } from "src/common/enum";
import { IsEmail, IsNotEmpty, IsEnum, IsString } from "class-validator"

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
    @IsEnum(UserRole)
    role!: UserRole;
}