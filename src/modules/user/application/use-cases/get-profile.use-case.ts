import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import * as userRepositoryInterface from "../../domain/repositories/user.repository.interface";

@Injectable()
export class GetProfileUseCase {
    constructor(
        @Inject(userRepositoryInterface.USER_REPOSITORY)
        private readonly userRepository: userRepositoryInterface.IUserRepository,
    ) { }

    async execute(userId: string) {
        const user = await this.userRepository.findById(userId);
        if (!user) throw new NotFoundException('ບໍ່ພົບບັນຊີຜູ້ໃຊ້');

        return user.getPublicProfile();
    }
}