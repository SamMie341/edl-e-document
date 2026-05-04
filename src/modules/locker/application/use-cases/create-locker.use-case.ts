import { Inject, Injectable } from "@nestjs/common";
import * as lockerRepositoryInterface from "../../domain/repositories/locker.repository.interface";
import { CreateLockerDto } from "../dtos/create-locker.dto";

@Injectable()
export class CreateLockerUseCase {
    constructor(
        @Inject(lockerRepositoryInterface.LOCKER_REPOSITORY)
        private readonly lockerRepository: lockerRepositoryInterface.ILockerRepository
    ) { }

    async execute(dto: CreateLockerDto) {
        return await this.lockerRepository.create(dto);
    }
}