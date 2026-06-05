import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import * as userRepositoryInterface from '../../domain/repositories/user.repository.interface';
import { HrmAuthService } from 'src/modules/hrm/infrastructure/services/hrm-auth.service';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as bcrypt from 'bcrypt';
import { Role } from 'src/core/auth/constants/role.enum';
import { PrismaService } from 'src/core/database/prisma.service';

@Injectable()
export class SyncUserFromHrmUseCase {
  constructor(
    @Inject(userRepositoryInterface.USER_REPOSITORY)
    private readonly userRepository: userRepositoryInterface.IUserRepository,
    private readonly hrmAuthService: HrmAuthService,
    private readonly httpService: HttpService,
    private readonly prisma: PrismaService,
  ) {}

  async execute(empCode: string): Promise<any> {
    try {
      const token = await this.hrmAuthService.getToken();

      const hrmApiUrl = `${process.env.HRM_API_URL}/employee?search=${empCode}`;
      const response = await firstValueFrom(
        this.httpService.get(hrmApiUrl, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      );
      const employeesList = response.data?.data?.employees;
      if (!employeesList || employeesList.length === 0) {
        return null;
      }
      const hrmData = employeesList[0];

      const defaultPassword = process.env.DEFAULT_USER_PASSWORD || 'EDL1234';
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);

      let validBranchId = null,
        validDeptId = null,
        validDivId = null,
        validOfficeId = null,
        validUnitId = null;

      if (hrmData.office?.department_id) {
        const exist = await this.prisma.departmentModel.findUnique({
          where: { id: hrmData.office.department_id },
        });
        if (exist) validDeptId = hrmData.office.department_id;
      }
      // 2. เช็ค Division
      if (hrmData.office?.division_id) {
        const exist = await this.prisma.divisionModel.findUnique({
          where: { id: hrmData.office.division_id },
        });
        if (exist) validDivId = hrmData.office.division_id;
      }
      // 3. เช็ค Office (อย่าลืมกันค่า 0 ด้วย)
      if (hrmData.office?.office_id && hrmData.office.office_id !== 0) {
        const exist = await this.prisma.officeModel.findUnique({
          where: { id: hrmData.office?.office_id },
        });
        if (exist) validOfficeId = hrmData.office.office_id;
      }
      // 4. เช็ค Unit
      if (hrmData.office?.unit_id && hrmData.office.unit_id !== 0) {
        const exist = await this.prisma.unitModel.findUnique({
          where: { id: hrmData.office?.unit_id },
        });
        if (exist) validUnitId = hrmData.office.unit_id;
      }

      const newUser = await this.userRepository.create({
        // email: hrmData.email,
        password: hashedPassword,
        role: Role.USER,

        empId: hrmData.emp_id,
        empCode: hrmData.emp_code,
        firstNameLa: hrmData.first_name_la,
        lastNameLa: hrmData.last_name_la,
        firstNameEng: hrmData.first_name_eng,
        lastNameEng: hrmData.last_name_eng,
        phone: hrmData.phone,
        status: hrmData.status,
        gender: hrmData.gender,
        image: hrmData.image,

        branchId: hrmData.office?.division?.branch_id || null,
        departmentId: validDeptId,
        divisionId: validDivId,
        officeId: validOfficeId,
        unitId: validUnitId,
      });

      return newUser;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(
        'ບໍ່ສາມາດດຶງຂໍ້ມູນພະນັກງານຈາກ HRMS ໄດ້!',
        error,
      );
    }
  }
}
