import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

// local guard
export interface RequestUserLocal {
  id: number;
  username: string;
  role: string;

  email: string;
  registerDate: Date;
  activated: boolean;
  token: string;
}

// jwt(access, refresh) guard
export interface RequestUser {
  id: number;
  username: string;
  role: string; // admin, null

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
