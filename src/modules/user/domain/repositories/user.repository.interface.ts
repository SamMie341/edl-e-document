
import { User } from "../entities/user.entity";

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

export interface IUserRepository {
    findAll(skip?: number, take?: number): Promise<{ data: User[], total: number }>;
    findByEmpCode(empCode: string): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    findById(id: string): Promise<User | null>;

    create(userData: any): Promise<User>;
    save(user: User): Promise<void>;
    update(id: string, data: any): Promise<User>;
}