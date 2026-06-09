# EDL E-Document System Flow and CRUD Documentation

This document outlines the workflows, structure, and CRUD (Create, Read, Update, Delete) operations of the **EDL E-Document** (Electronic Document Management System) backend built using NestJS, Prisma ORM, and PostgreSQL.

---

## 1. System Workflows

The EDL E-Document system is designed to manage both **Digital Attachments** and **Physical Storage Tracking**. The main workflows of the system are divided into 3 core sections:

### A. Authentication & HRM Sync Flow
1. **HRM Sync:** The system integrates with an external HRM database using employee codes (`empCode`) to synchronize personal profiles and organizational hierarchies, including Branches, Departments, Divisions, Offices, and Units.
2. **Authentication:** Standard authentication using passwords hashed with bcrypt and JWT Strategy for token verification.
3. **Role-Based Access Control (RBAC):** The system defines 4 main roles:
   * **`SUPER_ADMIN`**: Has full access to all operations across the entire system — manages users, roles, HRM sync, and all physical storage and document operations.
   * **`HQ_ADMIN`**: Headquarters Administrator. Can manage and view physical addresses, warehouses, lockers, shelves, folders, and document types nationwide. Also has full read/manage access to documents across all addresses.
   * **`BRANCH_ADMIN`**: Branch Administrator. Can manage physical warehouses, lockers, shelves, folders, and documents specifically within their own address (`addressId` from JWT).
   * **`USER`**: General employee. Can create documents, upload attachments, search their own documents, and view physical storage locations (can only view/download attachments of documents they created themselves).

---

### B. Physical Storage Hierarchy Flow
To facilitate easy tracking of physical documents, the system organizes storage locations in the following hierarchy:

```
[Address] (Storage Location / Building)
   └── [Warehouse] (Document Warehouse)
          └── [Locker] (Document Locker)
                 └── [Shelf] (Document Shelf)
                        └── [Folder / Kono] (Folder with QR Code)
                               └── [Document] (Physical Document)
```

> **Key Design Decision:** `Address` is the single source of truth for physical location. Only `Warehouse` stores `addressId` directly. All downstream entities (Locker → Shelf → Folder → Document) inherit location by traversing the chain upward. There is **no** `branchId` or `divisionId` on any physical storage model.

* **Address:** Identifies physical locations or buildings where warehouses are situated. All physical location scoping is done through `Address`.
* **Folder (Folder / Kono):** Storage folders have unique QR Codes for location scanning. The `locationRef` is auto-generated as `address.code / warehouse.code / locker.code`.
* **Shelf:** Has a defined maximum capacity (`maxQty`) to prevent overloading documents.

---

### C. Document Archival Flow
> **Note:** The system does not have an approval (Approve) or rejection (Reject) flow because documents archived in the system must be already verified and correct beforehand.

1. **Source Document Verification:** Users verify the physical source document before archiving.
2. **Document Creation:** User (`USER` or Admin) creates a document entry by entering metadata (title, doc number, doc type, selecting folder) and uploading attachments.
3. **File Compression & Storage:** Uploaded files are validated, compressed to save space, and saved in storage.
4. **Audit Logs:** The system automatically records the action, timestamp, and actor in the `audit_logs` table.

---

## 2. CRUD Details for Each Module

### 1. Document Module
Manages digital attachments and physical document metadata.
* **Create:**
  * Authorized roles: `SUPER_ADMIN`, `USER`, `HQ_ADMIN`, `BRANCH_ADMIN`.
  * Allows uploading up to 10 files simultaneously (compressed automatically).
* **Read:**
  * Retrieve a paginated list of documents with filters: document type, date range, title search, `folderId`, and `userId` scoping.
  * `HQ_ADMIN` and `SUPER_ADMIN` see all documents. `BRANCH_ADMIN` and `USER` see only their own documents (scoped by `userId`).
  * Retrieve document details by ID (`GetById`).
  * Stream or download file attachments (`GetAttachment`) with permission checks (USER can only view/download their own attachments).
* **Update:**
  * `USER` and `BRANCH_ADMIN` can only update documents they created (`userId` ownership check).
  * `HQ_ADMIN` and `SUPER_ADMIN` can update all documents.
* **Delete:**
  * Direct document deletion via API is prohibited to prevent data loss and ensure audit security.

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

---

