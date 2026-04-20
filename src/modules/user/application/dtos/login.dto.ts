import { IsNotEmpty, IsString, MinLength } from "class-validator";

export class LoginDto {

    @IsString({ message: 'ຊື່ຜູ້ໃຊ້ຕ້ອງເປັນຕົວອັກສອນ' })
    @IsNotEmpty({ message: 'ຊື່ຜູ້ໃຊ້ຕ້ອງບໍ່ເປັນຄ່າວ່າງ' })
    username: string;

    @IsString()
    @IsNotEmpty({ message: 'ລະຫັດຜ່ານຕ້ອງບໍ່ເປັນຄ່າວ່າງ' })
    @MinLength(6, { message: 'ລະຫັດຜ່ານຕ້ອງມີຢ່າງນ້ອຍ 6 ຕົວ' })
    password: string;
}