import {
  Body,
  Controller,
  Delete,
  Patch,
  Res,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { RequestUser } from '../auth/decorator/user.decorator';
import { UpdateUserDto } from './dto/update-user.dto';
import { Response } from 'express';
import { AccessGuard } from '../auth/guard/access.guard';
import { AuthService } from '../auth/auth.service';
import { USER_ERROR, UserException } from '../common/exception/user.exception';

@Controller('user')
@UseGuards(AccessGuard)
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
  ) {}

  // /user
  @Patch()
  async update(
    @RequestUser() requestUser: RequestUser,
    @Body() updateUserDto: UpdateUserDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    if (!requestUser || requestUser.role?.includes('admin')) {
      throw new UserException(USER_ERROR.PERMISSION_DENIED);
    }
    const user = await this.authService.validateRequestUser(requestUser);
    await this.userService.update(user, updateUserDto, response);
  }

  // /user
  // return: clear-cookie('refreshToken')
  @Delete()
  async delete(
    @RequestUser() requestUser: RequestUser,
    @Res({ passthrough: true }) response: Response,
  ) {
    if (!requestUser || requestUser.role?.includes('admin')) {
      throw new UserException(USER_ERROR.PERMISSION_DENIED);
    }
    const user = await this.authService.validateRequestUser(requestUser);
    await this.userService.delete(user, response);
  }
}
