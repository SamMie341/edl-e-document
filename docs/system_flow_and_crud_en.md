# EDL E-Document System Flow and CRUD Documentation

This document outlines the workflows, structure, and CRUD (Create, Read, Update, Delete) operations of the **EDL E-Document** (Electronic Document Management System) backend built using NestJS, Prisma ORM, and PostgreSQL.

---

## 1. System Workflows

The EDL E-Document system is designed to manage both **Digital Attachments** and **Physical Storage Tracking**. The main workflows of the system are divided into 4 core sections:

### A. Authentication & HRM Sync Flow
1. **HRM Sync:** The system integrates with an external HRM database using employee codes (`empCode`) to synchronize personal profiles and organizational hierarchies, including Branches, Departments, Divisions, Offices, and Units.
2. **Authentication:** Standard authentication using passwords hashed with bcrypt and JWT Strategy for token verification.
3. **Role-Based Access Control (RBAC):** The system defines 4 main roles:
   * **`SUPER_ADMIN`**: Has full access to all operations across the entire system — manages users, roles, HRM sync, and all physical storage and document operations.
   * **`HQ_ADMIN`**: Headquarters Administrator. Can manage and view physical warehouses, lockers, shelves, folders, and document types nationwide. Also has full read/manage access to documents across all divisions.
   * **`BRANCH_ADMIN`**: Branch Administrator. Can manage physical warehouses, lockers, shelves, folders, and documents specifically within their own department (`departmentId` from JWT). Document visibility is scoped to divisions they are associated with.
   * **`USER`**: General employee. Can create documents, upload attachments, search documents, and view physical storage locations. Document visibility is scoped only to divisions they are assigned to (`userDivisionIds` resolved from `UserDivisionModel`).

---

### B. Physical Storage Hierarchy Flow
To facilitate easy tracking of physical documents, the system organizes storage locations in the following hierarchy:

```
[Warehouse] (Document Warehouse — linked to departmentId & divisionId)
       └── [Locker] (Document Locker)
              └── [Shelf] (Document Shelf)
                     └── [Folder / Kono] (Folder with QR Code)
                            └── [Document] (Physical Document with QR Code)
                                   └── [SubDocument] (Sub-document entries)
```

> **Key Design Change (v2026-07-15):** The `Address` entity has been removed from the API. `Warehouse` now stores `departmentId` and `divisionId` directly for organizational scoping. All downstream entities (Locker → Shelf → Folder → Document) inherit location by traversing the chain upward.

* **Folder (Folder / Kono):** Storage folders have unique QR Codes for location scanning. The `locationRef` is auto-generated as `warehouse.code / locker.code / shelf.name`.
* **Shelf:** Has a defined maximum capacity (`maxQty`) to prevent overloading documents.
* **Document:** Has its own `qrCode` field for direct physical document tracking.

---

### C. Document Archival Flow
> **Note:** The system does not have an approval (Approve) or rejection (Reject) flow because documents archived in the system must be already verified and correct beforehand.

1. **Source Document Verification:** Users verify the physical source document before archiving.
2. **Document Creation:** User (`USER` or Admin) creates a document entry by entering metadata (title, doc number, doc type, selecting folder, `departmentId`, `divisionId`) and uploading attachments.
3. **File Compression & Storage:** Uploaded files are validated, compressed to save space, and saved in storage.
4. **Document Expiry & Retention:** Each document has a `docExpire` date and `isContractBound` flag. Retention status is automatically calculated:
   * `ACTIVE` — document age < 10 years
   * `DESTROYABLE` — document age = 10 years
   * `EXPIRED` — document age > 10 years
   * `DESTROYABLE_HOLD` — document is contract-bound (cannot be destroyed)
5. **Audit Logs:** The system automatically records the action, timestamp, and actor in the `audit_logs` table.

---

### D. Document Borrow Flow
The system tracks the physical borrowing and return of documents or folders:

