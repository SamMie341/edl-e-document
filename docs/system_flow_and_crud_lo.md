# ເອກະສານສະຫຼຸບຂັ້ນຕອນການເຮັດວຽກ (System Flow) ແລະ ການຈັດການຂໍ້ມູນ (CRUD) ຂອງລະບົບ EDL E-Document

ເອກະສານສະບັບນີ້ອະທິບາຍກ່ຽວກັບໂຄງສ້າງ, ຂັ້ນຕອນການເຮັດວຽກ ແລະ ການຈັດການຂໍ້ມູນ (CRUD) ຂອງລະບົບ **EDL E-Document** (ລະບົບຄຸ້ມຄອງເອກະສານເອເລັກໂຕຣນິກ) ທີ່ພັດທະນາດ້ວຍ NestJS, Prisma ORM ແລະ PostgreSQL.

---

## 1. ພາບລວມ ແລະ ຂັ້ນຕອນການເຮັດວຽກຂອງລະບົບ (System Workflows)

ລະບົບ EDL E-Document ຖືກອອກແບບມາເພື່ອຄຸ້ມຄອງທັງ **ເອກະສານດິຈິຕອນ (Digital Attachments)** ແລະ **ການກວດສອບສະຖານທີ່ຈັດເກັບເອກະສານຕົວຈິງ (Physical Storage Tracking)** ໂດຍມີຂັ້ນຕອນການເຮັດວຽກຫຼັກ 4 ພາກສ່ວນຄື:

### A. ຂັ້ນຕອນການກວດສອບສິດ ແລະ ຊິງຄ໌ຂໍ້ມູນພະນັກງານ (Authentication & HRM Sync Flow)
1. **ການຊິງຄ໌ຂໍ້ມູນຈາກ HRM:** ລະບົບມີລະບົບເຊື່ອມຕໍ່ກັບຖານຂໍ້ມູນ HRM ພາຍນອກ ໂດຍໃຊ້ລະຫັດພະນັກງານ (`empCode`) ເພື່ອດຶງຂໍ້ມູນສ່ວນຕົວ ແລະ ຂໍ້ມູນການສັງກັດເຊັ່ນ: ພະແນກ (`Department`), ຝ່າຍ (`Division`), ຫ້ອງການ (`Office`), ແລະ ໜ່ວຍງານ (`Unit`).
2. **ການເຂົ້າສູ່ລະບົບ (Authentication):** ລະບົບໃຊ້ລະຫັດຜ່ານທີ່ຖືກແຮຊ (Hashed) ດ້ວຍ bcrypt ແລະ ອອກ Token ຜ່ານ JWT Strategy ສໍາລັບການຢືນຢັນຕົວຕົນ.
3. **ການກວດສອບບົດບາດ (Role-Based Access Control - RBAC):** ລະບົບແບ່ງຜູ້ໃຊ້ອອກເປັນ 4 ບົດບາດຫຼັກ:
   * **`SUPER_ADMIN`**: ມີສິດເຕັມທຸກການດຳເນີນງານໃນລະບົບ — ຄຸ້ມຄອງຜູ້ໃຊ້, ສິດ, ຊິງຄ໌ HRM ແລະ ສາມາດຈັດການສາງ, ຕູ້, ຊັ້ນວາງ, ແຟ້ມເອກະສານ ແລະ ເອກະສານທັງໝົດ.
   * **`HQ_ADMIN`**: ຜູ້ດູແລລະບົບສ່ວນກາງ (ສຳນັກງານໃຫຍ່). ສາມາດຈັດການ ແລະ ເບິ່ງສາງ, ຕູ້, ຊັ້ນວາງ, ແຟ້ມເອກະສານ ແລະ ປະເພດເອກະສານທັງໝົດທົ່ວປະເທດ.
   * **`BRANCH_ADMIN`**: ຜູ້ດູແລລະບົບປະຈໍາສາຂາ. ສາມາດຈັດການສາງ, ຕູ້, ຊັ້ນວາງ, ແຟ້ມເອກະສານ ແລະ ຄຸ້ມຄອງເອກະສານສະເພາະພາຍໃນ `departmentId` ຂອງຕົນເອງ (ຈາກ JWT).
   * **`USER`**: ພະນັກງານທົ່ວໄປ. ສາມາດສ້າງເອກະສານ, ອັບໂຫລດໄຟລ໌ແນບ, ຄົ້ນຫາເອກະສານຂອງຕົນເອງ ແລະ ເບິ່ງສະຖານທີ່ຈັດເກັບໄດ້ (ເຂົ້າເຖິງໄດ້ສະເພາະ division ທີ່ຕົນຖືກ assign ໃນ `UserDivisionModel`).

