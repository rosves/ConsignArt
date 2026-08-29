import { CreateUserDTO } from "./createUserDTO";

export class CreateUserInternalDTO extends CreateUserDTO {
    isActive!: boolean;
}