1. **Borrow Request:** Any authenticated user submits a borrow request specifying `documentIds` or `folderIds` (plural arrays), borrower name, purpose, and destination division (`toDivisionId`).
2. **Active Tracking:** Borrow records are tracked with a `returnedAt` timestamp. Records without `returnedAt` are considered **active borrows**.
3. **Return:** Any authenticated user can mark a borrow record as returned via `PUT /document-borrows/:id/return`.
4. **Scope-Based Visibility:** Borrow history is scoped by role:
   * `SUPER_ADMIN` / `HQ_ADMIN` → see all borrow records.
   * `BRANCH_ADMIN` → scoped to their own `departmentId`.
   * `USER` → scoped to their own `divisionId`.

---

## 2. CRUD Details for Each Module

### 1. Document Module
Manages digital attachments and physical document metadata.
* **Create:** `POST /documents`
  * Authorized roles: `SUPER_ADMIN`, `USER`, `HQ_ADMIN`, `BRANCH_ADMIN`.
  * Allows uploading up to 10 files simultaneously (compressed automatically).
  * Required fields: `docNo`, `docDate`, `title`, `docExpire`, `folderId`, `documentTypeId`.
  * Optional fields: `shortName`, `subDocNo`, `subDocDate`, `description`, `qrCode`, `isContractBound`, `departmentId`, `divisionId`.
* **Read:**
  * `GET /documents` — Retrieve a paginated list of documents with filters:
    * `documentTypeId`, `startDate`, `endDate`, `search`, `folderId`, `departmentId`, `divisionId`
    * **[New]** `retentionStatus` — filter by retention status (`ACTIVE`, `DESTROYABLE`, `EXPIRED`, `DESTROYABLE_HOLD`)
    * **[New]** `warehouseId`, `lockerId`, `shelfId` — filter by physical storage location
  * `SUPER_ADMIN` and `HQ_ADMIN` see all documents.
  * `BRANCH_ADMIN` and `USER` see only documents within their assigned divisions (`userDivisionIds` from `UserDivisionModel`).
  * `GET /documents/:id` — Retrieve document details by ID; also enforces division-based access for `BRANCH_ADMIN` and `USER`.
  * `GET /documents/attachments/:attachmentId` — Stream/view a file attachment with role-based permission checks.
  * **[New]** `GET /documents/attachments/:attachmentId/download` — Force-download a file attachment.
  * `GET /documents/expired` — List documents that are expired or destroyable (`SUPER_ADMIN`, `HQ_ADMIN`, `BRANCH_ADMIN`).
  * **[New]** `GET /documents/:id/destruction-approval` — Get the destruction approval status for a specific document.
* **Update:** `PUT /documents/:id`
  * All roles can update documents. Ownership/scope checks are applied via the use case layer.
  * Supports replacing file attachments (up to 10 files).
* **Delete:**
  * Direct document deletion via API is prohibited to prevent data loss and ensure audit security.
  * **Expired Documents:** `SUPER_ADMIN`, `HQ_ADMIN`, `BRANCH_ADMIN` can bulk delete expired documents: `DELETE /documents/expired`.

---

### 2. Sub-Document Module *(New)*
Manages sub-document entries linked to a parent document (e.g., revisions, related documents).
* **Create:** `POST /documents/:documentId/sub-documents`
  * Authorized roles: All roles.
  * Fields: `subDocNo` (required), `subDocDate` (required), `subDocuments` (optional array of additional entries).
* **Read:** `GET /documents/:documentId/sub-documents`
  * Authorized roles: All roles.
  * Returns all sub-documents linked to the specified parent document ID.
* **Update:** `PUT /documents/:documentId/sub-documents/:id`
  * Authorized roles: All roles.
  * Fields: `subDocNo`, `subDocDate`.
* **Delete:** `DELETE /documents/:documentId/sub-documents/:id`
  * Authorized roles: All roles.

---

### 3. Folder / Kono Module
Manages physical folders placed on shelves.
* **Create:** `SUPER_ADMIN`, `USER`, `BRANCH_ADMIN`, `HQ_ADMIN` can create folders under a specific shelf (`shelfId`). A QR code and `locationRef` are generated automatically.
* **Read:**
  * `SUPER_ADMIN` and `HQ_ADMIN` see all folders. `BRANCH_ADMIN` and `USER` are scoped to their warehouse's `departmentId` / `divisionId` (traversed via Folder → Shelf → Locker → Warehouse).
  * `GET /folders` — Paginated list with filters: `shelfId`, `search`.
  * `GET /folders/:id` — Get folder details by ID.