---

### B. ໂຄງສ້າງການຈັດເກັບເອກະສານທາງກາຍະພາບ (Physical Storage Hierarchy Flow)
ເພື່ອຄວາມສະດວກໃນການຄົ້ນຫາເອກະສານຕົວຈິງ, ລະບົບໄດ້ຈັດລຽງໂຄງສ້າງການເກັບຮັກສາຕາມລໍາດັບດັ່ງນີ້:

```
[Warehouse] (ສາງເກັບເອກະສານ — ຜູກກັບ departmentId & divisionId)
       └── [Locker] (ຕູ້ເກັບເອກະສານ)
              └── [Shelf] (ຊັ້ນວາງເອກະສານ)
                     └── [Folder / Kono] (ແຟ້ມເອກະສານທີ່ມີ QR Code)
                            └── [Document] (ເອກະສານຕົວຈິງ ທີ່ມີ QR Code)
                                   └── [SubDocument] (ເອກະສານຍ່ອຍ)
```

> **ການປ່ຽນແປງໂຄງສ້າງ (v2026-07-15):** Module `Address` ຖືກລຶບອອກຈາກ API ແລ້ວ. ປັດຈຸບັນ `Warehouse` ເກັບ `departmentId` ແລະ `divisionId` ໂດຍກົງ ແທນ `addressId`. ທຸກ entity ທີ່ຢູ່ດ້ານລຸ່ມ ສືບທອດຂອບເຂດຜ່ານ chain ຂຶ້ນໄປ.

* **Folder (ແຟ້ມ / ໂກໂນ):** ແຟ້ມເກັບເອກະສານຈະມີ QR Code ສະເພາະຕົວ. `locationRef` ຈະຖືກສ້າງໂດຍອັດຕະໂນມັດໃນຮູບແບບ `warehouse.code / locker.code / shelf.name`.
* **Shelf (ຊັ້ນວາງ):** ຈະມີການກຳນົດຄວາມຈຸສູງສຸດ (`maxQty`) ເພື່ອບໍ່ໃຫ້ເກັບເອກະສານເກີນກຳນົດ.
* **Document:** ມີ field `qrCode` ສຳລັບລະບຸເອກະສານຕົວຈິງ.

---

### C. ຂັ້ນຕອນການນຳເອກະສານເຂົ້າລະບົບ (Document Archival Flow)
> **ໝາຍເຫດ:** ລະບົບບໍ່ມີຂັ້ນຕອນການອະນຸມັດ (Approve) ຫຼື ປະຕິເສດ (Reject) ເອກະສານ ເພາະເອກະສານທີ່ນຳເຂົ້າລະບົບຈະຕ້ອງເປັນເອກະສານທີ່ຖືກຕ້ອງ ແລະ ກວດສອບແລ້ວກ່ອນນຳເຂົ້າ.

