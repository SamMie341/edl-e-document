import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './presentation/controllers/auth.controller';
import { LoginUseCase } from './application/use-cases/login.use-case';
import { USER_REPOSITORY } from './domain/repositories/user.repository.interface';
import { PrismaUserRepository } from './infrastructure/repositories/prisma-user.repository';
import { UserController } from './presentation/controllers/user.controller';
import { ChangePasswordUseCase } from './application/use-cases/change-password.use-case';
import { ResetPasswordUseCase } from './application/use-cases/reset-password.use-case';
import { AuditModule } from '../audit/audit.module';
import { SyncUserFromHrmUseCase } from './application/use-cases/sync-user-from-hrm.use-case';
import { GetProfileUseCase } from './application/use-cases/get-profile.use-case';
import { GetAllUsersUseCase } from './application/use-cases/get-all-users.use-case';
import { UpdateUserRoleUseCase } from './application/use-cases/update-user-role.use-case';
import { RegisterUseCase } from './application/use-cases/register.use-case';
import { ApproveUserUseCase } from './application/use-cases/approve-user.use-case';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1h' },
    }),
    AuditModule,
  ],
  controllers: [AuthController, UserController],
  providers: [
    RegisterUseCase,
    ApproveUserUseCase,
    LoginUseCase,
    SyncUserFromHrmUseCase,
    ChangePasswordUseCase,
    ResetPasswordUseCase,
    GetProfileUseCase,
    GetAllUsersUseCase,
    UpdateUserRoleUseCase,
    {
      provide: USER_REPOSITORY,
      useClass: PrismaUserRepository,
    },
  ],
  exports: [USER_REPOSITORY],
})
export class UserModule {}