* **Update:** `PUT /folders/:id` — `SUPER_ADMIN`, `HQ_ADMIN`, and `BRANCH_ADMIN` can update folder details.
* **Delete:** `DELETE /folders/:id` — `SUPER_ADMIN` and `HQ_ADMIN` only.

---

### 4. Shelf Module
Manages physical shelves within lockers.
* **Create:** `POST /shelves` — `SUPER_ADMIN`, `HQ_ADMIN`, and `BRANCH_ADMIN` can create shelves under a locker (`lockerId`) and define `maxQty`. Supports batch creation via `shelves` array.
* **Read:**
  * `SUPER_ADMIN` and `HQ_ADMIN` see all shelves. `BRANCH_ADMIN` is scoped via Shelf → Locker → Warehouse.
  * `GET /shelves` — Paginated list with filters: `lockerId`, `warehouseId`, `search`, `status`.
  * `GET /shelves/:id` — Get shelf details by ID.
* **Update:** `PUT /shelves/:id` — `SUPER_ADMIN`, `HQ_ADMIN`, and `BRANCH_ADMIN` can update shelf information and status.
* **Delete:** `DELETE /shelves/:id` — `SUPER_ADMIN` and `HQ_ADMIN` only.

---

### 5. Locker Module
Manages physical lockers within warehouses.
* **Create:** `POST /lockers` — `SUPER_ADMIN`, `HQ_ADMIN`, and `BRANCH_ADMIN` can create lockers under a warehouse (`warehouseId`).
* **Read:**
  * `SUPER_ADMIN` and `HQ_ADMIN` see all lockers. `BRANCH_ADMIN` is scoped via Locker → Warehouse.
  * `GET /lockers` — Paginated list with filters: `warehouseId`, `search`, `status`.
  * `GET /lockers/:id` — Get locker details by ID.
  * `GET /lockers/dropdown` — Lightweight dropdown list, filters: `warehouseId`, `status`. Returns `id`, `name`, `code`, `status`, and parent warehouse info.
* **Update:** `PUT /lockers/:id` — `SUPER_ADMIN`, `HQ_ADMIN`, and `BRANCH_ADMIN`. Update fields: `code`, `name`, `description`, `warehouseId`, `status`.
* **Delete:** `DELETE /lockers/:id` — `SUPER_ADMIN` and `HQ_ADMIN` only. Blocked if the locker still has shelves inside (`ConflictException`).

---

### 6. Warehouse Module
Manages physical document warehouses associated with a department/division.
* **Create:** `POST /warehouses` — `SUPER_ADMIN`, `HQ_ADMIN`, and `BRANCH_ADMIN` can create warehouses.
  * **[Updated]** Required/optional fields: `code`, `name`, `description`, `departmentId`, `divisionId` (replaces old `addressId`).
* **Read:**
  * `GET /warehouses` — Paginated list with filters: `search`, `status`.
  * `GET /warehouses/dropdown` — Lightweight dropdown list.
  * `GET /warehouses/:id` — Get warehouse details by ID.
* **Update:** `PUT /warehouses/:id` — `SUPER_ADMIN`, `HQ_ADMIN`, and `BRANCH_ADMIN`. Update fields: `code`, `name`, `description`, `departmentId`, `divisionId`, `status`.
* **Delete:** `DELETE /warehouses/:id` — `SUPER_ADMIN` and `HQ_ADMIN` only.

> **Note:** The `Address` module has been **removed** from the API. Warehouse is now scoped by `departmentId` and `divisionId` instead of `addressId`.

---

### 7. Document Type Module
Manages document categories.
* **Create:** `POST /document-types` — `SUPER_ADMIN` and `HQ_ADMIN`. Fields: `code`, `name`, `description`.
* **Read:**
  * `GET /document-types` — Paginated list with filters: `search`, `status`.
  * `GET /document-types/name/:name` — Find by name.
  * `GET /document-types/:id` — Find by ID.
* **Update:** `PUT /document-types/:id` — Fields: `code`, `name`, `description`, `isActive`.
* **Delete:** `DELETE /document-types/:id` — `SUPER_ADMIN` and `HQ_ADMIN` only (provided no documents are currently using it).

