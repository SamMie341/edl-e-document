import { HttpService } from "@nestjs/axios";
import { Injectable, InternalServerErrorException, Logger } from "@nestjs/common";
import { firstValueFrom } from "rxjs";

@Injectable()
export class HrmAuthService {
    private readonly logger = new Logger(HrmAuthService.name);

    private readonly hrmLoginUrl = process.env.HRM_LOGIN_URL || '';
    private readonly hrmUsername = process.env.HRM_USERNAME;
    private readonly hrmPassword = process.env.HRM_PASSWORD;

    private cachedToken: string | null = null;
    private tokenExpiration: number | null = null;

    constructor(private readonly httpService: HttpService) { }

    async getToken(): Promise<string> {
        const now = Date.now();

        if (this.cachedToken && this.tokenExpiration && now < this.tokenExpiration - 300000) {
            return this.cachedToken;
        }

        try {
            this.logger.log('ກຳລັງເຂົ້າສູ່ລະບົບເພື່ອຂໍ Token...');
            const response = await firstValueFrom(
                this.httpService.post(
                    this.hrmLoginUrl, {
                    username: this.hrmUsername,
                    password: this.hrmPassword,
                }
                )
            );
            if (response.data && response.data.token) {
                this.cachedToken = response.data.token;

                this.tokenExpiration = now + (60 * 60 * 1000);

                return this.cachedToken!;
            }
            throw new Error('ບໍ່ພົບ Token');
        } catch (error) {
            this.logger.error(`ການຂໍ Token ຈາກ HRMS ລົ້ມເຫຼວ: ${error.message}`);
            throw new InternalServerErrorException('ບໍ່ສາມາດຢືນຢັນຕົວຕົນກັບລະບົບ HRMS ໄດ້');
        }
    }
}