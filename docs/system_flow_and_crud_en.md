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
   * **`HQ_ADMIN`**: Headquarters Administrator. Can manage and view physical addresses, warehouses, lockers, shelves, folders, and document types nationwide. Also has full read/manage access to documents across all addresses.
   * **`BRANCH_ADMIN`**: Branch Administrator. Can manage physical warehouses, lockers, shelves, folders, and documents specifically within their own department (`departmentId` from JWT). Document visibility is scoped to divisions they are associated with.
   * **`USER`**: General employee. Can create documents, upload attachments, search documents, and view physical storage locations. Document visibility is scoped only to divisions they are assigned to (`userDivisionIds` resolved from `UserDivisionModel`).

---

### B. Physical Storage Hierarchy Flow
To facilitate easy tracking of physical documents, the system organizes storage locations in the following hierarchy:

```
[Address] (Storage Location / Building)
   └── [Warehouse] (Document Warehouse)
          └── [Locker] (Document Locker)
                 └── [Shelf] (Document Shelf)
                        └── [Folder / Kono] (Folder with QR Code)
                               └── [Document] (Physical Document with QR Code)
```

> **Key Design Decision:** `Address` is the single source of truth for physical location. Only `Warehouse` stores `addressId` directly. All downstream entities (Locker → Shelf → Folder → Document) inherit location by traversing the chain upward. There is **no** `branchId` or `divisionId` on any physical storage model.

* **Address:** Identifies physical locations or buildings where warehouses are situated. Linked to a `departmentId` and `divisionId` for organizational scoping.
* **Folder (Folder / Kono):** Storage folders have unique QR Codes for location scanning. The `locationRef` is auto-generated as `address.code / warehouse.code / locker.code`.
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

1. **Borrow Request:** Any authenticated user submits a borrow request specifying `documentId` or `folderId`, borrower name, purpose, and destination division (`toDivisionId`).
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
* **Create:**
  * Authorized roles: `SUPER_ADMIN`, `USER`, `HQ_ADMIN`, `BRANCH_ADMIN`.
  * Allows uploading up to 10 files simultaneously (compressed automatically).
  * Required fields: `docNo`, `docDate`, `title`, `docExpire`, `folderId`, `documentTypeId`.
  * Optional fields: `shortName`, `subDocNo`, `subDocDate`, `description`, `qrCode`, `isContractBound`, `departmentId`, `divisionId`.
* **Read:**
  * Retrieve a paginated list of documents with filters: `documentTypeId`, `startDate`, `endDate`, `search`, `folderId`, `departmentId`, `divisionId`.
  * `SUPER_ADMIN` and `HQ_ADMIN` see all documents.
  * `BRANCH_ADMIN` and `USER` see only documents within their assigned divisions (`userDivisionIds` from `UserDivisionModel`).
  * Retrieve document details by ID (`GET /documents/:id`) — also enforces division-based access for `BRANCH_ADMIN` and `USER`.
  * Stream or download file attachments (`GET /documents/attachments/:attachmentId`) with role-based permission checks.
* **Update:**
  * All roles (`SUPER_ADMIN`, `HQ_ADMIN`, `BRANCH_ADMIN`, `USER`) can update documents. Ownership/scope checks are applied via the use case layer.
  * Supports replacing file attachments (up to 10 files).
* **Delete:**
  * Direct document deletion via API is prohibited to prevent data loss and ensure audit security.
  * **Expired Documents:** `SUPER_ADMIN`, `HQ_ADMIN`, `BRANCH_ADMIN` can:
    * List expired documents: `GET /documents/expired`
    * Bulk delete expired documents after review: `DELETE /documents/expired`

---

### 2. Folder / Kono Module
Manages physical folders placed on shelves.
* **Create:** `SUPER_ADMIN`, `USER`, `BRANCH_ADMIN`, `HQ_ADMIN` can create folders under a specific shelf (`shelfId`). A QR code and `locationRef` are generated automatically.
* **Read:**
  * `SUPER_ADMIN` and `HQ_ADMIN` see all folders. `BRANCH_ADMIN` and `USER` are scoped to their `addressId` (traversed via Folder → Shelf → Locker → Warehouse → addressId).
  * View all folders residing on a specific shelf (`getByShelf`).
  * Get folder details by ID (`getById`).
