import { UserModel } from '@prisma/client';
import { User } from '../../domain/entities/user.entity';
import { Role } from 'src/core/auth/constants/role.enum';

export class UserMapper {
  static toDomain(model: any): User {
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

      model.branchId,
      model.departmentId,
      model.divisionId,
      model.officeId,
      model.unitId,
      model.createdAt,
      model.updatedAt,

      model.branch,
      model.department,
      model.division,
      model.office,
      model.unit,
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
      branchId: entity.branchId,
      departmentId: entity.departmentId,
      divisionId: entity.divisionId,
      officeId: entity.officeId,
      unitId: entity.unitId,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