### 3. Shelf Module
Manages physical shelves within lockers.
* **Create:** `SUPER_ADMIN`, `HQ_ADMIN`, and `BRANCH_ADMIN` can create shelves under a locker (`lockerId`) and define `maxQty`. `BRANCH_ADMIN` is validated against their `addressId`.
* **Read:**
  * `SUPER_ADMIN` and `HQ_ADMIN` see all shelves. `BRANCH_ADMIN` is scoped to their `addressId` (via Shelf → Locker → Warehouse → addressId).
  * View shelves under a specific locker (`getByLocker`).
* **Update:** `SUPER_ADMIN`, `HQ_ADMIN`, and `BRANCH_ADMIN` can update shelf information and status.
* **Delete:** `SUPER_ADMIN` and `HQ_ADMIN` only.

---

### 4. Locker Module
Manages physical lockers within warehouses.
* **Create:** `SUPER_ADMIN`, `HQ_ADMIN`, and `BRANCH_ADMIN` can create lockers under a warehouse (`warehouseId`). `BRANCH_ADMIN` is validated that the target warehouse's `addressId` matches their own.
* **Read:**
  * `SUPER_ADMIN` and `HQ_ADMIN` see all lockers. `BRANCH_ADMIN` is scoped to their `addressId` (via Locker → Warehouse → addressId).
  * Retrieve lockers under a specific warehouse (`getByWarehouse`).
* **Update:** `SUPER_ADMIN`, `HQ_ADMIN`, and `BRANCH_ADMIN` can update locker details. `BRANCH_ADMIN` validated against their `addressId`.
* **Delete:** `SUPER_ADMIN` and `HQ_ADMIN` only.

---

### 5. Warehouse Module
Manages physical document warehouses associated with an address.
* **Create:** `SUPER_ADMIN`, `HQ_ADMIN`, and `BRANCH_ADMIN` can create warehouses. Only `addressId` is required (no `branchId` or `divisionId`).
* **Read:**
  * View warehouse list with optional `search` and `status` filters.
  * `SUPER_ADMIN` and `HQ_ADMIN` see all warehouses. All roles can list warehouses.
* **Update:** `SUPER_ADMIN`, `HQ_ADMIN`, and `BRANCH_ADMIN` can update warehouse name, code, description, and status.
* **Delete:** `SUPER_ADMIN` and `HQ_ADMIN` only.

> **Note:** The previous `GET branches/dropdown` endpoint has been removed. Warehouse no longer has `branchId` or `divisionId` — it is associated only with `Address`.

---

### 6. Address Module
Manages physical storage locations/buildings holding warehouses.
* **Create:** `SUPER_ADMIN` and `HQ_ADMIN` can create storage locations.
* **Read:**
  * View address lists (`HQ_ADMIN` and `SUPER_ADMIN`).
  * Fetch dropdown options of storage addresses (`HQ_ADMIN` and `BRANCH_ADMIN`).
* **Update:** `SUPER_ADMIN` and `HQ_ADMIN` can update address details.
* **Delete:** `SUPER_ADMIN` and `HQ_ADMIN` only.

---

### 7. Document Type Module
Manages document categories.
* **Create:** `SUPER_ADMIN` and `HQ_ADMIN` can create document types.
* **Read:** All roles can view and search document types.
* **Update:** `SUPER_ADMIN` and `HQ_ADMIN` can update document types.
* **Delete:** `SUPER_ADMIN` and `HQ_ADMIN` only (provided no documents are currently using it).

---

### 8. Branch Module
* **Read:** All authenticated users can view branches.
* **Sync:** Branch data is synced automatically via Division sync.

---

### 9. Department Module
* **Read:** All authenticated users can view departments.
* **Sync:** Only `SUPER_ADMIN` can trigger sync from external HRM database.

---

### 10. Division Module
* **Read:** All authenticated users can view divisions.
* **Sync:** Only `SUPER_ADMIN` can trigger sync from HRM (which also updates branch data).

---

### 11. Office Module
* **Read:** All authenticated users can view offices.
* **Sync:** Only `SUPER_ADMIN` can trigger sync.

---

### 12. Unit Module
* **Read:** All authenticated users can view units.
* **Sync:** Only `SUPER_ADMIN` can trigger sync.

---

### 13. User & Auth Module
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

### 14. Audit Log Module
* **Create:** Automatically logged on creation/update/view actions.
* **Read / Update / Delete:** No exposed APIs to preserve audit integrity.