---

### 8. Document Borrow Module
Tracks the physical borrowing and return of documents and folders.
* **Create (Borrow):** `POST /document-borrows`
  * Authorized roles: All roles.
  * **[Updated]** Fields: `documentIds` (optional array), `folderIds` (optional array), `borrower` (required), `purpose`, `toDivisionId`, `toLocation`, `note`.
  * At least one of `documentIds` or `folderIds` must be provided.
* **Update (Return):** `PUT /document-borrows/:id/return`
  * Authorized roles: All roles.
  * Marks the borrow record as returned by setting `returnedAt` timestamp.
* **Read:**
  * `GET /document-borrows` — Paginated list. Filters: `documentId`, `borrowerId`, `divisionId`, `activeOnly`. Scope enforced by role.
  * `GET /document-borrows/active` — Currently unreturned borrow records. Scoped by role.
  * `GET /document-borrows/:id` — Single borrow record by ID.
  * `GET /document-borrows/document/:documentId` — Borrow history for a specific document.
  * `GET /document-borrows/folder/:folderId` — All borrow records for a specific folder.
  * `GET /document-borrows/division/:divisionId` — All borrows for a specific division. Supports `activeOnly` query.
* **Delete:** No delete endpoint. Borrow records are permanent for audit purposes.

> **Scope Rules:**
> * `SUPER_ADMIN` / `HQ_ADMIN` → no restriction, see all borrow records.
> * `BRANCH_ADMIN` → records filtered by their `departmentId`.
> * `USER` → records filtered by their `divisionId`.

---

### 9. Global Search Module
Provides a unified full-text search across multiple entity types with role-based scoping.
* **Global Search:** `GET /search`
  * Authorized roles: All roles.
  * Query params:
    * `q` (required) — search keyword
    * `limit` (default: 5, max: 20) — results per entity per page
    * `page` (default: 1)
    * `type` (optional, comma-separated) — filter to specific entity types; e.g. `documents,folders`
    * `dateFrom` / `dateTo` (optional, ISO 8601) — date range filter applied to `documents` only
  * Supported entity types: `documents`, `folders`, `warehouses`, `lockers`, `shelves`, `users`, `departments`, `divisions`.
  * **Scope:**
    * `SUPER_ADMIN` and `HQ_ADMIN` search across all data.
    * `BRANCH_ADMIN` and `USER` are scoped to their assigned divisions (`userDivisionIds`).
  * Returns paginated results per entity type with `total`, `page`, `limit`, and `hasMore`.

* **QR Code Lookup:** `GET /search/qr`
  * Authorized roles: All roles.
  * Query params: `code` (required) — exact QR code string.
  * Searches in order: Folder → Document.
  * Returns `{ type: 'folder' | 'document', data: { ... } }` with full location hierarchy (Shelf → Locker → Warehouse).
  * Returns `404 NotFoundException` if the QR code is not found.

---

### 10. Department Module
* **Read:** `GET /departments` — All authenticated users can view departments.
* **Dropdown:** `GET /departments/dropdown` — Lightweight dropdown list.
* **Sync:** `POST /departments/sync` — Only `SUPER_ADMIN` can trigger sync from external HRM database.

---

### 11. Division Module
* **Read:** `GET /divisions` — All authenticated users can view divisions.
* **Dropdown:** `GET /divisions/dropdown?departmentId=` — Filter by department.
* **By Department:** `GET /divisions/department/:departmentId` — All divisions under a specific department.
* **Sync:** `POST /divisions/sync` — Only `SUPER_ADMIN` can trigger sync from HRM.

---

### 12. Office Module
* **Read:** `GET /offices` — All authenticated users can view offices.
* **Sync:** `POST /offices/sync` — Only `SUPER_ADMIN` can trigger sync.

---

### 13. Unit Module
* **Read:** `GET /units` — All authenticated users can view units.
* **Sync:** `POST /units/sync` — Only `SUPER_ADMIN` can trigger sync.

---

### 14. User & Auth Module
Manages user accounts, permissions, and HRM integration.
* **Create / Auth:**
  * `POST /auth/register` — Register new user with `empCode` and `password`.
  * `POST /auth/login` — Login with `empCode` and `password`.