1. **ກວດສອບເອກະສານຕົ້ນສະບັບ:** ຜູ້ໃຊ້ຈະຕ້ອງກວດສອບຄວາມຖືກຕ້ອງຂອງເອກະສານຕົ້ນສະບັບກ່ອນ ແລ້ວຈຶ່ງນຳເຂົ້າລະບົບ.
2. **ການສ້າງເອກະສານ:** ຜູ້ໃຊ້ (`USER` ຫຼື Admin) ສ້າງເອກະສານໂດຍການປ້ອນຂໍ້ມູນຫົວຂໍ້, ເລກທີເອກະສານ, ປະເພດເອກະສານ, ເລືອກແຟ້ມຈັດເກັບຕົວຈິງ (`Folder`) ແລະ ອັບໂຫລດໄຟລ໌ແນບ.
3. **ການບີບອັດ ແລະ ຈັດເກັບໄຟລ໌:** ໄຟລ໌ທີ່ອັບໂຫລດຈະຖືກກວດສອບ, ບີບອັດ (Compress) ເພື່ອປະຢັດພື້ນທີ່ ແລະ ບັນທຶກລົງໃນລະບົບຈັດເກັບ.
4. **ສະຖານະການຮັກສາເອກະສານ (Retention Status):** ທຸກເອກະສານມີ field `docExpire` ແລະ `isContractBound`. ລະບົບຄຳນວນສະຖານະໂດຍອັດຕະໂນມັດ:
   * `ACTIVE` — ອາຍຸເອກະສານ < 10 ປີ
   * `DESTROYABLE` — ອາຍຸເອກະສານ = 10 ປີ
   * `EXPIRED` — ອາຍຸເອກະສານ > 10 ປີ
   * `DESTROYABLE_HOLD` — ເອກະສານຜູກກັບສັນຍາ (ຫ້າມທຳລາຍ)
5. **ການບັນທຶກປະຫວັດ (Audit Log):** ລະບົບຈະບັນທຶກປະຫວັດການກະທຳ, ວັນເວລາ ແລະ ຜູ້ເຮັດທຸລະກຳລົງໃນຕາຕະລາງ `audit_logs` ໂດຍອັດຕະໂນມັດ.

---

### D. ຂັ້ນຕອນການຢືມ-ຄືນເອກະສານ (Document Borrow Flow)
ລະບົບຕິດຕາມການຢືມ ແລະ ຄືນ ເອກະສານ ຫຼື ແຟ້ມເອກະສານທາງກາຍະພາບ:

1. **ຄຳຂໍຢືມ:** ຜູ້ໃຊ້ທຸກລະດັບສາມາດສ້າງຄຳຂໍຢືມ ໂດຍລະບຸ `documentIds` ຫຼື `folderIds` (ຮູບແບບ array), ຊື່ຜູ້ຢືມ, ຈຸດປະສົງ ແລະ ຝ່າຍທີ່ຈະສົ່ງໄປ (`toDivisionId`).
2. **ການຕິດຕາມ:** ຂໍ້ມູນການຢືມຈະຖືກຕິດຕາມດ້ວຍ `returnedAt`. ຂໍ້ມູນທີ່ຍັງບໍ່ມີ `returnedAt` ຈະຖືກຈັດເປັນ **ການຢືມທີ່ຍັງເຄື່ອນໄຫວ**.
3. **ການຄືນ:** `PUT /document-borrows/:id/return` ສຳລັບການຄືນເອກະສານ.
4. **ຂອບເຂດຕາມສິດ (Scope):**
   * `SUPER_ADMIN` / `HQ_ADMIN` → ເຫັນທຸກຂໍ້ມູນ.
   * `BRANCH_ADMIN` → ຈຳກັດຕາມ `departmentId` ຂອງຕົນ.
   * `USER` → ຈຳກັດຕາມ `divisionId` ຂອງຕົນ.

---

## 2. ລາຍລະອຽດການຈັດການຂໍ້ມູນ (CRUD) ໃນແຕ່ລະໂມດູນ (Modules)

### 1. ໂມດູນເອກະສານ (Document Module)
ໂມດູນຫຼັກໃນການຈັດການເອກະສານດິຈິຕອນ ແລະ ເອກະສານຕົວຈິງ.
* **Create (ສ້າງ):** `POST /documents`
  * ຜູ້ໃຊ້ (`SUPER_ADMIN`, `USER`, `HQ_ADMIN`, `BRANCH_ADMIN`) ສາມາດສ້າງເອກະສານໃໝ່.
  * ສາມາດແນບໄຟລ໌ເອກະສານໄດ້ພ້ອມກັນສູງສຸດ 10 ໄຟລ໌ ໂດຍລະບົບຈະທຳການບີບອັດ ແລະ ບັນທຶກໄຟລ໌ອັດຕະໂນມັດ.
