import { Address } from '../../domain/entities/address.entity';

export class AddressMapper {
  static toDomain(model: any): Address {
    return new Address(
      model.id,
      model.code,
      model.name,
      model.details,
      model.status,
      model.createdAt,
      model.updatedAt,
      model.departmentId,
      model.divisionId,
      model.department,
      model.division,
    );
  }
}
