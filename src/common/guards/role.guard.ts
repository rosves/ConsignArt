
import { ExecutionContext, Injectable, CanActivate } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/role.decorator';
import { UserRole } from '../enum';


@Injectable()
export class RoleGuard implements CanActivate{
    
    constructor(private reflector : Reflector){}

    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        const Role = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY,[
            context.getHandler(),
            context.getClass(),
        ]);

        if(!Role) return true;

        const request = context.switchToHttp().getRequest();

        const IsAllowed = Role.includes(request.user.role);

        if(IsAllowed){return true}

        return false
        
    }
}