* **Read (ອ່ານ/ຄົ້ນຫາ):** `GET /documents`
  * ຄົ້ນຫາ ແລະ ດຶງຂໍ້ມູນເອກະສານທັງໝົດແບບແບ່ງໜ້າ (Pagination) ພ້ອມທັງສາມາດກັ່ນຕອງ (Filter):
    * `documentTypeId`, `startDate`, `endDate`, `search`, `folderId`, `departmentId`, `divisionId`
    * **[ໃໝ່]** `retentionStatus` — ກອງຕາມສະຖານະ (`ACTIVE`, `DESTROYABLE`, `EXPIRED`, `DESTROYABLE_HOLD`)
    * **[ໃໝ່]** `warehouseId`, `lockerId`, `shelfId` — ກອງຕາມສະຖານທີ່ຈັດເກັບ
  * `HQ_ADMIN` ແລະ `SUPER_ADMIN` ເຫັນເອກະສານທັງໝົດ. `BRANCH_ADMIN` ແລະ `USER` ເຫັນສະເພາະ division ຂອງຕົນ.
  * `GET /documents/:id` — ດຶງຂໍ້ມູນລະອຽດຂອງເອກະສານ; ກວດສອບສິດຕາມ division.
  * `GET /documents/attachments/:attachmentId` — ເປີດ/ສະຕຣີມໄຟລ໌ແນບ.
  * **[ໃໝ່]** `GET /documents/attachments/:attachmentId/download` — ດາວໂຫລດໄຟລ໌ (Force download).
  * `GET /documents/expired` — ລາຍການເອກະສານທີ່ໝົດອາຍຸ ຫຼື ຄວນທຳລາຍ.
  * **[ໃໝ່]** `GET /documents/:id/destruction-approval` — ດຶງສະຖານະການອະນຸມັດທຳລາຍຂອງເອກະສານ.
* **Update (ແກ້ໄຂ):** `PUT /documents/:id`
  * ທຸກລະດັບສິດສາມາດແກ້ໄຂໄດ້ (ກວດສອບຂອບເຂດໃນ use case layer). ຮອງຮັບການໃສ່ໄຟລ໌ແນບໃໝ່.
* **Delete (ລົບ):**
  * ບໍ່ອະນຸຍາດໃຫ້ລົບເອກະສານໂດຍກົງ.
  * **ເອກະສານໝົດອາຍຸ:** `DELETE /documents/expired` — ລົບຈຳນວນຫຼາຍ (`SUPER_ADMIN`, `HQ_ADMIN`, `BRANCH_ADMIN`).

---

### 2. ໂມດູນເອກະສານຍ່ອຍ (Sub-Document Module) *(ໃໝ່)*
ຄຸ້ມຄອງ Sub-Document ທີ່ຜູກກັບເອກະສານຫຼັກ (ເຊັ່ນ: ສະບັບແກ້ໄຂ, ເອກະສານທີ່ກ່ຽວຂ້ອງ).
* **Create (ສ້າງ):** `POST /documents/:documentId/sub-documents`
  * ທຸກລະດັບສິດ. Fields: `subDocNo` (ຕ້ອງມີ), `subDocDate` (ຕ້ອງມີ), `subDocuments` (array ເພີ່ມເຕີມ).
* **Read (ອ່ານ):** `GET /documents/:documentId/sub-documents`
  * ດຶງ sub-document ທັງໝົດຂອງເອກະສານຫຼັກ.
* **Update (ແກ້ໄຂ):** `PUT /documents/:documentId/sub-documents/:id`
  * Fields: `subDocNo`, `subDocDate`.
* **Delete (ລົບ):** `DELETE /documents/:documentId/sub-documents/:id`

---

