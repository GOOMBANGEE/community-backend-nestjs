import { HttpException, HttpStatus } from '@nestjs/common';

export const COMMUNITY_ERROR = {
  COMMUNITY_INVALID: '존재하지 않는 게시판입니다',
  PERMISSION_DENIED: '권한이 없습니다',
};

export class CommunityException extends HttpException {
  constructor(public readonly message: string) {
    super(
      {
        message: message || '알 수 없는 오류',
        statusCode: HttpStatus.BAD_REQUEST,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}
