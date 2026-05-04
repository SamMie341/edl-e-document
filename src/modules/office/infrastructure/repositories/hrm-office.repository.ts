import { Injectable, InternalServerErrorException, Logger } from "@nestjs/common";
import { IOfficeRepository } from "../../domain/repositories/office.repository.interface";
import { Office } from "../../domain/entities/office.entity";
import { HttpService } from "@nestjs/axios";
import { HrmAuthService } from "src/modules/hrm/infrastructure/services/hrm-auth.service";
import { firstValueFrom } from "rxjs";
import { OfficeMapper } from "../mappers/office.mapper";

@Injectable()
export class HrmOfficeRepository implements IOfficeRepository {
    private readonly logger = new Logger(HrmOfficeRepository.name);
    private readonly hrmOfficeApiUrl = process.env.HRM_OFFICE_API_URL || '';

    constructor(
        private readonly httpService: HttpService,
        private readonly hrmAuthService: HrmAuthService,
    ) { }

    async findAll(): Promise<Office[]> {
        try {
            const token = await this.hrmAuthService.getToken();

            const response = await firstValueFrom(
                this.httpService.get(
                    this.hrmOfficeApiUrl,
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                )
            );

            const responseData = response.data;

            if (responseData.statusCode === 200 && Array.isArray(responseData.data)) {
                return responseData.data.map(OfficeMapper.toDomain);
            }

            return [];
        } catch (error) {
            this.logger.error(`ດຶງຂໍ້ມູນຫ້ອງການຈາກ HRMS ລົ້ມເຫຼວ: ${error.message}`);
            throw new InternalServerErrorException('ເຊື່ອມຕໍ່ລະບົບ HRMS ລົ້ມເຫຼວ(ຫ້ອງການ)');
        }
    }
}