### 3. ໂມດູນແຟ້ມເອກະສານ (Folder / Kono Module)
ຄຸ້ມຄອງແຟ້ມເອກະສານທາງກາຍະພາບທີ່ວາງຢູ່ເທິງຊັ້ນວາງ.
* **Create (ສ້າງ):** `POST /folders` — `SUPER_ADMIN`, `USER`, `BRANCH_ADMIN`, `HQ_ADMIN` ສາມາດສ້າງແຟ້ມ ໂດຍຕ້ອງລະບຸ `shelfId`. ລະບົບຈະສ້າງ QR Code ແລະ `locationRef` ໂດຍອັດຕະໂນມັດ.
* **Read (ອ່ານ):**
  * `GET /folders` — ລາຍການໜ້າ ດ້ວຍ filter: `shelfId`, `search`.
  * `GET /folders/:id` — ລາຍລະອຽດແຟ້ມ.
  * `HQ_ADMIN` ແລະ `SUPER_ADMIN` ເຫັນທຸກແຟ້ມ. `BRANCH_ADMIN` ແລະ `USER` ຖືກຈຳກັດຕາມ warehouse ຂອງຕົນ.
* **Update (ແກ້ໄຂ):** `PUT /folders/:id` — `SUPER_ADMIN`, `HQ_ADMIN`, `BRANCH_ADMIN`.
* **Delete (ລົບ):** `DELETE /folders/:id` — `SUPER_ADMIN` ແລະ `HQ_ADMIN` ເທົ່ານັ້ນ.

---

### 4. ໂມດູນຊັ້ນວາງເອກະສານ (Shelf Module)
ຄຸ້ມຄອງຊັ້ນວາງເອກະສານພາຍໃນຕູ້ເກັບ.
* **Create (ສ້າງ):** `POST /shelves` — `SUPER_ADMIN`, `HQ_ADMIN`, `BRANCH_ADMIN` ໂດຍລະບຸ `lockerId` ແລະ `maxQty`. **[ໃໝ່]** ຮອງຮັບການສ້າງຊັ້ນວາງຫຼາຍອັນໃນຄັ້ງດຽວ ຜ່ານ array `shelves`.
* **Read (ອ່ານ):**
  * `GET /shelves` — ລາຍການໜ້າ ດ້ວຍ filter: `lockerId`, `warehouseId`, `search`, `status`.
  * `GET /shelves/:id` — ລາຍລະອຽດຊັ້ນວາງ.
  * `HQ_ADMIN` ແລະ `SUPER_ADMIN` ເຫັນທຸກຊັ້ນວາງ. `BRANCH_ADMIN` ຖືກຈຳກັດຕາມ warehouse.
* **Update (ແກ້ໄຂ):** `PUT /shelves/:id` — `SUPER_ADMIN`, `HQ_ADMIN`, `BRANCH_ADMIN`.
* **Delete (ລົບ):** `DELETE /shelves/:id` — `SUPER_ADMIN` ແລະ `HQ_ADMIN` ເທົ່ານັ້ນ.

---

### 5. ໂມດູນຕູ້ເອກະສານ (Locker Module)
ຄຸ້ມຄອງຕູ້ຈັດເກັບເອກະສານພາຍໃນສາງ.
* **Create (ສ້າງ):** `POST /lockers` — `SUPER_ADMIN`, `HQ_ADMIN`, `BRANCH_ADMIN` ໂດຍລະບຸ `warehouseId`.
* **Read (ອ່ານ):**
  * `GET /lockers` — ລາຍການໜ້າ ດ້ວຍ filter: `warehouseId`, `search`, `status`.
  * `GET /lockers/:id` — ລາຍລະອຽດຕູ້.
  * `GET /lockers/dropdown` — Dropdown ຫຍໍ້, filter: `warehouseId`, `status`. ສົ່ງຄືນ `id`, `name`, `code`, `status` + ຂໍ້ມູນສາງ.
  * `HQ_ADMIN` ແລະ `SUPER_ADMIN` ເຫັນທຸກຕູ້. `BRANCH_ADMIN` ຖືກຈຳກັດຕາມ warehouse ຂອງຕົນ.
