//try to write it yourself

import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { Roles } from './roles.decorator';

//step 1: get the roles from the methos and decorator using the reflector and the get method in it
//step 2: if it had nothing then anyone could enter
//step 3: match the role form the reflector to ones that are in the user object trying to access the route

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const roles = this.reflector.get(Roles, context.getHandler()); //roles: from the decorator as it stores the array and the other param points to the method where we need to look into its decorator
    if (!roles) {
      return true;
    }
    const req = context.switchToHttp().getRequest();

    return roles.includes(req.user.roleId);
  }
}
