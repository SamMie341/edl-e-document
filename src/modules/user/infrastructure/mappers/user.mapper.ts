import { UserModel } from "@prisma/client";
import { User } from "../../domain/entities/user.entity";
import { Role } from "src/core/auth/constants/role.enum";

export class UserMapper {
    static toDomain(model: UserModel): User {
        return new User(
            model.id,
            model.username,
            model.password,
            model.role as Role,
            model.branchId,
            model.createdAt,
            model.updatedAt,
        );
    }

    static toPersistence(entity: User): any {
        return {
            id: entity.id,
            username: entity.username,
            password: entity.passwordHash,
            role: entity.role,
            branchId: entity.branchId,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
        };
    }
}