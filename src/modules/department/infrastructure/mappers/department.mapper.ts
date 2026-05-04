import { Department } from "../../domain/entities/department.entity";

export class DepartmentMapper {
    static toDomain(raw: any): Department {
        return new Department(
            raw.department_id,
            raw.department_code,
            raw.department_name,
            raw.department_phone || '',
            raw.department_email || '',
            raw.department_status,
        );
    }
}