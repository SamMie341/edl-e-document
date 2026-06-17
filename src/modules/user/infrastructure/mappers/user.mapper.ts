import { User } from '../../domain/entities/user.entity';
import { Role } from 'src/core/auth/constants/role.enum';

export class UserMapper {
  static toDomain(model: any): User {
    const divisions = (model.userDivisions ?? []).map((ud: any) => ({
      id: ud.divisionId,
      name: ud.division?.name ?? null,
      shortName: ud.division?.shortName ?? null,
      isPrimary: ud.isPrimary,
    }));

    return new User(
      model.id,
      model.password,
      model.role as Role,

      model.empId,
      model.empCode,
      model.firstNameLa,
      model.lastNameLa,
      model.firstNameEng,
      model.lastNameEng,
      model.email,
      model.phone,
      model.status,
      model.gender,
      model.image,

      model.departmentId,
      model.officeId,
      model.unitId,
      model.addressId,
      model.createdAt,
      model.updatedAt,

      model.department,
      model.office,
      model.unit,
      divisions,
    );
  }

  static toPersistence(entity: User): any {
    return {
      id: entity.id,
      password: entity.password,
      role: entity.role,

      empId: entity.empId,
      empCode: entity.empCode,
      firstNameLa: entity.firstNameLa,
      lastNameLa: entity.lastNameLa,
      firstNameEng: entity.firstNameEng,
      lastNameEng: entity.lastNameEng,
      email: entity.email,
      phone: entity.phone,
      status: entity.status,
      gender: entity.gender,
      image: entity.image,
      departmentId: entity.departmentId,
      officeId: entity.officeId,
      unitId: entity.unitId,
      addressId: entity.addressId,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
