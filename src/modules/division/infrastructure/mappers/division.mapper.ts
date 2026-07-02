import { Division } from '../../domain/entities/division.entity';

export class DivisionMapper {
  static toDomain(raw: any): Division {
    return new Division(
      raw.division_id ?? raw.id,           // HRM: division_id | Prisma: id
      raw.division_code ?? raw.code,       // HRM: division_code | Prisma: code
      raw.division_name ?? raw.name,       // HRM: division_name | Prisma: name
      raw.short_name ?? raw.shortName ?? null,
      raw.division_status ?? raw.status,   // HRM: division_status | Prisma: status
      raw.department_id ?? raw.departmentId ?? null,
      raw.branch_id ?? raw.hrmBranchId ?? null,
      raw.branch ?? null,
    );
  }
}