* **Update (ແກ້ໄຂ):** `PUT /lockers/:id` — `SUPER_ADMIN`, `HQ_ADMIN`, `BRANCH_ADMIN`. Fields: `code`, `name`, `description`, `warehouseId`, `status`.
* **Delete (ລົບ):** `DELETE /lockers/:id` — `SUPER_ADMIN` ແລະ `HQ_ADMIN` ເທົ່ານັ້ນ. ບໍ່ສາມາດລົບຕູ້ທີ່ຍັງມີຊັ້ນວາງ (`ConflictException`).

---

### 6. ໂມດູນສາງເອກະສານ (Warehouse Module)
ຄຸ້ມຄອງສາງເກັບເອກະສານ.
* **Create (ສ້າງ):** `POST /warehouses` — `SUPER_ADMIN`, `HQ_ADMIN`, `BRANCH_ADMIN`.
  * **[ອັບເດດ]** Fields: `code`, `name`, `description`, `departmentId`, `divisionId` (ແທນ `addressId` ເດີມ).
* **Read (ອ່ານ):**
  * `GET /warehouses` — ລາຍການໜ້າ ດ້ວຍ filter: `search`, `status`.
  * `GET /warehouses/dropdown` — Dropdown ຫຍໍ້.
  * `GET /warehouses/:id` — ລາຍລະອຽດສາງ.
* **Update (ແກ້ໄຂ):** `PUT /warehouses/:id` — Fields: `code`, `name`, `description`, `departmentId`, `divisionId`, `status`.
* **Delete (ລົບ):** `DELETE /warehouses/:id` — `SUPER_ADMIN` ແລະ `HQ_ADMIN` ເທົ່ານັ້ນ.

> **ໝາຍເຫດ:** Module `Address` ຖືກລຶບອອກຈາກ API ແລ້ວ. ສາງເອກະສານຕອນນີ້ໃຊ້ `departmentId` ແລະ `divisionId` ໂດຍກົງ ແທນ `addressId`.

---

### 7. ໂມດູນປະເພດເອກະສານ (Document Type Module)
ຄຸ້ມຄອງໝວດໝູ່ ຫຼື ປະເພດຂອງເອກະສານ.
* **Create (ສ້າງ):** `POST /document-types` — `SUPER_ADMIN`, `HQ_ADMIN`. Fields: `code`, `name`, `description`.
* **Read (ອ່ານ):**
  * `GET /document-types` — ລາຍການໜ້າ ດ້ວຍ filter: `search`, `status`.
  * `GET /document-types/name/:name` — ຊອກຫາຕາມຊື່.
  * `GET /document-types/:id` — ລາຍລະອຽດ.
* **Update (ແກ້ໄຂ):** `PUT /document-types/:id` — Fields: `code`, `name`, `description`, `isActive`.
* **Delete (ລົບ):** `DELETE /document-types/:id` — `SUPER_ADMIN` ແລະ `HQ_ADMIN` ເທົ່ານັ້ນ.

---

### 8. ໂມດູນການຢືມ-ຄືນເອກະສານ (Document Borrow Module)
ຄຸ້ມຄອງການຢືມ ແລະ ຄືນ ເອກະສານ ຫຼື ແຟ້ມເອກະສານ.
* **Create (ສ້າງ/ຢືມ):** `POST /document-borrows`
  * ທຸກລະດັບສິດ.
  * **[ອັບເດດ]** Fields: `documentIds` (array ທາງເລືອກ), `folderIds` (array ທາງເລືອກ), `borrower` (ຕ້ອງມີ), `purpose`, `toDivisionId`, `toLocation`, `note`.
  * ຕ້ອງລະບຸ `documentIds` ຫຼື `folderIds` ຢ່າງໜ້ອຍ 1 ອັນ.
