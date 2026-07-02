import { AttachmentModel } from '@prisma/client';
import {
  Address,
  Attachment,
  Department,
  Division,
  DocumentEntity,
  DocumentType,
  Folder,
  Locker,
  Shelf,
  User,
  Warehouse,
} from '../../domain/entities/document.entity';

export class DocumentMapper {
  static toDomain(model: any): DocumentEntity {
    // ── ดึง chain: folder → shelf → locker → warehouse → address ──────────
    const att = model.attachment ?? null;
    const folder = model.folder ?? null;
    const shelf = folder?.shelf ?? null;
    const locker = shelf?.locker ?? null;
    const warehouse = locker?.warehouse ?? null;
    const address = warehouse?.address ?? null;
    const user = model?.user ?? null;

    return new DocumentEntity(
      model.id,
      model.docNo,
      model.shortName,
      model.docDate,
      model.subDocNo,
      model.subDocDate,
      model.title,
      model.description || '',
      model.docExpire,
      model.qrCode,
      // ── departmentId / divisionId (scalar) ───────────────────────────────
      model.departmentId ?? null,
      model.divisionId ?? null,
      model.userId,
      model.folderId,
      model.documentTypeId,
      model.createdAt,
      model.updatedAt,
      model.isContractBound ?? false,
      // ── Department ───────────────────────────────────────────────────────
      model.department
        ? new Department(
          model.department.id,
          model.department.code,
          model.department.name,
          model.department.phone ?? null,
          model.department.email ?? null,
          model.department.status,
          model.department.createdAt,
          model.department.updatedAt,
        )
        : null,
      // ── Division ─────────────────────────────────────────────────────────
      model.division
        ? new Division(
          model.division.id,
          model.division.code,
          model.division.name,
          model.division.shortName,
          model.division.status,
          model.division.departmentId ?? null,
          model.division.createdAt,
          model.division.updatedAt,
        )
        : null,
      user ? new User(
        user.id,
        user.role,
        user.empCode,
        user.firstNameLa,
        user.lastNameLa,
        user.phone,
        user.createdAt,
        user.updatedAt,
        user.department,
        user.division,
      ) : null,
      // ── Address ──────────────────────────────────────────────
      address
        ? new Address(
          address.id,
          address.code,
          address.name,
          address.details,
          address.status,
          address.createdAt,
          address.updatedAt,
        )
        : null,
      // ── Warehouse ─────────────────────────────────────────────────────────
      warehouse
        ? new Warehouse(
          warehouse.id,
          warehouse.code,
          warehouse.name,
          warehouse.description,
          warehouse.status,
          warehouse.createdAt,
          warehouse.updatedAt,
        )
        : null,
      // ── Locker ───────────────────────────────────────────────────────────
      locker
        ? new Locker(
          locker.id,
          locker.code,
          locker.name,
          locker.description,
          locker.status,
          locker.createdAt,
          locker.updatedAt,
        )
        : null,
      // ── Shelf ────────────────────────────────────────────────────────────
      shelf
        ? new Shelf(
          shelf.id,
          shelf.name,
          shelf.description,
          shelf.status,
          shelf.maxQty,
          shelf._count?.folders ?? 0,
          shelf.maxQty - (shelf._count?.folders ?? 0),
          shelf.createdAt,
          shelf.updatedAt,
        )
        : null,
      // ── Folder ───────────────────────────────────────────────────────────
      folder
        ? new Folder(
          folder.id,
          folder.code,
          folder.name,
          folder.status,
          folder.qrCode,
          folder.locationRef,
          folder.createdAt,
          folder.updatedAt,
        )
        : null,
      // ── DocumentType ──────────────────────────────────────────────────────
      model.documentType
        ? new DocumentType(
          model.documentType.id,
          model.documentType.code,
          model.documentType.name,
          model.documentType.description,
          model.documentType.createdAt,
          model.documentType.updatedAt,
        )
        : null,
      model.attachments
        ? model.attachments.map(
          (att: AttachmentModel) =>
            new Attachment(
              att.id,
              att.fileName,
              att.filePath,
              att.mimeType,
              att.size,
              att.createdAt,
            ),
        )
        : null,
    );
  }
}
