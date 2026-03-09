import { Reflector } from '@nestjs/core';
import { RoleId } from 'src/domain/user';

export const Roles = Reflector.createDecorator<RoleId[]>();

//now we can use this decorator on top of any role based method
