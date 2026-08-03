import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class DeleteDocumentDto {
  @IsOptional()
  @IsString()
  destroyedDate?: string;

  @IsOptional()
  @IsString()
  details?: string;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class DeleteBatchDocumentsDto extends DeleteDocumentDto {
  @IsNotEmpty({ message: 'ກະລຸນາລະບຸ ID ເອກະສານທີ່ຕ້ອງການລົບ' })
  ids: string[] | string;
}
