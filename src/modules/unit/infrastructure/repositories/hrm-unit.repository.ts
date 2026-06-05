import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { IUnitRepository } from '../../domain/repositories/unit.repository.interface';
import { Unit } from '../../domain/entities/unit.entity';
import { HttpService } from '@nestjs/axios';
import { HrmAuthService } from 'src/modules/hrm/infrastructure/services/hrm-auth.service';
import { firstValueFrom } from 'rxjs';
import { UnitMapper } from '../mapper/unit.mapper';

@Injectable()
export class HrmUnitRepository implements IUnitRepository {
  private readonly logger = new Logger(HrmUnitRepository.name);
  private readonly hrmUnitApiUrl = process.env.HRM_API_URL || '';

  constructor(
    private readonly httpService: HttpService,
    private readonly hrmAuthService: HrmAuthService,
  ) {}

  async findAll(): Promise<Unit[]> {
    try {
      const token = await this.hrmAuthService.getToken();
      const response = await firstValueFrom(
        this.httpService.get(`${this.hrmUnitApiUrl}/unit`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      );
      const responseData = response.data;
      if (
        responseData &&
        responseData.statusCode === 200 &&
        Array.isArray(responseData.data)
      ) {
        return responseData.data.map(UnitMapper.toDomain);
      }

      return [];
    } catch (error) {
      this.logger.log(
        `ບໍ່ສາມາດດຶງຂໍ້ມູນຈາກ HRMS ໄດ້: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'ບໍ່ສາມາດເຊື່ອມຕໍ່ກັບຖານຂໍ້ມູນ HRMS ໄດ້...',
      );
    }
  }
}
