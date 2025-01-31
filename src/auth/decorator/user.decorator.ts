import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface RequestUser {
  id: number;
  username: string;
  type: string;
  role: string;
  iat: number;
  exp: number;
}

export const RequestUser = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();
    return request.user;
  },
);