* **Update (ແກ້ໄຂ/ຄືນ):** `PUT /document-borrows/:id/return` — ທຸກລະດັບສິດ.
* **Read (ອ່ານ):**
  * `GET /document-borrows` — ລາຍການໜ້າ. Filters: `documentId`, `borrowerId`, `divisionId`, `activeOnly`. Scope ຕາມສິດ.
  * `GET /document-borrows/active` — ລາຍການທີ່ຍັງຢືມຢູ່.
  * `GET /document-borrows/:id` — ລາຍລະອຽດ.
  * `GET /document-borrows/document/:documentId` — ປະຫວັດຕາມເອກະສານ.
  * `GET /document-borrows/folder/:folderId` — ປະຫວັດຕາມແຟ້ມ.
  * `GET /document-borrows/division/:divisionId` — ປະຫວັດຕາມຝ່າຍ, filter `activeOnly`.
* **Delete (ລົບ):** ບໍ່ມີ.

---

### 9. ໂມດູນຄົ້ນຫາລວມ (Search Module)
ຄຸ້ມຄອງການຄົ້ນຫາຂໍ້ມູນທົ່ວລະບົບ (Global Search).
* `GET /search` — ຄົ້ນຫາ Full-text. Query params: `q`, `limit` (default 5), `page`, `type`, `dateFrom`, `dateTo`. Entity types: `documents`, `folders`, `warehouses`, `lockers`, `shelves`, `users`, `departments`, `divisions`.
* `GET /search/qr?code=` — ຄົ້ນຫາຈາກ QR Code ໂດຍກົງ. ສົ່ງຄືນ `{ type: 'folder' | 'document', data: ... }`. ຖ້າບໍ່ພົບຈະ throw `404 NotFoundException`.

---

### 10. ໂມດູນພະແນກ (Department Module)
* `GET /departments` — ທຸກລະດັບສິດ.
* `GET /departments/dropdown` — Dropdown ຫຍໍ້.
* `POST /departments/sync` — ສະເພາະ `SUPER_ADMIN`.

---

### 11. ໂມດູນຝ່າຍ (Division Module)
* `GET /divisions` — ທຸກລະດັບສິດ.
* `GET /divisions/dropdown?departmentId=` — Dropdown ຕາມພະແນກ.
* `GET /divisions/department/:departmentId` — ທຸກຝ່າຍໃນພະແນກ.
* `POST /divisions/sync` — ສະເພາະ `SUPER_ADMIN`.

---

### 12. ໂມດູນຫ້ອງການ (Office Module)
* `GET /offices` — ທຸກລະດັບສິດ.
* `POST /offices/sync` — ສະເພາະ `SUPER_ADMIN`.

---

### 13. ໂມດູນໜ່ວຍງານ (Unit Module)
* `GET /units` — ທຸກລະດັບສິດ.
* `POST /units/sync` — ສະເພາະ `SUPER_ADMIN`.

---

### 14. ໂມດູນຜູ້ໃຊ້ ແລະ ລະບົບຄວາມປອດໄພ (User & Auth Module)
ຄຸ້ມຄອງບັນຊີຜູ້ໃຊ້, ສິດການເຂົ້າເຖິງ ແລະ ການເຊື່ອມໂຍງຂໍ້ມູນພະນັກງານ.
* **Create / Auth:**
  * `POST /auth/register` — ລົງທະບຽນດ້ວຍ `empCode` ແລະ `password`.
  * `POST /auth/login` — ເຂົ້າສູ່ລະບົບ.
* **Read (ອ່ານ):**
  * `GET /users/profile` — ຂໍ້ມູນຕົນເອງ.
  * `GET /users` — ລາຍຊື່ຜູ້ໃຊ້ (ສະເພາະ `SUPER_ADMIN`), filter: `page`, `limit`, `status`, `search`.
* **Update (ແກ້ໄຂ):**
  * `PUT /users/change-password` — ປ່ຽນລະຫັດຜ່ານຕົນເອງ.
  * `PUT /users/:id/reset-password` — ຣີເຊັດລະຫັດຜ່ານ (`BRANCH_ADMIN`, `HQ_ADMIN`, `SUPER_ADMIN`).
  * `PUT /users/:id/role` — ອັບເດດ Role (ສະເພາະ `SUPER_ADMIN`).
  * `PATCH /users/:id/approve` — ອະນຸມັດຜູ້ໃຊ້ (ສະເພາະ `SUPER_ADMIN`). **[ອັບເດດ]** Fields: `role`, `divisionIds` (ລຶບ `addressId` ອອກ).
  * `PUT /users/:id/divisions` — ອັບເດດ divisions ຂອງຜູ້ໃຊ້. Field: `divisionIds`.
