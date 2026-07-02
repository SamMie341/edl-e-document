import { Office } from '../../domain/entities/office.entity';

export class OfficeMapper {
  static toDomain(raw: any): Office {
    return new Office(
      raw.office_id ?? raw.id,           // HRM: office_id | Prisma: id
      raw.office_code ?? raw.code,       // HRM: office_code | Prisma: code
      raw.office_name ?? raw.name,       // HRM: office_name | Prisma: name
      raw.office_status ?? raw.status,   // HRM: office_status | Prisma: status
      raw.division_id ?? raw.divisionId ?? null,
    );
  }
}
