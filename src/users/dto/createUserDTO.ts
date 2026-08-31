import { UserRole } from "src/common/enum";
import { IsEmail, IsNotEmpty, IsIn, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateUserDTO {
    @ApiProperty({ example: 'galerie.louvre@consignart.com' })
    @IsEmail()
    email!: string;

    @ApiProperty({ example: 'Password123!' })
    @IsNotEmpty()
    @IsString()
    password!: string;

    @ApiProperty({ example: 'Galerie' })
    @IsNotEmpty()
    @IsString()
    firstName!: string;

    @ApiProperty({ example: 'Du Louvre' })
    @IsNotEmpty()
    @IsString()
    lastName!: string;

    @ApiProperty({ example: UserRole.GALLERY, enum: [UserRole.ARTIST, UserRole.COLLECTOR, UserRole.GALLERY] })
    @IsIn([UserRole.ARTIST, UserRole.COLLECTOR, UserRole.GALLERY])
    role!: UserRole;
}