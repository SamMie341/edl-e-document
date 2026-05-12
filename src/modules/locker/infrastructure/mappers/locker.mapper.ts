import { LockerModel } from "@prisma/client";
import { Locker } from "../../domain/entities/locker.entity";

export class LockerMapper {
    static toDomain(model: LockerModel): Locker {
        return new Locker(
            model.id,
            model.code,
            model.name,
            model.description,
            model.status,
            model.warehouseId,
            model.createdAt,
            model.updatedAt,
        );
    }
}