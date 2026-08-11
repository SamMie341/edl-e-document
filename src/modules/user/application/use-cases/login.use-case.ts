import {
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as userRepositoryInterface from '../../domain/repositories/user.repository.interface';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from '../dtos/login.dto';
import * as bcrypt from 'bcrypt';
import { AuditService } from 'src/modules/audit/application/services/audit.service';
import { AuditAction } from 'src/core/constants/audit-action.enum';

export interface LoginContext {
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(userRepositoryInterface.USER_REPOSITORY)
    private readonly userRepository: userRepositoryInterface.IUserRepository,
    private readonly jwtService: JwtService,
    private readonly auditService: AuditService,
  ) { }

  async execute(
    dto: LoginDto,
    context?: LoginContext,
  ): Promise<{ accessToken: string; user: any }> {
    const user = await this.userRepository.findByEmpCode(dto.empCode);

    if (!user) {
      await this.auditService.log({
        action: AuditAction.LOGIN,
        details: `ເຂົ້າສູ່ລະບົບບໍ່ສຳເລັດ: ບໍ່ມີລະຫັດພະນັກງານ (${dto.empCode}) ໃນລະບົບ`,
        status: 'FAILED',
        entityType: 'USER',
        ipAddress: context?.ipAddress,
        userAgent: context?.userAgent,
        payload: { empCode: dto.empCode, reason: 'USER_NOT_FOUND' },
      });
      throw new NotFoundException('ບໍ່ມີບັນຊີຜູ້ໃຊ້ນີ້ໃນລະບົບ HRMS...');
    }

    const primaryDiv =
      user.divisions?.find((d: any) => d.isPrimary) || user.divisions?.[0];

    if (user.status === 'P') {
      const reasonMsg = 'ບັນຊີຂອງທ່ານຍັງບໍ່ທັນອະນຸມັດ';
      await this.auditService.log({
        action: AuditAction.LOGIN,
        details: `ເຂົ້າສູ່ລະບົບບໍ່ສຳເລັດ: ${reasonMsg} (EmpCode: ${user.empCode})`,
        status: 'FAILED',
        entityId: user.id,
        entityType: 'USER',
        actorId: user.id,
        departmentId: user.departmentId,
        divisionId: primaryDiv ? primaryDiv.id : null,
        ipAddress: context?.ipAddress,
        userAgent: context?.userAgent,
        payload: { empCode: dto.empCode, status: user.status, reason: reasonMsg },
      });
      throw new UnauthorizedException(reasonMsg);
    } else if (user.status !== 'A') {
      const reasonMsg = 'ບັນຊີຂອງທ່ານຖືກລະງັບການນຳໃຊ້';
      await this.auditService.log({
        action: AuditAction.LOGIN,
        details: `ເຂົ້າສູ່ລະບົບບໍ່ສຳເລັດ: ${reasonMsg} (EmpCode: ${user.empCode})`,
        status: 'FAILED',
        entityId: user.id,
        entityType: 'USER',
        actorId: user.id,
        departmentId: user.departmentId,
        divisionId: primaryDiv ? primaryDiv.id : null,
        ipAddress: context?.ipAddress,
        userAgent: context?.userAgent,
        payload: { empCode: dto.empCode, status: user.status, reason: reasonMsg },
      });
      throw new UnauthorizedException(reasonMsg);
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      await this.auditService.log({
        action: AuditAction.LOGIN,
        details: `ເຂົ້າສູ່ລະບົບບໍ່ສຳເລັດ: ລະຫັດຜ່ານບໍ່ຖືກຕ້ອງ (EmpCode: ${user.empCode})`,
        status: 'FAILED',
        entityId: user.id,
        entityType: 'USER',
        actorId: user.id,
        departmentId: user.departmentId,
        divisionId: primaryDiv ? primaryDiv.id : null,
        ipAddress: context?.ipAddress,
        userAgent: context?.userAgent,
        payload: { empCode: dto.empCode, reason: 'INVALID_PASSWORD' },
      });
      throw new UnauthorizedException('ລະຫັດພະນັກງານ ຫຼື ລະຫັດຜ່ານບໍ່ຖືກຕ້ອງ...');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      firstNameLa: user.firstNameLa,
      lastNameLa: user.lastNameLa,
      role: user.role,
      departmentId: user.departmentId,
      divisionId: primaryDiv ? primaryDiv.id : null,
      officeId: user.officeId,
      unitId: user.unitId,
    };

    await this.auditService.log({
      action: AuditAction.LOGIN,
      details: `ເຂົ້າສູ່ລະບົບສຳເລັດ: ${user.firstNameLa || ''} ${user.lastNameLa || ''} (EmpCode: ${user.empCode})`,
      status: 'SUCCESS',
      entityId: user.id,
      entityType: 'USER',
      actorId: user.id,
      departmentId: user.departmentId,
      divisionId: primaryDiv ? primaryDiv.id : null,
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
      payload: { empCode: user.empCode, role: user.role },
    });

    return {
      accessToken: this.jwtService.sign(payload),
      user: user.getPublicProfile(),
    };
  }
}
