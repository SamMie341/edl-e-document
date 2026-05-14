import { ConflictException, Inject, Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import * as userRepositoryInterface from "../../domain/repositories/user.repository.interface";
import { HttpService } from "@nestjs/axios";
import { PrismaService } from "src/core/database/prisma.service";
import { HrmAuthService } from "src/modules/hrm/infrastructure/services/hrm-auth.service";
import { RegisterDto } from "../dtos/register.dto";
import { firstValueFrom } from "rxjs";
import * as bcrypt from "bcrypt";
import { Role } from "src/core/auth/constants/role.enum";

@Injectable()
export class RegisterUseCase {
    constructor(
        @Inject(userRepositoryInterface.USER_REPOSITORY)
        private readonly userRepository: userRepositoryInterface.IUserRepository,
        private readonly hrmAuthService: HrmAuthService,
        private readonly httpService: HttpService,
        private readonly prisma: PrismaService,
    ) { }

    async execute(dto: RegisterDto) {
        const existingEmail = await this.userRepository.findByEmail(dto.email);
        if (existingEmail) throw new ConflictException('ອີເມວນີ້ຖືກນຳໃຊ້ໃນລະບົບແລ້ວ...');

        let hrmData: any = null;

        try {
            const token = await this.hrmAuthService.getToken();
            const hrmApiUrl = `${process.env.HRM_API_URL}/employee?search=${dto.empCode}`;
            const response = await firstValueFrom(
                this.httpService.get(hrmApiUrl, { headers: { Authorization: `Bearer ${token}` } })
            );
            const employeeList = response.data?.data?.employees;
            if (!employeeList || employeeList.length === 0) {
                throw new NotFoundException('ບໍ່ພົບລະຫັດພະນັກງານໃນລະບົບ HRMS');
            }
            hrmData = employeeList[0];
        } catch (error) {
            if (error instanceof NotFoundException) throw error;
            throw new InternalServerErrorException('ບໍ່ສາມາເຊື່ອມຕໍ່ລະບົບ HRMS ໄດ້...');
        }

        let validDeptId = null, validDivId = null, validOfficeId = null, validUnitId = null;

        if (hrmData.office?.department_id) {
            const exist = await this.prisma.departmentModel.findUnique({ where: { id: hrmData.office.department_id } });
            if (exist) validDeptId = hrmData.office.department_id;
        }
        if (hrmData.office?.division_id) {
            const exist = await this.prisma.divisionModel.findUnique({ where: { id: hrmData.office.division_id } });
            if (exist) validDivId = hrmData.office.division_id;
        }
        if (hrmData.office?.office_id && hrmData.office.office_id !== 0) {
            const exist = await this.prisma.officeModel.findUnique({ where: { id: hrmData.office?.office_id } });
        }
        if (hrmData.office?.unit_id && hrmData.office.unit_id !== 0) {
            const exist = await this.prisma.unitModel.findUnique({ where: { id: hrmData.office?.unit_id } });
            if (exist) validUnitId = hrmData.office.unit_id;
        }

        const hashedPassword = await bcrypt.hash(dto.password, 10);
        const newUser = await this.userRepository.create({
            email: dto.email,
            password: hashedPassword,
            role: Role.USER,
            empId: hrmData.emp_id,
            empCode: hrmData.emp_code,
            firstNameLa: hrmData.first_name_la,
            lastNameLa: hrmData.last_name_la,
            firstNameEng: hrmData.first_name_eng,
            lastNameEng: hrmData.last_name_eng,
            phone: hrmData.phone,
            status: 'P',
            gender: hrmData.gender,
            image: hrmData.image,
            branchId: hrmData.office?.division?.branch_id || null,
            departmentId: validDeptId,
            divisionId: validDivId,
            officeId: validOfficeId,
            unitId: validUnitId,
        });
        return newUser.getPublicProfile();
    }
}