* **Delete (ລົບ):** ບໍ່ມີຟັງຊັນລົບ ໃຊ້ການປ່ຽນສະຖານະ Inactive ແທນ.

---

### 15. ໂມດູນບັນທຶກປະຫວັດ (Audit Log Module)
* **Create (ສ້າງ):** ລະບົບຈະບັນທຶກປະຫວັດໂດຍອັດຕະໂນມັດ.
* **Read / Update / Delete:** ບໍ່ມີ API ເປີດເຜີຍ.

---

## 📋 ປະຫວັດການປ່ຽນແປງ (Changelog)

### ເວີຊັ່ນ 2026-07-15

#### ✅ ສິ່ງທີ່ເພີ່ມໃໝ່ (Added)

| ລາຍການ | ລາຍລະອຽດ |
|--------|-----------|
| **ໂມດູນ Sub-Document ໃໝ່** | Full CRUD `GET/POST /documents/:documentId/sub-documents` ແລະ `PUT/DELETE /documents/:documentId/sub-documents/:id` |
| **Document filter: `retentionStatus`** | ກອງເອກະສານຕາມ `ACTIVE`, `DESTROYABLE`, `EXPIRED`, `DESTROYABLE_HOLD` |
| **Document filter: `warehouseId`, `lockerId`, `shelfId`** | ກອງເອກະສານຕາມສະຖານທີ່ຈັດເກັບ |
| **`GET /documents/attachments/:attachmentId/download`** | ດາວໂຫລດໄຟລ໌ (Force download, ແຍກຈາກ stream) |
| **`GET /documents/:id/destruction-approval`** | ດຶງສະຖານະການອະນຸມັດທຳລາຍ |

#### 🔄 ສິ່ງທີ່ອັບເດດ (Updated)

| ລາຍການ | ກ່ອນໜ້ານີ້ | ຫຼັງຈາກນີ້ |
|--------|-----------|----------|
| **Warehouse schema** | ໃຊ້ `addressId` | ໃຊ້ `departmentId` + `divisionId` ແທນ |
| **Document Borrow fields** | `documentId` (single), `folderId` (single) | `documentIds` (array), `folderIds` (array) |
| **User approve fields** | `role`, `addressId`, `divisionIds` | `role`, `divisionIds` (ລຶບ `addressId` ອອກ) |
| **Physical storage hierarchy** | Address → Warehouse → Locker → Shelf → Folder → Document | Warehouse → Locker → Shelf → Folder → Document → SubDocument |

#### ❌ ສິ່ງທີ່ລຶບອອກ (Removed)

| ລາຍການ | ລາຍລະອຽດ |
|--------|-----------|
| **Address Module** | ລຶບທັງ Module ອອກຈາກ API. Warehouse ໃຊ້ `departmentId`/`divisionId` ໂດຍກົງ. |

---

### ເວີຊັ່ນ 2026-07-02

#### ✅ ສິ່ງທີ່ເພີ່ມໃໝ່ (Added)

| ລາຍການ | ລາຍລະອຽດ |
|--------|-----------|
| **`GET /lockers/dropdown`** | Endpoint Dropdown ສຳລັບ Locker |
| **`getDropdown()` ໃນ `ILockerRepository`** | Contract ໃໝ່ໃນ Interface |

#### 🔄 ສິ່ງທີ່ອັບເດດ (Updated)

| ລາຍການ | ລາຍລະອຽດ |
|--------|-----------|
| **Delete Locker** | ເພີ່ມການ block ດ້ວຍ `ConflictException` ຖ້າຕູ້ຍັງມີ Shelf ຢູ່ |