* **Update:** `SUPER_ADMIN`, `HQ_ADMIN`, and `BRANCH_ADMIN` can update folder details. `BRANCH_ADMIN` is restricted to folders within their own address.
* **Delete:** `SUPER_ADMIN` and `HQ_ADMIN` only. `BRANCH_ADMIN` can delete folders within their own address.

### 3. Shelf Module
Manages physical shelves within lockers.
* **Create:** `SUPER_ADMIN`, `HQ_ADMIN`, and `BRANCH_ADMIN` can create shelves under a locker (`lockerId`) and define `maxQty`. `BRANCH_ADMIN` is validated against their `addressId`.
* **Read:**
  * `SUPER_ADMIN` and `HQ_ADMIN` see all shelves. `BRANCH_ADMIN` is scoped to their `addressId` (via Shelf → Locker → Warehouse → addressId).
  * View shelves under a specific locker (`getByLocker`).
* **Update:** `SUPER_ADMIN`, `HQ_ADMIN`, and `BRANCH_ADMIN` can update shelf information and status.
* **Delete:** `SUPER_ADMIN` and `HQ_ADMIN` only.

### 4. Locker Module
Manages physical lockers within warehouses.
* **Create:** `SUPER_ADMIN`, `HQ_ADMIN`, and `BRANCH_ADMIN` can create lockers under a warehouse (`warehouseId`). `BRANCH_ADMIN` is validated that the target warehouse's `addressId` matches their own.
* **Read:**
  * `SUPER_ADMIN` and `HQ_ADMIN` see all lockers. `BRANCH_ADMIN` is scoped to their `addressId` (via Locker → Warehouse → addressId).
  * Supports filters: `warehouseId`, `addressId`, `status`, `search`.
  * Retrieve lockers under a specific warehouse (`getByWarehouse`).
  * Dropdown list endpoint supports filtering by `warehouseId`, `addressId`, `status`.
* **Update:** `SUPER_ADMIN`, `HQ_ADMIN`, and `BRANCH_ADMIN` can update locker details. `BRANCH_ADMIN` validated against their `addressId`.
* **Delete:** `SUPER_ADMIN` and `HQ_ADMIN` only. Delete is blocked if the locker still has shelves inside.

### 5. Warehouse Module
Manages physical document warehouses associated with an address.
* **Create:** `SUPER_ADMIN`, `HQ_ADMIN`, and `BRANCH_ADMIN` can create warehouses. Only `addressId` is required (no `branchId` or `divisionId`).
* **Read:**
  * View warehouse list with optional `search` and `status` filters.
  * `SUPER_ADMIN` and `HQ_ADMIN` see all warehouses. All roles can list warehouses.
* **Update:** `SUPER_ADMIN`, `HQ_ADMIN`, and `BRANCH_ADMIN` can update warehouse name, code, description, and status.
* **Delete:** `SUPER_ADMIN` and `HQ_ADMIN` only.

> **Note:** The previous `GET branches/dropdown` endpoint has been removed. Warehouse no longer has `branchId` or `divisionId` — it is associated only with `Address`.

### 6. Address Module
Manages physical storage locations/buildings holding warehouses.
* **Create:** `SUPER_ADMIN` and `HQ_ADMIN` can create storage locations. Requires `code`, `name`, `departmentId`, and `divisionId`.
* **Read:**
  * View address lists (`HQ_ADMIN` and `SUPER_ADMIN`).
  * Fetch dropdown options of storage addresses (`HQ_ADMIN` and `BRANCH_ADMIN`).
* **Update:** `SUPER_ADMIN` and `HQ_ADMIN` can update address details.
* **Delete:** `SUPER_ADMIN` and `HQ_ADMIN` only.

### 7. Document Type Module
Manages document categories.
* **Create:** `SUPER_ADMIN` and `HQ_ADMIN` can create document types.
* **Read:** All roles can view and search document types.
* **Update:** `SUPER_ADMIN` and `HQ_ADMIN` can update document types.
* **Delete:** `SUPER_ADMIN` and `HQ_ADMIN` only (provided no documents are currently using it).

---

### 8. Document Borrow Module *(New)*
Tracks the physical borrowing and return of documents and folders.
* **Create (Borrow):** `POST /document-borrows`
  * Authorized roles: All roles (`SUPER_ADMIN`, `HQ_ADMIN`, `BRANCH_ADMIN`, `USER`).
  * Fields: `documentId` (optional UUID), `folderId` (optional UUID), `borrower` (required), `purpose`, `toDivisionId`, `toLocation`, `note`.
  * Either `documentId` or `folderId` must be provided.
