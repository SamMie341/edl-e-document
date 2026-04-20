import { Body, Controller, Post } from "@nestjs/common";
import { LoginUseCase } from "../../application/use-cases/login.use-case";
import { LoginDto } from "../../application/dtos/login.dto";

@Controller('auth')
export class AuthController {
    constructor(private readonly loginUseCase: LoginUseCase) { }

    @Post('login')
    async login(@Body() dto: LoginDto) {
        const result = await this.loginUseCase.execute(dto);
        return {
            message: 'ເຂົ້າສູ່ລະບົບສຳເລັດ',
            data: result,
        };
    }
}