import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// header: 'bearer accessToken'
@Injectable()
export class AccessGuard extends AuthGuard('jwt-access') {}