* **Update (Return):** `PUT /document-borrows/:id/return`
  * Authorized roles: All roles.
  * Marks the borrow record as returned by setting `returnedAt` timestamp.
* **Read:**
  * `GET /document-borrows` — Paginated list of all borrow records. Supports filters: `documentId`, `borrowerId`, `divisionId`, `activeOnly`. Scope is enforced by role.
  * `GET /document-borrows/active` — List of currently borrowed (unreturned) records. Scoped by role.
  * `GET /document-borrows/:id` — Single borrow record by ID.
  * `GET /document-borrows/document/:documentId` — Borrow history for a specific document. Scoped by role.
  * `GET /document-borrows/folder/:folderId` — All borrow records for documents in a specific folder. Scoped by role.
  * `GET /document-borrows/division/:divisionId` — All borrows destined to a specific division (`toDivisionId`). Supports `activeOnly` query. `USER` is forced to see only their own division.
* **Delete:** No delete endpoint. Borrow records are permanent for audit purposes.

> **Scope Rules:**
> * `SUPER_ADMIN` / `HQ_ADMIN` → no restriction, see all borrow records.
> * `BRANCH_ADMIN` → records filtered by their `departmentId`.
> * `USER` → records filtered by their `divisionId`.

---

### 9. Global Search Module *(New)*
Provides a unified full-text search across multiple entity types with role-based scoping.
* **Global Search:** `GET /search`
  * Authorized roles: All roles.
  * Query params:
    * `q` (required) — search keyword
    * `limit` (default: 5, max: 20) — results per entity per page
    * `page` (default: 1)
    * `type` (optional, comma-separated) — filter to specific entity types; e.g. `documents,folders`
    * `dateFrom` / `dateTo` (optional, ISO 8601) — date range filter applied to `documents` only
  * Supported entity types: `documents`, `folders`, `warehouses`, `lockers`, `shelves`, `users`, `addresses`, `departments`, `divisions`.
  * **Scope:**
    * `SUPER_ADMIN` and `HQ_ADMIN` search across all data.
    * `BRANCH_ADMIN` and `USER` are scoped to their assigned divisions (`userDivisionIds`).
  * Returns paginated results per entity type with `total`, `page`, `limit`, and `hasMore`.

* **QR Code Lookup:** `GET /search/qr`
  * Authorized roles: All roles.
  * Query params: `code` (required) — exact QR code string.
  * Searches in order: Folder → Document.
  * Returns `{ type: 'folder' | 'document', data: { ... } }` with full location hierarchy (Shelf → Locker → Warehouse → Address).
  * Returns `404 NotFoundException` if the QR code is not found.

---

### 10. Branch Module
* **Read:** All authenticated users can view branches.
* **Sync:** Branch data is synced automatically via Division sync.

---

### 11. Department Module
* **Read:** All authenticated users can view departments.
* **Sync:** Only `SUPER_ADMIN` can trigger sync from external HRM database.

---

### 12. Division Module
* **Read:** All authenticated users can view divisions.
* **Sync:** Only `SUPER_ADMIN` can trigger sync from HRM (which also updates branch data).

---

### 13. Office Module
* **Read:** All authenticated users can view offices.
* **Sync:** Only `SUPER_ADMIN` can trigger sync.

---

### 14. Unit Module
* **Read:** All authenticated users can view units.
* **Sync:** Only `SUPER_ADMIN` can trigger sync.

---

### 15. User & Auth Module
Manages user accounts, permissions, and HRM integration.
* **Create:**
  * Register new user (`register`).
  * Auto-register employee via HRM sync using `empCode`.
* **Read:**
  * View current logged-in profile (`getProfile`).
  * View user list (only `SUPER_ADMIN`).
* **Update:**
  * Change own password (`changePassword`).
  * Reset password for other users (roles: `BRANCH_ADMIN`, `HQ_ADMIN`, `SUPER_ADMIN`).
  * Update user role (only `SUPER_ADMIN`).
  * Approve user registrations (only `SUPER_ADMIN`).
* **Delete:** Accounts cannot be deleted; status is set to Inactive.

---

### 16. Audit Log Module
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
