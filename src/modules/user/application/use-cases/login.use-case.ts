import { Inject, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import * as userRepositoryInterface from "../../domain/repositories/user.repository.interface";
import { JwtService } from "@nestjs/jwt";
import { LoginDto } from "../dtos/login.dto";
import * as bcrypt from "bcrypt";
import { AuditLog } from "src/modules/audit/domain/entities/audit-log.entity";
import * as auditLogRepositoryInterface from "src/modules/audit/domain/repositories/audit-log.repository.interface";
import { v4 as uuidv4 } from 'uuid';
import { AuditAction } from "src/core/constants/audit-action.enum";

@Injectable()
export class LoginUseCase {
    constructor(
        @Inject(userRepositoryInterface.USER_REPOSITORY)
        private readonly userRepository: userRepositoryInterface.IUserRepository,
        private readonly jwtService: JwtService,
        @Inject(auditLogRepositoryInterface.AUDIT_LOG_REPOSITORY)
        private readonly auditLogRepository: auditLogRepositoryInterface.IAuditLogRepository,
    ) { }

    async execute(dto: LoginDto): Promise<{ accessToken: string, user: any }> {

        const user = await this.userRepository.findByUsername(dto.username);
        if (!user) {
            throw new NotFoundException('ບໍ່ມີບັນຊີຜູ້ໃຊ້ນີ້ໃນລະບົບ...');
        }

        const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
        if (!isPasswordValid) {
            throw new UnauthorizedException('ຊື່ຜູ້ໃຊ້ ຫຼື ລະຫັດຜ່ານບໍ່ຖືກຕ້ອງ...');
        }

        const payload = {
            sub: user.id,
            username: user.username,
            role: user.role,
            branchId: user.branchId,
        };

        const log = new AuditLog(
            uuidv4(),
            AuditAction.LOGIN,
            '',
            user.id,
            `LOGIN: '${user.username}'`,
            user.role,
            new Date(),

        );

        await this.auditLogRepository.save(log);

        return {
            accessToken: this.jwtService.sign(payload),
            user: user.getPublicProfile(),
        }
    }
}