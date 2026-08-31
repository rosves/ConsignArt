import { IsEmail, IsNotEmpty, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class LoginDTO {
    @ApiProperty({ example: 'galerie.louvre@consignart.com' })
    @IsEmail()
    email!: string;

    @ApiProperty({ example: 'Password123!' })
    @IsNotEmpty()
    @IsString()
    password!: string;
}