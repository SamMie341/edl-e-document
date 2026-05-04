import { Injectable, InternalServerErrorException, Logger } from "@nestjs/common";
import { IDepartmentRepository } from "../../domain/repositories/department.repository.interface";
import { Department } from "../../domain/entities/department.entity";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import { DepartmentMapper } from "../mappers/department.mapper";
import { HrmAuthService } from "src/modules/hrm/infrastructure/services/hrm-auth.service";

@Injectable()
export class HrmDepartmentRepository implements IDepartmentRepository {

    private readonly logger = new Logger(HrmDepartmentRepository.name);
    private readonly hrmApiUrl = process.env.HRM_API_URL_DEPARTMENT || '';

    constructor(
        private readonly httpService: HttpService,
        private readonly hrmAuthService: HrmAuthService,
    ) { }



    async findAll(): Promise<Department[]> {
        try {
            const token = await this.hrmAuthService.getToken();

            const response = await firstValueFrom(this.httpService.get(this.hrmApiUrl,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    }
                }
            ));

            const responseData = response.data;

            if (responseData.statusCode === 200 && Array.isArray(responseData.data)) {
                return responseData.data.map(DepartmentMapper.toDomain);
            }

            return [];
        } catch (error) {
            this.logger.error(`ບໍ່ສາມາດດຶງຂໍ້ມູນຈາກ HRMS ໄດ້: ${error.message}`, error.stack);
            throw new InternalServerErrorException('ບໍ່ສາມາດເຊື່ອມຕໍ່ກັບຖານຂໍ້ມູນ HRMS ໄດ້');
        }
    }

}