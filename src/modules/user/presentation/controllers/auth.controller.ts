import { Body, Controller, Headers, Ip, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { LoginUseCase } from '../../application/use-cases/login.use-case';
import { LoginDto } from '../../application/dtos/login.dto';
import { SyncUserFromHrmUseCase } from '../../application/use-cases/sync-user-from-hrm.use-case';
import { RegisterDto } from '../../application/dtos/register.dto';
import { RegisterUseCase } from '../../application/use-cases/register.use-case';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly registerUseCase: RegisterUseCase,
  ) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    const result = await this.registerUseCase.execute(dto);
    return {
      message: 'ລົງທະບຽນສຳເລັດ',
      data: result,
    };
  }

  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    const rawIp = req.headers['x-forwarded-for'];
    const ipAddress = rawIp
      ? (Array.isArray(rawIp) ? rawIp[0] : rawIp.split(',')[0]).trim()
      : ip;

    const result = await this.loginUseCase.execute(dto, {
      ipAddress,
      userAgent,
    });
    return {
      message: 'ເຂົ້າສູ່ລະບົບສຳເລັດ',
      data: result,
    };
  }
}
