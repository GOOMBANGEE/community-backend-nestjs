import { HttpException, HttpStatus } from '@nestjs/common';

export const POST_ERROR = {
  POST_INVALID: '존재하지 않는 게시글입니다',
  PERMISSION_DENIED: '권한이 없습니다',
  PASSWORD_INVALID: '비밀번호가 올바르지 않습니다',
  RATE_PLUS_ALREADY: '이미 추천하였습니다',
  RATE_MINUS_ALREADY: '이미 비추천하였습니다',
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
