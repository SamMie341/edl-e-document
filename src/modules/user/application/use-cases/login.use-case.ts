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
import { AuditLog } from 'src/modules/audit/domain/entities/audit-log.entity';
import * as auditLogRepositoryInterface from 'src/modules/audit/domain/repositories/audit-log.repository.interface';
import { v4 as uuidv4 } from 'uuid';
import { AuditAction } from 'src/core/constants/audit-action.enum';

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(userRepositoryInterface.USER_REPOSITORY)
    private readonly userRepository: userRepositoryInterface.IUserRepository,
    private readonly jwtService: JwtService,
    @Inject(auditLogRepositoryInterface.AUDIT_LOG_REPOSITORY)
    private readonly auditLogRepository: auditLogRepositoryInterface.IAuditLogRepository,
  ) {}

  async execute(dto: LoginDto): Promise<{ accessToken: string; user: any }> {
    const user = await this.userRepository.findByEmpCode(dto.empCode);

    if (!user) {
      throw new NotFoundException('ບໍ່ມີບັນຊີຜູ້ໃຊ້ນີ້ໃນລະບົບ HRMS...');
    }

    if (user.status === 'P') {
      throw new UnauthorizedException('ບັນຊີຂອງທ່ານຍັງບໍ່ທັນອະນຸມັດ');
    } else if (user.status !== 'A') {
      throw new UnauthorizedException('ບັນຊີຂອງທ່ານຖືກລະງັບການນຳໃຊ້');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('ລະຫັດພະນັກງານ ຫຼື ລະຫັດຜ່ານບໍ່ຖືກຕ້ອງ...');
    }

    const primaryDiv = user.divisions?.find((d: any) => d.isPrimary) || user.divisions?.[0];
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      addressId: user.addressId,
      departmentId: user.departmentId,
      divisionId: primaryDiv ? primaryDiv.id : null,
      officeId: user.officeId,
      unitId: user.unitId,
    };

    const log = new AuditLog(
      uuidv4(),
      AuditAction.LOGIN,
      '',
      user.id,
      `LOGIN: '${user.firstNameLa}'`,
      user.role,
      new Date(),
    );

    await this.auditLogRepository.save(log);

    return {
      accessToken: this.jwtService.sign(payload),
      user: user.getPublicProfile(),
    };
  }
}
