import { Division } from '../../domain/entities/division.entity';

export class DivisionMapper {
  static toDomain(raw: any): Division {
    return new Division(
      raw.division_id,
      raw.division_code,
      raw.division_name,
      raw.short_name || null,
      raw.division_status,
      raw.department_id || null,
      raw.branch_id || null,
      raw.branch || null,
    );
  }
}
