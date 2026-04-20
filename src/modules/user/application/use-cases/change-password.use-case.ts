import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import * as userRepositoryInterface from "../../domain/repositories/user.repository.interface";
import { ChangePasswordDto } from "../dtos/change-password.dto";
import * as bcrypt from "bcrypt";
import { AuditLog } from "src/modules/audit/domain/entities/audit-log.entity";
import * as auditLogRepositoryInterface from "src/modules/audit/domain/repositories/audit-log.repository.interface";
import { v4 as uuidv4 } from "uuid";
import { AuditAction } from "src/core/constants/audit-action.enum";
import { AppException } from "src/core/exceptions/app.exception";

@Injectable()
export class ChangePasswordUseCase {
    constructor(
        @Inject(userRepositoryInterface.USER_REPOSITORY)
        private readonly userRepository: userRepositoryInterface.IUserRepository,
        @Inject(auditLogRepositoryInterface.AUDIT_LOG_REPOSITORY)
        private readonly auditLogRepository: auditLogRepositoryInterface.IAuditLogRepository,
    ) { }

    async execute(userId: string, dto: ChangePasswordDto): Promise<void> {
        const user = await this.userRepository.findById(userId);
        if (!user) throw new AppException('NOT_FOUND', 'ບໍ່ພົບຜູ້ໃຊ້ງານ!', { userId }, HttpStatus.NOT_FOUND);

        const isOldPasswordValid = await bcrypt.compare(dto.oldPassword, user.passwordHash);
        if (!isOldPasswordValid) {
            throw new AppException('BAD_REQUEST', 'ລະຫັດຜ່ານເກົ່າບໍ່ຖືກຕ້ອງ!', '', HttpStatus.BAD_REQUEST);
        }

        const isSameAsOld = await bcrypt.compare(dto.newPassword, user.passwordHash);
        if (isSameAsOld) {
            throw new AppException('BAD_REQUEST', 'ລະຫັດຜ່ານໃໝ່ຕ້ອງບໍ່ຊ້ຳກັບລະຫັດຜ່ານເກົ່າ!', '', HttpStatus.BAD_REQUEST);
        }

        const salt = await bcrypt.genSalt(10);
        const newHash = await bcrypt.hash(dto.newPassword, salt);

        user.updatePassword(newHash);
        await this.userRepository.save(user);

        const log = new AuditLog(
            uuidv4(),
            AuditAction.PASSWORD_CHANGED,
            'ຜູ້ໃຊ້ປ່ຽນລະຫັດຜ່ານດ້ວຍຕົວເອງ',
            user.id,
            'USER',
            user.id,
            new Date(),
        );
        await this.auditLogRepository.save(log);
    }
}