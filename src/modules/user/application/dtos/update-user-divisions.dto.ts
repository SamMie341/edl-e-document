import { IsArray, IsInt, IsNotEmpty } from 'class-validator';

export class UpdateUserDivisionsDto {
  @IsNotEmpty({ message: 'ກະລຸນາລະບຸພະແນກທີ່ຮັບຜິດຊອບ' })
  @IsArray({ message: 'ພະແນກຕ້ອງເປັນ Array' })
  @IsInt({ each: true, message: 'ID ຂອງພະແນກຕ້ອງເປັນຕົວເລກ' })
  divisionIds: number[];
}
