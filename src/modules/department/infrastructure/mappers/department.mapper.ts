import { Department } from '../../domain/entities/department.entity';

export class DepartmentMapper {
  static toDomain(raw: any): Department {
    return new Department(
      raw.department_id ?? raw.id,
      raw.department_code ?? raw.code,
      raw.department_name ?? raw.name,
      raw.department_phone ?? raw.phone ?? '',
      raw.department_email ?? raw.email ?? '',
      raw.department_status ?? raw.status,
    );
  }
}
