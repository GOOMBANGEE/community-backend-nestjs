import { HttpException, HttpStatus } from '@nestjs/common';

export const COMMENT_ERROR = {
  COMMENT_INVALID: '존재하지 않는 댓글입니다',
  PERMISSION_DENIED: '권한이 없습니다',
  PASSWORD_INVALID: '비밀번호가 올바르지 않습니다',
};

export class CommentException extends HttpException {
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
