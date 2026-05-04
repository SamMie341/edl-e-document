import { LockerModel } from "@prisma/client";
import { Locker } from "../../domain/entities/locker.entity";

export class LockerMapper {
    static toDomain(model: LockerModel): Locker {
        return new Locker(
            model.id,
            model.name,
            model.description,
            model.status,
            model.branchId,
            model.departmentId,
            model.createdAt,
            model.updatedAt,
        );
    }
}