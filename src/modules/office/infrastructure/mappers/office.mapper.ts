import { Office } from '../../domain/entities/office.entity';

export class OfficeMapper {
  static toDomain(raw: any): Office {
    return new Office(
      raw.office_id,
      raw.office_code,
      raw.office_name,
      raw.office_status,
      raw.division_id || null,
    );
  }
}
