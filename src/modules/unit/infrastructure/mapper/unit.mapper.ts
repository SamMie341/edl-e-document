import { Unit } from '../../domain/entities/unit.entity';

export class UnitMapper {
  static toDomain(raw: any): Unit {
    return new Unit(
      raw.unit_id ?? raw.id,             // HRM: unit_id | Prisma: id
      raw.unit_code ?? raw.code,         // HRM: unit_code | Prisma: code
      raw.unit_name ?? raw.name,         // HRM: unit_name | Prisma: name
      raw.unit_type ?? raw.type,         // HRM: unit_type | Prisma: type
      raw.unit_status ?? raw.status,     // HRM: unit_status | Prisma: status
      raw.division_id ?? raw.divisionId ?? null,
      raw.office_id ?? raw.officeId ?? null,
    );
  }
}
