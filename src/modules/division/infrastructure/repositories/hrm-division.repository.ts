import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { IDivisionRepository } from '../../domain/repositories/division.repository.interface';
import { Division } from '../../domain/entities/division.entity';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { DivisionMapper } from '../mappers/division.mapper';
import { HrmAuthService } from 'src/modules/hrm/infrastructure/services/hrm-auth.service';

@Injectable()
export class HrmDivisionRepository implements IDivisionRepository {
  private readonly logger = new Logger(HrmDivisionRepository.name);

  private readonly hrmDivisionApiUrl = process.env.HRM_DIVISION_API_URL || '';

  constructor(
    private readonly httpService: HttpService,
    private readonly hrmAuthService: HrmAuthService,
  ) {}

  async findAll(): Promise<Division[]> {
    try {
      const token = await this.hrmAuthService.getToken();

      const response = await firstValueFrom(
        this.httpService.get(this.hrmDivisionApiUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      );
      const responseData = response.data;
      if (responseData && Array.isArray(responseData.data)) {
        return responseData.data.map(DivisionMapper.toDomain);
      }

      return [];
    } catch (error) {
      this.logger.error(`ດຶງຂໍ້ມູນພະແນກຈາກ HRMS ລົ້ມເຫຼວ: ${error.message}`);
      throw new InternalServerErrorException('ເຊື່ອມຕໍ່ລະບົບ HRM ລົ້ມເຫຼວ');
    }
  }

  async findByDepartment(departmentId: number): Promise<Division[]> {
    const all = await this.findAll();
    return all.filter((d) => d.departmentId === departmentId);
  }
}
