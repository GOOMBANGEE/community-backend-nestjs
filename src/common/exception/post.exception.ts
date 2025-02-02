import { HttpException, HttpStatus } from '@nestjs/common';

export const POST_ERROR = {
  COMMUNITY_INVALID: '존재하지 않는 게시판입니다',
  PERMISSION_DENIED: '권한이 없습니다',
  PASSWORD_INVALID: '비밀번호가 올바르지 않습니다',
};

export class PostException extends HttpException {
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