* **Read:**
  * `GET /users/profile` — View current logged-in user profile.
  * `GET /users` — View user list with filters: `page`, `limit`, `status`, `search` (only `SUPER_ADMIN`).
* **Update:**
  * `PUT /users/change-password` — Change own password (`oldPassword`, `newPassword`).
  * `PUT /users/:id/reset-password` — Reset another user's password (`BRANCH_ADMIN`, `HQ_ADMIN`, `SUPER_ADMIN`).
  * `PUT /users/:id/role` — Update user role (only `SUPER_ADMIN`). Field: `role`.
  * `PATCH /users/:id/approve` — Approve user registration (only `SUPER_ADMIN`). **[Updated]** Fields: `role`, `divisionIds` (removed `addressId`).
  * `PUT /users/:id/divisions` — Update a user's assigned divisions. Field: `divisionIds`.
* **Delete:** Accounts cannot be deleted; status is set to Inactive.

---

### 15. Audit Log Module
* **Create:** Automatically logged on creation/update/view actions.
* **Read / Update / Delete:** No exposed APIs to preserve audit integrity.

---

## 3. Key Design Notes

### Document Access Scoping
The system uses `UserDivisionModel` (a junction table) to determine which divisions each user belongs to. Document access for `BRANCH_ADMIN` and `USER` roles is determined by the set of `divisionIds` associated with their user account:
- **`SUPER_ADMIN` / `HQ_ADMIN`** → no division restriction, see all documents.
- **`BRANCH_ADMIN` / `USER`** → can only access documents where the document's `divisionId` is in their allowed `userDivisionIds`.

### Document Retention Policy
Documents have a calculated retention status based on document age and contract binding:

| Condition | Status |
|---|---|
| `isContractBound = true` | `DESTROYABLE_HOLD` |
| age < 10 years | `ACTIVE` |
| age = 10 years | `DESTROYABLE` |
| age > 10 years | `EXPIRED` |

Expired and destroyable documents can be listed and bulk-deleted by `SUPER_ADMIN`, `HQ_ADMIN`, and `BRANCH_ADMIN`.

### QR Code Strategy
Both **Folders** and **Documents** have unique QR codes:
- **Folder QR Code** — auto-generated on creation; used to identify the physical storage location.
- **Document QR Code** — optionally provided on creation or set manually; used to identify individual physical documents.
- The `GET /search/qr?code=` endpoint resolves any QR code to either a folder or a document, returning the full location hierarchy.

---

## 📋 Changelog

### Version 2026-07-15

#### ✅ Added
| Item | Detail |
|---|---|
| **New Module: Sub-Document** | Full CRUD under `GET/POST /documents/:documentId/sub-documents` and `PUT/DELETE /documents/:documentId/sub-documents/:id` |
| **Document filter: `retentionStatus`** | Filter documents by `ACTIVE`, `DESTROYABLE`, `EXPIRED`, `DESTROYABLE_HOLD` |
| **Document filter: `warehouseId`, `lockerId`, `shelfId`** | Filter documents by physical storage location |
| **New endpoint: `GET /documents/attachments/:attachmentId/download`** | Force-download attachment (separate from stream/view) |
| **New endpoint: `GET /documents/:id/destruction-approval`** | Get destruction approval status for a document |

#### 🔄 Updated
| Item | Before | After |
|---|---|---|
| **Warehouse schema** | Required `addressId` | Now uses `departmentId` + `divisionId` instead |
| **Borrow request fields** | `documentId` (single), `folderId` (single) | `documentIds` (array), `folderIds` (array) |
| **User approve endpoint** | Fields: `role`, `addressId`, `divisionIds` | Fields: `role`, `divisionIds` (removed `addressId`) |
| **Physical storage hierarchy** | Address → Warehouse → Locker → Shelf → Folder → Document | Warehouse → Locker → Shelf → Folder → Document → SubDocument |

#### ❌ Removed
| Item | Detail |
|---|---|
| **Address Module** | Removed from API entirely. Warehouse now directly stores `departmentId` and `divisionId`. |

### Version 2026-07-02
- Added `GET /lockers/dropdown` endpoint to Locker Module.
- Added `ConflictException` guard on Locker delete when shelves exist inside.
