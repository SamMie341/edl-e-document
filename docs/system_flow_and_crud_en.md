# EDL E-Document System Flow and CRUD Documentation

This document outlines the workflows, structure, and CRUD (Create, Read, Update, Delete) operations of the **EDL E-Document** (Electronic Document Management System) backend built using NestJS, Prisma ORM, and PostgreSQL.

---

## 1. System Workflows

The EDL E-Document system is designed to manage both **Digital Attachments** and **Physical Storage Tracking**. The main workflows of the system are divided into 3 core sections:

### A. Authentication & HRM Sync Flow
1. **HRM Sync:** The system integrates with an external HRM database using employee codes (`empCode`) to synchronize personal profiles and organizational hierarchies, including Branches, Departments, Divisions, Offices, and Units.
2. **Authentication:** Standard authentication using passwords hashed with bcrypt and JWT Strategy for token verification.
3. **Role-Based Access Control (RBAC):** The system defines 4 main roles:
   * **`SUPER_ADMIN`**: Manages the entire system, approves new user accounts, updates user roles, and executes HRM synchronization endpoints.
   * **`HQ_ADMIN`**: Headquarters Administrator. Can manage and view physical addresses, warehouses, lockers, shelves, folders, and document types nationwide. Also has full read/manage access to documents across all branches.
   * **`BRANCH_ADMIN`**: Branch Administrator. Can manage physical addresses, warehouses, lockers, shelves, folders, and documents specifically within their own branch or division.
   * **`USER`**: General employee. Can create documents, upload attachments, search documents, and view physical storage locations (can only view/download attachments of documents they created themselves).

---

### B. Physical Storage Hierarchy Flow
To facilitate easy tracking of physical documents, the system organizes storage locations in the following hierarchy:

```
[Branch] (Branch) / [Division] (Division)
   └── [Address] (Storage Location/Address)
          └── [Warehouse] (Document Warehouse)
                 └── [Locker] (Document Locker)
                        └── [Shelf] (Document Shelf)
                               └── [Folder / Kono] (Folder with QR Code)
                                      └── [Document] (Physical Document)
```

* **Address:** Identifies physical locations or buildings belonging to branches/divisions, where warehouses are situated.
* **Folder (Folder / Kono):** Storage folders have unique QR Codes for location scanning.
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
  * Authorized roles: `USER`, `HQ_ADMIN`, `BRANCH_ADMIN`.
  * Allows uploading up to 10 files simultaneously (compressed automatically).
* **Read:**
  * Retrieve a paginated list of documents with filters (document type, date range, title search, branch, division).
  * Retrieve document details by ID (`GetById`).
  * Stream or download file attachments (`GetAttachment`) with permission checks (USER can only view/download their own attachments).
* **Update:**
  * `USER` can only update documents they created.
  * `BRANCH_ADMIN` can update documents belonging to their branch.
  * `HQ_ADMIN` can update all documents.
* **Delete:**
  * Direct document deletion via API is prohibited to prevent data loss and ensure audit security.

---

### 2. Folder / Kono Module
Manages physical folders placed on shelves.
* **Create:** `USER`, `BRANCH_ADMIN`, `HQ_ADMIN` can create folders under a specific shelf (`ShelfId`). A QR code is generated automatically.
* **Read:**
  * View list of folders with search filters and branch/division conditions.
  * View all folders residing on a specific shelf (`getByShelf`).
* **Update:** `HQ_ADMIN` and `BRANCH_ADMIN` can update folder details (name, status, location reference).
* **Delete:** Only `HQ_ADMIN` can delete folders.

---

### 3. Shelf Module
Manages physical shelves within lockers.
* **Create:** `HQ_ADMIN` and `BRANCH_ADMIN` can create shelves under a locker (`LockerId`) and define `maxQty`.
* **Read:**
  * View shelf lists filtered by Locker, Warehouse, Branch, or Division.
  * View shelves under a specific locker (`getByLocker`).
* **Update:** `HQ_ADMIN` and `BRANCH_ADMIN` can update shelf information and status.
* **Delete:** Only `HQ_ADMIN` can delete shelves.

---

### 4. Locker Module
Manages physical lockers within warehouses.
* **Create:** `HQ_ADMIN` and `BRANCH_ADMIN` can create lockers under a warehouse (`WarehouseId`).
* **Read:**
  * View locker lists (HQ sees all, Branch sees only their branch/division).
  * Retrieve lockers under a specific warehouse (`getByWarehouse`).
* **Update:** Update locker name, description, and status.
* **Delete:** Only `HQ_ADMIN` can delete lockers.

---

### 5. Warehouse Module
Manages physical document warehouses for each branch.
* **Create:** `HQ_ADMIN` can create warehouses in any branch. `BRANCH_ADMIN` can only create within their own branch.
* **Read:**
  * View warehouse lists filtered by branch/division.
  * Fetch dropdown options of branches related to warehouses.
  * Retrieve warehouses under a branch (`getByBranch`).
* **Update:** Update warehouse name, code, description, and status.
* **Delete:** Only `HQ_ADMIN` can delete warehouses.

---

### 6. Address Module
Manages physical storage locations/buildings holding warehouses.
* **Create:** Only `HQ_ADMIN` can create storage locations.
* **Read:**
  * View address lists (only `HQ_ADMIN`).
  * Fetch dropdown options of storage addresses (both `HQ_ADMIN` and `BRANCH_ADMIN`).
* **Update:** Only `HQ_ADMIN` can update address details.
* **Delete:** Only `HQ_ADMIN` can delete addresses.

---

### 7. Document Type Module
Manages document categories.
* **Create:** Only `HQ_ADMIN` can create document types.
* **Read:** All roles can view and search document types.
* **Update:** Only `HQ_ADMIN` can update document types.
* **Delete:** Only `HQ_ADMIN` can delete a document type (provided no documents are currently using it).

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
