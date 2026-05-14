import { Body, Controller, Post } from "@nestjs/common";
import { LoginUseCase } from "../../application/use-cases/login.use-case";
import { LoginDto } from "../../application/dtos/login.dto";
import { SyncUserFromHrmUseCase } from "../../application/use-cases/sync-user-from-hrm.use-case";
import { RegisterDto } from "../../application/dtos/register.dto";
import { RegisterUseCase } from "../../application/use-cases/register.use-case";

@Controller('auth')
export class AuthController {
    constructor(
        private readonly loginUseCase: LoginUseCase,
        private readonly registerUseCase: RegisterUseCase,
    ) { }

    @Post('register')
    async register(@Body() dto: RegisterDto) {
        const result = await this.registerUseCase.execute(dto);
        return {
            message: 'ລົງທະບຽນສຳເລັດ',
            data: result,
        }
    }

    @Post('login')
    async login(@Body() dto: LoginDto) {
        const result = await this.loginUseCase.execute(dto);
        return {
            message: 'ເຂົ້າສູ່ລະບົບສຳເລັດ',
            data: result,
        };
    }
}