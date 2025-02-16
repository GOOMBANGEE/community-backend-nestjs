import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export interface UserBase {
  id: number;
  username: string;
  role: string; // admin, null
}

// local guard
export interface RequestUserLocal extends UserBase {
  email: string;
  registerDate: Date;
  activated: boolean;
  token: string;
}

// jwt(access, refresh) guard
export interface RequestUser extends UserBase {
  type: string; // accessToken, refreshToken
  iat: number;
  exp: number;
}

export const RequestUser = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
    const request: Request = context.switchToHttp().getRequest();
    return request.user;
  },
);
